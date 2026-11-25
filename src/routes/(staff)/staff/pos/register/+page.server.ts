import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { inventoryRequest } from '$lib/server/inventory';

type ProductRow = { id: number; sku: string; product_name: string; category_id: number | null; selling_price: number | null; stock: number | null; image_url: string | null; size: string | null; status: string | null };
type InventoryRow = { product_id: number; quantity: number; location_type: string };
type ProfileRow = { id: string; school_id: string | null; employee_no: string | null; first_name: string | null; last_name: string | null; role: string; account_status: string | null };
type QrOrderRow = { id: string; order_reference: string | null; order_number: string | null; customer_id: string; total_amount: number | string; status: string; created_at: string; stock_reserved: boolean };
type QrOrderItemRow = { qr_order_id: string; product_id: number; quantity: number; price: number | string };

async function rows<T>(table: string, query: Record<string, string>) {
	const response = await inventoryRequest(`${table}?${new URLSearchParams(query)}`);
	if (!response.ok) throw error(502, `Could not load ${table} for the register (Supabase HTTP ${response.status}).`);
	return await response.json() as T[];
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || !['cashier', 'admin'].includes(locals.user.role)) throw error(403, 'Cashier access required.');
	const [productRows, inventoryRows, categories, profiles, qrOrders] = await Promise.all([
		rows<ProductRow>('products', { select: 'id,sku,product_name,category_id,selling_price,stock,image_url,size,status', order: 'product_name.asc', limit: '2000' }),
		rows<InventoryRow>('inventory', { select: 'product_id,quantity,location_type' }),
		rows<{ id: number; category_name: string }>('categories', { select: 'id,category_name', order: 'category_name.asc' }),
		rows<ProfileRow>('profiles', { select: 'id,school_id,employee_no,first_name,last_name,role,account_status', role: 'in.(student,teacher,faculty,customer,user,member)', order: 'last_name.asc,first_name.asc', limit: '1000' }),
		rows<QrOrderRow>('qr_orders', { select: 'id,order_reference,order_number,customer_id,total_amount,status,created_at,stock_reserved', status: 'eq.pending', order: 'created_at.asc', limit: '100' })
	]);
	const qrOrderItems = qrOrders.length
		? await rows<QrOrderItemRow>('qr_order_items', {
			select: 'qr_order_id,product_id,quantity,price',
			qr_order_id: `in.(${qrOrders.map((order) => order.id).join(',')})`,
			order: 'product_id.asc'
		})
		: [];
	const productById = new Map(productRows.map((product) => [product.id, product]));
	const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
	const itemsByOrderId = new Map<string, QrOrderItemRow[]>();
	for (const item of qrOrderItems) {
		const items = itemsByOrderId.get(item.qr_order_id) ?? [];
		items.push(item);
		itemsByOrderId.set(item.qr_order_id, items);
	}
	const storeStock = new Map<number, number>();
	const productsWithStoreStock = new Set<number>();
	for (const inventory of inventoryRows) {
		if (String(inventory.location_type ?? '').toLowerCase() !== 'store') continue;
		productsWithStoreStock.add(inventory.product_id);
		storeStock.set(inventory.product_id, (storeStock.get(inventory.product_id) ?? 0) + Number(inventory.quantity || 0));
	}
	const activeProducts = productRows
		.filter((product) => product.status?.toLowerCase() === 'active')
		.map((product) => ({
			id: product.id,
			sku: product.sku,
			name: product.product_name,
			categoryId: product.category_id,
			price: product.selling_price === null ? null : Number(product.selling_price),
			stock: productsWithStoreStock.has(product.id) ? (storeStock.get(product.id) ?? 0) : Number(product.stock ?? 0),
			size: product.size || 'One size',
			image: product.image_url
		}));
	const customers = profiles.flatMap((profile) => {
		if (/(pending|inactive|suspend|disabled|blocked|locked|rejected|archived)/i.test(profile.account_status ?? '')) return [];
		const role = profile.role.toLowerCase();
		const idNumber = (profile.school_id || profile.employee_no || '').replace(/\D/g, '');
		const memberRole = ['teacher', 'faculty'].includes(role) ? 'teacher'
			: role === 'student' ? 'student'
			: ['customer', 'user', 'member'].includes(role) && idNumber.startsWith('10') ? 'teacher'
			: ['customer', 'user', 'member'].includes(role) && idNumber.startsWith('23') ? 'student'
			: null;
		if (!memberRole) return [];
		return [{
			id: profile.id,
			displayId: memberRole === 'teacher' ? profile.employee_no || profile.school_id || 'Member' : profile.school_id || profile.employee_no || 'Member',
			name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Unnamed member',
			role: memberRole
		}];
	});
	const pickupOrders = qrOrders.map((order) => {
		const profile = profileById.get(order.customer_id);
		return {
			id: order.id,
			reference: order.order_reference || order.order_number || order.id.slice(0, 8),
			customerId: order.customer_id,
			customerName: [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Member',
			total: Number(order.total_amount),
			stockReserved: order.stock_reserved,
			createdAt: order.created_at,
			items: (itemsByOrderId.get(order.id) ?? []).map((item) => ({
				productId: item.product_id,
				name: productById.get(item.product_id)?.product_name || `Product #${item.product_id}`,
				quantity: Number(item.quantity),
				price: Number(item.price)
			}))
		};
	});
	return {
		products: activeProducts,
		categories,
		customers,
		pickupOrders,
		cashierName: [locals.user.firstName, locals.user.lastName].filter(Boolean).join(' ') || 'Cashier'
	};
};

