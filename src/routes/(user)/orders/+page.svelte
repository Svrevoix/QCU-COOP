<script lang="ts">
	import { addToCart } from '$lib/cart';
	import { handleImageError } from '$lib/imageFallback';
	import { purchaseOrders, type OrderStatus } from '$lib/orders';

	type OrderFilter = 'All orders' | OrderStatus;

	const filters: OrderFilter[] = ['All orders', 'Delivered', 'Ready for pickup', 'Cancelled'];
	let activeFilter = $state<OrderFilter>('All orders');
	let selectedLineKeys = $state<string[]>([]);
	let reorderQuantities = $state<Record<string, number>>({});
	let reorderNotice = $state('');

	const filteredOrders = $derived(
		$purchaseOrders.filter((order) => activeFilter === 'All orders' || order.status === activeFilter)
	);
	const selectedLines = $derived(
		$purchaseOrders.flatMap((order) => order.items
			.filter((item) => selectedLineKeys.includes(lineKey(order.id, item.productId, item.sku)))
			.map((item) => ({ ...item, quantity: reorderQuantities[lineKey(order.id, item.productId, item.sku)] ?? item.quantity })))
	);
	const selectedTotal = $derived(selectedLines.reduce((total, item) => total + item.unitPrice * item.quantity, 0));
	const selectedPieces = $derived(selectedLines.reduce((total, item) => total + item.quantity, 0));

	function lineKey(orderId: string, productId: string, sku: string) {
		return `${orderId}:${productId}:${sku}`;
	}

	function formatPrice(value: number) {
		return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(value);
	}

	function getFilterCount(filter: OrderFilter) {
		return filter === 'All orders'
			? $purchaseOrders.length
			: $purchaseOrders.filter((order) => order.status === filter).length;
	}

	function toggleLine(orderId: string, productId: string, sku: string, quantity: number) {
		const key = lineKey(orderId, productId, sku);
		if (selectedLineKeys.includes(key)) {
			selectedLineKeys = selectedLineKeys.filter((selectedKey) => selectedKey !== key);
		} else {
			selectedLineKeys = [...selectedLineKeys, key];
			reorderQuantities[key] ??= quantity;
		}
		reorderNotice = '';
	}

	function orderSelectionState(orderId: string, items: { productId: string; sku: string }[]) {
		const keys = items.map((item) => lineKey(orderId, item.productId, item.sku));
		const selectedCount = keys.filter((key) => selectedLineKeys.includes(key)).length;
		return { allSelected: keys.length > 0 && selectedCount === keys.length, partiallySelected: selectedCount > 0 && selectedCount < keys.length };
	}

	function toggleOrder(orderId: string, items: { productId: string; sku: string; quantity: number }[]) {
		const state = orderSelectionState(orderId, items);
		const keys = items.map((item) => lineKey(orderId, item.productId, item.sku));
		if (state.allSelected) {
			selectedLineKeys = selectedLineKeys.filter((key) => !keys.includes(key));
		} else {
			selectedLineKeys = [...new Set([...selectedLineKeys, ...keys])];
			for (const item of items) {
				const key = lineKey(orderId, item.productId, item.sku);
				reorderQuantities[key] ??= item.quantity;
			}
		}
		reorderNotice = '';
	}

	function updateQuantity(key: string, amount: number, currentQuantity: number) {
		reorderQuantities[key] = Math.max(1, (reorderQuantities[key] ?? currentQuantity) + amount);
		reorderNotice = '';
	}

	function reorderSelected() {
		for (const item of selectedLines) addToCart(item);
		reorderNotice = `${selectedPieces} item${selectedPieces === 1 ? '' : 's'} added to your cart.`;
		selectedLineKeys = [];
	}
</script>

<svelte:head>
	<title>Purchase history | QCU COOP SHOP</title>
	<meta name="description" content="Review previous QCU COOP orders and reorder items." />
</svelte:head>

