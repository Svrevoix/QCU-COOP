<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { afterNavigate, beforeNavigate, goto } from '$app/navigation';
	import './layout.css';
	import { cartItemCount, cartPieceCount } from '$lib/cart';
	import { avatarImage } from '$lib/profile';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';

	let { children } = $props();
	let showMobileMenu = $state(false);
	let searchQuery = $state('');
	let searchInput = $state<HTMLInputElement>();

	// Fallback identity shown on the avatar badge before any session is authenticated.
	const placeholderStudentId = '23-1111';
	let displayedId = $derived(page.data.user?.id ?? placeholderStudentId);
	let isAdmin = $derived(page.data.user?.role === 'admin');

	// Profile dropdown state + a reference to its wrapper so outside clicks can close it.
	let showProfileMenu = $state(false);
	let profileMenuContainer = $state<HTMLDivElement>();

	let showLogoutConfirmation = $state(false);
	let showLoadingSkeleton = $state(true);
	let loadingPathname = $state<string>(page.url.pathname);
	let loadingStartedAt = 0;
	let loadingTimer: ReturnType<typeof setTimeout> | undefined;
	let loadingKind = $derived.by(() => {
		const pathname = loadingPathname;
		if (pathname === '/login' || pathname === '/staff/login') return 'login';
		if (pathname === '/staff/pos/account' || pathname === '/account') return 'account';
		if (pathname.startsWith('/staff/pos')) return 'cashier-pos';
		if (pathname.startsWith('/staff/admin/inventory/profiles/') || pathname.startsWith('/staff/admin/inventory/purchases/') || pathname.startsWith('/staff/admin/inventory/adjustments/')) return 'inventory-form';
		if (pathname.startsWith('/staff/admin/inventory')) return 'inventory';
		if (pathname.startsWith('/staff/admin/reports')) return 'reports';
		if (pathname === '/staff/admin' || pathname.startsWith('/staff/admin/dashboard')) return 'admin-dashboard';
		if (pathname === '/cart') return 'cart';
		if (pathname.startsWith('/products')) return 'products';
		if (pathname.startsWith('/shop')) return 'shop';
		if (pathname.startsWith('/about')) return 'about';
		return 'home';
	});
	let isStaffWorkspace = $derived(page.url.pathname.startsWith('/staff') && loadingKind !== 'login');

	let activeNav = $derived(
		page.url.pathname === '/' ? 'home' : page.url.pathname.startsWith('/shop') ? 'aisle' : page.url.pathname.startsWith('/products') ? 'product' : 'product'
	);

	function submitSearch() {
		const query = searchQuery.trim();
		if (!query) return;
		showMobileMenu = false;
		goto(`/products?query=${encodeURIComponent(query)}`);
	}

	function toggleProfileMenu() {
		showProfileMenu = !showProfileMenu;
	}

	function closeProfileMenu() {
		showProfileMenu = false;
	}

	function handleLogout() {
		closeProfileMenu();
		showMobileMenu = false;
		showLogoutConfirmation = true;
	}

	function closeLogoutConfirmation() {
		showLogoutConfirmation = false;
	}

	function finishPageLoading() {
		const remaining = Math.max(0, 400 - (Date.now() - loadingStartedAt));
		clearTimeout(loadingTimer);
		loadingTimer = setTimeout(() => {
			showLoadingSkeleton = false;
			loadingStartedAt = 0;
		}, remaining);
	}

	async function confirmLogout() {
		searchQuery = '';
		showLogoutConfirmation = false;
		await fetch('/logout', { method: 'POST' });
		await goto('/login', { invalidateAll: true });
	}

	// Closes the dropdown when a click lands outside of its container.
	function handleWindowClick(event: MouseEvent) {
		if (!showProfileMenu) return;
		if (profileMenuContainer && !profileMenuContainer.contains(event.target as Node)) {
			showProfileMenu = false;
		}
	}

	beforeNavigate(({ to }) => {
		clearTimeout(loadingTimer);
		loadingStartedAt = Date.now();
		loadingPathname = to?.url.pathname ?? page.url.pathname;
		showLoadingSkeleton = true;
	});

	afterNavigate(() => {
		loadingPathname = page.url.pathname;
		if (!loadingStartedAt) loadingStartedAt = Date.now();
		finishPageLoading();
	});

	$effect(() => {
		if (!showLogoutConfirmation) return;

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		return () => {
			document.body.style.overflow = previousOverflow;
		};
	});

	onMount(() => {
		// Applies the previously saved theme (set from the Account page) on load.
		const savedTheme = localStorage.getItem('qcu-theme');
		if (savedTheme) document.documentElement.dataset.theme = savedTheme;
		loadingStartedAt = Date.now();
		finishPageLoading();

		window.addEventListener('click', handleWindowClick);
		return () => {
			clearTimeout(loadingTimer);
			window.removeEventListener('click', handleWindowClick);
		};
	});
