import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { inventoryRequest } from '$lib/server/inventory';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || !['student', 'teacher'].includes(locals.user.role)) throw error(403, 'Sign in with a customer account to place an order.');
	let body: { items?: unknown };
	try { body = await request.json() as { items?: unknown }; } catch { throw error(400, 'The order request is invalid.'); }
	if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 100) throw error(400, 'Add at least one item to your order.');
	const items = body.items.map((item) => {
		const value = item as { productId?: unknown; quantity?: unknown };
		return { productId: Number(value?.productId), quantity: Number(value?.quantity) };
	});
	if (items.some((item) => !Number.isSafeInteger(item.productId) || item.productId < 1 || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 500)) throw error(400, 'Each order line needs a valid item and quantity.');
	const response = await inventoryRequest('rpc/create_customer_qr_order', {
		method: 'POST', headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ p_customer_id: locals.user.profileId, p_items: items })
	});
	if (!response.ok) {
		const text = await response.text();
		let message = `Order request could not be saved (Supabase HTTP ${response.status}).`;
		try {
			const detail = JSON.parse(text) as { message?: string; code?: string };
			message = detail.message ?? message;
			if (detail.code === 'PGRST202' || message.includes('create_customer_qr_order')) message = 'The customer order function is not installed. In Supabase SQL Editor, run 202611250007_customer_qr_orders.sql first, then 202611250008_reserve_customer_order_stock.sql. Retry after both migrations complete.';
		} catch { if (text) message = text.slice(0, 400); }
		return json({ message }, { status: response.status >= 500 ? 502 : 400 });
	}
	const result = await response.json() as Array<{ order_id: string; order_reference: string; order_number: string; total_amount: number }>;
	const order = result[0];
	if (!order) throw error(502, 'Supabase saved the order without returning its reference.');
	return json({ orderId: order.order_id, orderReference: order.order_reference, orderNumber: order.order_number, totalAmount: Number(order.total_amount) });
};