<main class="history-page">
	<header class="history-toolbar">
		<a class="back-button" href="/" aria-label="Back to home">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15 18l-6-6 6-6" /></svg>
		</a>
		<div class="toolbar-title"><h1>Purchase history</h1><p>{$purchaseOrders.length} orders <span>·</span> QCU COOP</p></div>
		<a class="shop-link" href="/shop">Shop</a>
	</header>

	<div class="history-content">
		<nav class="filter-tabs" aria-label="Filter orders">
			{#each filters as filter (filter)}
				<button type="button" class:active={activeFilter === filter} aria-pressed={activeFilter === filter} onclick={() => { activeFilter = filter; selectedLineKeys = []; reorderNotice = ''; }}>
					{filter}<span>{getFilterCount(filter)}</span>
				</button>
			{/each}
		</nav>

		{#if filteredOrders.length}
			<div class="order-list">
				{#each filteredOrders as order (order.id)}
					<section class="order-block" aria-labelledby={`order-${order.id}`}>
						<header class="order-header">
							<div class="order-meta"><p>Order <strong id={`order-${order.id}`}>{order.id}</strong><span>·</span>{new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date(`${order.date}T12:00:00`))}</p><h2>Items</h2></div>
							<div class="order-actions"><span class="order-count">{order.items.length} item{order.items.length === 1 ? '' : 's'} · {order.items.reduce((sum, item) => sum + item.quantity, 0)} pcs</span><span class="status-badge" class:delivered={order.status === 'Delivered'} class:ready={order.status === 'Ready for pickup'} class:cancelled={order.status === 'Cancelled'}>{order.status}</span><button type="button" class="select-order" onclick={() => toggleOrder(order.id, order.items)}>{orderSelectionState(order.id, order.items).allSelected ? 'Deselect all' : 'Select all'}</button></div>
						</header>

						<div class="order-items">
							{#each order.items as item (item.productId + item.sku)}
								{@const key = lineKey(order.id, item.productId, item.sku)}
								<article class="order-item">
									<label class="item-checkbox" aria-label={`Select ${item.name} from order ${order.id}`}>
										<input type="checkbox" checked={selectedLineKeys.includes(key)} onchange={() => toggleLine(order.id, item.productId, item.sku, item.quantity)} />
										<span></span>
									</label>
									<div class="item-thumbnail">
										{#if item.image}<img src={item.image.startsWith('/') ? item.image : `/${item.image}`} alt={item.name} onerror={(event) => handleImageError(event, item.name)} />{:else}<span aria-hidden="true">{item.name.slice(0, 1)}</span>{/if}
									</div>
									<div class="item-info"><h3>{item.name}</h3><p>{item.variant}</p><code>{item.sku}</code></div>
									<div class="quantity-control" aria-label={`Reorder quantity for ${item.name}`}>
										<button type="button" aria-label={`Decrease reorder quantity for ${item.name}`} onclick={() => updateQuantity(key, -1, item.quantity)}>−</button>
										<span>{reorderQuantities[key] ?? item.quantity}</span>
										<button type="button" aria-label={`Increase reorder quantity for ${item.name}`} onclick={() => updateQuantity(key, 1, item.quantity)}>+</button>
									</div>
									<div class="item-price"><strong>{formatPrice(item.unitPrice * item.quantity)}</strong><span>{formatPrice(item.unitPrice)} ea.</span></div>
								</article>
							{/each}
						</div>
					</section>
				{/each}
			</div>
		{:else}
			<section class="empty-history"><span class="empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 4h16v16H4zM8 8h8M8 12h8M8 16h5" /></svg></span><h2>No {activeFilter === 'All orders' ? 'orders yet' : activeFilter.toLowerCase() + ' orders'}</h2><p>Your order history will appear here.</p><a href="/shop">Browse the shop</a></section>
		{/if}
	</div>
</main>

<footer class="reorder-bar">
	<div class="reorder-inner">
		<div class="selection-summary"><span>Selected total</span><strong>{formatPrice(selectedTotal)}</strong><small>{selectedLines.length} lines · {selectedPieces} pcs</small></div>
		<div class="reorder-actions">
			{#if reorderNotice}<p class="reorder-notice" role="status">{reorderNotice} <a href="/cart">View cart</a></p>{/if}
			<button type="button" class="reorder-button" onclick={reorderSelected} disabled={!selectedLines.length}>Reorder selected <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6 6 6-6 6" /></svg></button>
		</div>
	</div>
</footer>

<style>
	:global(body) { margin: 0; background: #061d42; color: #f4f8ff; font-family: 'Montserrat', sans-serif; }
	.history-page { min-height: calc(100vh - 4rem); background: #061d42; padding-bottom: 8rem; }
	.history-toolbar { display: flex; min-height: 5rem; align-items: center; gap: 1rem; border-bottom: 1px solid #1d385c; padding: .8rem clamp(1rem, 4vw, 3.75rem); }
	.back-button { display: grid; width: 2.75rem; height: 2.75rem; flex: 0 0 auto; place-items: center; border-radius: .7rem; background: #172f50; color: #eaf2ff; }
	.back-button svg { width: 1.25rem; height: 1.25rem; }
	.toolbar-title { min-width: 0; }
	.toolbar-title h1 { margin: 0; color: #fff; font-size: 1.15rem; font-weight: 800; }
	.toolbar-title p { margin: .2rem 0 0; color: #83a3cf; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .7rem; letter-spacing: .04em; text-transform: uppercase; }
	.toolbar-title p span { padding: 0 .3rem; }
	.shop-link { margin-left: auto; border: 1px solid #29496f; border-radius: .65rem; padding: .65rem .9rem; color: #dbeafe; font-size: .76rem; font-weight: 700; text-decoration: none; }
	.history-content { width: min(100% - 2rem, 65rem); margin: 1.25rem auto 0; }
	.filter-tabs { display: flex; flex-wrap: wrap; gap: .5rem; margin-bottom: 1.8rem; }
	.filter-tabs button { display: inline-flex; min-height: 2.65rem; align-items: center; gap: .55rem; border: 1px solid #2a4567; border-radius: 999px; background: #10294b; padding: .55rem 1rem; color: #9eb5d6; font: inherit; font-size: .76rem; font-weight: 700; cursor: pointer; transition: background 140ms ease, color 140ms ease, border-color 140ms ease; }
	.filter-tabs button.active { border-color: #e6f0ff; background: #f4f8ff; color: #10294b; }
	.filter-tabs button span { color: inherit; opacity: .68; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .65rem; }
	.order-list { display: grid; gap: 1rem; }
	.order-block { min-width: 0; }
	.order-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; border-bottom: 1px solid #1d385c; padding: .2rem 0 1rem; }
	.order-meta p { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; margin: 0 0 1.2rem; color: #8eadd4; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .72rem; }
	.order-meta p strong { color: #d8e7fb; }
	.order-meta h2 { margin: 0; color: #fff; font-size: 1.3rem; font-weight: 800; }
	.order-actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: .65rem; }
	.order-count { color: #83a3cf; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .68rem; text-transform: uppercase; }
	.status-badge { border-radius: .55rem; padding: .42rem .72rem; font-size: .65rem; font-weight: 900; letter-spacing: .06em; text-transform: uppercase; }
	.status-badge.delivered { background: #073d3b; color: #39d99a; }
	.status-badge.ready { background: #3e3212; color: #f4c85b; }
	.status-badge.cancelled { background: #45202c; color: #ff8d9c; }
	.select-order { border: 1px solid #dce9f8; border-radius: .65rem; background: #f5f8fc; padding: .65rem .9rem; color: #10294b; font: inherit; font-size: .74rem; font-weight: 800; cursor: pointer; }
	.order-items { display: grid; }
	.order-item { display: grid; grid-template-columns: 1.25rem 5.25rem minmax(8rem, 1fr) 8.25rem 7rem; align-items: start; gap: 1rem; border-bottom: 1px solid #1d385c; padding: 1.15rem 0; }
	.item-checkbox { display: grid; height: 5.25rem; place-items: center; cursor: pointer; }
	.item-checkbox input { position: absolute; width: 1px; height: 1px; opacity: 0; }
	.item-checkbox span { width: 1.15rem; height: 1.15rem; border: 1px solid #6f89ac; border-radius: .28rem; background: #10294b; }
	.item-checkbox input:checked + span { border-color: #2d6cff; background: #2d6cff; box-shadow: inset 0 0 0 3px #10294b; }
	.item-checkbox input:focus-visible + span { outline: 2px solid #8bb8ff; outline-offset: 2px; }
	.item-thumbnail { display: grid; width: 5.25rem; aspect-ratio: 1; place-items: center; overflow: hidden; border-radius: .7rem; background: #f4f8fc; color: #2563eb; }
	.item-thumbnail img { width: 100%; height: 100%; box-sizing: border-box; padding: .45rem; object-fit: contain; }
	.item-thumbnail > span { font-size: 1.5rem; font-weight: 900; }
	.item-info { min-width: 0; }
	.item-info h3 { margin: 0; color: #fff; font-size: .95rem; font-weight: 800; line-height: 1.35; }
	.item-info p, .item-info code { display: block; margin: .28rem 0 0; color: #8eadd4; font-size: .76rem; }
	.item-info code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .69rem; }
	.quantity-control { display: inline-grid; width: max-content; justify-self: start; grid-template-columns: 2.25rem 2.25rem 2.25rem; height: 2.45rem; overflow: hidden; border-radius: .6rem; background: #172f50; }
	.quantity-control button { border: 0; background: transparent; color: #d4d4d8; font-size: 1.15rem; font-weight: 800; cursor: pointer; }
	.quantity-control button:hover { background: #223e62; }
	.quantity-control span { display: grid; place-items: center; border-right: 1px solid #29496f; border-left: 1px solid #29496f; color: #f4f8ff; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .85rem; }
	.item-price { display: grid; justify-items: end; gap: .3rem; text-align: right; }
	.item-price strong { color: #f3f7ff; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .9rem; white-space: nowrap; }
	.item-price span { color: #7292be; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .68rem; white-space: nowrap; }
	.empty-history { display: grid; justify-items: center; padding: 4rem 1rem; text-align: center; }
	.empty-icon { display: grid; width: 3.5rem; height: 3.5rem; place-items: center; border: 1px solid #29496f; border-radius: 1rem; background: #10294b; color: #a7c5ed; }
	.empty-icon svg { width: 1.65rem; height: 1.65rem; }
	.empty-history h2 { margin: 1rem 0 .35rem; color: #fff; font-size: 1.1rem; }
	.empty-history p { margin: 0 0 1rem; color: #8eadd4; font-size: .8rem; }
	.empty-history a { color: #8bb8ff; font-size: .8rem; font-weight: 800; }
	.reorder-bar { position: fixed; z-index: 20; right: 0; bottom: 0; left: 0; border-top: 1px solid #244364; background: rgba(12, 39, 72, .97); backdrop-filter: blur(12px); }
	.reorder-inner { display: flex; min-height: 6.1rem; align-items: center; justify-content: space-between; gap: 1rem; width: min(100% - 2rem, 68rem); margin: 0 auto; }
	.selection-summary { display: grid; gap: .1rem; }
	.selection-summary span { color: #87a7d0; font-size: .65rem; font-weight: 800; letter-spacing: .15em; text-transform: uppercase; }
	.selection-summary strong { color: #f3f7ff; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 1.2rem; }
	.selection-summary small { color: #7897c0; font-size: .63rem; }
	.reorder-actions { display: flex; align-items: center; gap: 1rem; }
	.reorder-notice { margin: 0; color: #7de2ad; font-size: .73rem; }
	.reorder-notice a { margin-left: .25rem; color: #b9d5ff; font-weight: 800; }
	.reorder-button { display: inline-flex; min-height: 3.1rem; align-items: center; justify-content: center; gap: .65rem; border: 0; border-radius: .75rem; background: #f4f8ff; padding: .75rem 1.2rem; color: #10294b; font: inherit; font-size: .82rem; font-weight: 900; cursor: pointer; }
	.reorder-button:disabled { background: #405c7c; color: #a4b8d0; cursor: not-allowed; }
	.reorder-button svg { width: 1rem; height: 1rem; }
	@media (max-width: 760px) {
		.order-header { align-items: flex-start; flex-direction: column; }
		.order-meta p { margin-bottom: .8rem; }
		.order-actions { width: 100%; justify-content: flex-start; }
		.order-item { grid-template-columns: 1.1rem 4.25rem minmax(0, 1fr) 7rem; gap: .7rem; }
		.item-checkbox { height: 4.25rem; }
		.item-thumbnail { width: 4.25rem; }
		.quantity-control { grid-column: 3; }
		.item-price { grid-column: 4; grid-row: 2; }
		.reorder-inner { min-height: 5.5rem; }
		.reorder-notice { display: none; }
	}
	@media (max-width: 480px) {
		.history-content { width: min(100% - 1.25rem, 65rem); margin-top: .9rem; }
		.filter-tabs { flex-wrap: nowrap; overflow-x: auto; padding-bottom: .25rem; }
		.filter-tabs button { flex: 0 0 auto; padding: .5rem .8rem; font-size: .68rem; }
		.order-item { grid-template-columns: 1rem 3.5rem minmax(0, 1fr); gap: .55rem; }
		.item-checkbox { height: 3.5rem; }
		.item-thumbnail { width: 3.5rem; }
		.item-info h3 { font-size: .82rem; }
		.quantity-control { grid-column: 3; }
		.item-price { grid-column: 3; grid-row: 3; justify-items: start; text-align: left; }
		.order-count { width: 100%; }
		.status-badge { margin-right: auto; }
		.reorder-inner { width: min(100% - 1.25rem, 68rem); }
		.reorder-button { padding: .7rem .85rem; font-size: .72rem; }
		.selection-summary strong { font-size: 1rem; }
	}
	:global(html:not([data-theme='dark']) body) { background: #f9fbff; color: #061d42; }
	:global(html:not([data-theme='dark']) .history-page) { background: #f9fbff; color: #061d42; }
	:global(html:not([data-theme='dark']) .history-toolbar) { border-color: #d9e0ea; }
	:global(html:not([data-theme='dark']) .back-button) { background: #e8eff7; color: #17385f; }
	:global(html:not([data-theme='dark']) .toolbar-title h1), :global(html:not([data-theme='dark']) .order-meta h2), :global(html:not([data-theme='dark']) .item-info h3), :global(html:not([data-theme='dark']) .item-price strong), :global(html:not([data-theme='dark']) .selection-summary strong), :global(html:not([data-theme='dark']) .empty-history h2) { color: #10294b; }
	:global(html:not([data-theme='dark']) .toolbar-title p), :global(html:not([data-theme='dark']) .order-meta p), :global(html:not([data-theme='dark']) .order-count), :global(html:not([data-theme='dark']) .item-info p), :global(html:not([data-theme='dark']) .item-info code), :global(html:not([data-theme='dark']) .item-price span), :global(html:not([data-theme='dark']) .selection-summary small), :global(html:not([data-theme='dark']) .empty-history p) { color: #6d83a2; }
	:global(html:not([data-theme='dark']) .order-meta p strong) { color: #345477; }
	:global(html:not([data-theme='dark']) .shop-link) { border-color: #c6d3e2; color: #345477; }
	:global(html:not([data-theme='dark']) .filter-tabs button) { border-color: #d5dfec; background: #edf3fa; color: #536b8a; }
	:global(html:not([data-theme='dark']) .filter-tabs button.active) { border-color: #155bd8; background: #fff; color: #12365e; }
	:global(html:not([data-theme='dark']) .order-header) { border-bottom-color: #d9e0ea; }
	:global(html:not([data-theme='dark']) .order-item) { border-bottom-color: #d9e0ea; }
	:global(html:not([data-theme='dark']) .status-badge.delivered) { background: #e3f7ed; color: #168251; }
	:global(html:not([data-theme='dark']) .status-badge.ready) { background: #fff4d9; color: #9b6500; }
	:global(html:not([data-theme='dark']) .status-badge.cancelled) { background: #fdebed; color: #b42336; }
	:global(html:not([data-theme='dark']) .item-checkbox span) { border-color: #aebdd0; background: #fff; }
	:global(html:not([data-theme='dark']) .item-checkbox input:checked + span) { border-color: #155bd8; background: #155bd8; box-shadow: inset 0 0 0 3px #fff; }
	:global(html:not([data-theme='dark']) .item-checkbox input:focus-visible + span) { outline-color: #155bd8; }
	:global(html:not([data-theme='dark']) .quantity-control) { background: #e8eff7; }
	:global(html:not([data-theme='dark']) .quantity-control button) { color: #38506f; }
	:global(html:not([data-theme='dark']) .quantity-control button:hover) { background: #d8e5f3; }
	:global(html:not([data-theme='dark']) .quantity-control span) { border-color: #c6d3e2; color: #17385f; }
	:global(html:not([data-theme='dark']) .empty-icon) { border-color: #d5dfec; background: #edf3fa; color: #2563eb; }
	:global(html:not([data-theme='dark']) .empty-history a), :global(html:not([data-theme='dark']) .reorder-notice a) { color: #155bd8; }
	:global(html:not([data-theme='dark']) .reorder-bar) { border-color: #d7e0ec; background: rgba(255, 255, 255, .96); }
	:global(html:not([data-theme='dark']) .selection-summary span) { color: #7890b6; }
	:global(html:not([data-theme='dark']) .reorder-notice) { color: #168251; }
	:global(html:not([data-theme='dark']) .reorder-button) { background: #155bd8; color: #fff; }
	:global(html:not([data-theme='dark']) .reorder-button:disabled) { background: #d4deeb; color: #7588a3; }
</style>