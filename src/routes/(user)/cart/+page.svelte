<script lang="ts">
	import CartItem from '$lib/CartItem.svelte';
	import { goto } from '$app/navigation';
	import { cartItems, removeFromCart, updateCartQuantity } from '$lib/cart';
	import { recordPurchaseOrder } from '$lib/orders';
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	type CheckoutStage = 'review' | 'qr' | null;

	let checkoutStage = $state<CheckoutStage>(null);
	let orderReference = $state('');
	let isEditingCart = $state(false);
	let checkoutItemKeys = $state<string[]>([]);
	const memberTeacher = $derived(page.data.user?.role === 'teacher' && page.data.user?.coopMember === true);
	let deletionItemKeys = $state<string[]>([]);
	let placingOrder = $state(false);
	let orderError = $state('');
	let savedOrderNumber = $state('');
	let savedOrderTotal = $state<number | null>(null);
	let savedOrderPieces = $state(0);
	let knownCartItemKeys: string[] = [];

	const formatPrice = (value: number) =>
		new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(value);

	function portalToBody(node: HTMLElement) {
		document.body.append(node);
		return { destroy: () => node.remove() };
	}

	let checkoutCartItems = $derived($cartItems.filter((item) => checkoutItemKeys.includes(item.productId + item.sku)));
	let checkoutPieceCount = $derived(checkoutCartItems.reduce((sum, item) => sum + item.quantity, 0));
	let checkoutSubtotal = $derived(checkoutCartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
	let checkoutDiscount = $derived(memberTeacher ? Math.round(checkoutSubtotal * 0.2 * 100) / 100 : 0);
	let checkoutTotal = $derived(checkoutSubtotal - checkoutDiscount);
	let activeSelectionKeys = $derived(isEditingCart ? deletionItemKeys : checkoutItemKeys);
	let activeSelectedCartItems = $derived(
		$cartItems.filter((item) => activeSelectionKeys.includes(item.productId + item.sku))
	);
	let activeSelectedPieceCount = $derived(
		activeSelectedCartItems.reduce((sum, item) => sum + item.quantity, 0)
	);
	let activeSelectedSubtotal = $derived(
		activeSelectedCartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
	);
	let allItemsSelected = $derived(
		$cartItems.length > 0 &&
			$cartItems.every((item) => activeSelectionKeys.includes(item.productId + item.sku))
	);
	let qrPayload = $derived(
		`QCU-COOP|${orderReference}|TOTAL:${(savedOrderTotal ?? checkoutTotal).toFixed(2)}|ITEMS:${savedOrderPieces || checkoutPieceCount}`
	);
	let qrCodeUrl = $derived(`https://api.qrserver.com/v1/create-qr-code/?size=220x220&format=svg&data=${encodeURIComponent(qrPayload)}`);

	$effect(() => {
		const validItemKeys = $cartItems.map((item) => item.productId + item.sku);
		const newItemKeys = validItemKeys.filter((key) => !knownCartItemKeys.includes(key));
		const validCheckoutKeys = checkoutItemKeys.filter((key) => validItemKeys.includes(key));
		const validDeletionKeys = deletionItemKeys.filter((key) => validItemKeys.includes(key));
		const nextCheckoutKeys = [...validCheckoutKeys, ...newItemKeys.filter((key) => !validCheckoutKeys.includes(key))];
		if (
			nextCheckoutKeys.length !== checkoutItemKeys.length ||
			nextCheckoutKeys.some((key, index) => key !== checkoutItemKeys[index])
		) {
			checkoutItemKeys = nextCheckoutKeys;
		}
		if (validDeletionKeys.length !== deletionItemKeys.length) deletionItemKeys = validDeletionKeys;
		knownCartItemKeys = validItemKeys;
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

	function toggleSelectAll(selected: boolean) {
		const allItemKeys = $cartItems.map((item) => item.productId + item.sku);
		if (isEditingCart) deletionItemKeys = selected ? allItemKeys : [];
		else checkoutItemKeys = selected ? allItemKeys : [];
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

	async function confirmOrder() {
		if (placingOrder || !checkoutCartItems.length) return;
		placingOrder = true;
		orderError = '';
		try {
			const response = await fetch('/api/qr-orders', {
				method: 'POST', headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ items: checkoutCartItems.map((item) => ({ productId: Number(item.productId), quantity: item.quantity })) })
			});
			const result = await response.json() as { message?: string; orderReference?: string; orderNumber?: string; totalAmount?: number };
			if (!response.ok) throw new Error(result.message || 'The order could not be saved. Please try again.');
			orderReference = result.orderReference || result.orderNumber || '';
			savedOrderNumber = result.orderNumber || orderReference;
			savedOrderTotal = Number(result.totalAmount ?? checkoutTotal);
			savedOrderPieces = checkoutPieceCount;
			recordPurchaseOrder({
				id: savedOrderNumber,
				date: new Date().toISOString(),
				status: 'Pending confirmation',
				items: checkoutCartItems.map((item) => ({ ...item })),
				subtotal: checkoutSubtotal,
				discount: checkoutDiscount,
				total: savedOrderTotal
			});
			for (const item of checkoutCartItems) removeFromCart(item.productId, item.sku);
			checkoutItemKeys = [];
			checkoutStage = 'qr';
		} catch (cause) {
			orderError = cause instanceof Error ? cause.message : 'The order could not be saved. Please try again.';
		} finally {
			placingOrder = false;
		}
	}

	function closeCheckout() {
		if (checkoutStage === 'qr') {
			void goto('/history', { invalidateAll: true });
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

<div class="cart-viewport">
	<div class="cart-layout">
		<section class="cart-content" aria-labelledby="items-heading">
			<div class="cart-heading">
				<div>
					<h1 id="items-heading">Items</h1>
					<p>{$cartItems.length} item{$cartItems.length === 1 ? '' : 's'} · {activeSelectionKeys.length} selected</p>
				</div>
				<div class="cart-heading-actions">
					<label class="select-all-control">
						<input
							type="checkbox"
							checked={allItemsSelected}
							disabled={!$cartItems.length}
							onchange={(event) => toggleSelectAll(event.currentTarget.checked)}
						/>
						<span>Select all</span>
					</label>
					{#if $cartItems.length}
						<button
							type="button"
							class="cart-edit-button"
							class:editing={isEditingCart}
							onclick={toggleEditCart}
						>
							{isEditingCart ? 'Done' : 'Edit Cart'}
						</button>
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
							onRemove={() => removeFromCart(item.productId, item.sku)}
						/>
					{/each}
				</div>
			{:else}
				<div class="empty-cart">
					<h2>Your cart is empty</h2>
					<a href="/shop">Browse the shop</a>
				</div>
			{/if}
		</section>

		<aside class="order-summary-card" aria-labelledby="order-summary-title">
			<h2 id="order-summary-title">Order summary</h2>
			<div class="summary-row">
				<span>Selected items</span>
				<strong>{activeSelectedCartItems.length} · {activeSelectedPieceCount} pcs</strong>
			</div>
			<div class="pickup-location">
				<span>Pickup location</span>
				<strong>Coop Office, Bautista Building Basement</strong>
			</div>
			<div class="summary-row">
				<span>Subtotal</span>
				<strong>{formatPrice(activeSelectedSubtotal)}</strong>
			</div>
			{#if memberTeacher && !isEditingCart}
				<div class="summary-row discount-row">
					<span>Member discount</span>
					<strong>−{formatPrice(checkoutDiscount)}</strong>
				</div>
			{/if}
			<div class="summary-total">
				<span>{isEditingCart ? 'Selected to remove' : 'Selected total'}</span>
				<strong>{formatPrice(isEditingCart ? activeSelectedSubtotal : checkoutTotal)}</strong>
			</div>
			{#if isEditingCart}
				<button
					type="button"
					class="cart-delete-button"
					onclick={deleteSelectedItems}
					disabled={!deletionItemKeys.length}
				>
					Delete selected
				</button>
			{:else}
				<button
					type="button"
					class="cart-checkout-button"
					onclick={openCheckout}
					disabled={!checkoutCartItems.length}
				>
					Checkout <span aria-hidden="true">→</span>
				</button>
			{/if}
		</aside>
	</div>
</div>

{#if checkoutStage}
	<div use:portalToBody class="checkout-overlay" role="presentation" onclick={(event) => event.target === event.currentTarget && closeCheckout()}>
		<div class="checkout-modal w-full max-w-md rounded-3xl border border-sky-200/80 bg-[#F4F9FF] p-6 text-[#0C2340] shadow-2xl dark:border-white/10 dark:bg-[#162038] dark:text-slate-100 sm:p-7" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
			{#if checkoutStage === 'review'}
				<button type="button" class="modal-close" onclick={closeCheckout} aria-label="Close checkout">×</button>
			{/if}
			{#if checkoutStage === 'review'}
				<p class="modal-eyebrow">Order review</p>
				<h2 id="checkout-title">Confirm your items</h2>
				<div class="checkout-items max-h-60 space-y-2.5 overflow-y-auto rounded-2xl border border-sky-200/70 bg-sky-100/60 p-3.5 dark:border-white/10 dark:bg-slate-900/60">
					{#each checkoutCartItems as item (item.productId + item.sku)}
						<div class="checkout-line"><div><strong>{item.name}</strong><span>{item.variant} · {item.quantity} pc{item.quantity === 1 ? '' : 's'}</span></div><b>{formatPrice(item.unitPrice * item.quantity)}</b></div>
					{/each}
				</div>
				{#if memberTeacher}<div class="checkout-line"><span>Items subtotal</span><b>{formatPrice(checkoutSubtotal)}</b></div><div class="checkout-line"><span>Cooperative member discount (20%)</span><b>−{formatPrice(checkoutDiscount)}</b></div>{/if}
				<div class="checkout-pickup-location"><span>Pickup location</span><strong>Coop Office, Bautista Building Basement</strong></div>
				<div class="checkout-total"><span>Total to pay</span><strong>{formatPrice(checkoutTotal)}</strong></div>
				{#if orderError}<p class="order-error" role="alert">{orderError}</p>{/if}
				<button type="button" class="confirm-button" onclick={confirmOrder} disabled={placingOrder}>{placingOrder ? 'Saving order…' : 'Place order'} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6 6 6-6 6"/></svg></button>
			{:else}
				<p class="modal-eyebrow">Order confirmed</p>
				<h2 id="checkout-title">Order request saved</h2>
				<p class="qr-copy">Show this order QR code to the cashier. Payment is completed at the counter.</p>
				<div class="qr-code-frame"><img class="qr-code" src={qrCodeUrl} alt={`QR code for order ${orderReference}`} /></div>
				<p class="order-reference">{savedOrderNumber}</p>
				<div class="checkout-total"><span>Order total</span><strong>{formatPrice(savedOrderTotal ?? checkoutTotal)}</strong></div>
				<button type="button" class="confirm-button" onclick={closeCheckout}>Done</button>
				<a class="history-link" href="/history" data-sveltekit-reload>View in Purchase History <span aria-hidden="true">→</span></a>
			{/if}
		</div>
	</div>
{/if}

<style>
	:global(body) { margin: 0; background: #e6f0fa; font-family: 'Montserrat', sans-serif; color: #0c2340; }
	.cart-viewport { display: flex; width: 100%; height: 100%; min-height: 0; flex: 1; flex-direction: column; overflow: hidden; box-sizing: border-box; background: #e6f0fa; padding: 1rem; color: #0c2340; }
	.cart-layout { display: flex; width: 100%; height: 100%; min-height: 0; max-width: 72rem; flex: 1; flex-direction: column; gap: 1rem; margin: 0 auto; }
	.cart-content { display: flex; min-width: 0; min-height: 0; flex: 1; flex-direction: column; }
	.cart-heading { display: flex; flex: 0 0 auto; align-items: center; justify-content: space-between; gap: 1rem; padding: 0 0 0.85rem; border-bottom: 1px solid rgba(148, 163, 184, 0.3); }
	.cart-heading h1 { margin: 0; color: #0c2340; font-size: 1.25rem; font-weight: 800; letter-spacing: 0; }
	.cart-heading p { margin: 0.3rem 0 0; color: #64748b; font-size: 0.72rem; font-weight: 600; }
	.cart-heading-actions { display: flex; align-items: center; gap: 0.75rem; }
	.select-all-control { display: inline-flex; align-items: center; gap: 0.45rem; color: #38506f; font-size: 0.75rem; font-weight: 700; white-space: nowrap; cursor: pointer; }
	.select-all-control input { width: 1rem; height: 1rem; accent-color: #2563eb; }
	.select-all-control input:disabled { cursor: not-allowed; }
	.cart-edit-button { border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 999px; background: rgba(37, 99, 235, 0.1); padding: 0.45rem 0.8rem; color: #1d4ed8; font: inherit; font-size: 0.72rem; font-weight: 700; cursor: pointer; }
	.cart-edit-button:hover, .cart-edit-button.editing { background: rgba(37, 99, 235, 0.16); }
	.cart-list { display: flex; min-height: 0; flex: 1; flex-direction: column; gap: 0.75rem; overflow-y: auto; overscroll-behavior: contain; padding: 0.85rem 0.25rem 0.25rem 0; }
	.empty-cart { display: grid; flex: 1; align-content: center; justify-items: center; gap: 0.75rem; padding: 2rem 0; text-align: center; }
	.empty-cart h2 { margin: 0; color: #0c2340; font-size: 1.25rem; }
	.empty-cart a { color: #2563eb; font-weight: 700; }
	.order-summary-card { flex: 0 0 auto; border: 1px solid rgba(186, 230, 253, 0.7); border-radius: 1rem; background: #f4f9ff; padding: 1rem; color: #0c2340; }
	.order-summary-card h2 { margin: 0 0 0.8rem; color: #0c2340; font-size: 1rem; font-weight: 800; }
	.summary-row { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; margin-top: 0.65rem; font-size: 0.78rem; }
	.summary-row span, .pickup-location span { color: #64748b; font-weight: 600; }
	.summary-row strong { color: #0c2340; font-size: 0.8rem; font-weight: 700; text-align: right; }
	.pickup-location { display: grid; gap: 0.25rem; margin-top: 0.75rem; border-top: 1px solid rgba(148, 163, 184, 0.25); padding-top: 0.75rem; }
	.pickup-location span { font-size: 0.7rem; font-weight: 700; }
	.pickup-location strong { color: #0c2340; font-size: 0.76rem; font-weight: 700; line-height: 1.4; }
	.discount-row strong { color: #047857; }
	.summary-total { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; margin-top: 0.8rem; border-top: 1px solid rgba(148, 163, 184, 0.3); padding-top: 0.8rem; }
	.summary-total span { color: #38506f; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
	.summary-total strong { color: #0c2340; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 1.25rem; font-weight: 800; }
	.cart-checkout-button, .cart-delete-button { display: flex; width: 100%; align-items: center; justify-content: center; gap: 0.6rem; margin-top: 1rem; border: 0; border-radius: 0.75rem; padding: 0.85rem 1rem; color: white; font: inherit; font-size: 0.9rem; font-weight: 800; cursor: pointer; transition: background 150ms ease; }
	.cart-checkout-button { background: linear-gradient(to right, #2563eb, #3b82f6, #0ea5e9); }
	.cart-checkout-button:hover { background: linear-gradient(to right, #3b82f6, #0ea5e9, #22d3ee); }
	.cart-delete-button { background: #dc2626; }
	.cart-delete-button:hover { background: #b91c1c; }
	.cart-checkout-button:disabled, .cart-delete-button:disabled { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; }
	.cart-delete-button { background: #b91c1c; }
	.cart-delete-button:disabled { background: #e2e8f0; }
	:global(html[data-theme='dark'] .cart-viewport) { background: #0f172a; color: #f1f5f9; }
	:global(html[data-theme='dark'] .cart-heading) { border-color: rgba(255, 255, 255, 0.1); }
	:global(html[data-theme='dark'] .cart-heading h1), :global(html[data-theme='dark'] .empty-cart h2) { color: #f1f5f9; }
	:global(html[data-theme='dark'] .cart-heading p), :global(html[data-theme='dark'] .select-all-control) { color: #94a3b8; }
	:global(html[data-theme='dark'] .cart-edit-button) { border-color: rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.05); color: #cbd5e1; }
	:global(html[data-theme='dark'] .cart-edit-button:hover), :global(html[data-theme='dark'] .cart-edit-button.editing) { background: rgba(255, 255, 255, 0.1); }
	:global(html[data-theme='dark'] .order-summary-card) { border-color: rgba(255, 255, 255, 0.1); background: #162038; color: #f1f5f9; }
	:global(html[data-theme='dark'] .order-summary-card h2), :global(html[data-theme='dark'] .summary-row strong), :global(html[data-theme='dark'] .pickup-location strong), :global(html[data-theme='dark'] .summary-total strong) { color: #f1f5f9; }
	:global(html[data-theme='dark'] .summary-row span), :global(html[data-theme='dark'] .pickup-location span), :global(html[data-theme='dark'] .summary-total span) { color: #94a3b8; }
	:global(html[data-theme='dark'] .pickup-location), :global(html[data-theme='dark'] .summary-total) { border-color: rgba(255, 255, 255, 0.1); }
	:global(html[data-theme='dark'] .cart-checkout-button:disabled), :global(html[data-theme='dark'] .cart-delete-button:disabled) { background: #1e293b; color: #64748b; }
	:global(html[data-theme='dark'] .cart-checkout-button:not(:disabled)) { background: linear-gradient(to right, #2563eb, #6366f1, #0ea5e9); }
	:global(html[data-theme='dark'] .cart-checkout-button:not(:disabled):hover) { background: linear-gradient(to right, #3b82f6, #38bdf8, #67e8f9); }
	.checkout-overlay { position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center; overflow-y: auto; padding: 1rem; background: rgba(2, 6, 23, 0.6); backdrop-filter: blur(12px); }
	.checkout-modal { position: relative; max-height: calc(100dvh - 2rem); overflow-y: auto; }
	.modal-close { position: absolute; top: 1rem; right: 1rem; display: grid; place-items: center; width: 2rem; height: 2rem; border: 0; border-radius: 50%; background: #e6f0fa; color: #38506f; font-size: 1.25rem; cursor: pointer; }
	.modal-eyebrow { margin: 0; color: #155bd8; font-size: 0.68rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; }
	.checkout-modal h2 { margin: 0.5rem 2rem 1.4rem 0; color: inherit; font-size: 1.4rem; font-weight: 800; }
	.checkout-items { display: flex; flex-direction: column; }
	.checkout-line { display: flex; align-items: start; justify-content: space-between; gap: 1rem; border-bottom: 1px solid rgba(148, 163, 184, 0.28); padding: 0.65rem; }
	.checkout-items .checkout-line { border: 0; border-radius: 0.75rem; background: rgba(255, 255, 255, 0.68); }
	:global(html[data-theme='dark'] .checkout-items .checkout-line) { background: rgba(30, 41, 59, 0.65); }
	.checkout-line strong, .checkout-line span { display: block; }
	.checkout-line strong { color: inherit; font-size: 0.8rem; }
	.checkout-line span { margin-top: 0.25rem; color: #38506f; font-size: 0.7rem; }
	.checkout-line b { color: inherit; white-space: nowrap; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.75rem; }
	.checkout-pickup-location { display: grid; gap: 0.3rem; margin-top: 0.9rem; border: 1px solid rgba(148, 163, 184, 0.24); border-radius: 0.85rem; padding: 0.8rem 0.9rem; }
	.checkout-pickup-location span { color: #64748b; font-size: 0.68rem; font-weight: 700; }
	.checkout-pickup-location strong { color: inherit; font-size: 0.78rem; line-height: 1.45; }
	.checkout-total { display: flex !important; align-items: end; justify-content: space-between; margin: 1.25rem 0; padding: 1rem 0; border-bottom: 1px solid #d9e0ea; border-top: 1px solid #d9e0ea; }
	.checkout-total span { color: #7890b6; font-size: 0.73rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
	.checkout-total strong { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 1.25rem; }
	.confirm-button { display: inline-flex; align-items: center; justify-content: center; gap: 0.55rem; width: 100%; min-height: 3rem; border: 0; border-radius: 0.75rem; background: linear-gradient(to right, #2563eb, #3b82f6, #0ea5e9); padding: 0.75rem 1rem; color: white; font: inherit; font-size: 0.9rem; font-weight: 800; cursor: pointer; box-shadow: 0 10px 24px rgba(37, 99, 235, 0.2); transition: background 180ms ease, transform 180ms ease; }
	.confirm-button:hover { background: linear-gradient(to right, #3b82f6, #0ea5e9, #22d3ee); }
	.confirm-button:disabled { opacity: .6; cursor: wait; }
	.history-link { display: block; margin-top: 0.9rem; color: #2563eb; font-size: 0.78rem; font-weight: 700; text-align: center; text-decoration: none; }
	.history-link:hover { text-decoration: underline; }
	.order-error { margin: .75rem 0 0; border-radius: .55rem; background: #fff1f2; padding: .65rem .75rem; color: #b42336; font-size: .74rem; line-height: 1.45; }
	.confirm-button svg { width: 1rem; height: 1rem; }
	.qr-copy { margin: -0.65rem 0 1.25rem; color: #607897; font-size: 0.8rem; line-height: 1.55; }
	.qr-code-frame { width: fit-content; max-width: 100%; margin: 0 auto 1rem; border-radius: 1rem; background: #fff; padding: 0.75rem; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1); }
	.qr-code { display: block; width: min(100%, 13.75rem); aspect-ratio: 1; margin: 0 auto; image-rendering: pixelated; }
	.order-reference { margin: 0 0 1.25rem; color: #607897; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em; text-align: center; }
	@media (min-width: 1024px) {
		.cart-viewport { padding: 1.5rem; }
		.cart-layout { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 2rem; }
		.cart-content { grid-column: span 8; }
		.order-summary-card { position: sticky; top: 1.5rem; grid-column: span 4; align-self: start; padding: 1.5rem; }
	}
	@media (max-width: 700px) {
		.cart-viewport { padding: 0.75rem; }
		.cart-heading { gap: 0.5rem; padding-bottom: 0.65rem; }
		.cart-heading h1 { font-size: 1.1rem; }
		.cart-heading p { font-size: 0.66rem; }
		.cart-heading-actions { gap: 0.5rem; }
		.select-all-control { gap: 0.3rem; font-size: 0.68rem; }
		.cart-edit-button { padding: 0.4rem 0.65rem; font-size: 0.66rem; }
		.cart-list { gap: 0.6rem; padding-top: 0.65rem; }
		.order-summary-card { padding: 0.8rem 0.9rem; }
		.order-summary-card h2 { margin-bottom: 0.5rem; font-size: 0.92rem; }
		.summary-row, .pickup-location { margin-top: 0.5rem; }
		.pickup-location { padding-top: 0.5rem; }
		.summary-total { margin-top: 0.6rem; padding-top: 0.6rem; }
		.summary-total strong { font-size: 1.1rem; }
		.cart-checkout-button, .cart-delete-button { margin-top: 0.7rem; padding: 0.7rem; }
	}
	@media (prefers-reduced-motion: reduce) {
		.cart-checkout-button, .cart-delete-button { transition: none; }
	}
</style>