</script>

<svelte:window onkeydown={(event) => {
	if (event.key === 'Escape' && showLogoutConfirmation) closeLogoutConfirmation();
}} />

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
{:else if !page.url.pathname.startsWith('/staff')}
<header class="site-header bg-[#050c1e] text-white shadow-md relative z-50 font-sans" style="font-family: 'Montserrat', sans-serif;">
	<div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
		
		<a href="/" class="text-xl font-black tracking-wider hover:text-blue-300 transition shrink-0">
			QCU COOP STORE
		</a>
		{#if !isAdmin}
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
		{/if}

		<div class="flex items-center gap-4 font-medium text-sm shrink-0 ml-auto">
			{#if !isAdmin}
				<nav class="hidden md:grid grid-cols-2 items-center gap-1 rounded-full bg-blue-900/40 border border-blue-400/30 p-1 shadow-inner shadow-black/20">
					<div class="pointer-events-none absolute"></div>
					<a href="/" class="relative z-10 rounded-full px-4 py-2 text-center text-xs transition-colors {activeNav === 'home' ? 'text-blue-900' : 'text-blue-200 hover:text-white'}">
						{#if activeNav === 'home'}<span class="absolute inset-0 -z-10 rounded-full bg-white shadow-sm"></span>{/if}
						Home
					</a>
					<a href="/shop" class="relative z-10 rounded-full px-4 py-2 text-center text-xs transition-colors {activeNav === 'aisle' ? 'text-blue-900' : 'text-blue-200 hover:text-white'}">
						{#if activeNav === 'aisle'}<span class="absolute inset-0 -z-10 rounded-full bg-white shadow-sm"></span>{/if}
						Shop
					</a>
				</nav>

				<a href="/cart" class="relative p-2 text-zinc-300 hover:text-blue-300 transition" aria-label="View Shopping Cart">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
					</svg>
					<span class="absolute top-0 right-0 bg-blue-600 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-sm border border-[#050c1e]">
						{$cartPieceCount}
					</span>
				</a>
			{/if}

			<!-- Profile trigger: student ID pill sits left of the avatar, which opens the Account/Logout dropdown. -->
			<!-- Keyed on role+id so the avatar visual force-resets/remounts on every identity change. -->
			{#key `${page.data.user?.role}:${page.data.user?.id}`}
				<div class="profile-menu-container" bind:this={profileMenuContainer}>
					<div class="profile-trigger">
						<span class="student-id-badge" aria-hidden="true">{displayedId}</span>
						<button
							type="button"
							class="profile-avatar-button"
							onclick={toggleProfileMenu}
							aria-haspopup="menu"
							aria-expanded={showProfileMenu}
							aria-label={`Open profile menu. Student ID: ${displayedId}`}
						>
							{#if isAdmin}
								<span class="profile-avatar" aria-hidden="true">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4Z" stroke-linejoin="round"/></svg>
								</span>
							{:else if $avatarImage}
								<img src={$avatarImage} alt="" class="profile-avatar-image" />
							{:else if !page.url.pathname.startsWith('/staff')}
								<span class="profile-avatar" aria-hidden="true">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="3.5"/><path stroke-linecap="round" d="M5 20c1.2-3.6 4.2-5.5 7-5.5s5.8 1.9 7 5.5"/></svg>
								</span>
							{/if}
						</button>
					</div>

					{#if showProfileMenu}
						<div class="profile-dropdown" role="menu" transition:fly={{ y: -6, duration: 150 }}>
							<a href="/account" role="menuitem" class="profile-dropdown-item" onclick={closeProfileMenu}>
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path stroke-linecap="round" d="M5 20c1.2-3.6 4.2-5.5 7-5.5s5.8 1.9 7 5.5"/></svg>
								<span>Account</span>
							</a>

							<button type="button" role="menuitem" class="profile-dropdown-item logout-item" onclick={handleLogout}>
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path stroke-linecap="round" stroke-linejoin="round" d="M16 17l5-5-5-5"/><path stroke-linecap="round" d="M21 12H9"/></svg>
								<span>Logout</span>
							</button>
						</div>
					{/if}
				</div>
			{/key}

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
	/* Profile trigger: student ID pill placed left of the avatar button */
	.profile-menu-container { position: relative; display: inline-flex; }
	.profile-trigger { display: flex; align-items: center; gap: 0.5rem; }
	.student-id-badge { background: #2563eb; color: #ffffff; font-size: 0.68rem; font-weight: 800; letter-spacing: 0.02em; line-height: 1; padding: 0.35rem 0.7rem; border-radius: 9999px; white-space: nowrap; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25); }
	.profile-avatar-button { position: relative; display: grid; place-items: center; width: 2.35rem; height: 2.35rem; padding: 0; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 9999px; background: #17233d; color: #d9e8ff; cursor: pointer; overflow: hidden; transition: background 150ms ease, border-color 150ms ease; }
	.profile-avatar-button:hover { background: #243557; }
	.profile-avatar { width: 1.3rem; height: 1.3rem; }
	.profile-avatar-image { width: 100%; height: 100%; object-fit: cover; border-radius: 9999px; }

	/* Dropdown panel: minimalist light theme with subtle border + smooth transitions */
	.profile-dropdown { position: absolute; top: calc(100% + 0.85rem); right: 0; width: 12rem; background: #ffffff; color: #1f2937; border: 1px solid #e5e9f0; border-radius: 0.85rem; box-shadow: 0 14px 32px rgba(15, 23, 42, 0.16); padding: 0.4rem; z-index: 60; }
	.profile-dropdown-item { display: flex; align-items: center; gap: 0.5rem; width: 100%; padding: 0.55rem 0.65rem; border: 0; border-radius: 0.6rem; background: transparent; color: #1f2937; font-size: 0.8rem; font-weight: 700; text-align: left; text-decoration: none; cursor: pointer; transition: background 120ms ease, color 120ms ease; }
	.profile-dropdown-item svg { width: 1.05rem; height: 1.05rem; flex-shrink: 0; }
	.profile-dropdown-item:hover { background: #f1f5f9; }
	.logout-item { color: #dc2626; }
	.logout-item:hover { background: #fef2f2; color: #b91c1c; }

	:global(html[data-theme='dark'] .profile-dropdown) { background: #172640; border-color: #334866; box-shadow: 0 14px 32px rgba(0, 0, 0, 0.4); }
	:global(html[data-theme='dark'] .profile-dropdown-item) { color: #edf4ff; }
	:global(html[data-theme='dark'] .profile-dropdown-item:hover) { background: #223957; }
	:global(html[data-theme='dark'] .logout-item) { color: #fca5a5; }
	:global(html[data-theme='dark'] .logout-item:hover) { background: #3b1f24; color: #fecaca; }
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
	:global(html[data-theme='dark'] .logout-confirmation-modal) { background: #172640 !important; border-color: #334866 !important; }
	:global(html[data-theme='dark'] .logout-confirmation-icon) { background: #3b1f24 !important; color: #fecaca !important; box-shadow: 0 0 0 8px #261b2a; }
	:global(html[data-theme='dark'] .logout-confirmation-title) { color: #edf4ff !important; }
	:global(html[data-theme='dark'] .logout-confirmation-description) { color: #b8c8dd !important; }
	:global(html[data-theme='dark'] .logout-confirmation-cancel) { background: #2b3b56 !important; color: #edf4ff !important; }
	:global(html[data-theme='dark'] .logout-confirmation-cancel:hover) { background: #374b6b !important; }
	:global(html[data-theme='light'] .site-header) { background: #ffffff !important; color: #07152d !important; border-bottom: 1px solid #d9e2ec; box-shadow: 0 2px 10px rgba(7, 21, 45, 0.08); }
	:global(html[data-theme='light'] .site-header > div > a) { color: #07152d !important; }
	:global(html[data-theme='light'] .site-header input) { background: #f5f7fa !important; border-color: #d9e2ec !important; color: #07152d !important; }
	:global(html[data-theme='light'] .site-header .profile-avatar-button) { background: #edf2f8 !important; border-color: #d9e2ec !important; box-shadow: none; }
	:global(html[data-theme='light'] .site-header nav) { background: #dbeafe !important; border-color: #93c5fd !important; box-shadow: none; }
	:global(html[data-theme='light'] .site-header nav a), :global(html[data-theme='light'] .site-header nav button) { color: #1d4ed8 !important; }
	:global(html[data-theme='light'] .site-header a[aria-label='View Shopping Cart']), :global(html[data-theme='light'] .site-header .profile-avatar-button) { color: #38506f !important; }
	:global(html[data-theme='dark'] .site-header) { background: #050c1e !important; }
	:global(html[data-theme='dark'] .site-header nav) { background: rgba(30, 58, 138, 0.35) !important; border-color: rgba(96, 165, 250, 0.35) !important; }
	.page-loading-overlay { position: fixed; z-index: 200; inset: 0; overflow: auto; background: #f3f6fa; color: #172b4d; }
	.loading-stage { display: grid; min-height: 100vh; grid-template-columns: minmax(0, 1fr); }
	.loading-stage.staff-loading { grid-template-columns: 17rem minmax(0, 1fr); }
	.loading-sidebar { display: flex; min-height: 100vh; flex-direction: column; gap: 1.1rem; background: #07152d; padding: 1.5rem 1rem; }
	.loading-brand { display: flex; align-items: center; gap: .75rem; margin-bottom: 1rem; }
	.loading-mark { width: 2.25rem; height: 2.25rem; flex: 0 0 auto; border-radius: .6rem; }
	.loading-nav-item { height: 2.65rem; border-radius: .6rem; }
	.loading-content { min-width: 0; }
	.loading-topbar { display: flex; height: 4rem; align-items: center; justify-content: space-between; border-bottom: 1px solid #e4eaf2; background: white; padding: 0 clamp(1rem, 4vw, 3rem); }
	.loading-topbar-brand { width: 10rem; height: 1.25rem; }
	.loading-topbar-actions { display: flex; gap: .75rem; }
	.loading-topbar-actions i { width: 2.25rem; height: 2.25rem; border-radius: 50%; }
	.loading-body { width: min(100%, 100rem); margin: 0 auto; padding: 2.25rem clamp(1rem, 3vw, 3rem) 3rem; }
	.loading-body.loading-narrow { max-width: 38rem; }
	.loading-body.user-account { max-width: 26rem; }
	.loading-heading { display: grid; gap: .7rem; margin-bottom: 1.5rem; }
	.loading-block { display: block; height: .7rem; border-radius: .3rem; }
	.loading-block.short { width: 7rem; height: .55rem; }
	.loading-block.title { width: min(18rem, 65%); height: 1.8rem; }
	.loading-block.subtitle { width: min(25rem, 80%); height: .65rem; }
	.loading-panel, .loading-stat, .loading-card { border: 1px solid #e4eaf2; border-radius: .65rem; background: white; }
	.loading-panel { padding: 1.25rem; }
	.loading-panel-heading { display: flex; justify-content: space-between; gap: 1rem; margin-bottom: 1.1rem; }
	.loading-panel-heading i:first-child { width: 9rem; height: .85rem; }
	.loading-panel-heading i:last-child { width: 5rem; height: .75rem; }
	.loading-stats, .loading-cards { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .85rem; margin-bottom: 1.1rem; }
	.loading-stat { display: grid; min-height: 6rem; gap: .75rem; align-content: center; padding: 1rem; }
	.loading-stat i, .loading-table-row i, .loading-card-copy i, .loading-image, .loading-filter i, .loading-profile-avatar, .loading-chart i { display: block; border-radius: .3rem; }
	.loading-stat i { width: 55%; height: .65rem; }.loading-stat i:last-child { width: 35%; height: 1.1rem; }
	.loading-table-row { display: grid; grid-template-columns: 1.2fr 1fr 1fr .7fr; gap: 1rem; border-top: 1px solid #edf1f5; padding: 1rem 0; }
	.loading-table-row i { height: .65rem; }
	.loading-cards { grid-template-columns: repeat(3, minmax(0, 1fr)); }
	.loading-card { min-width: 0; overflow: hidden; }
	.loading-image { height: 9rem; border-radius: 0; }
	.loading-card-copy { display: grid; gap: .65rem; padding: 1rem; }
	.loading-card-copy i { width: 72%; height: .65rem; }.loading-card-copy i:first-child { width: 88%; height: .85rem; }.loading-card-copy i:last-child { width: 45%; }
	.loading-featured { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(17rem, .8fr); gap: 2rem; align-items: center; min-height: 27rem; border-radius: 0 0 1.25rem 1.25rem; background: #123a72; padding: clamp(1.5rem, 5vw, 4rem); }
	.loading-featured-copy { display: grid; gap: 1rem; }.loading-featured-copy i { width: 85%; height: .85rem; border-radius: .4rem; background: #4a6792; }.loading-featured-copy i:first-child { width: 48%; height: .55rem; }.loading-featured-copy i:nth-child(2) { width: 95%; height: 2.25rem; }.loading-featured-copy i:nth-child(3) { width: 74%; height: 1.1rem; }
	.loading-featured-art { display: grid; min-height: 19rem; place-items: center; border-radius: 1rem; background: #e5edf8; }.loading-featured-art i { width: 55%; height: 65%; border-radius: .8rem; background: #d0dceb; }
	.loading-section { width: min(100%, 72rem); margin: 2rem auto; padding: 0 1.25rem; }.loading-section-title { width: 12rem; height: 1.1rem; margin-bottom: 1rem; border-radius: .3rem; }
	.loading-shop-card .loading-image { height: 14rem; }.loading-product-card .loading-image { height: 9rem; }.loading-product-card .loading-card-copy { min-height: 8rem; }
	.loading-account { width: min(100%, 38rem); margin: 0 auto; }.loading-account-center { display: grid; justify-items: center; gap: .65rem; padding: 2rem 0; }.loading-profile-avatar { width: 6rem; height: 6rem; border-radius: 50%; }.loading-settings-row { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #edf1f5; padding-top: 1rem; }.loading-settings-row i:first-child { width: 7rem; height: .75rem; }.loading-settings-row i:last-child { width: 2.5rem; height: 1.3rem; border-radius: 1rem; }
	.loading-cart { display: grid; grid-template-columns: minmax(0, 1fr) 16rem; gap: 1.5rem; }.loading-cart-item { display: grid; grid-template-columns: 5rem minmax(0, 1fr) auto; align-items: center; gap: 1rem; border-bottom: 1px solid #edf1f5; padding: 1rem 0; }.loading-cart-image { width: 5rem; height: 5rem; border-radius: .6rem; }.loading-cart-copy { display: grid; gap: .6rem; }.loading-cart-copy i { width: 65%; height: .65rem; }.loading-cart-copy i:first-child { width: 82%; height: .85rem; }.loading-cart-price { width: 4rem; height: .85rem; }.loading-cart-summary { display: grid; align-content: start; gap: 1rem; }.loading-cart-summary i { height: .75rem; }.loading-cart-summary i:last-child { height: 2.5rem; margin-top: .5rem; border-radius: .5rem; }
	.loading-dashboard-charts { display: grid; grid-template-columns: 1.5fr 1fr; gap: .85rem; margin-bottom: 1.1rem; }.loading-chart { display: flex; height: 10rem; align-items: flex-end; justify-content: space-around; gap: .5rem; padding-top: 1rem; }.loading-chart i { width: 7%; min-height: 20%; }.loading-chart i:nth-child(3n) { height: 78%; }.loading-chart i:nth-child(3n + 1) { height: 48%; }.loading-chart i:nth-child(3n + 2) { height: 62%; }.loading-report-filters { display: grid; grid-template-columns: 1fr 1fr 1.4fr auto; gap: .7rem; margin-top: 1.2rem; }.loading-filter { display: grid; gap: .45rem; }.loading-filter i:first-child { width: 45%; height: .55rem; }.loading-filter i:last-child { width: 100%; height: 2.4rem; }
	.loading-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }.loading-form-field { display: grid; gap: .45rem; }.loading-form-field i:first-child { width: 45%; height: .6rem; }.loading-form-field i:last-child { height: 2.6rem; }
	.loading-login { width: min(100% - 2rem, 27rem); margin: 10vh auto; }.loading-login .loading-profile-avatar { margin: 0 auto 1.5rem; }
	.loading-about-grid { display: grid; grid-template-columns: 1.2fr .8fr; gap: 1.25rem; }.loading-about-copy { display: grid; gap: .75rem; }.loading-about-copy i { height: .7rem; }.loading-about-copy i:nth-child(3n) { width: 82%; }
	.skeleton-block, .loading-block, .loading-stat i, .loading-table-row i, .loading-card-copy i, .loading-image, .loading-featured-art i, .loading-account-center i, .loading-cart-item i, .loading-cart-summary i, .loading-chart i, .loading-filter i, .loading-form-field i, .loading-panel-heading i, .loading-topbar-actions i { background: linear-gradient(100deg, #e7edf4 20%, #f5f7fa 38%, #e7edf4 56%); background-size: 250% 100%; animation: loading-sheen 1.35s ease-in-out infinite; }
	.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; clip-path: inset(50%); }
	@keyframes loading-sheen { to { background-position-x: -250%; } }
	:global(html[data-theme='dark'] .page-loading-overlay) { background: #101d35; }
	:global(html[data-theme='dark'] .loading-topbar), :global(html[data-theme='dark'] .loading-stat), :global(html[data-theme='dark'] .loading-panel), :global(html[data-theme='dark'] .loading-card) { border-color: #334866; background-color: #172640; }
	:global(html[data-theme='dark'] .skeleton-block), :global(html[data-theme='dark'] .loading-block), :global(html[data-theme='dark'] .loading-stat i), :global(html[data-theme='dark'] .loading-table-row i), :global(html[data-theme='dark'] .loading-card-copy i), :global(html[data-theme='dark'] .loading-image), :global(html[data-theme='dark'] .loading-cart-item i), :global(html[data-theme='dark'] .loading-cart-summary i), :global(html[data-theme='dark'] .loading-chart i), :global(html[data-theme='dark'] .loading-filter i), :global(html[data-theme='dark'] .loading-form-field i), :global(html[data-theme='dark'] .loading-panel-heading i), :global(html[data-theme='dark'] .loading-topbar-actions i) { background-image: linear-gradient(100deg, #263b59 20%, #334866 38%, #263b59 56%); }
	@media (max-width: 900px) { .loading-stage.staff-loading { grid-template-columns: 14rem minmax(0, 1fr); }.loading-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }.loading-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }.loading-cart { grid-template-columns: minmax(0, 1fr) 13rem; }.loading-dashboard-charts { grid-template-columns: 1fr; } }
	@media (max-width: 760px) { .loading-stage.staff-loading { display: block; }.loading-sidebar { min-height: auto; height: 5.75rem; flex-direction: row; align-items: center; overflow: hidden; padding: .85rem 1rem; }.loading-brand { margin: 0 .5rem 0 0; }.loading-nav-item { width: 7rem; height: 2.4rem; flex: 0 0 auto; }.loading-featured { grid-template-columns: 1fr; gap: 1.25rem; min-height: 0; }.loading-featured-art { min-height: 12rem; }.loading-report-filters { grid-template-columns: 1fr 1fr; }.loading-about-grid { grid-template-columns: 1fr; } }
	@media (max-width: 560px) { .loading-cards { gap: .6rem; }.loading-shop-card .loading-image { height: 9rem; }.loading-product-card .loading-image { height: 7rem; }.loading-card-copy { padding: .75rem; }.loading-cart { grid-template-columns: 1fr; }.loading-cart-summary { position: sticky; bottom: 0; grid-template-columns: 1fr auto; align-items: center; border: 1px solid #e4eaf2; border-radius: .65rem; background: white; padding: .85rem; }.loading-cart-summary i:last-child { width: 7rem; margin: 0; }.loading-form-grid { grid-template-columns: 1fr; }.loading-table-row { grid-template-columns: 1fr 1fr; gap: .75rem; padding: .8rem 0; }.loading-table-row i:nth-child(n + 3) { display: none; } }
	.loading-products-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
	.loading-cart { display: block; padding-bottom: 7rem; }
	.loading-cart-summary { position: fixed; z-index: 2; right: 0; bottom: 0; left: 0; display: flex; min-height: 6.5rem; align-items: center; justify-content: space-between; gap: 1rem; border-right: 0; border-bottom: 0; border-left: 0; border-radius: 0; background: rgba(255,255,255,.96); padding: 0 clamp(1rem, 4vw, 3rem); }
	.loading-cart-summary i { width: 9rem; height: .75rem; }.loading-cart-summary i:last-child { width: 11.5rem; height: 3rem; margin: 0; border-radius: .6rem; }
	@media (max-width: 1023px) { .loading-products-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
	@media (max-width: 760px) { .loading-shop-grid { grid-template-columns: 1fr; } }
	@media (max-width: 639px) { .loading-products-grid { grid-template-columns: 1fr; } }
	@media (max-width: 560px) { .loading-cart-summary { min-height: 5.75rem; }.loading-cart-summary i:first-child { width: 7rem; }.loading-cart-summary i:last-child { width: 7rem; height: 2.75rem; } }
	@media (prefers-reduced-motion: reduce) { .skeleton-block, .loading-block, .loading-stat i, .loading-table-row i, .loading-card-copy i, .loading-image, .loading-cart-item i, .loading-cart-summary i, .loading-chart i, .loading-filter i, .loading-form-field i, .loading-panel-heading i, .loading-topbar-actions i { animation: none; } }

	/* Fade + slide entrance replayed on reload (fresh mount) or right after a successful login (key bump) */
	@keyframes dashboard-enter {
		from { opacity: 0; transform: translateY(22px); }
		to { opacity: 1; transform: translateY(0); }
	}
	.dashboard-enter { animation: dashboard-enter 620ms cubic-bezier(0.22, 1, 0.36, 1) both; }
</style>

<main class="min-h-screen bg-zinc-50 font-sans" class:dashboard-enter={page.data.user !== null} style="font-family: 'Montserrat', sans-serif;">
	{@render children()}
</main>

{#if showLogoutConfirmation}
	<div class="fixed inset-0 z-[100] flex items-center justify-center bg-[#050c1e]/70 p-4 backdrop-blur-md" role="presentation" onclick={(event) => event.target === event.currentTarget && closeLogoutConfirmation()}>
		<div class="logout-confirmation-modal w-full max-w-md rounded-2xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8" role="alertdialog" aria-modal="true" aria-labelledby="logout-confirmation-title" aria-describedby="logout-confirmation-description">
			<div class="logout-confirmation-icon mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 ring-8 ring-red-50" aria-hidden="true">
				<svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.3 4.8 2.9 18a2 2 0 0 0 1.74 3h14.72a2 2 0 0 0 1.74-3L13.7 4.8a2 2 0 0 0-3.4 0Z" />
				</svg>
			</div>
			<h2 id="logout-confirmation-title" class="logout-confirmation-title mt-5 text-xl font-black text-[#07152d]">Are you sure you want to log out?</h2>
			<p id="logout-confirmation-description" class="logout-confirmation-description mt-2 text-sm leading-6 text-zinc-500">You will need to sign in again to access your account.</p>
			<div class="mt-7 grid grid-cols-2 gap-3">
				<button type="button" onclick={closeLogoutConfirmation} class="logout-confirmation-cancel rounded-xl bg-zinc-200 px-4 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-300">Cancel</button>
				<button type="button" onclick={confirmLogout} class="logout-confirmation-submit rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700">Log out</button>
			</div>
		</div>
	</div>
{/if}

{#if showLoadingSkeleton}
	<div class="page-loading-overlay" role="status" aria-live="polite" aria-label="Loading page">
		<span class="sr-only">Loading page</span>
		<div class="loading-stage" class:staff-loading={isStaffWorkspace} aria-hidden="true">
			{#if isStaffWorkspace}
				<aside class="loading-sidebar">
					<div class="loading-brand"><i class="skeleton-block loading-mark"></i><i class="skeleton-block loading-line" style="width: 7rem"></i></div>
					<i class="skeleton-block loading-nav-item"></i><i class="skeleton-block loading-nav-item"></i><i class="skeleton-block loading-nav-item"></i>
				</aside>
			{/if}
			<section class="loading-content">
				{#if !isStaffWorkspace && loadingKind !== 'login' && loadingKind !== 'cart'}
					<div class="loading-topbar"><i class="skeleton-block loading-topbar-brand"></i><div class="loading-topbar-actions"><i></i><i></i></div></div>
				{/if}
				{#if loadingKind === 'home'}
					<section class="loading-featured"><div class="loading-featured-copy"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="loading-featured-art"><i></i></div></section>
					<div class="loading-section"><i class="skeleton-block loading-section-title"></i><div class="loading-cards">{#each [0, 1, 2] as card (card)}<article class="loading-card"><div class="loading-image"></div><div class="loading-card-copy"><i></i><i></i><i></i></div></article>{/each}</div></div>
				{:else if loadingKind === 'login'}
					<div class="loading-login"><section class="loading-panel"><i class="skeleton-block loading-profile-avatar"></i><div class="loading-heading"><i class="loading-block title"></i><i class="loading-block subtitle"></i></div>{#each [0, 1, 2] as field (field)}<div class="loading-form-field"><i class="skeleton-block"></i><i class="skeleton-block"></i></div>{/each}</section></div>
				{:else}
					<div class="loading-body" class:loading-narrow={loadingKind === 'account'} class:user-account={loadingKind === 'account' && !isStaffWorkspace}>
						{#if loadingKind === 'account'}
							<div class="loading-heading"><i class="loading-block short"></i><i class="loading-block title"></i><i class="loading-block subtitle"></i></div><section class="loading-panel loading-account"><div class="loading-panel-heading"><i></i></div><div class="loading-account-center"><i class="skeleton-block loading-profile-avatar"></i><i class="loading-block" style="width: 9rem"></i><i class="loading-block" style="width: 6rem"></i></div><div class="loading-settings-row"><i class="skeleton-block"></i><i class="skeleton-block"></i></div></section>
						{:else if loadingKind === 'shop'}
						<div class="loading-heading"><i class="loading-block short"></i><i class="loading-block title"></i></div><div class="loading-cards loading-shop-grid">{#each [0, 1, 2, 3, 4, 5] as card (card)}<article class="loading-card loading-shop-card"><div class="loading-image"></div><div class="loading-card-copy"><i></i><i></i><i></i></div></article>{/each}</div>
						{:else if loadingKind === 'products'}
						<div class="loading-heading"><i class="loading-block short"></i><div class="loading-panel-heading"><i class="loading-block title"></i><i class="skeleton-block" style="width: 8rem"></i></div><i class="loading-block subtitle"></i></div><div class="loading-cards loading-products-grid">{#each [0, 1, 2, 3, 4, 5, 6, 7] as card (card)}<article class="loading-card loading-product-card"><div class="loading-image"></div><div class="loading-card-copy"><i></i><i></i><i></i></div></article>{/each}</div>
						{:else if loadingKind === 'about'}
						<div class="loading-heading"><i class="loading-block short"></i><i class="loading-block title"></i><i class="loading-block subtitle"></i></div><div class="loading-about-grid"><section class="loading-panel loading-about-copy">{#each [0, 1, 2, 3, 4, 5, 6, 7] as line (line)}<i class="skeleton-block"></i>{/each}</section><section class="loading-panel loading-about-copy">{#each [0, 1, 2, 3, 4] as line (line)}<i class="skeleton-block"></i>{/each}</section></div>
						{:else if loadingKind === 'cart'}
						<div class="loading-topbar"><i class="skeleton-block loading-mark"></i><div class="loading-card-copy"><i style="width: 8rem"></i><i style="width: 5rem"></i></div></div><div class="loading-body"><div class="loading-heading"><i class="loading-block title"></i></div><div class="loading-cart"><section class="loading-panel">{#each [0, 1, 2] as item (item)}<div class="loading-cart-item"><i class="skeleton-block loading-cart-image"></i><div class="loading-cart-copy"><i></i><i></i></div><i class="skeleton-block loading-cart-price"></i></div>{/each}</section><section class="loading-panel loading-cart-summary"><i class="skeleton-block"></i><i class="skeleton-block"></i></section></div></div>
						{:else if loadingKind === 'admin-dashboard'}
						<div class="loading-heading"><i class="loading-block short"></i><div class="loading-panel-heading"><i class="loading-block title"></i><i class="skeleton-block" style="width: 5rem"></i></div><i class="loading-block subtitle"></i></div><div class="loading-stats">{#each [0, 1, 2, 3] as stat (stat)}<article class="loading-stat"><i></i><i></i><i></i></article>{/each}</div><div class="loading-dashboard-charts"><section class="loading-panel"><div class="loading-panel-heading"><i></i><i></i></div><div class="loading-chart">{#each [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as bar (bar)}<i class="skeleton-block"></i>{/each}</div></section><section class="loading-panel"><div class="loading-panel-heading"><i></i></div><div class="loading-account-center"><i class="skeleton-block loading-profile-avatar"></i><i class="loading-block" style="width: 7rem"></i></div></section></div><section class="loading-panel"><div class="loading-panel-heading"><i></i><i></i></div><div class="loading-cards">{#each [0, 1, 2] as group (group)}<div class="loading-card-copy"><i></i><i></i><i></i><i></i></div>{/each}</div></section>
						{:else if loadingKind === 'inventory'}
						<div class="loading-heading"><i class="loading-block short"></i><div class="loading-panel-heading"><i class="loading-block title"></i><i class="skeleton-block" style="width: 6rem"></i></div><i class="loading-block subtitle"></i></div><div class="loading-stats">{#each [0, 1, 2, 3] as stat (stat)}<article class="loading-stat"><i></i><i></i><i></i></article>{/each}</div><section class="loading-panel"><div class="loading-panel-heading"><i></i></div><div class="loading-cards">{#each [0, 1, 2, 3, 4] as profile (profile)}<div class="loading-card-copy loading-card"><i></i><i></i></div>{/each}</div></section><section class="loading-panel"><div class="loading-panel-heading"><i></i><i></i></div>{#each [0, 1, 2, 3, 4] as row (row)}<div class="loading-table-row"><i></i><i></i><i></i><i></i></div>{/each}</section>
						{:else if loadingKind === 'inventory-form'}
						<div class="loading-heading"><i class="loading-block short"></i><i class="loading-block title"></i><i class="loading-block subtitle"></i></div><section class="loading-panel"><div class="loading-panel-heading"><i></i></div><div class="loading-form-grid">{#each [0, 1, 2, 3, 4, 5] as field (field)}<div class="loading-form-field"><i class="skeleton-block"></i><i class="skeleton-block"></i></div>{/each}</div><div class="loading-panel-heading" style="margin-top: 1.5rem"><i></i><i></i></div><div class="loading-table-row"><i></i><i></i><i></i><i></i></div></section>
						{:else if loadingKind === 'reports'}
						<div class="loading-heading"><i class="loading-block short"></i><div class="loading-panel-heading"><i class="loading-block title"></i><i class="skeleton-block" style="width: 7rem"></i></div><i class="loading-block subtitle"></i></div><section class="loading-panel"><div class="loading-panel-heading"><i></i><i></i></div><div class="loading-report-filters">{#each [0, 1, 2, 3] as filter (filter)}<div class="loading-filter"><i class="skeleton-block"></i><i class="skeleton-block"></i></div>{/each}</div></section><div class="loading-stats">{#each [0, 1, 2, 3] as stat (stat)}<article class="loading-stat"><i></i><i></i><i></i></article>{/each}</div><section class="loading-panel"><div class="loading-panel-heading"><i></i><i></i></div>{#each [0, 1, 2, 3, 4] as row (row)}<div class="loading-table-row"><i></i><i></i><i></i><i></i></div>{/each}</section>
						{:else if loadingKind === 'cashier-pos'}
						<div class="loading-heading"><i class="loading-block short"></i><i class="loading-block title"></i><i class="loading-block subtitle"></i></div><div class="loading-stats">{#each [0, 1, 2, 3] as stat (stat)}<article class="loading-stat"><i></i><i></i><i></i></article>{/each}</div><section class="loading-panel"><div class="loading-panel-heading"><i></i><i></i></div><div class="loading-cards">{#each [0, 1, 2] as session (session)}<div class="loading-card-copy loading-card"><i></i><i></i><i></i></div>{/each}</div></section><section class="loading-panel"><div class="loading-panel-heading"><i></i><i></i></div>{#each [0, 1, 2, 3, 4] as row (row)}<div class="loading-table-row"><i></i><i></i><i></i><i></i></div>{/each}</section>
						{:else}
						<div class="loading-heading"><i class="loading-block short"></i><i class="loading-block title"></i><i class="loading-block subtitle"></i></div><section class="loading-panel">{#each [0, 1, 2, 3, 4] as line (line)}<div class="loading-table-row"><i></i><i></i><i></i><i></i></div>{/each}</section>
						{/if}
					</div>
				{/if}
			</section>
		</div>
	</div>
{/if}
