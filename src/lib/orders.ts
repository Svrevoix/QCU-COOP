import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import type { CartItem } from '$lib/cart';

export type OrderStatus = 'Pending confirmation' | 'Delivered' | 'Claimed' | 'Ready for pickup' | 'Cancelled';

export type PurchaseOrder = {
	id: string;
	date: string;
	status: OrderStatus;
	items: CartItem[];
	subtotal?: number;
	discount?: number;
	total?: number;
};

const STORAGE_KEY = 'qcu-coop-purchase-history';
let activeProfileId: string | null = null;

function readOrders(profileId: string): PurchaseOrder[] {
	if (!browser) return [];

	try {
		const savedOrders = localStorage.getItem(`${STORAGE_KEY}:${profileId}`);
		return savedOrders ? JSON.parse(savedOrders) as PurchaseOrder[] : [];
	} catch {
		return [];
	}
}

export const purchaseOrders = writable<PurchaseOrder[]>([]);

purchaseOrders.subscribe((orders) => {
	if (browser && activeProfileId) {
		localStorage.setItem(`${STORAGE_KEY}:${activeProfileId}`, JSON.stringify(orders));
	}
});

export function setPurchaseHistoryAccount(profileId: string | null) {
	if (!browser || activeProfileId === profileId) return;
	activeProfileId = profileId;
	purchaseOrders.set(profileId ? readOrders(profileId) : []);
}

export function recordPurchaseOrder(order: PurchaseOrder) {
	if (!activeProfileId) throw new Error('Sign in before recording a purchase.');
	purchaseOrders.update((orders) => [order, ...orders]);
}
