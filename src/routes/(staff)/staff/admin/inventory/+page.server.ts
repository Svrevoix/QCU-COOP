import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { inventoryRequest } from '$lib/server/inventory';

type Product = { id: number; sku: string; product_name: string; category_id: number | null; cost_price: number; selling_price: number; stock: number; reorder_level: number; refill_level: number; refill_quantity: number; status: string };
type Balance = { id: number; product_id: number; warehouse_id: number; quantity: number; location_type: string };
type StockAlert = { id: number; product_id: number; warehouse_stock: number; store_stock: number; alert_type: string; resolved: boolean; created_at: string };
type Category = { id: number; category_name: string };

async function getRows<T>(table: string, query: Record<string, string>) {
	const response = await inventoryRequest(`${table}?${new URLSearchParams(query)}`);
	if (!response.ok) throw error(502, `Could not load ${table} (Supabase HTTP ${response.status}). Check the table and column names.`);
	return await response.json() as T[];
}

async function apiError(response: Response) {
	const body = await response.text();
	if (!body) return `Supabase HTTP ${response.status}`;
	try {
		const detail = JSON.parse(body) as { message?: string; details?: string; hint?: string; code?: string };
		const description = `${detail.message ?? ''} ${detail.details ?? ''}`;
		if (description.includes('inventory_transactions_transaction_type_check')) {
			return 'The database still blocks the “restock” transaction type. Apply migration 202611250003_allow_restock_transaction_type.sql in the Supabase SQL Editor.';
		}
		return [detail.message, detail.details, detail.hint, detail.code ? `(${detail.code})` : ''].filter(Boolean).join(' · ') || `Supabase HTTP ${response.status}`;
	} catch {
		return body.slice(0, 500);
	}
}

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user?.role !== 'admin') throw error(403, 'Administrator access required.');
	const [products, balances, suppliers, stockAlerts, categories] = await Promise.all([
		getRows<Product>('products', { select: 'id,sku,product_name,category_id,cost_price,selling_price,stock,reorder_level,refill_level,refill_quantity,status', order: 'product_name.asc' }),
		getRows<Balance>('inventory', { select: 'id,product_id,warehouse_id,quantity,location_type' }),
		getRows<{ id: number }>('suppliers', { select: 'id' }),
		getRows<StockAlert>('stock_alerts', { select: 'id,product_id,warehouse_stock,store_stock,alert_type,resolved,created_at', resolved: 'eq.false', order: 'created_at.desc', limit: '30' }),
		getRows<Category>('categories', { select: 'id,category_name', order: 'category_name.asc' })
	]);
	return { products, balances, supplierCount: suppliers.length, stockAlerts, categories };
};

export const actions: Actions = {
	restock: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') throw error(403, 'Administrator access required.');
		const form = await request.formData();
		const productId = Number(form.get('productId'));
		const quantity = Number(form.get('quantity'));
		const remarks = String(form.get('remarks') ?? '').trim() || null;
		if (![productId, quantity].every(Number.isInteger) || productId < 1 || quantity < 1) return fail(400, { restockError: 'Choose an item and enter a positive whole quantity.' });

		const warehouseResponse = await inventoryRequest(`warehouses?${new URLSearchParams({ select: 'id', order: 'id.asc', limit: '1' })}`);
		if (!warehouseResponse.ok) return fail(502, { restockError: `Could not resolve the default inventory location (HTTP ${warehouseResponse.status}).` });
		const warehouses = await warehouseResponse.json() as Array<{ id: number }>;
		let warehouseId = warehouses[0]?.id;
		if (!warehouseId) {
			const createWarehouse = await inventoryRequest('warehouses', {
				method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
				body: JSON.stringify({ warehouse_name: 'Main Warehouse', location: 'Default inventory location' })
			});
			if (!createWarehouse.ok) return fail(502, { restockError: `Could not create the default inventory location (HTTP ${createWarehouse.status}).` });
			const created = await createWarehouse.json() as Array<{ id: number }>;
			warehouseId = created[0]?.id;
			if (!warehouseId) return fail(502, { restockError: 'The default inventory location was created without an ID.' });
		}

		const receiveResponse = await inventoryRequest('rpc/receive_inventory_stock', {
			method: 'POST', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ p_product_id: productId, p_warehouse_id: warehouseId, p_quantity: quantity, p_remarks: remarks, p_created_by: locals.user.profileId })
		});
		if (!receiveResponse.ok) return fail(502, { restockError: `Warehouse restock was not applied. ${await apiError(receiveResponse)}` });
		return { restockSuccess: 'Stock received into the warehouse and inventory movement recorded.' };
	},
	transferToStore: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') throw error(403, 'Administrator access required.');
		const form = await request.formData();
		const productId = Number(form.get('productId'));
		const quantity = Number(form.get('quantity'));
		const remarks = String(form.get('remarks') ?? '').trim() || null;
		if (![productId, quantity].every(Number.isInteger) || productId < 1 || quantity < 1) {
			return fail(400, { transferError: 'Choose an item and enter a positive whole quantity.' });
		}
		const response = await inventoryRequest('rpc/transfer_inventory_to_store', {
			method: 'POST', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ p_product_id: productId, p_quantity: quantity, p_remarks: remarks, p_created_by: locals.user.profileId })
		});
		if (!response.ok) {
			const body = await response.text();
			let message = `Could not transfer stock (Supabase HTTP ${response.status}).`;
			try {
				const detail = JSON.parse(body) as { message?: string; code?: string };
				message = detail.message ?? message;
				if (detail.code === 'PGRST202' || message.includes('transfer_inventory_to_store')) {
					message = 'The store-transfer function is not installed or visible in Supabase. Apply migration 202611250005_transfer_stock_to_store.sql, then refresh the page.';
				}
			} catch { if (body) message = body.slice(0, 400); }
			return fail(502, { transferError: message });
		}
		return { transferSuccess: 'Stock moved from the warehouse to store inventory.' };
	}
};
