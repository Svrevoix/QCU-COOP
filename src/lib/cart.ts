import { browser } from '$app/environment';
import { derived, writable } from 'svelte/store';

export type CartItem = {
	productId: string;
	name: string;
	variant: string;
	sku: string;
	unitPrice: number;
	quantity: number;
	category: string;
};

type CartProduct = Omit<CartItem, 'quantity'> & { quantity?: number };

const storageKey = 'qcu-coop-cart';

function readCart(): CartItem[] {
	if (!browser) return [];

	try {
		const savedCart = localStorage.getItem(storageKey);
		return savedCart ? JSON.parse(savedCart) : [];
	} catch {
		return [];
	}
}

export const cartItems = writable<CartItem[]>(readCart());

cartItems.subscribe((items) => {
	if (browser) localStorage.setItem(storageKey, JSON.stringify(items));
});

export const cartItemCount = derived(cartItems, (items) => items.length);
export const cartPieceCount = derived(cartItems, (items) => items.reduce((sum, item) => sum + item.quantity, 0));
export const cartTotal = derived(cartItems, (items) => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));

export function addToCart(product: CartProduct) {
	cartItems.update((items) => {
		const existingIndex = items.findIndex((item) => item.productId === product.productId && item.sku === product.sku);
		if (existingIndex === -1) return [...items, { ...product, quantity: product.quantity ?? 1 }];

		return items.map((item, index) => index === existingIndex
			? { ...item, quantity: item.quantity + (product.quantity ?? 1) }
			: item
		);
	});
}

export function updateCartQuantity(productId: string, sku: string, amount: number) {
	cartItems.update((items) => items.map((item) => item.productId === productId && item.sku === sku
		? { ...item, quantity: Math.max(1, item.quantity + amount) }
		: item
	));
}

export function removeFromCart(productId: string, sku: string) {
	cartItems.update((items) => items.filter((item) => item.productId !== productId || item.sku !== sku));
}