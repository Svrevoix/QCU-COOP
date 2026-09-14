<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import './layout.css';
	import { cartItemCount, cartPieceCount } from '$lib/cart';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';

	let { children } = $props();
	let showMobileMenu = $state(false);
	let searchQuery = $state('');
	let searchInput = $state<HTMLInputElement>();
	let isDarkMode = $state(false);

	let activeNav = $derived(
		page.url.pathname === '/' ? 'home' : page.url.pathname.startsWith('/shop') ? 'aisle' : page.url.pathname.startsWith('/products') ? 'product' : 'product'
	);

	function focusSearch() {
		searchInput?.focus();
	}

	function submitSearch() {
		const query = searchQuery.trim();
		if (!query) return;
		showMobileMenu = false;
		goto(`/products?query=${encodeURIComponent(query)}`);
	}

	function toggleTheme() {
		isDarkMode = !isDarkMode;
		document.documentElement.dataset.theme = isDarkMode ? 'dark' : 'light';
		localStorage.setItem('qcu-theme', isDarkMode ? 'dark' : 'light');
	}

	onMount(() => {
		isDarkMode = localStorage.getItem('qcu-theme') === 'dark';
		document.documentElement.dataset.theme = isDarkMode ? 'dark' : 'light';
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://googleapis.com">
	<link rel="preconnect" href="https://gstatic.com" crossorigin="anonymous">
	<link href="https://googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
</svelte:head>

{#if page.url.pathname === '/cart'}
	<header class="cart-shell-header">
		<div class="cart-header-inner">
			<a href="/shop" class="cart-back-button" aria-label="Return to shop">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15 18l-6-6 6-6" /></svg>
			</a>
			<div>
				<p class="cart-header-title">Your cart</p>
				<p class="cart-header-meta">{$cartItemCount} item{$cartItemCount === 1 ? '' : 's'} &nbsp;&bull;&nbsp; {$cartPieceCount} pcs</p>
			</div>
		</div>
	</header>
{:else}
<header class="site-header bg-[#050c1e] text-white shadow-md relative z-50 font-sans" style="font-family: 'Montserrat', sans-serif;">
	<div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
		
		<a href="/" class="text-xl font-black tracking-wider hover:text-blue-300 transition shrink-0">
			QCU COOP STORE
		</a>
		<form class="hidden sm:block flex-1 max-w-md mx-4 relative" onsubmit={(event) => { event.preventDefault(); submitSearch(); }}>
			<input 
				bind:this={searchInput}
				type="text" 
				bind:value={searchQuery}
				placeholder="Search essentials, uniforms..." 
				class="w-full bg-zinc-900/60 border border-zinc-800 focus:border-blue-500 rounded-xl px-4 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition"
			/>
			<div class="absolute right-3 top-2.5 text-zinc-500 pointer-events-none">
				<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
			</div>
		</form>

		<div class="flex items-center gap-4 font-medium text-sm shrink-0">
			<nav class="hidden md:grid grid-cols-3 items-center gap-1 rounded-full bg-[#17233d] border border-white/10 p-1 shadow-inner shadow-black/20">
				<div class="pointer-events-none absolute"></div>
				<a href="/" class="relative z-10 rounded-full px-4 py-2 text-center text-xs transition-colors {activeNav === 'home' ? 'text-[#17233d]' : 'text-zinc-300 hover:text-white'}">
					{#if activeNav === 'home'}<span class="absolute inset-0 -z-10 rounded-full bg-white shadow-sm"></span>{/if}
					Home
				</a>
				<a href="/shop" class="relative z-10 rounded-full px-4 py-2 text-center text-xs transition-colors {activeNav === 'aisle' ? 'text-[#17233d]' : 'text-zinc-300 hover:text-white'}">
					{#if activeNav === 'aisle'}<span class="absolute inset-0 -z-10 rounded-full bg-white shadow-sm"></span>{/if}
					Shop
				</a>
				<button type="button" onclick={focusSearch} class="relative z-10 rounded-full px-4 py-2 text-center text-xs transition-colors text-zinc-300 hover:text-white">
					Search
				</button>
			</nav>

			<a href="/cart" class="relative p-2 text-zinc-300 hover:text-blue-300 transition" aria-label="View Shopping Cart">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
				</svg>
				<span class="absolute top-0 right-0 bg-blue-600 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-sm border border-[#050c1e]">
					{$cartPieceCount}
				</span>
			</a>
			<button type="button" class="theme-toggle" onclick={toggleTheme} aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}>
				{#if isDarkMode}
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path stroke-linecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41"/></svg>
				{:else}
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/></svg>
				{/if}
			</button>

			<button 
				class="block md:hidden p-2 focus:outline-none hover:bg-zinc-800 rounded-md transition" 
				onclick={() => showMobileMenu = !showMobileMenu}
				aria-label="Toggle menu"
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					{#if showMobileMenu}
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
					{:else}
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
					{/if}
				</svg>
			</button>
		</div>

	</div>

	{#if showMobileMenu}
		<div class="md:hidden bg-zinc-950 border-t border-zinc-800 px-4 py-3 space-y-3 font-medium text-sm shadow-inner">
			<form class="block sm:hidden relative pb-1" onsubmit={(event) => { event.preventDefault(); submitSearch(); }}>
				<input 
					type="text" 
					bind:value={searchQuery}
					placeholder="Search essentials, uniforms..." 
					class="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 rounded-xl px-4 py-2 text-xs text-zinc-200 outline-none transition"
				/>
			</form>

			<a href="/shop" class="block hover:text-blue-300 transition py-1" onclick={() => showMobileMenu = false}>Shop</a>
			<a href="/about" class="block hover:text-blue-300 transition py-1" onclick={() => showMobileMenu = false}>About</a>
			
		</div>
	{/if}
</header>
{/if}

<style>
	.cart-shell-header {
		background: #061d42;
		color: white;
		font-family: 'Montserrat', sans-serif;
	}

	.cart-header-inner {
		display: flex;
		align-items: center;
		gap: 1rem;
		max-width: 64rem;
		height: 5rem;
		margin: 0 auto;
		padding: 0 1.125rem;
	}

	.cart-back-button {
		display: grid;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: 0.75rem;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		transition: background 160ms ease;
	}

	.cart-back-button:hover { background: rgba(255, 255, 255, 0.18); }
	.cart-back-button svg { width: 1.25rem; height: 1.25rem; }
	.cart-header-title { margin: 0; font-size: 1.05rem; font-weight: 800; line-height: 1.2; }
	.cart-header-meta { margin: 0.25rem 0 0; color: #a8bddf; font-size: 0.625rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
	.theme-toggle { display: grid; place-items: center; width: 2.25rem; height: 2.25rem; border: 0; border-radius: 0.55rem; background: #17233d; color: #d9e8ff; cursor: pointer; transition: background 150ms ease, color 150ms ease; }
	.theme-toggle:hover { background: #243557; color: white; }
	.theme-toggle svg { width: 1.1rem; height: 1.1rem; }
	:global(html[data-theme='dark']) { color-scheme: dark; background: #07152d; }
	:global(html[data-theme='dark'] body) { background: #07152d; color: #edf4ff; }
	:global(html[data-theme='dark'] main.min-h-screen) { background: #101d35 !important; }
	:global(html[data-theme='dark'] .product-page), :global(html[data-theme='dark'] .aisle-page) { color: #edf4ff; }
	:global(html[data-theme='dark'] .cart-page) { background: #101d35 !important; }
	:global(html[data-theme='dark'] .aisle-page h1), :global(html[data-theme='dark'] .product-page h1), :global(html[data-theme='dark'] .product-page h2), :global(html[data-theme='dark'] .cart-heading h1), :global(html[data-theme='dark'] .item-details h2) { color: #edf4ff !important; }
	:global(html[data-theme='dark'] .aisle-page > div:first-child), :global(html[data-theme='dark'] .product-page > div:first-child) { border-color: #334866 !important; }
	:global(html[data-theme='dark'] .product-page > div:first-child p), :global(html[data-theme='dark'] .product-page a) { color: #b8c8dd !important; }
	:global(html[data-theme='dark'] .product-card), :global(html[data-theme='dark'] .aisle-card) { border-color: #3b61b5 !important; box-shadow: 0 12px 28px rgba(0, 0, 0, 0.24) !important; }
	:global(html[data-theme='dark'] .filter-panel), :global(html[data-theme='dark'] .modal-panel), :global(html[data-theme='dark'] .buy-now-modal), :global(html[data-theme='dark'] .checkout-modal) { background: #172640 !important; color: #edf4ff; }
	:global(html[data-theme='dark'] .featured-card) { background: #172640 !important; border-color: #334866 !important; }
	:global(html[data-theme='dark'] .featured-card .featured-name), :global(html[data-theme='dark'] .featured-card .featured-price) { color: #edf4ff !important; }
	:global(html[data-theme='dark'] .featured-card .featured-desc), :global(html[data-theme='dark'] .featured-card .featured-sku) { color: #b8c8dd !important; }
	:global(html[data-theme='dark'] footer.bg-zinc-100) { background: #101d35 !important; border-color: #334866 !important; }
	:global(html[data-theme='dark'] footer .text-zinc-900) { color: #edf4ff !important; }
	:global(html[data-theme='dark'] footer .text-zinc-500), :global(html[data-theme='dark'] footer .text-zinc-400) { color: #b8c8dd !important; }
	:global(html[data-theme='dark'] .cart-summary) { background: rgba(16, 29, 53, 0.96) !important; border-color: #334866; }
	:global(html[data-theme='dark'] .cart-heading), :global(html[data-theme='dark'] .checkout-line), :global(html[data-theme='dark'] .checkout-total) { border-color: #334866 !important; }
	:global(html[data-theme='dark'] .empty-cart h2), :global(html[data-theme='dark'] .checkout-modal h2), :global(html[data-theme='dark'] .buy-now-modal h2) { color: #edf4ff !important; }
	:global(html[data-theme='dark'] .checkout-line strong), :global(html[data-theme='dark'] .checkout-line b), :global(html[data-theme='dark'] .checkout-total strong), :global(html[data-theme='dark'] .buy-now-item strong), :global(html[data-theme='dark'] .buy-now-item b) { color: #edf4ff !important; }
	:global(html[data-theme='dark'] .checkout-line span), :global(html[data-theme='dark'] .checkout-total span), :global(html[data-theme='dark'] .qr-copy), :global(html[data-theme='dark'] .order-reference), :global(html[data-theme='dark'] .buy-now-item span), :global(html[data-theme='dark'] .buy-now-reference), :global(html[data-theme='dark'] .buy-now-note) { color: #b8c8dd !important; }
	:global(html[data-theme='dark'] .buy-now-item), :global(html[data-theme='dark'] .checkout-items), :global(html[data-theme='dark'] .checkout-total) { border-color: #415878 !important; }
	:global(html[data-theme='dark'] .modal-close), :global(html[data-theme='dark'] .edit-cart-button) { background: #eaf2fc !important; color: #172640 !important; }
	:global(html[data-theme='dark'] .quantity-control), :global(html[data-theme='dark'] .quantity-control span) { border-color: #415878 !important; background: #101d35 !important; color: #edf4ff !important; }
	:global(html[data-theme='dark'] .quantity-control button) { background: #eaf2fc !important; }
	:global(html[data-theme='dark'] .product-icon) { background: #eaf2fc !important; }
	:global(html[data-theme='dark'] .modal-panel .text-\[\#07152d\]), :global(html[data-theme='dark'] .modal-panel .text-zinc-400) { color: #edf4ff !important; }
	:global(html[data-theme='dark'] .modal-panel .text-\[\#233f91\]) { color: #7ec8ff !important; }
	:global(html[data-theme='dark'] .modal-panel .bg-sky-50) { background: #223957 !important; }
	:global(html[data-theme='dark'] .modal-panel .bg-sky-50 .text-\[\#233f91\]) { color: #8bcbff !important; }
	:global(html[data-theme='dark'] .modal-panel .border-zinc-200) { border-color: #58718f !important; }
	:global(html[data-theme='dark'] .modal-panel .bg-zinc-100) { background: #eaf2fc !important; }
	:global(html[data-theme='dark'] .modal-panel .bg-white\/90) { background: #eaf2fc !important; }
	:global(html[data-theme='dark'] .modal-panel .modal-close), :global(html[data-theme='dark'] .modal-panel .modal-close.text-\[\#07152d\]) { color: #07152d !important; }
	:global(html[data-theme='dark'] .modal-panel button[aria-label='Close product details']) { background: #eaf2fc !important; color: #07152d !important; }
	:global(html[data-theme='dark'] .modal-panel button[aria-label='Decrease quantity']) { background: #eaf2fc !important; color: #07152d !important; }
	:global(html[data-theme='dark'] .modal-panel button.bg-white) { background: #223957 !important; border-color: #58718f !important; color: #edf4ff !important; }
	:global(html[data-theme='dark'] .modal-panel button.bg-\[\#233f91\]) { background: #294aa5 !important; border-color: #294aa5 !important; color: #ffffff !important; }
	:global(html[data-theme='dark'] .filter-panel .text-\[\#07152d\]), :global(html[data-theme='dark'] .filter-panel .text-zinc-400) { color: #edf4ff !important; }
	:global(html[data-theme='dark'] .filter-panel .bg-white), :global(html[data-theme='dark'] .filter-panel .bg-zinc-50) { background: #172640 !important; }
	:global(html[data-theme='dark'] .filter-panel .border-zinc-200), :global(html[data-theme='dark'] .filter-panel .border-zinc-100) { border-color: #415878 !important; }
	:global(html[data-theme='dark'] button[aria-label='Filter products']) { border-color: #3b82f6 !important; background: #172640 !important; color: #7ec8ff !important; }
	:global(html[data-theme='light'] .site-header) { background: #ffffff !important; color: #07152d !important; border-bottom: 1px solid #d9e2ec; box-shadow: 0 2px 10px rgba(7, 21, 45, 0.08); }
	:global(html[data-theme='light'] .site-header > div > a) { color: #07152d !important; }
	:global(html[data-theme='light'] .site-header input) { background: #f5f7fa !important; border-color: #d9e2ec !important; color: #07152d !important; }
	:global(html[data-theme='light'] .site-header nav), :global(html[data-theme='light'] .site-header .theme-toggle) { background: #edf2f8 !important; border-color: #d9e2ec !important; box-shadow: none; }
	:global(html[data-theme='light'] .site-header nav a), :global(html[data-theme='light'] .site-header nav button), :global(html[data-theme='light'] .site-header a[aria-label='View Shopping Cart']), :global(html[data-theme='light'] .site-header .theme-toggle) { color: #38506f !important; }
	:global(html[data-theme='dark'] .site-header) { background: #050c1e !important; }
</style>

<main class="min-h-screen bg-zinc-50 font-sans" style="font-family: 'Montserrat', sans-serif;">
	{@render children()}
</main>
