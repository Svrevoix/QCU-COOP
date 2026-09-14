<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import './layout.css';
	import { cartItemCount, cartPieceCount } from '$lib/cart';
	import { avatarImage } from '$lib/profile';
	import { session, type Role } from '$lib/session';
	import AuthModal from '$lib/AuthModal.svelte';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';

	let { children } = $props();
	let showMobileMenu = $state(false);
	let searchQuery = $state('');
	let searchInput = $state<HTMLInputElement>();

	// Fallback identity shown on the avatar badge before any session is authenticated.
	const placeholderStudentId = '23-1111';
	let displayedId = $derived($session.id ?? placeholderStudentId);
	let isAdmin = $derived($session.role === 'admin');

	// Profile dropdown state + a reference to its wrapper so outside clicks can close it.
	let showProfileMenu = $state(false);
	let profileMenuContainer = $state<HTMLDivElement>();

	// Controls the split-screen auth modal shown after logging out.
	let showAuthModal = $state(false);

	// Bumping this key remounts <main>, replaying the dashboard entrance animation on demand.
	let dashboardEntranceKey = $state(0);

	// Bumping this tells the auth modal to wipe any typed credentials on sign-out.
	let authResetSignal = $state(0);

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
		// Total session purge: clear auth state, wipe typed credentials, reset every panel/tab
		// tracking marker, then force a fresh route + remount so no prior sub-page bleeds through.
		closeProfileMenu();
		showMobileMenu = false;
		searchQuery = '';
		session.logout();
		authResetSignal += 1;
		dashboardEntranceKey += 1;
		showAuthModal = true;
		goto('/');
	}

	// Resolves the auth modal's result: hardcoded admin credentials route to the isolated
	// Admin Workspace, everything else lands back on the store with the entrance animation.
	// Every authorization explicitly resets routing to its default landing index, overwriting
	// whatever sub-page was previously active, and forces the dashboard wrapper to remount.
	function handleAuthenticated(role: Role, id: string) {
		session.login(role, id);
		dashboardEntranceKey += 1;
		goto(role === 'admin' ? '/admin' : '/');
	}

	// Closes the dropdown when a click lands outside of its container.
	function handleWindowClick(event: MouseEvent) {
		if (!showProfileMenu) return;
		if (profileMenuContainer && !profileMenuContainer.contains(event.target as Node)) {
			showProfileMenu = false;
		}
	}

	onMount(() => {
		// Applies the previously saved theme (set from the Account page) on load.
		const savedTheme = localStorage.getItem('qcu-theme');
		if (savedTheme) document.documentElement.dataset.theme = savedTheme;

		window.addEventListener('click', handleWindowClick);
		return () => window.removeEventListener('click', handleWindowClick);
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
			{#key `${$session.role}:${$session.id}`}
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
							{:else}
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
	:global(html[data-theme='light'] .site-header) { background: #ffffff !important; color: #07152d !important; border-bottom: 1px solid #d9e2ec; box-shadow: 0 2px 10px rgba(7, 21, 45, 0.08); }
	:global(html[data-theme='light'] .site-header > div > a) { color: #07152d !important; }
	:global(html[data-theme='light'] .site-header input) { background: #f5f7fa !important; border-color: #d9e2ec !important; color: #07152d !important; }
	:global(html[data-theme='light'] .site-header .profile-avatar-button) { background: #edf2f8 !important; border-color: #d9e2ec !important; box-shadow: none; }
	:global(html[data-theme='light'] .site-header nav) { background: #dbeafe !important; border-color: #93c5fd !important; box-shadow: none; }
	:global(html[data-theme='light'] .site-header nav a), :global(html[data-theme='light'] .site-header nav button) { color: #1d4ed8 !important; }
	:global(html[data-theme='light'] .site-header a[aria-label='View Shopping Cart']), :global(html[data-theme='light'] .site-header .profile-avatar-button) { color: #38506f !important; }
	:global(html[data-theme='dark'] .site-header) { background: #050c1e !important; }
	:global(html[data-theme='dark'] .site-header nav) { background: rgba(30, 58, 138, 0.35) !important; border-color: rgba(96, 165, 250, 0.35) !important; }

	/* Fade + slide entrance replayed on reload (fresh mount) or right after a successful login (key bump) */
	@keyframes dashboard-enter {
		from { opacity: 0; transform: translateY(22px); }
		to { opacity: 1; transform: translateY(0); }
	}
	.dashboard-enter { animation: dashboard-enter 620ms cubic-bezier(0.22, 1, 0.36, 1) both; }
</style>

{#key dashboardEntranceKey}
	<main class="min-h-screen bg-zinc-50 font-sans" class:dashboard-enter={$session.role !== 'guest'} style="font-family: 'Montserrat', sans-serif;">
		{@render children()}
	</main>
{/key}

<AuthModal bind:open={showAuthModal} onAuthenticated={handleAuthenticated} resetSignal={authResetSignal} />
