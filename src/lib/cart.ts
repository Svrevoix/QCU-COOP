import { browser } from '$app/environment';
import { derived, writable } from 'svelte/store';

export type CartItem = {
	productId: string;
	name: string;
	image?: string;
	variant: string;
	sku: string;
	unitPrice: number;
	quantity: number;
	category: string;
};

type CartProduct = Omit<CartItem, 'quantity'> & { quantity?: number };

const STORAGE_KEY = 'qcu-coop-cart';
let activeProfileId: string | null = null;

function readCart(profileId: string): CartItem[] {
	if (!browser) return [];

	try {
		const savedCart = localStorage.getItem(`${STORAGE_KEY}:${profileId}`);
		return savedCart ? JSON.parse(savedCart) : [];
	} catch {
		return [];
	}
}

export const cartItems = writable<CartItem[]>([]);

cartItems.subscribe((items) => {
	if (browser && activeProfileId) {
		localStorage.setItem(`${STORAGE_KEY}:${activeProfileId}`, JSON.stringify(items));
	}
});

export const cartItemCount = derived(cartItems, (items) => items.length);
export const cartPieceCount = derived(cartItems, (items) => items.reduce((sum, item) => sum + item.quantity, 0));
export const cartTotal = derived(cartItems, (items) => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));

export function setCartAccount(profileId: string | null) {
	if (!browser || activeProfileId === profileId) return;
	activeProfileId = profileId;
	cartItems.set(profileId ? readCart(profileId) : []);
}

export function addToCart(product: CartProduct) {
	if (!activeProfileId) throw new Error('Sign in before adding items to your cart.');
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