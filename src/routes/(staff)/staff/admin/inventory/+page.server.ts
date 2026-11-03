import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { inventoryRequest } from '$lib/server/inventory';

type Product = { id: number; sku: string; product_name: string; category_id: number | null; cost_price: number; selling_price: number; stock: number; reorder_level: number; status: string };
type Balance = { id: number; product_id: number; warehouse_id: number; quantity: number };

async function getRows<T>(table: string, query: Record<string, string>) {
	const response = await inventoryRequest(`${table}?${new URLSearchParams(query)}`);
	if (!response.ok) throw error(502, `Could not load ${table} (Supabase HTTP ${response.status}). Check the table and column names.`);
	return await response.json() as T[];
}

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user?.role !== 'admin') throw error(403, 'Administrator access required.');
	const [products, balances, suppliers] = await Promise.all([
		getRows<Product>('products', { select: 'id,sku,product_name,category_id,cost_price,selling_price,stock,reorder_level,status', order: 'product_name.asc' }),
		getRows<Balance>('inventory', { select: 'product_id,warehouse_id,quantity' }),
		getRows<{ id: number }>('suppliers', { select: 'id' })
	]);
	return { products, balances, supplierCount: suppliers.length };
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

		const existingResponse = await inventoryRequest(`inventory?${new URLSearchParams({ select: 'id,quantity', product_id: `eq.${productId}`, warehouse_id: `eq.${warehouseId}`, limit: '1' })}`);
		if (!existingResponse.ok) return fail(502, { restockError: `Could not read the warehouse stock (HTTP ${existingResponse.status}).` });
		const existing = await existingResponse.json() as Array<{ id: number; quantity: number }>;
		const currentQuantity = existing[0]?.quantity ?? 0;
		const productCheck = await inventoryRequest(`products?${new URLSearchParams({ select: 'stock', id: `eq.${productId}`, limit: '1' })}`);
		if (!productCheck.ok) return fail(502, { restockError: `Could not verify the product record (HTTP ${productCheck.status}).` });
		const productRows = await productCheck.json() as Array<{ stock: number }>;
		if (!productRows.length) return fail(404, { restockError: 'The selected product no longer exists.' });
		const balanceResponse = await inventoryRequest(existing[0] ? `inventory?id=eq.${existing[0].id}` : 'inventory', {
			method: existing[0] ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
			body: JSON.stringify(existing[0] ? { quantity: currentQuantity + quantity } : { product_id: productId, warehouse_id: warehouseId, quantity })
		});
		if (!balanceResponse.ok) return fail(502, { restockError: `Could not update warehouse stock (HTTP ${balanceResponse.status}).` });

		const transactionResponse = await inventoryRequest('inventory_transactions', {
			method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
			body: JSON.stringify({ product_id: productId, warehouse_id: warehouseId, transaction_type: 'restock', quantity, remarks, created_by: locals.user.profileId })
		});
		if (!transactionResponse.ok) return fail(502, { restockError: `Stock quantity was updated, but the movement history could not be saved (HTTP ${transactionResponse.status}).` });

		const productResponse = await inventoryRequest(`products?id=eq.${productId}`, {
			method: 'PATCH', headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
			body: JSON.stringify({ stock: Number(productRows[0].stock ?? 0) + quantity })
		});
		if (!productResponse.ok) return fail(502, { restockError: `Stock was received, but products.stock could not be synchronized (HTTP ${productResponse.status}).` });
		return { restockSuccess: 'Stock received and inventory movement recorded.' };
	}
};
