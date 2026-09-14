<script lang="ts">
	import CartItem from '$lib/CartItem.svelte';
	import { cartItems, cartTotal, removeFromCart, updateCartQuantity } from '$lib/cart';
	import { onMount } from 'svelte';

	type CheckoutStage = 'review' | 'qr' | null;

	let checkoutStage = $state<CheckoutStage>(null);
	let orderReference = $state('');
	let isEditingCart = $state(false);
	let checkoutItemKeys = $state<string[]>([]);
	let deletionItemKeys = $state<string[]>([]);

	const formatPrice = (value: number) =>
		new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(value);

	let checkoutCartItems = $derived($cartItems.filter((item) => checkoutItemKeys.includes(item.productId + item.sku)));
	let checkoutPieceCount = $derived(checkoutCartItems.reduce((sum, item) => sum + item.quantity, 0));
	let checkoutTotal = $derived(checkoutCartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
	let activeSelectionKeys = $derived(isEditingCart ? deletionItemKeys : checkoutItemKeys);
	let qrPayload = $derived(`QCU-COOP|${orderReference}|TOTAL:${checkoutTotal.toFixed(2)}|ITEMS:${checkoutPieceCount}`);
	let qrCodeUrl = $derived(`https://api.qrserver.com/v1/create-qr-code/?size=220x220&format=svg&data=${encodeURIComponent(qrPayload)}`);

	$effect(() => {
		const validItemKeys = $cartItems.map((item) => item.productId + item.sku);
		const validCheckoutKeys = checkoutItemKeys.filter((key) => validItemKeys.includes(key));
		const validDeletionKeys = deletionItemKeys.filter((key) => validItemKeys.includes(key));
		if (validCheckoutKeys.length !== checkoutItemKeys.length) checkoutItemKeys = validCheckoutKeys;
		if (validDeletionKeys.length !== deletionItemKeys.length) deletionItemKeys = validDeletionKeys;
	});

	function openCheckout() {
		if (!checkoutCartItems.length) return;
		checkoutStage = 'review';
	}

	function updateSelection(itemKey: string, selected: boolean) {
		const selectedKeys = isEditingCart ? deletionItemKeys : checkoutItemKeys;
		const nextSelection = selected ? [...selectedKeys, itemKey] : selectedKeys.filter((key) => key !== itemKey);
		if (isEditingCart) deletionItemKeys = nextSelection;
		else checkoutItemKeys = nextSelection;
	}

	function toggleEditCart() {
		isEditingCart = !isEditingCart;
		deletionItemKeys = [];
	}

	function deleteSelectedItems() {
		for (const item of $cartItems) {
			if (deletionItemKeys.includes(item.productId + item.sku)) removeFromCart(item.productId, item.sku);
		}
		deletionItemKeys = [];
		isEditingCart = false;
	}

	function confirmOrder() {
		orderReference = `QCU-${Date.now().toString().slice(-8)}`;
		checkoutStage = 'qr';
	}

	function closeCheckout() {
		if (checkoutStage === 'qr') {
			window.location.href = '/';
			return;
		}

		checkoutStage = null;
	}

	onMount(() => {
		const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && closeCheckout();
		window.addEventListener('keydown', closeOnEscape);
		return () => window.removeEventListener('keydown', closeOnEscape);
	});

</script>

<svelte:head>
	<title>Your cart | QCU COOP SHOP</title>
</svelte:head>

<main class="cart-page">
	<section class="cart-content" aria-labelledby="items-heading">
		<div class="cart-heading">
			<h1 id="items-heading">Items</h1>
			<div class="cart-heading-actions">
				<span>{$cartItems.length} item{$cartItems.length === 1 ? '' : 's'} · {activeSelectionKeys.length} selected</span>
				{#if $cartItems.length}
					<button type="button" class:editing={isEditingCart} class="edit-cart-button" onclick={toggleEditCart}>{isEditingCart ? 'Done' : 'Edit Cart'}</button>
				{/if}
			</div>
		</div>

		{#if $cartItems.length}
			<div class="cart-list">
				{#each $cartItems as item (item.productId + item.sku)}
					<CartItem
						{item}
						selected={activeSelectionKeys.includes(item.productId + item.sku)}
						selectionMode={isEditingCart ? 'delete' : 'checkout'}
						onSelectionChange={(selected) => updateSelection(item.productId + item.sku, selected)}
						onQuantityChange={(amount) => updateCartQuantity(item.productId, item.sku, amount)}
					/>
				{/each}
			</div>
		{:else}
			<div class="empty-cart"><h2>Your cart is empty</h2><a href="/shop">Browse the shop</a></div>
		{/if}
	</section>
</main>

<footer class="cart-summary">
	<div class="summary-inner">
		<div><span>{isEditingCart ? 'Cart total' : 'Selected total'}</span><strong>{formatPrice(isEditingCart ? $cartTotal : checkoutTotal)}</strong></div>
		<div class="summary-actions">
			{#if isEditingCart}
				<button type="button" class="delete-button" onclick={deleteSelectedItems} disabled={!deletionItemKeys.length}>Delete</button>
			{:else}
				<button type="button" class="checkout-button" onclick={openCheckout} disabled={!checkoutCartItems.length}>Checkout <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6 6 6-6 6"/></svg></button>
			{/if}
		</div>
	</div>
</footer>

{#if checkoutStage}
	<div class="checkout-overlay" role="presentation" onclick={(event) => event.target === event.currentTarget && closeCheckout()}>
		<div class="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
			{#if checkoutStage === 'review'}
				<button type="button" class="modal-close" onclick={closeCheckout} aria-label="Close checkout">×</button>
			{/if}
			{#if checkoutStage === 'review'}
				<p class="modal-eyebrow">Order review</p>
				<h2 id="checkout-title">Confirm your items</h2>
				<div class="checkout-items">
					{#each checkoutCartItems as item (item.productId + item.sku)}
						<div class="checkout-line"><div><strong>{item.name}</strong><span>{item.variant} · {item.quantity} pc{item.quantity === 1 ? '' : 's'}</span></div><b>{formatPrice(item.unitPrice * item.quantity)}</b></div>
					{/each}
				</div>
				<div class="checkout-total"><span>Total to pay</span><strong>{formatPrice(checkoutTotal)}</strong></div>
				<button type="button" class="confirm-button" onclick={confirmOrder}>Confirm order <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6 6 6-6 6"/></svg></button>
			{:else}
				<p class="modal-eyebrow">Order confirmed</p>
				<h2 id="checkout-title">Scan to continue</h2>
				<p class="qr-copy">Present this QR code to the QCU COOP cashier to retrieve your order and payment total.</p>
				<img class="qr-code" src={qrCodeUrl} alt={`QR code for order ${orderReference}`} />
				<p class="order-reference">{orderReference}</p>
				<div class="checkout-total"><span>Amount due</span><strong>{formatPrice(checkoutTotal)}</strong></div>
				<button type="button" class="confirm-button" onclick={closeCheckout}>Done</button>
			{/if}
		</div>
	</div>
{/if}

<style>
	:global(body) { margin: 0; background: #f9fbff; font-family: 'Montserrat', sans-serif; color: #061d42; }
	.cart-page { min-height: calc(100vh - 10.25rem); padding: 2.25rem 1.25rem 10rem; background: #fff; }
	.cart-content { max-width: 62rem; margin: 0 auto; }
	.cart-heading { display: flex; align-items: baseline; justify-content: space-between; padding-bottom: 1rem; border-bottom: 1px solid #d9e0ea; }
	.cart-heading h1 { margin: 0; font-size: 1.25rem; font-weight: 800; letter-spacing: 0; }
	.cart-heading span { color: #7d93b8; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
	.cart-heading-actions { display: flex; align-items: center; gap: 1rem; }
	.edit-cart-button { border: 1px solid #c6d3e2; border-radius: 0.45rem; background: white; padding: 0.4rem 0.65rem; color: #345477; font: inherit; font-size: 0.7rem; font-weight: 800; cursor: pointer; }
	.edit-cart-button:hover, .edit-cart-button.editing { border-color: #155bd8; color: #155bd8; }
	.cart-summary { position: fixed; right: 0; bottom: 0; left: 0; z-index: 20; border-top: 1px solid #d7e0ec; background: rgba(255, 255, 255, 0.96); box-shadow: 0 -8px 24px rgba(6, 29, 66, 0.08); backdrop-filter: blur(10px); }
	.summary-inner { display: flex; align-items: center; justify-content: space-between; max-width: 66rem; min-height: 6.5rem; margin: 0 auto; padding: 0 1.25rem; }
	.summary-inner div { display: grid; gap: 0.2rem; }
	.summary-inner div span { color: #7890b6; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; }
	.summary-inner div strong { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 1.45rem; }
	.summary-actions { display: flex; align-items: center; gap: 0.75rem; }
	.delete-button { border: 0; background: transparent; color: #6b7f9d; font: inherit; font-size: 0.78rem; font-weight: 700; cursor: pointer; }
	.delete-button:hover { color: #bd1d34; }
	.delete-button:disabled { color: #b5c0cf; cursor: not-allowed; }
	.checkout-button { display: inline-flex; align-items: center; gap: 0.65rem; min-width: 11.5rem; justify-content: center; border: 0; border-radius: 0.75rem; background: #155bd8; padding: 1rem 1.35rem; color: white; font: inherit; font-size: 0.95rem; font-weight: 800; cursor: pointer; box-shadow: 0 5px 12px rgba(21, 91, 216, 0.24); transition: transform 150ms ease, background 150ms ease; }
	.checkout-button:hover { background: #0d4fc7; transform: translateY(-1px); }
	.checkout-button:disabled { cursor: not-allowed; background: #9aacc7; box-shadow: none; transform: none; }
	.checkout-button svg { width: 1.15rem; height: 1.15rem; }
	.checkout-overlay { position: fixed; inset: 0; z-index: 40; display: grid; place-items: center; padding: 1rem; background: rgba(3, 18, 42, 0.58); backdrop-filter: blur(4px); }
	.checkout-modal { position: relative; width: min(100%, 31rem); max-height: calc(100vh - 2rem); overflow-y: auto; border-radius: 0.85rem; background: white; padding: 2rem; box-shadow: 0 24px 70px rgba(3, 18, 42, 0.3); }
	.modal-close { position: absolute; top: 1rem; right: 1rem; display: grid; place-items: center; width: 2rem; height: 2rem; border: 0; border-radius: 50%; background: #eef3f9; color: #38506f; font-size: 1.25rem; cursor: pointer; }
	.modal-eyebrow { margin: 0; color: #155bd8; font-size: 0.68rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; }
	.checkout-modal h2 { margin: 0.5rem 2rem 1.4rem 0; color: #061d42; font-size: 1.4rem; font-weight: 800; }
	.checkout-items { max-height: 15rem; overflow-y: auto; border-top: 1px solid #d9e0ea; }
	.checkout-line { display: flex; align-items: start; justify-content: space-between; gap: 1rem; padding: 0.9rem 0; border-bottom: 1px solid #e6ebf2; }
	.checkout-line strong, .checkout-line span { display: block; }
	.checkout-line strong { font-size: 0.8rem; }
	.checkout-line span { margin-top: 0.25rem; color: #38506f; font-size: 0.7rem; }
	.checkout-line b { white-space: nowrap; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.75rem; }
	.checkout-total { display: flex !important; align-items: end; justify-content: space-between; margin: 1.25rem 0; padding: 1rem 0; border-bottom: 1px solid #d9e0ea; border-top: 1px solid #d9e0ea; }
	.checkout-total span { color: #7890b6; font-size: 0.73rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
	.checkout-total strong { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 1.25rem; }
	.confirm-button { display: inline-flex; align-items: center; justify-content: center; gap: 0.55rem; width: 100%; border: 0; border-radius: 0.7rem; background: #155bd8; padding: 0.9rem 1rem; color: white; font: inherit; font-size: 0.9rem; font-weight: 800; cursor: pointer; }
	.confirm-button:hover { background: #0d4fc7; }
	.confirm-button svg { width: 1rem; height: 1rem; }
	.qr-copy { margin: -0.65rem 0 1.25rem; color: #607897; font-size: 0.8rem; line-height: 1.55; }
	.qr-code { display: block; width: min(100%, 13.75rem); aspect-ratio: 1; margin: 0 auto 1rem; border: 0.7rem solid #f4f7fb; image-rendering: pixelated; }
	.order-reference { margin: 0 0 1.25rem; color: #607897; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em; text-align: center; }
	.empty-cart { padding: 5rem 0; text-align: center; }
	.empty-cart h2 { margin: 0 0 1rem; font-size: 1.25rem; }
	.empty-cart a { color: #155bd8; font-weight: 700; }
	@media (max-width: 600px) {
		.cart-page { padding: 1.5rem 1rem 9rem; }
		.cart-heading span { display: none; }
		.cart-heading-actions { gap: 0.5rem; }
		.summary-inner { min-height: 5.75rem; }
		.summary-actions { gap: 0.4rem; }
		.delete-button { font-size: 0.68rem; }
		.checkout-button { min-width: auto; padding: 0.9rem 1rem; }
	}
</style>