export const actions: Actions = {
	completeSale: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'cashier') throw error(403, 'Cashier access required.');
		const form = await request.formData();
		const qrOrderId = String(form.get('qrOrderId') ?? '').trim();
		if (qrOrderId) {
			if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(qrOrderId)) {
				return fail(400, { success: false, message: 'The pickup order ID is invalid. Reload the register and try again.' });
			}
			const cashReceived = Number(form.get('cashReceived'));
			if (!Number.isFinite(cashReceived) || cashReceived < 0) {
				return fail(400, { success: false, message: 'Enter a valid cash amount to complete the pickup order.' });
			}
			const response = await inventoryRequest('rpc/complete_customer_qr_order', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					p_qr_order_id: qrOrderId,
					p_cashier_id: locals.user.profileId,
					p_cash_received: cashReceived
				})
			});
			if (!response.ok) {
				const body = await response.text();
				let message = `Could not complete the pickup order (Supabase HTTP ${response.status}).`;
				try {
					const detail = JSON.parse(body) as { message?: string; code?: string };
					message = detail.message ?? message;
					if (detail.code === 'PGRST202' || message.includes('complete_customer_qr_order')) {
						message = 'Supabase cannot find the pickup checkout function. Run supabase/migrations/202611250008_reserve_customer_order_stock.sql, then reload the API schema and retry.';
					}
				} catch { if (body) message = body.slice(0, 400); }
				return fail(502, { success: false, message });
			}
			const [sale] = await response.json() as Array<{ sale_id: number; receipt_number: string; total_amount: number }>;
			return { success: true, receiptNumber: sale?.receipt_number ?? 'saved', saleId: sale?.sale_id };
		}
		const itemsText = String(form.get('items') ?? '');
		let items: Array<{ productId: number; quantity: number }>;
		try {
			const parsed = JSON.parse(itemsText) as Array<{ productId: number; quantity: number }>;
			if (!Array.isArray(parsed)) throw new Error();
			items = parsed.map((item) => ({ productId: Number(item.productId), quantity: Number(item.quantity) }));
		} catch {
			return fail(400, { success: false, message: 'The order could not be read. Please review the cart and try again.' });
		}
		const cashReceived = Number(form.get('cashReceived'));
		const customerId = String(form.get('customerId') ?? '').trim() || null;
		if (!items.length || items.some((item) => !Number.isInteger(item.productId) || item.productId < 1 || !Number.isInteger(item.quantity) || item.quantity < 1) || !Number.isFinite(cashReceived) || cashReceived < 0) {
			return fail(400, { success: false, message: 'The cart or cash amount is invalid. Please correct it and retry.' });
		}
		const response = await inventoryRequest('rpc/complete_pos_sale', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ p_cashier_id: locals.user.profileId, p_customer_id: customerId, p_cash_received: cashReceived, p_items: items })
		});
		if (!response.ok) {
			const body = await response.text();
			let message = `Could not complete the sale (Supabase HTTP ${response.status}).`;
			try {
				const detail = JSON.parse(body) as { message?: string; code?: string };
				message = detail.message ?? message;
				if (detail.code === 'PGRST202' || message.includes('complete_pos_sale')) message = 'Supabase cannot find the POS checkout function. In Supabase SQL Editor, run supabase/migrations/202611250004_atomic_pos_sale.sql. Then reload this page. If you already ran it, run NOTIFY pgrst, \'reload schema\'; and retry.';
			} catch { if (body) message = body.slice(0, 400); }
			return fail(502, { success: false, message });
		}
		const [sale] = await response.json() as Array<{ sale_id: number; receipt_number: string; total_amount: number }>;
		return { success: true, receiptNumber: sale?.receipt_number ?? 'saved', saleId: sale?.sale_id };
	},
	cancelPickupOrder: async ({ request, locals }) => {
		if (!locals.user || !['cashier', 'admin'].includes(locals.user.role)) throw error(403, 'Staff access required.');
		const orderId = String((await request.formData()).get('orderId') ?? '').trim();
		if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)) {
			return fail(400, { success: false, message: 'The pickup order ID is invalid. Reload the register and try again.' });
		}
		const response = await inventoryRequest('rpc/cancel_customer_qr_order', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ p_qr_order_id: orderId, p_staff_id: locals.user.profileId })
		});
		if (!response.ok) {
			const body = await response.text();
			let message = `Could not cancel the pickup order (Supabase HTTP ${response.status}).`;
			try {
				const detail = JSON.parse(body) as { message?: string; code?: string };
				message = detail.message ?? message;
				if (detail.code === 'PGRST202' || message.includes('cancel_customer_qr_order')) {
					message = 'Supabase cannot find the pickup cancellation function. Run supabase/migrations/202611250008_reserve_customer_order_stock.sql, then reload the API schema and retry.';
				}
			} catch { if (body) message = body.slice(0, 400); }
			return fail(502, { success: false, message });
		}
		return { success: true, message: 'Pickup order cancelled and reserved stock returned to the store.' };
	}
};
