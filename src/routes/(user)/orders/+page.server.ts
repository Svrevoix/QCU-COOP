import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { inventoryRequest } from '$lib/server/inventory';

async function rows<T>(table: string, query: Record<string, string>): Promise<T[]> {
	const response = await inventoryRequest(`${table}?${new URLSearchParams(query)}`);
	if (!response.ok) throw error(502, `Could not load purchase history from ${table} (HTTP ${response.status}).`);
	return await response.json() as T[];
}

function customerStatus(status: string): 'Pending confirmation' | 'Delivered' | 'Claimed' | 'Ready for pickup' | 'Cancelled' {
	const value = status.trim().toLowerCase().replaceAll('_', ' ');
	if (value === 'ready for pickup' || value === 'ready') return 'Ready for pickup';
	if (value === 'claimed' || value === 'picked up') return 'Claimed';
	if (value === 'delivered' || value === 'completed') return 'Delivered';
	if (value === 'cancelled' || value === 'canceled') return 'Cancelled';
	return 'Pending confirmation';
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || !['student', 'teacher'].includes(locals.user.role)) throw error(403, 'Customer account required.');
	const orders = await rows<{ id: string; order_reference: string | null; order_number: string | null; customer_id: string; total_amount: number | string; status: string; created_at: string }>('qr_orders', {
		select: 'id,order_reference,order_number,customer_id,total_amount,status,created_at', customer_id: `eq.${locals.user.profileId}`, order: 'created_at.desc', limit: '200'
	});
	type OrderItem = { qr_order_id: string; product_id: number; quantity: number; price: number | string };
	let orderItems: OrderItem[] = [];
	for (let index = 0; index < orders.length; index += 100) {
		const ids = orders.slice(index, index + 100).map((order) => order.id);
		orderItems.push(...await rows<OrderItem>('qr_order_items', { select: 'qr_order_id,product_id,quantity,price', qr_order_id: `in.(${ids.join(',')})`, limit: '5000' }));
	}
	const itemsByOrder = new Map<string, OrderItem[]>();
	for (const item of orderItems) itemsByOrder.set(item.qr_order_id, [...(itemsByOrder.get(item.qr_order_id) ?? []), item]);
	const productIds = [...new Set(orderItems.map((item) => item.product_id))];
	const products = productIds.length ? await rows<{ id: number; sku: string; product_name: string; image_url: string | null; size: string | null }>('products', { select: 'id,sku,product_name,image_url,size', id: `in.(${productIds.join(',')})`, limit: '2000' }) : [];
	const productMap = new Map(products.map((product) => [product.id, product]));
	return {
		orders: orders.map((order) => ({
			id: order.order_number || order.order_reference || order.id,
			qrReference: order.order_reference || order.order_number || order.id,
			dbId: order.id,
			date: order.created_at,
			status: customerStatus(order.status),
			total: Number(order.total_amount || 0),
			items: (itemsByOrder.get(order.id) ?? []).map((item) => {
				const product = productMap.get(item.product_id);
				return { productId: String(item.product_id), sku: product?.sku ?? '', name: product?.product_name ?? `Product #${item.product_id}`, image: product?.image_url ?? undefined, variant: product?.size ?? 'One size', quantity: Number(item.quantity), unitPrice: Number(item.price), category: 'supplies' };
			})
		}))
	};
};
