import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import type { CartItem } from '$lib/cart';
import { productCatalog } from '$lib/products';

export type OrderStatus = 'Delivered' | 'Ready for pickup' | 'Cancelled';

export type PurchaseOrder = {
	id: string;
	date: string;
	status: OrderStatus;
	items: CartItem[];
};

const storageKey = 'qcu-coop-purchase-history';

function catalogItem(name: string, variant: string, quantity: number, variantIndex = 0): CartItem {
	const product = productCatalog.find((item) => item.name === name);
	if (!product) throw new Error(`Purchase history product not found: ${name}`);

	const selectedVariant = product.variants?.[variantIndex] ?? product.variants?.[0];
	return {
		productId: product.id,
		name: product.name,
		image: product.image,
		variant,
		sku: selectedVariant?.sku ?? product.sku,
		unitPrice: selectedVariant?.price ?? product.price ?? 0,
		quantity,
		category: product.category
	};
}

const starterOrders: PurchaseOrder[] = [
	{
		id: 'CART-88231',
		date: '2026-10-02',
		status: 'Delivered',
		items: [
			catalogItem('Lanyard (Admin)', 'Navy', 2),
			catalogItem('P.E. T-Shirt (XS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL)', 'Size M', 1, 2)
		]
	},
	{
		id: 'CART-87904',
		date: '2026-09-21',
		status: 'Ready for pickup',
		items: [
			catalogItem('QCU Jacket', 'Size L', 1),
			catalogItem('Bond Paper Ream (A4)', 'A4', 2)
		]
	},
	{
		id: 'CART-87218',
		date: '2026-09-12',
		status: 'Cancelled',
		items: [catalogItem('Regular Keychain', 'Blue', 1)]
	}
];

function readOrders(): PurchaseOrder[] {
	if (!browser) return starterOrders;

	try {
		const savedOrders = localStorage.getItem(storageKey);
		return savedOrders ? JSON.parse(savedOrders) as PurchaseOrder[] : starterOrders;
	} catch {
		return starterOrders;
	}
}

export const purchaseOrders = writable<PurchaseOrder[]>(readOrders());

purchaseOrders.subscribe((orders) => {
	if (browser) localStorage.setItem(storageKey, JSON.stringify(orders));
});

export function recordPurchaseOrder(order: PurchaseOrder) {
	purchaseOrders.update((orders) => [order, ...orders]);
}