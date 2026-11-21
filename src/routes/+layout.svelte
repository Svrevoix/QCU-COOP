<script lang="ts">
	import { onMount, setContext } from 'svelte';
	import { fly } from 'svelte/transition';
	import { afterNavigate, beforeNavigate, goto, onNavigate } from '$app/navigation';
	import './layout.css';
	import { cartItemCount, cartPieceCount, setCartAccount } from '$lib/cart';
	import { avatarImage } from '$lib/profile';
	import { setPurchaseHistoryAccount } from '$lib/orders';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';

	let { children } = $props();
	let showMobileMenu = $state(false);
	let searchQuery = $state('');
	let searchInput = $state<HTMLInputElement>();

	// Fallback identity shown on the avatar badge before any session is authenticated.
	const placeholderStudentId = '23-1111';
	const cashierSidebarPreferenceKey = 'qcu-cashier-sidebar-collapsed';
	let cashierSidebarState = $state({ collapsed: true });
	let cashierSidebarPreferenceLoaded = $state(false);
	setContext('cashierSidebar', cashierSidebarState);
	let displayedId = $derived(page.data.user?.id ?? placeholderStudentId);
	let isAuthenticated = $derived(!!page.data.user);
	let isAdmin = $derived(page.data.user?.role === 'admin');
	let isPublicLanding = $derived(page.url.pathname === '/' && !isAuthenticated);

	$effect(() => {
		if (cashierSidebarPreferenceLoaded) {
			localStorage.setItem(cashierSidebarPreferenceKey, String(cashierSidebarState.collapsed));
		}
	});

	$effect(() => {
		const profileId = page.data.user?.profileId ?? null;
		avatarImage.setAccount(profileId);
		setCartAccount(profileId);
		setPurchaseHistoryAccount(profileId);
	});

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
		if (pathname === '/login') return 'login';
		if (pathname === '/staff/pos/account' || pathname === '/account') return 'account';
		if (pathname.startsWith('/staff/pos')) return 'cashier-pos';
		if (
			pathname.startsWith('/staff/admin/inventory/profiles/') ||
			pathname.startsWith('/staff/admin/inventory/purchases/') ||
			pathname.startsWith('/staff/admin/inventory/adjustments/')
		)
			return 'inventory-form';
		if (pathname.startsWith('/staff/admin/inventory')) return 'inventory';
		if (pathname.startsWith('/staff/admin/reports')) return 'reports';
		if (pathname === '/staff/admin/accounts') return 'admin-accounts';
		if (pathname === '/staff/admin/teachers') return 'teacher-membership';
		if (pathname === '/staff/admin/utilities') return 'admin-utilities';
		if (pathname === '/staff/admin/settings') return 'admin-settings';
		if (pathname === '/staff/admin' || pathname.startsWith('/staff/admin/dashboard'))
			return 'admin-dashboard';
		if (pathname === '/cart') return 'cart';
		if (pathname === '/orders') return 'orders';
		if (pathname.startsWith('/products')) return 'products';
		if (pathname.startsWith('/shop')) return 'shop';
		if (pathname.startsWith('/about')) return 'about';
		return 'home';
	});
	let isStaffWorkspace = $derived(loadingPathname.startsWith('/staff') && loadingKind !== 'login');

	let activeNav = $derived(
		page.url.pathname === '/'
			? 'home'
			: page.url.pathname.startsWith('/shop')
				? 'aisle'
				: page.url.pathname.startsWith('/products')
					? 'product'
					: 'product'
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

	onNavigate((navigation) => {
		const from = navigation.from?.url.pathname;
		const to = navigation.to?.url.pathname;
		const isCashierRoute = (pathname: string | undefined) =>
			pathname === '/staff/pos' || pathname?.startsWith('/staff/pos/') === true;
		if (!isCashierRoute(from) || !isCashierRoute(to) || !document.startViewTransition) return;

		return new Promise<void>((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	afterNavigate(() => {
		showMobileMenu = false;
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

	$effect(() => {
		if (!showMobileMenu) return;

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
		const savedSidebarPreference = localStorage.getItem(cashierSidebarPreferenceKey);
		if (savedSidebarPreference === 'true' || savedSidebarPreference === 'false') {
			cashierSidebarState.collapsed = savedSidebarPreference === 'true';
		}
		cashierSidebarPreferenceLoaded = true;
		loadingStartedAt = Date.now();
		finishPageLoading();

		const handleStorage = (event: StorageEvent) => {
			if (
				event.key === cashierSidebarPreferenceKey &&
				(event.newValue === 'true' || event.newValue === 'false')
			) {
				cashierSidebarState.collapsed = event.newValue === 'true';
			}
		};
		window.addEventListener('storage', handleStorage);
		window.addEventListener('click', handleWindowClick);
		return () => {
			clearTimeout(loadingTimer);
			window.removeEventListener('storage', handleStorage);
			window.removeEventListener('click', handleWindowClick);
		};
	});
</script>

<svelte:window
	onkeydown={(event) => {
		if (event.key === 'Escape') {
			if (showLogoutConfirmation) closeLogoutConfirmation();
			showMobileMenu = false;
		}
	}}
/>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

{#if page.url.pathname === '/cart'}
	<header class="cart-shell-header">
		<div class="cart-header-inner">
			<a href="/" class="cart-back-button" aria-label="Return to home">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.25"
					aria-hidden="true"
					><path stroke-linecap="round" stroke-linejoin="round" d="M15 18l-6-6 6-6" /></svg
				>
			</a>
			<div>
				<p class="cart-header-title">Your cart</p>
				<p class="cart-header-meta">
					{$cartItemCount} item{$cartItemCount === 1 ? '' : 's'} &nbsp;&bull;&nbsp; {$cartPieceCount}
					pcs
				</p>
			</div>
		</div>
	</header>
{:else if !page.url.pathname.startsWith('/staff') && page.url.pathname !== '/login' && page.url.pathname !== '/orders'}
	<header
		class="site-header sticky top-0 z-50 backdrop-blur-xl bg-white dark:bg-[#081a42]/95 border-b border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-xs transition-all"
		style="font-family: 'Manrope', sans-serif;"
	>
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4 relative">
			<!-- 1. Left: Brand Lockup -->
			<div class="flex items-center shrink-0">
				<a href="/" class="flex items-center gap-3 group">
					<img src="/images/logo/qcu_cooplogo.png" alt="QCU COOP Logo" class="h-9 w-auto object-contain shrink-0" />
					<div class="flex flex-col">
						<span class="site-brand text-base sm:text-lg font-black tracking-wide text-[#071739] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-200 transition-colors">
							QCU Coop Store
						</span>
						<span class="text-[10px] font-semibold tracking-normal text-slate-500 dark:text-slate-400 -mt-0.5 hidden sm:block">
							Quezon City University
						</span>
					</div>
				</a>
			</div>

			<!-- 2. Center: Navigation Menu (Perfect Horizontal Center) -->
			{#if isPublicLanding}
				<nav class="landing-nav-links hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
					<a href="#top" class="text-xs font-bold tracking-wide text-slate-700 hover:text-blue-600 dark:text-slate-200 dark:hover:text-white transition-colors py-1">
						Home
					</a>
					<a href="#catalog" class="text-xs font-bold tracking-wide text-slate-700 hover:text-blue-600 dark:text-slate-200 dark:hover:text-white transition-colors py-1">
						Catalog
					</a>
					<a href="#catalog" class="text-xs font-bold tracking-wide text-slate-700 hover:text-blue-600 dark:text-slate-200 dark:hover:text-white transition-colors py-1">
						Uniforms
					</a>
					<a href="#faq" class="text-xs font-bold tracking-wide text-slate-700 hover:text-blue-600 dark:text-slate-200 dark:hover:text-white transition-colors py-1">
						FAQs
					</a>
					<a href="#top" class="text-xs font-bold tracking-wide text-slate-700 hover:text-blue-600 dark:text-slate-200 dark:hover:text-white transition-colors py-1">
						About
					</a>
				</nav>
			{:else if !isAdmin && isAuthenticated}
				<form
					class="hidden sm:block flex-1 max-w-md mx-8 relative"
					onsubmit={(event) => {
						event.preventDefault();
						submitSearch();
					}}
				>
					<input
						bind:this={searchInput}
						type="text"
						bind:value={searchQuery}
						placeholder="Search essentials, uniforms..."
						class="w-full bg-white/5 border border-white/10 focus:border-blue-400/50 rounded-full px-4 py-2 text-xs text-slate-200 placeholder-slate-400 outline-none transition"
					/>
					<div class="absolute right-3.5 top-2.5 text-slate-400 pointer-events-none">
						<svg
							class="w-3.5 h-3.5"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/>
						</svg>
					</div>
				</form>
			{/if}

			<!-- 3. Right: Action Buttons & Navigation -->
			<div class="flex items-center gap-3 shrink-0 ml-auto">
				{#if !isAdmin && !isPublicLanding}
					<nav
						class="nav-segmented-pill hidden md:grid {isAuthenticated
							? 'grid-cols-2'
							: 'grid-cols-1'} items-center gap-1 rounded-full bg-white/5 border border-white/10 p-1 shadow-inner shadow-black/20"
					>
						<div class="pointer-events-none absolute"></div>
						<a
							href="/"
							class="relative z-10 rounded-full px-4 py-1.5 text-center text-xs font-bold transition-colors {activeNav ===
							'home'
								? 'text-slate-900'
								: 'text-slate-300 hover:text-white'}"
						>
							{#if activeNav === 'home'}<span
									class="absolute inset-0 -z-10 rounded-full bg-white shadow-xs"
								></span>{/if}
							Home
						</a>
						{#if isAuthenticated}
							<a
								href="/shop"
								class="relative z-10 rounded-full px-4 py-1.5 text-center text-xs font-bold transition-colors {activeNav ===
								'aisle'
									? 'text-slate-900'
									: 'text-slate-300 hover:text-white'}"
							>
								{#if activeNav === 'aisle'}<span
										class="absolute inset-0 -z-10 rounded-full bg-white shadow-xs"
									></span>{/if}
								Shop
							</a>
						{/if}
					</nav>
				{/if}

				<!-- Profile trigger: student ID pill sits left of the avatar, which opens the Account/Logout dropdown. -->
				<!-- Keyed on role+id so the avatar visual force-resets/remounts on every identity change. -->
				{#if isAuthenticated && !isPublicLanding}
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
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
												><path
													d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4Z"
													stroke-linejoin="round"
												/></svg
											>
										</span>
									{:else if $avatarImage}
										<img src={$avatarImage} alt="" class="profile-avatar-image" />
									{:else if !page.url.pathname.startsWith('/staff')}
										<span class="profile-avatar" aria-hidden="true">
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
												><circle cx="12" cy="8" r="3.5" /><path
													stroke-linecap="round"
													d="M5 20c1.2-3.6 4.2-5.5 7-5.5s5.8 1.9 7 5.5"
												/></svg
											>
										</span>
									{/if}
								</button>
							</div>

							{#if showProfileMenu}
								<div class="profile-dropdown" role="menu" transition:fly={{ y: -6, duration: 150 }}>
									<a
										href="/account"
										role="menuitem"
										class="profile-dropdown-item"
										onclick={closeProfileMenu}
									>
										<svg
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											aria-hidden="true"
											><circle cx="12" cy="8" r="3.5" /><path
												stroke-linecap="round"
												d="M5 20c1.2-3.6 4.2-5.5 7-5.5s5.8 1.9 7 5.5"
											/></svg
										>
										<span>Account</span>
									</a>

									<button
										type="button"
										role="menuitem"
										class="profile-dropdown-item logout-item"
										onclick={handleLogout}
									>
										<svg
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											aria-hidden="true"
											><path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
											/><path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M16 17l5-5-5-5"
											/><path stroke-linecap="round" d="M21 12H9" /></svg
										>
										<span>Logout</span>
									</button>
								</div>
							{/if}
						</div>
					{/key}
				{:else}
					<a
						href="/login"
						class="inline-flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 px-5 py-2 text-xs font-bold tracking-wide text-white transition-colors duration-200"
					>
						<span>Sign In</span>
						<svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
						</svg>
					</a>
				{/if}

				{#if isAuthenticated && !isPublicLanding && !isAdmin}
					<a
						href="/cart"
						class="cart-icon-button relative p-2 text-zinc-300 hover:text-blue-300 transition"
						aria-label="View Shopping Cart"
					>
						<svg
							class="w-5 h-5"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
							/>
						</svg>
						<span
							class="cart-count-badge absolute top-0 right-0 bg-blue-600 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-sm border border-[#050c1e]"
						>
							{$cartPieceCount}
						</span>
					</a>
					<a
						href="/orders"
						class="relative p-2 text-zinc-300 hover:text-blue-300 transition"
						aria-label="Purchase history"
						title="Purchase history"
					>
						<svg
							class="w-5 h-5"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							viewBox="0 0 24 24"
							aria-hidden="true"
							><path stroke-linecap="round" d="M6 3h12v18l-6-3-6 3V3Z" /><path
								stroke-linecap="round"
								d="M9 8h6M9 12h6"
							/></svg
						>
					</a>
				{/if}

				<!-- Mobile Menu Toggle Button (For mobile screens) -->
				<button
					class="mobile-menu-toggle block md:hidden p-2 text-slate-700 hover:text-blue-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/10 rounded-xl transition focus:outline-none"
					onclick={() => (showMobileMenu = !showMobileMenu)}
					aria-label={showMobileMenu ? 'Close menu' : 'Open menu'}
					aria-expanded={showMobileMenu}
					aria-controls="mobile-navigation"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						{#if showMobileMenu}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						{:else}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
						{/if}
					</svg>
				</button>
			</div>
		</div>

		{#if showMobileMenu}
			<div class="mobile-menu-layer md:hidden">
				<button
					class="mobile-menu-backdrop"
					type="button"
					aria-label="Close navigation"
					onclick={() => (showMobileMenu = false)}
				></button>
				<nav id="mobile-navigation" class="mobile-menu-panel" aria-label="Mobile navigation">
					{#if !isPublicLanding}
						<form
							class="mobile-menu-search relative"
							onsubmit={(event) => {
								event.preventDefault();
								submitSearch();
							}}
						>
							<input
								type="text"
								bind:value={searchQuery}
								placeholder="Search essentials, uniforms..."
								class="mobile-menu-search-input"
							/>
						</form>
					{/if}

					<a href="#top" class="mobile-menu-link" onclick={() => (showMobileMenu = false)}>Home</a>
					<a href="#catalog" class="mobile-menu-link" onclick={() => (showMobileMenu = false)}>Catalog</a>
					<a href="#catalog" class="mobile-menu-link" onclick={() => (showMobileMenu = false)}>Uniforms</a>
					<a href="#faq" class="mobile-menu-link" onclick={() => (showMobileMenu = false)}>FAQs</a>

					{#if isAuthenticated}
						<a href="/shop" class="mobile-menu-link" onclick={() => (showMobileMenu = false)}>Shop</a>
						<a href="/orders" class="mobile-menu-link" onclick={() => (showMobileMenu = false)}>Purchase history</a>
						<a href="/account" class="mobile-menu-link" onclick={() => (showMobileMenu = false)}>My Account</a>
					{:else}
						<a href="/login" class="mobile-menu-link text-blue-400 font-bold" onclick={() => (showMobileMenu = false)}>Sign In →</a>
					{/if}
				</nav>
			</div>
		{/if}
	</header>
{/if}

<main
	class="min-h-screen bg-zinc-50 font-sans"
	class:dashboard-enter={page.data.user !== null}
	style="font-family: 'Manrope', sans-serif;"
>
	{@render children()}
</main>

{#if showLogoutConfirmation}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-[#050c1e]/70 p-4 backdrop-blur-md"
		role="presentation"
		onclick={(event) => event.target === event.currentTarget && closeLogoutConfirmation()}
	>
		<div
			class="logout-confirmation-modal w-full max-w-md rounded-2xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8"
			role="alertdialog"
			aria-modal="true"
			aria-labelledby="logout-confirmation-title"
			aria-describedby="logout-confirmation-description"
		>
			<div
				class="logout-confirmation-icon mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 ring-8 ring-red-50"
				aria-hidden="true"
			>
				<svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M12 9v4m0 4h.01M10.3 4.8 2.9 18a2 2 0 0 0 1.74 3h14.72a2 2 0 0 0 1.74-3L13.7 4.8a2 2 0 0 0-3.4 0Z"
					/>
				</svg>
			</div>
			<h2
				id="logout-confirmation-title"
				class="logout-confirmation-title mt-5 text-xl font-black text-[#07152d]"
			>
				Are you sure you want to log out?
			</h2>
			<p
				id="logout-confirmation-description"
				class="logout-confirmation-description mt-2 text-sm leading-6 text-zinc-500"
			>
				You will need to sign in again to access your account.
			</p>
			<div class="mt-7 grid grid-cols-2 gap-3">
				<button
					type="button"
					onclick={closeLogoutConfirmation}
					class="logout-confirmation-cancel rounded-xl bg-zinc-200 px-4 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-300"
					>Cancel</button
				>
				<button
					type="button"
					onclick={confirmLogout}
					class="logout-confirmation-submit rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700"
					>Log out</button
				>
			</div>
		</div>
	</div>
{/if}

{#if showLoadingSkeleton}
	<div
		class="page-loading-overlay"
		class:staff-loading={isStaffWorkspace}
		role="status"
		aria-live="polite"
		aria-label="Loading page"
	>
		<span class="sr-only">Loading page</span>
		<div class="loading-stage" aria-hidden="true">
			<section class="loading-content">
				{#if !isStaffWorkspace && loadingKind !== 'login' && loadingKind !== 'cart'}
					<div class="loading-topbar">
						<i class="skeleton-block loading-topbar-brand"></i>
						<div class="loading-topbar-actions"><i></i><i></i></div>
					</div>
				{/if}
				{#if loadingKind === 'home'}
					<section class="loading-featured">
						<div class="loading-featured-copy"><i></i><i></i><i></i><i></i><i></i><i></i></div>
						<div class="loading-featured-art"><i></i></div>
					</section>
					<div class="loading-section">
						<i class="skeleton-block loading-section-title"></i>
						<div class="loading-cards">
							{#each [0, 1, 2] as card (card)}<article class="loading-card">
									<div class="loading-image"></div>
									<div class="loading-card-copy"><i></i><i></i><i></i></div>
								</article>{/each}
						</div>
					</div>
				{:else if loadingKind === 'login'}
					<div class="loading-login">
						<section class="loading-panel">
							<i class="skeleton-block loading-profile-avatar"></i>
							<div class="loading-heading">
								<i class="loading-block title"></i><i class="loading-block subtitle"></i>
							</div>
							{#each [0, 1, 2] as field (field)}<div class="loading-form-field">
									<i class="skeleton-block"></i><i class="skeleton-block"></i>
								</div>{/each}
						</section>
					</div>
				{:else}
					<div
						class="loading-body"
						class:loading-narrow={loadingKind === 'account'}
						class:user-account={loadingKind === 'account' && !isStaffWorkspace}
						class:loading-utilities={loadingKind === 'admin-utilities'}
						class:loading-shop-body={loadingKind === 'shop'}
					>
						{#if loadingKind === 'admin-accounts'}
							<div class="loading-admin-accounts">
								<div class="loading-admin-title-actions">
									<div class="loading-admin-title-copy">
										<i class="loading-block short"></i><i class="loading-block title"></i><i
											class="loading-block subtitle"
										></i>
									</div>
									<i class="skeleton-block"></i>
								</div>
								<div class="loading-signup-notice">
									<i class="skeleton-block"></i><i class="skeleton-block"></i>
								</div>
								<section class="loading-panel">
									<div class="loading-admin-toolbar">
										<div class="loading-admin-toolbar-field">
											<i class="skeleton-block"></i><i class="skeleton-block"></i>
										</div>
										<div class="loading-admin-toolbar-field">
											<i class="skeleton-block"></i><i class="skeleton-block"></i>
										</div>
										<i class="loading-block"></i>
									</div>
									<div class="loading-admin-account-table">
										<div class="loading-admin-account-row table-head">
											{#each [0, 1, 2, 3, 4] as column (column)}<i class="skeleton-block"
												></i>{/each}
										</div>
										{#each [0, 1, 2, 3, 4] as row (row)}
											<div class="loading-admin-account-row">
												<div class="loading-admin-account-cell">
													<i class="skeleton-block"></i><i class="skeleton-block"></i>
												</div>
												<div class="loading-admin-account-cell">
													<i class="skeleton-block"></i><i class="skeleton-block"></i>
												</div>
												<div class="loading-admin-account-cell">
													<i class="skeleton-block"></i><i class="skeleton-block"></i>
												</div>
												<div class="loading-admin-account-cell"><i class="skeleton-block"></i></div>
												<div class="loading-admin-actions">
													{#each [0, 1, 2] as action (action)}<i class="skeleton-block"></i>{/each}
												</div>
											</div>
										{/each}
									</div>
								</section>
							</div>
						{:else if loadingKind === 'teacher-membership'}
							<div class="loading-teacher-membership">
								<div class="loading-admin-title-actions">
									<div class="loading-admin-title-copy">
										<i class="loading-block short"></i><i class="loading-block title"></i><i
											class="loading-block subtitle"
										></i>
									</div>
								</div>
								<section class="loading-panel">
									<div class="loading-teacher-table">
										<div class="loading-teacher-row table-head">
											{#each [0, 1, 2, 3, 4] as column (column)}<i class="skeleton-block"
												></i>{/each}
										</div>
										{#each [0, 1, 2, 3] as row (row)}
											<div class="loading-teacher-row">
												<div class="loading-teacher-cell"><i class="skeleton-block"></i></div>
												<div class="loading-teacher-cell"><i class="skeleton-block"></i></div>
												<div class="loading-teacher-cell"><i class="skeleton-block"></i></div>
												<div class="loading-teacher-cell membership-copy">
													<i class="skeleton-block"></i><i class="skeleton-block"></i>
												</div>
												<div class="loading-teacher-form">
													<i class="skeleton-block"></i>
													<div class="loading-teacher-dates">
														<i class="skeleton-block"></i><i class="skeleton-block"></i>
													</div>
													<i class="skeleton-block"></i>
												</div>
											</div>
										{/each}
									</div>
								</section>
							</div>
						{:else if loadingKind === 'admin-utilities'}
							<header class="loading-utility-topbar">
								<div class="loading-utility-title">
									<i class="skeleton-block"></i><i class="skeleton-block"></i>
								</div>
								<div class="loading-utility-actions">
									<i class="skeleton-block"></i><i class="skeleton-block"></i><i
										class="skeleton-block"
									></i>
								</div>
							</header>
							<section class="loading-panel loading-utility-overview">
								<div class="loading-utility-overview-heading">
									<i class="skeleton-block"></i>
									<div class="loading-utility-overview-copy">
										<i class="skeleton-block"></i><i class="skeleton-block"></i>
									</div>
									<i class="skeleton-block"></i>
								</div>
								<div class="loading-utility-stats">
									{#each [0, 1, 2, 3] as stat (stat)}<div class="loading-utility-stat">
											<i class="skeleton-block"></i><i class="skeleton-block"></i>
										</div>{/each}
								</div>
								<div class="loading-utility-links">
									{#each [0, 1] as link (link)}<div class="loading-utility-link">
											<i class="skeleton-block"></i><i class="skeleton-block"></i>
										</div>{/each}
								</div>
							</section>
							<div class="loading-utility-section-heading">
								<div class="loading-utility-section-copy">
									<i class="skeleton-block"></i><i class="skeleton-block"></i>
								</div>
								<div class="loading-utility-section-actions">
									<i class="skeleton-block"></i><i class="skeleton-block"></i>
								</div>
							</div>
							<div class="loading-utility-stats loading-utility-account-stats">
								{#each [0, 1, 2, 3] as stat (stat)}<div class="loading-utility-stat">
										<i class="skeleton-block"></i><i class="skeleton-block"></i><i
											class="skeleton-block"
										></i>
									</div>{/each}
							</div>
							<div class="loading-utility-account-layout">
								<section class="loading-panel loading-utility-account">
									<div class="loading-utility-account-heading">
										<i class="skeleton-block"></i>
										<div class="loading-utility-account-name">
											<i class="skeleton-block"></i><i class="skeleton-block"></i>
										</div>
										<i class="skeleton-block"></i>
									</div>
									<div class="loading-utility-details">
										{#each [0, 1, 2] as detail (detail)}<div class="loading-utility-detail">
												<i class="skeleton-block"></i><i class="skeleton-block"></i><i
													class="skeleton-block"
												></i>
											</div>{/each}
									</div>
									<div class="loading-utility-service-list">
										{#each [0, 1, 2, 3] as service (service)}<i class="skeleton-block"></i>{/each}
									</div>
								</section>
								<aside class="loading-panel loading-utility-activity">
									<i class="skeleton-block loading-utility-activity-heading"></i>
									{#each [0, 1, 2] as activity (activity)}<div
											class="loading-utility-activity-item"
										>
											<i class="skeleton-block"></i><i class="skeleton-block"></i><i
												class="skeleton-block"
											></i>
										</div>{/each}
								</aside>
							</div>
						{:else if loadingKind === 'account'}
							<div class="loading-heading">
								<i class="loading-block short"></i><i class="loading-block title"></i><i
									class="loading-block subtitle"
								></i>
							</div>
							<section class="loading-panel loading-account">
								<div class="loading-panel-heading"><i></i></div>
								<div class="loading-account-center">
									<i class="skeleton-block loading-profile-avatar"></i><i
										class="loading-block"
										style="width: 9rem"
									></i><i class="loading-block" style="width: 6rem"></i>
								</div>
								<div class="loading-settings-row">
									<i class="skeleton-block"></i><i class="skeleton-block"></i>
								</div>
							</section>
						{:else if loadingKind === 'orders'}
							<div class="loading-orders">
								<div class="loading-heading">
									<i class="loading-block title"></i><i class="loading-block subtitle"></i>
								</div>
								<div class="loading-order-filters">
									{#each [0, 1, 2, 3] as filter (filter)}<i class="skeleton-block"></i>{/each}
								</div>
								{#each [0, 1] as order (order)}<section class="loading-panel loading-order-panel">
										<div class="loading-panel-heading"><i></i><i></i></div>
										<i class="loading-block loading-order-title"
										></i>{#each [0, 1, 2] as item (item)}<div class="loading-order-item">
												<i class="skeleton-block loading-order-checkbox"></i><i
													class="skeleton-block loading-order-thumbnail"
												></i>
												<div class="loading-order-copy">
													<i class="loading-block"></i><i class="loading-block"></i>
												</div>
												<i class="skeleton-block loading-order-quantity"></i><i
													class="skeleton-block loading-order-price"
												></i>
											</div>{/each}
									</section>{/each}
							</div>
						{:else if loadingKind === 'shop'}
							<div class="loading-shop-page">
								<div class="loading-shop-heading">
									<i class="loading-block short"></i>
									<i class="loading-block title"></i>
									<i class="loading-block subtitle"></i>
								</div>

								<section class="loading-shop-section">
									<div class="loading-shop-section-heading">
										<div>
											<i class="loading-block loading-shop-eyebrow"></i>
											<i class="loading-block loading-shop-title"></i>
										</div>
										<i class="loading-block loading-shop-count"></i>
									</div>
									<div class="loading-shop-featured-mask">
										<div class="loading-shop-featured-track">
											{#each [0, 1, 2, 3, 4, 5, 6, 7] as card (card)}
												<article class="loading-card loading-shop-featured-card">
													<div class="loading-shop-featured-topline">
														<i class="skeleton-block loading-shop-featured-badge"></i>
														<i class="skeleton-block loading-shop-featured-category"></i>
													</div>
													<i class="skeleton-block loading-shop-featured-image"></i>
													<div class="loading-shop-featured-copy">
														<i class="skeleton-block"></i>
														<i class="skeleton-block"></i>
														<i class="skeleton-block"></i>
													</div>
												</article>
											{/each}
										</div>
									</div>
									<div class="loading-shop-controls">
										<i class="skeleton-block"></i>
										<i class="skeleton-block"></i>
									</div>
								</section>

								<section class="loading-shop-section">
									<div class="loading-shop-section-heading">
										<div>
											<i class="loading-block loading-shop-eyebrow"></i>
											<i class="loading-block loading-shop-title"></i>
										</div>
									</div>
									<div class="loading-shop-category-grid">
										{#each [0, 1, 2, 3, 4, 5, 6, 7] as category (category)}
											<div class="loading-shop-category">
												<i class="skeleton-block loading-shop-category-icon"></i>
												<i class="skeleton-block loading-shop-category-label"></i>
											</div>
										{/each}
									</div>
								</section>

								<section class="loading-shop-section">
									<div class="loading-shop-section-heading">
										<div>
											<i class="loading-block loading-shop-eyebrow"></i>
											<i class="loading-block loading-shop-title"></i>
											<i class="loading-block loading-shop-description"></i>
										</div>
									</div>
									<div class="loading-shop-discover-grid">
										{#each [0, 1, 2, 3] as card (card)}
											<article class="loading-card loading-shop-discover-card">
												<i class="loading-image"></i>
												<div class="loading-card-copy">
													<i></i>
													<i></i>
													<i></i>
													<i class="loading-shop-product-action"></i>
												</div>
											</article>
										{/each}
									</div>
								</section>
							</div>
						{:else if loadingKind === 'products'}
							<div class="loading-heading">
								<i class="loading-block short"></i>
								<div class="loading-panel-heading">
									<i class="loading-block title"></i><i class="skeleton-block" style="width: 8rem"
									></i>
								</div>
								<i class="loading-block subtitle"></i>
							</div>
							<div class="loading-cards loading-products-grid">
								{#each [0, 1, 2, 3, 4, 5, 6, 7] as card (card)}<article
										class="loading-card loading-product-card"
									>
										<div class="loading-image"></div>
										<div class="loading-card-copy"><i></i><i></i><i></i></div>
									</article>{/each}
							</div>
						{:else if loadingKind === 'about'}
							<div class="loading-heading">
								<i class="loading-block short"></i><i class="loading-block title"></i><i
									class="loading-block subtitle"
								></i>
							</div>
							<div class="loading-about-grid">
								<section class="loading-panel loading-about-copy">
									{#each [0, 1, 2, 3, 4, 5, 6, 7] as line (line)}<i class="skeleton-block"
										></i>{/each}
								</section>
								<section class="loading-panel loading-about-copy">
									{#each [0, 1, 2, 3, 4] as line (line)}<i class="skeleton-block"></i>{/each}
								</section>
							</div>
						{:else if loadingKind === 'cart'}
							<div class="loading-topbar">
								<i class="skeleton-block loading-mark"></i>
								<div class="loading-card-copy">
									<i style="width: 8rem"></i><i style="width: 5rem"></i>
								</div>
							</div>
							<div class="loading-body">
								<div class="loading-heading"><i class="loading-block title"></i></div>
								<div class="loading-cart">
									<section class="loading-panel">
										{#each [0, 1, 2] as item (item)}<div class="loading-cart-item">
												<i class="skeleton-block loading-cart-image"></i>
												<div class="loading-cart-copy"><i></i><i></i></div>
												<i class="skeleton-block loading-cart-price"></i>
											</div>{/each}
									</section>
									<section class="loading-panel loading-cart-summary">
										<i class="skeleton-block"></i><i class="skeleton-block"></i>
									</section>
								</div>
							</div>
						{:else if loadingKind === 'admin-settings'}
							<div class="loading-heading">
								<i class="loading-block short"></i><i class="loading-block title"></i><i
									class="loading-block subtitle"
								></i>
							</div>
							<section class="loading-panel loading-admin-settings">
								<div class="loading-panel-heading"><i></i></div>
								<div class="loading-admin-profile">
									<i class="skeleton-block loading-profile-avatar"></i><i
										class="loading-block"
										style="width: 11rem"
									></i><i class="loading-block" style="width: 8rem"></i>
								</div>
								<div class="loading-admin-details">
									{#each [0, 1, 2, 3] as row (row)}<div class="loading-admin-detail-row">
											<i class="skeleton-block"></i><i class="skeleton-block"></i>
										</div>{/each}
								</div>
								<div class="loading-admin-preferences">
									<i class="loading-block loading-admin-section-title"></i>
									<div class="loading-admin-setting-row">
										<i class="skeleton-block"></i><i class="skeleton-block"></i>
									</div>
									<i class="loading-block loading-admin-section-title"></i>
									<div class="loading-admin-password">
										{#each [0, 1] as field (field)}<div class="loading-admin-password-field">
												<i class="loading-block"></i><i class="skeleton-block"></i>
											</div>{/each}
									</div>
									<i class="skeleton-block loading-admin-password-button"></i>
								</div>
							</section>
						{:else if loadingKind === 'admin-dashboard'}
							<div class="loading-heading">
								<i class="loading-block short"></i>
								<div class="loading-panel-heading">
									<i class="loading-block title"></i><i class="skeleton-block" style="width: 5rem"
									></i>
								</div>
								<i class="loading-block subtitle"></i>
							</div>
							<div class="loading-stats">
								{#each [0, 1, 2, 3] as stat (stat)}<article class="loading-stat">
										<i></i><i></i><i></i>
									</article>{/each}
							</div>
							<div class="loading-dashboard-charts">
								<section class="loading-panel">
									<div class="loading-panel-heading"><i></i><i></i></div>
									<div class="loading-chart">
										{#each [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as bar (bar)}<i
												class="skeleton-block"
											></i>{/each}
									</div>
								</section>
								<section class="loading-panel">
									<div class="loading-panel-heading"><i></i></div>
									<div class="loading-account-center">
										<i class="skeleton-block loading-profile-avatar"></i><i
											class="loading-block"
											style="width: 7rem"
										></i>
									</div>
								</section>
							</div>
							<section class="loading-panel">
								<div class="loading-panel-heading"><i></i><i></i></div>
								<div class="loading-cards">
									{#each [0, 1, 2] as group (group)}<div class="loading-card-copy">
											<i></i><i></i><i></i><i></i>
										</div>{/each}
								</div>
							</section>
						{:else if loadingKind === 'inventory'}
							<div class="loading-heading">
								<i class="loading-block short"></i>
								<div class="loading-panel-heading">
									<i class="loading-block title"></i><i class="skeleton-block" style="width: 6rem"
									></i>
								</div>
								<i class="loading-block subtitle"></i>
							</div>
							<div class="loading-stats">
								{#each [0, 1, 2, 3] as stat (stat)}<article class="loading-stat">
										<i></i><i></i><i></i>
									</article>{/each}
							</div>
							<section class="loading-panel">
								<div class="loading-panel-heading"><i></i></div>
								<div class="loading-cards">
									{#each [0, 1, 2, 3, 4] as profile (profile)}<div
											class="loading-card-copy loading-card"
										>
											<i></i><i></i>
										</div>{/each}
								</div>
							</section>
							<section class="loading-panel">
								<div class="loading-panel-heading"><i></i><i></i></div>
								{#each [0, 1, 2, 3, 4] as row (row)}<div class="loading-table-row">
										<i></i><i></i><i></i><i></i>
									</div>{/each}
							</section>
						{:else if loadingKind === 'inventory-form'}
							<div class="loading-heading">
								<i class="loading-block short"></i><i class="loading-block title"></i><i
									class="loading-block subtitle"
								></i>
							</div>
							<section class="loading-panel">
								<div class="loading-panel-heading"><i></i></div>
								<div class="loading-form-grid">
									{#each [0, 1, 2, 3, 4, 5] as field (field)}<div class="loading-form-field">
											<i class="skeleton-block"></i><i class="skeleton-block"></i>
										</div>{/each}
								</div>
								<div class="loading-panel-heading" style="margin-top: 1.5rem"><i></i><i></i></div>
								<div class="loading-table-row"><i></i><i></i><i></i><i></i></div>
							</section>
						{:else if loadingKind === 'reports'}
							<div class="loading-heading">
								<i class="loading-block short"></i>
								<div class="loading-panel-heading">
									<i class="loading-block title"></i><i class="skeleton-block" style="width: 7rem"
									></i>
								</div>
								<i class="loading-block subtitle"></i>
							</div>
							<section class="loading-panel">
								<div class="loading-panel-heading"><i></i><i></i></div>
								<div class="loading-report-filters">
									{#each [0, 1, 2, 3] as filter (filter)}<div class="loading-filter">
											<i class="skeleton-block"></i><i class="skeleton-block"></i>
										</div>{/each}
								</div>
							</section>
							<div class="loading-stats">
								{#each [0, 1, 2, 3] as stat (stat)}<article class="loading-stat">
										<i></i><i></i><i></i>
									</article>{/each}
							</div>
							<section class="loading-panel">
								<div class="loading-panel-heading"><i></i><i></i></div>
								{#each [0, 1, 2, 3, 4] as row (row)}<div class="loading-table-row">
										<i></i><i></i><i></i><i></i>
									</div>{/each}
							</section>
						{:else if loadingKind === 'cashier-pos'}
							<div class="loading-heading">
								<i class="loading-block short"></i><i class="loading-block title"></i><i
									class="loading-block subtitle"
								></i>
							</div>
							<div class="loading-stats">
								{#each [0, 1, 2, 3] as stat (stat)}<article class="loading-stat">
										<i></i><i></i><i></i>
									</article>{/each}
							</div>
							<section class="loading-panel">
								<div class="loading-panel-heading"><i></i><i></i></div>
								<div class="loading-cards">
									{#each [0, 1, 2] as session (session)}<div class="loading-card-copy loading-card">
											<i></i><i></i><i></i>
										</div>{/each}
								</div>
							</section>
							<section class="loading-panel">
								<div class="loading-panel-heading"><i></i><i></i></div>
								{#each [0, 1, 2, 3, 4] as row (row)}<div class="loading-table-row">
										<i></i><i></i><i></i><i></i>
									</div>{/each}
							</section>
						{:else}
							<div class="loading-heading">
								<i class="loading-block short"></i><i class="loading-block title"></i><i
									class="loading-block subtitle"
								></i>
							</div>
							<section class="loading-panel">
								{#each [0, 1, 2, 3, 4] as line (line)}<div class="loading-table-row">
										<i></i><i></i><i></i><i></i>
									</div>{/each}
							</section>
						{/if}
					</div>
				{/if}
			</section>
		</div>
	</div>
{/if}

<style>
	.cart-shell-header {
		background: #061d42;
		color: white;
		font-family: 'Manrope', sans-serif;
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

	.cart-back-button:hover {
		background: rgba(255, 255, 255, 0.18);
	}
	.cart-back-button svg {
		width: 1.25rem;
		height: 1.25rem;
	}
	.cart-header-title {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 800;
		line-height: 1.2;
	}
	.cart-header-meta {
		margin: 0.25rem 0 0;
		color: #a8bddf;
		font-size: 0.625rem;
		font-weight: 600;
		letter-spacing: 0.03em;
	}
	/* Profile trigger: student ID pill placed left of the avatar button */
	.profile-menu-container {
		position: relative;
		display: inline-flex;
	}
	.site-brand {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.profile-trigger {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.student-id-badge {
		background: #2563eb;
		color: #ffffff;
		font-size: 0.68rem;
		font-weight: 800;
		letter-spacing: 0.02em;
		line-height: 1;
		padding: 0.35rem 0.7rem;
		border-radius: 9999px;
		white-space: nowrap;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
	}
	.profile-avatar-button {
		position: relative;
		display: grid;
		flex: 0 0 2.75rem;
		aspect-ratio: 1;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		padding: 0;
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 50%;
		background: #17233d;
		color: #d9e8ff;
		cursor: pointer;
		overflow: hidden;
		transition:
			background 150ms ease,
			border-color 150ms ease;
	}
	.profile-avatar-button:hover {
		background: #243557;
	}
	.profile-avatar {
		display: grid;
		flex: 0 0 auto;
		aspect-ratio: 1;
		width: 1.3rem;
		height: 1.3rem;
		place-items: center;
	}
	.profile-avatar-image {
		display: block;
		flex: 0 0 auto;
		aspect-ratio: 1;
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 50%;
	}

	/* Dropdown panel: minimalist light theme with subtle border + smooth transitions */
	.profile-dropdown {
		position: absolute;
		top: calc(100% + 0.85rem);
		right: 0;
		width: 12rem;
		background: #ffffff;
		color: #1f2937;
		border: 1px solid #e5e9f0;
		border-radius: 0.85rem;
		box-shadow: 0 14px 32px rgba(15, 23, 42, 0.16);
		padding: 0.4rem;
		z-index: 60;
	}
	.profile-dropdown-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.55rem 0.65rem;
		border: 0;
		border-radius: 0.6rem;
		background: transparent;
		color: #1f2937;
		font-size: 0.8rem;
		font-weight: 700;
		text-align: left;
		text-decoration: none;
		cursor: pointer;
		transition:
			background 120ms ease,
			color 120ms ease;
	}
	.profile-dropdown-item svg {
		width: 1.05rem;
		height: 1.05rem;
		flex-shrink: 0;
	}
	.profile-dropdown-item:hover {
		background: #f1f5f9;
	}
	.logout-item {
		color: #dc2626;
	}
	.logout-item:hover {
		background: #fef2f2;
		color: #b91c1c;
	}

	:global(html[data-theme='dark'] .profile-dropdown) {
		background: #172640;
		border-color: #334866;
		box-shadow: 0 14px 32px rgba(0, 0, 0, 0.4);
	}
	:global(html[data-theme='dark'] .profile-dropdown-item) {
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .profile-dropdown-item:hover) {
		background: #223957;
	}
	:global(html[data-theme='dark'] .logout-item) {
		color: #fca5a5;
	}
	:global(html[data-theme='dark'] .logout-item:hover) {
		background: #3b1f24;
		color: #fecaca;
	}
	:global(html[data-theme='dark']) {
		color-scheme: dark;
		background: #07152d;
	}
	:global(html[data-theme='dark'] body) {
		background: #07152d;
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] main.min-h-screen) {
		background: #101d35 !important;
	}
	:global(html[data-theme='dark'] .product-page),
	:global(html[data-theme='dark'] .aisle-page) {
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .cart-page) {
		background: #101d35 !important;
	}
	:global(html[data-theme='dark'] .aisle-page h1),
	:global(html[data-theme='dark'] .product-page h1),
	:global(html[data-theme='dark'] .product-page h2),
	:global(html[data-theme='dark'] .cart-heading h1),
	:global(html[data-theme='dark'] .item-details h2) {
		color: #edf4ff !important;
	}
	:global(html[data-theme='dark'] .aisle-page > div:first-child),
	:global(html[data-theme='dark'] .product-page > div:first-child) {
		border-color: #334866 !important;
	}
	:global(html[data-theme='dark'] .product-page > div:first-child p),
	:global(html[data-theme='dark'] .product-page a) {
		color: #b8c8dd !important;
	}
	:global(html[data-theme='dark'] .product-card),
	:global(html[data-theme='dark'] .aisle-card) {
		border-color: #3b61b5 !important;
		box-shadow: 0 12px 28px rgba(0, 0, 0, 0.24) !important;
	}
	:global(html[data-theme='dark'] .filter-panel),
	:global(html[data-theme='dark'] .modal-panel),
	:global(html[data-theme='dark'] .buy-now-modal),
	:global(html[data-theme='dark'] .checkout-modal) {
		background: #172640 !important;
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .featured-card) {
		background: #172640 !important;
		border-color: #334866 !important;
	}
	:global(html[data-theme='dark'] .featured-card .featured-name),
	:global(html[data-theme='dark'] .featured-card .featured-price) {
		color: #edf4ff !important;
	}
	:global(html[data-theme='dark'] .featured-card .featured-desc),
	:global(html[data-theme='dark'] .featured-card .featured-sku) {
		color: #b8c8dd !important;
	}
	:global(html[data-theme='dark'] footer.bg-zinc-100) {
		background: #101d35 !important;
		border-color: #334866 !important;
	}
	:global(html[data-theme='dark'] footer .text-zinc-900) {
		color: #edf4ff !important;
	}
	:global(html[data-theme='dark'] footer .text-zinc-500),
	:global(html[data-theme='dark'] footer .text-zinc-400) {
		color: #b8c8dd !important;
	}
	:global(html[data-theme='dark'] .cart-summary) {
		background: rgba(16, 29, 53, 0.96) !important;
		border-color: #334866;
	}
	:global(html[data-theme='dark'] .cart-heading),
	:global(html[data-theme='dark'] .checkout-line),
	:global(html[data-theme='dark'] .checkout-total) {
		border-color: #334866 !important;
	}
	:global(html[data-theme='dark'] .empty-cart h2),
	:global(html[data-theme='dark'] .checkout-modal h2),
	:global(html[data-theme='dark'] .buy-now-modal h2) {
		color: #edf4ff !important;
	}
	:global(html[data-theme='dark'] .checkout-line strong),
	:global(html[data-theme='dark'] .checkout-line b),
	:global(html[data-theme='dark'] .checkout-total strong),
	:global(html[data-theme='dark'] .buy-now-item strong),
	:global(html[data-theme='dark'] .buy-now-item b) {
		color: #edf4ff !important;
	}
	:global(html[data-theme='dark'] .checkout-line span),
	:global(html[data-theme='dark'] .checkout-total span),
	:global(html[data-theme='dark'] .qr-copy),
	:global(html[data-theme='dark'] .order-reference),
	:global(html[data-theme='dark'] .buy-now-item span),
	:global(html[data-theme='dark'] .buy-now-reference),
	:global(html[data-theme='dark'] .buy-now-note) {
		color: #b8c8dd !important;
	}
	:global(html[data-theme='dark'] .buy-now-item),
	:global(html[data-theme='dark'] .checkout-items),
	:global(html[data-theme='dark'] .checkout-total) {
		border-color: #415878 !important;
	}
	:global(html[data-theme='dark'] .modal-close),
	:global(html[data-theme='dark'] .edit-cart-button) {
		background: #eaf2fc !important;
		color: #172640 !important;
	}
	:global(html[data-theme='dark'] .quantity-control),
	:global(html[data-theme='dark'] .quantity-control span) {
		border-color: #415878 !important;
		background: #101d35 !important;
		color: #edf4ff !important;
	}
	:global(html[data-theme='dark'] .quantity-control button) {
		background: #eaf2fc !important;
	}
	:global(html[data-theme='dark'] .product-icon) {
		background: #eaf2fc !important;
	}
	:global(html[data-theme='dark'] .modal-panel .text-\[\#07152d\]),
	:global(html[data-theme='dark'] .modal-panel .text-zinc-400) {
		color: #edf4ff !important;
	}
	:global(html[data-theme='dark'] .modal-panel .text-\[\#233f91\]) {
		color: #7ec8ff !important;
	}
	:global(html[data-theme='dark'] .modal-panel .bg-sky-50) {
		background: #223957 !important;
	}
	:global(html[data-theme='dark'] .modal-panel .bg-sky-50 .text-\[\#233f91\]) {
		color: #8bcbff !important;
	}
	:global(html[data-theme='dark'] .modal-panel .border-zinc-200) {
		border-color: #58718f !important;
	}
	:global(html[data-theme='dark'] .modal-panel .bg-zinc-100) {
		background: #eaf2fc !important;
	}
	:global(html[data-theme='dark'] .modal-panel .bg-white\/90) {
		background: #eaf2fc !important;
	}
	:global(html[data-theme='dark'] .modal-panel .modal-close),
	:global(html[data-theme='dark'] .modal-panel .modal-close.text-\[\#07152d\]) {
		color: #07152d !important;
	}
	:global(html[data-theme='dark'] .modal-panel button[aria-label='Close product details']) {
		background: #eaf2fc !important;
		color: #07152d !important;
	}
	:global(html[data-theme='dark'] .modal-panel button[aria-label='Decrease quantity']) {
		background: #eaf2fc !important;
		color: #07152d !important;
	}
	:global(html[data-theme='dark'] .modal-panel button.bg-white) {
		background: #223957 !important;
		border-color: #58718f !important;
		color: #edf4ff !important;
	}
	:global(html[data-theme='dark'] .modal-panel button.bg-\[\#233f91\]) {
		background: #294aa5 !important;
		border-color: #294aa5 !important;
		color: #ffffff !important;
	}
	:global(html[data-theme='dark'] .filter-panel .text-\[\#07152d\]),
	:global(html[data-theme='dark'] .filter-panel .text-zinc-400) {
		color: #edf4ff !important;
	}
	:global(html[data-theme='dark'] .filter-panel .bg-white),
	:global(html[data-theme='dark'] .filter-panel .bg-zinc-50) {
		background: #172640 !important;
	}
	:global(html[data-theme='dark'] .filter-panel .border-zinc-200),
	:global(html[data-theme='dark'] .filter-panel .border-zinc-100) {
		border-color: #415878 !important;
	}
	:global(html[data-theme='dark'] button[aria-label='Filter products']) {
		border-color: #3b82f6 !important;
		background: #172640 !important;
		color: #7ec8ff !important;
	}
	:global(html[data-theme='dark'] .logout-confirmation-modal) {
		background: #172640 !important;
		border-color: #334866 !important;
	}
	:global(html[data-theme='dark'] .logout-confirmation-icon) {
		background: #3b1f24 !important;
		color: #fecaca !important;
		box-shadow: 0 0 0 8px #261b2a;
	}
	:global(html[data-theme='dark'] .logout-confirmation-title) {
		color: #edf4ff !important;
	}
	:global(html[data-theme='dark'] .logout-confirmation-description) {
		color: #b8c8dd !important;
	}
	:global(html[data-theme='dark'] .logout-confirmation-cancel) {
		background: #2b3b56 !important;
		color: #edf4ff !important;
	}
	:global(html[data-theme='dark'] .logout-confirmation-cancel:hover) {
		background: #374b6b !important;
	}
	:global(html[data-theme='light'] .site-header) {
		background: #ffffff !important;
		color: #07152d !important;
		border-bottom: 1px solid #d9e2ec;
		box-shadow: 0 2px 10px rgba(7, 21, 45, 0.08);
	}
	:global(html[data-theme='light'] .site-header .site-brand) {
		color: #071739 !important;
	}
	:global(html[data-theme='light'] .site-header .landing-nav-links a) {
		color: #334155 !important;
	}
	:global(html[data-theme='light'] .site-header .landing-nav-links a:hover) {
		color: #2563eb !important;
	}
	:global(html[data-theme='light'] .site-header .mobile-menu-toggle) {
		color: #334155 !important;
	}
	:global(html[data-theme='light'] .site-header > div > a) {
		color: #07152d !important;
	}
	:global(html[data-theme='light'] .site-header input) {
		background: #f5f7fa !important;
		border-color: #d9e2ec !important;
		color: #07152d !important;
	}
	:global(html[data-theme='light'] .site-header .profile-avatar-button) {
		background: #edf2f8 !important;
		border-color: #d9e2ec !important;
		box-shadow: none;
	}
	:global(html[data-theme='light'] .site-header nav.nav-segmented-pill) {
		background: #dbeafe !important;
		border-color: #93c5fd !important;
		box-shadow: none;
	}
	:global(html[data-theme='light'] .site-header nav.nav-segmented-pill a),
	:global(html[data-theme='light'] .site-header nav.nav-segmented-pill button) {
		color: #1d4ed8 !important;
	}
	:global(html[data-theme='light'] .site-header a[aria-label='View Shopping Cart']),
	:global(html[data-theme='light'] .site-header a[aria-label='Purchase history']),
	:global(html[data-theme='light'] .site-header .profile-avatar-button) {
		color: #38506f !important;
	}
	:global(html[data-theme='dark'] .site-header) {
		background: #050c1e !important;
	}
	:global(html[data-theme='dark'] .site-header .site-brand) {
		color: #ffffff !important;
	}
	:global(html[data-theme='dark'] .site-header .landing-nav-links a) {
		color: #e2e8f0 !important;
	}
	:global(html[data-theme='dark'] .site-header .landing-nav-links a:hover) {
		color: #ffffff !important;
	}
	:global(html[data-theme='dark'] .site-header .mobile-menu-toggle) {
		color: #cbd5e1 !important;
	}
	:global(html[data-theme='dark'] .site-header nav.nav-segmented-pill) {
		background: rgba(30, 58, 138, 0.35) !important;
		border-color: rgba(96, 165, 250, 0.35) !important;
	}
	.mobile-menu-layer {
		position: fixed;
		z-index: 60;
		inset: 0;
	}
	.mobile-menu-backdrop {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		border: 0;
		background: rgba(2, 6, 23, 0.58);
	}
	.mobile-menu-panel {
		position: absolute;
		inset: 0 auto 0 0;
		display: flex;
		box-sizing: border-box;
		width: min(21rem, 88vw);
		height: 100vh;
		height: 100dvh;
		flex-direction: column;
		gap: 0.55rem;
		overflow-y: auto;
		overscroll-behavior: contain;
		border-right: 1px solid #26354d;
		background: #080f1f;
		padding: max(1rem, env(safe-area-inset-top)) 1rem max(1rem, env(safe-area-inset-bottom));
		color: #f8fafc;
		box-shadow: 12px 0 32px rgba(0, 0, 0, 0.3);
		animation: mobile-drawer-enter 180ms ease-out both;
	}
	.mobile-menu-link {
		display: flex;
		min-height: 2.75rem;
		align-items: center;
		border-radius: 0.6rem;
		padding: 0.65rem 0.75rem;
		color: inherit;
		font-size: 0.9rem;
		font-weight: 650;
		text-decoration: none;
		transition:
			background 120ms ease,
			color 120ms ease;
	}
	.mobile-menu-link:hover {
		background: #172b4d;
		color: #bfdbfe;
	}
	.mobile-menu-link:active {
		background: #294574;
		color: #fff;
	}
	.mobile-menu-search {
		margin-bottom: 0.35rem;
	}
	.mobile-menu-search-input {
		box-sizing: border-box;
		width: 100%;
		min-height: 2.75rem;
		border: 1px solid #334155;
		border-radius: 0.65rem;
		background: #101d35;
		padding: 0.65rem 0.8rem;
		color: #f8fafc;
		font: inherit;
		font-size: 0.85rem;
	}
	.mobile-menu-search-input::placeholder {
		color: #94a3b8;
	}
	.mobile-menu-toggle {
		flex: 0 0 2.75rem;
		width: 2.75rem;
		height: 2.75rem;
		place-items: center;
	}
	.cart-icon-button {
		display: grid;
		flex: 0 0 2.75rem;
		width: 2.75rem;
		height: 2.75rem;
		aspect-ratio: 1;
		place-items: center;
		border-radius: 50%;
	}
	.cart-count-badge {
		flex: 0 0 1rem;
		width: 1rem;
		height: 1rem;
		aspect-ratio: 1;
	}
	:global(html[data-theme='light'] .mobile-menu-panel) {
		border-color: #cbd5e1;
		background: #f8fafc;
		color: #0f172a;
		box-shadow: 12px 0 32px rgba(15, 23, 42, 0.2);
	}
	:global(html[data-theme='light'] .mobile-menu-link) {
		color: #0f172a;
	}
	:global(html[data-theme='light'] .mobile-menu-link:hover) {
		background: #dbeafe;
		color: #1d4ed8;
	}
	:global(html[data-theme='light'] .mobile-menu-link:active) {
		background: #bfdbfe;
		color: #1d4ed8;
	}
	:global(html[data-theme='light'] .mobile-menu-search-input) {
		border-color: #cbd5e1;
		background: #fff;
		color: #0f172a;
	}
	:global(html[data-theme='light'] .mobile-menu-search-input::placeholder) {
		color: #64748b;
	}
	:global(html[data-theme='dark'] .mobile-menu-panel) {
		border-color: #334866;
		background: #080f1f;
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .mobile-menu-link) {
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .mobile-menu-link:hover) {
		background: #223957;
		color: #bfdbfe;
	}
	:global(html[data-theme='dark'] .mobile-menu-link:active) {
		background: #294574;
		color: #fff;
	}
	:global(html[data-theme='dark'] .mobile-menu-search-input) {
		border-color: #415878;
		background: #101d35;
		color: #edf4ff;
	}
	@keyframes mobile-drawer-enter {
		from {
			transform: translateX(-100%);
		}
		to {
			transform: translateX(0);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.mobile-menu-panel {
			animation: none;
		}
	}
	@media (max-width: 560px) {
		:global(.site-header > div) {
			gap: 0.35rem;
			padding-right: 0.625rem;
			padding-left: 0.625rem;
		}
		:global(.site-header > div > .ml-auto) {
			gap: 0.35rem;
		}
		:global(.site-header .student-id-badge) {
			display: none;
		}
		:global(.site-header .site-brand) {
			font-size: clamp(0.8rem, 4vw, 0.95rem) !important;
			letter-spacing: 0.04em !important;
		}
	}
	@media (max-width: 767px) {
		:global(.site-header a[aria-label='Purchase history']) {
			display: none;
		}
	}
	.page-loading-overlay {
		position: fixed;
		z-index: 200;
		inset: 0;
		overflow: auto;
		background: #f3f6fa;
		color: #172b4d;
	}
	:global(::view-transition-group(cashier-nav-active)) {
		animation-duration: 260ms;
		animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
	}
	:global(::view-transition-old(root)),
	:global(::view-transition-new(root)) {
		animation: none;
	}
	.page-loading-overlay.staff-loading {
		left: 0;
	}
	:global(body:has(.admin-shell) .page-loading-overlay.staff-loading) {
		left: calc(17rem * 1.1);
	}
	:global(body:has(.admin-shell.collapsed) .page-loading-overlay.staff-loading) {
		left: calc(5rem * 1.1);
	}
	:global(body:has(.cashier-shell) .page-loading-overlay.staff-loading) {
		left: 17rem;
	}
	:global(body:has(.cashier-shell.collapsed) .page-loading-overlay.staff-loading) {
		left: 5rem;
	}
	:global(body:has(.register-shell) .page-loading-overlay.staff-loading) {
		left: 17rem;
	}
	:global(body:has(.register-shell.collapsed) .page-loading-overlay.staff-loading) {
		left: 5rem;
	}
	.loading-stage {
		display: grid;
		min-height: 100vh;
		grid-template-columns: minmax(0, 1fr);
	}
	.loading-mark {
		width: 2.25rem;
		height: 2.25rem;
		flex: 0 0 auto;
		border-radius: 0.6rem;
	}
	.loading-content {
		min-width: 0;
	}
	.loading-topbar {
		display: flex;
		height: 4rem;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1px solid #e4eaf2;
		background: white;
		padding: 0 clamp(1rem, 4vw, 3rem);
	}
	.loading-topbar-brand {
		width: 10rem;
		height: 1.25rem;
	}
	.loading-topbar-actions {
		display: flex;
		gap: 0.75rem;
	}
	.loading-topbar-actions i {
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 50%;
	}
	.loading-body {
		width: min(100%, 100rem);
		margin: 0 auto;
		padding: 2.25rem clamp(1rem, 3vw, 3rem) 3rem;
	}
	.loading-body.loading-narrow {
		max-width: 38rem;
	}
	.loading-body.user-account {
		max-width: 26rem;
	}
	.loading-heading {
		display: grid;
		gap: 0.7rem;
		margin-bottom: 1.5rem;
	}
	.loading-block {
		display: block;
		height: 0.7rem;
		border-radius: 0.3rem;
	}
	.loading-block.short {
		width: 7rem;
		height: 0.55rem;
	}
	.loading-block.title {
		width: min(18rem, 65%);
		height: 1.8rem;
	}
	.loading-block.subtitle {
		width: min(25rem, 80%);
		height: 0.65rem;
	}
	.loading-panel,
	.loading-stat,
	.loading-card {
		border: 1px solid #e4eaf2;
		border-radius: 0.65rem;
		background: white;
	}
	.loading-panel {
		padding: 1.25rem;
	}
	.loading-panel-heading {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.1rem;
	}
	.loading-panel-heading i:first-child {
		width: 9rem;
		height: 0.85rem;
	}
	.loading-panel-heading i:last-child {
		width: 5rem;
		height: 0.75rem;
	}
	.loading-stats,
	.loading-cards {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.85rem;
		margin-bottom: 1.1rem;
	}
	.loading-stat {
		display: grid;
		min-height: 6rem;
		gap: 0.75rem;
		align-content: center;
		padding: 1rem;
	}
	.loading-stat i,
	.loading-table-row i,
	.loading-card-copy i,
	.loading-image,
	.loading-filter i,
	.loading-profile-avatar,
	.loading-chart i {
		display: block;
		border-radius: 0.3rem;
	}
	.loading-stat i {
		width: 55%;
		height: 0.65rem;
	}
	.loading-stat i:last-child {
		width: 35%;
		height: 1.1rem;
	}
	.loading-table-row {
		display: grid;
		grid-template-columns: 1.2fr 1fr 1fr 0.7fr;
		gap: 1rem;
		border-top: 1px solid #edf1f5;
		padding: 1rem 0;
	}
	.loading-table-row i {
		height: 0.65rem;
	}
	.loading-cards {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}
	.loading-card {
		min-width: 0;
		overflow: hidden;
	}
	.loading-image {
		height: 9rem;
		border-radius: 0;
	}
	.loading-card-copy {
		display: grid;
		gap: 0.65rem;
		padding: 1rem;
	}
	.loading-card-copy i {
		width: 72%;
		height: 0.65rem;
	}
	.loading-card-copy i:first-child {
		width: 88%;
		height: 0.85rem;
	}
	.loading-card-copy i:last-child {
		width: 45%;
	}
	.loading-featured {
		display: grid;
		grid-template-columns: minmax(0, 1.2fr) minmax(17rem, 0.8fr);
		gap: 2rem;
		align-items: center;
		min-height: 27rem;
		border-radius: 0 0 1.25rem 1.25rem;
		background: #123a72;
		padding: clamp(1.5rem, 5vw, 4rem);
	}
	.loading-featured-copy {
		display: grid;
		gap: 1rem;
	}
	.loading-featured-copy i {
		width: 85%;
		height: 0.85rem;
		border-radius: 0.4rem;
		background: #4a6792;
	}
	.loading-featured-copy i:first-child {
		width: 48%;
		height: 0.55rem;
	}
	.loading-featured-copy i:nth-child(2) {
		width: 95%;
		height: 2.25rem;
	}
	.loading-featured-copy i:nth-child(3) {
		width: 74%;
		height: 1.1rem;
	}
	.loading-featured-art {
		display: grid;
		min-height: 19rem;
		place-items: center;
		border-radius: 1rem;
		background: #e5edf8;
	}
	.loading-featured-art i {
		width: 55%;
		height: 65%;
		border-radius: 0.8rem;
		background: #d0dceb;
	}
	.loading-section {
		width: min(100%, 72rem);
		margin: 2rem auto;
		padding: 0 1.25rem;
	}
	.loading-section-title {
		width: 12rem;
		height: 1.1rem;
		margin-bottom: 1rem;
		border-radius: 0.3rem;
	}
	.loading-product-card .loading-image {
		height: 9rem;
	}
	.loading-product-card .loading-card-copy {
		min-height: 8rem;
	}
	.loading-body.loading-shop-body {
		width: min(100%, 64rem);
		padding: 1.5rem 1.5rem 5rem;
	}
	.loading-shop-page {
		width: 100%;
		margin: 0 auto;
	}
	.loading-shop-heading {
		display: grid;
		gap: 0.7rem;
		margin-bottom: 1.5rem;
	}
	.loading-shop-heading .short {
		width: 7rem;
		height: 0.55rem;
	}
	.loading-shop-heading .title {
		width: min(18rem, 65%);
		height: 1.8rem;
	}
	.loading-shop-heading .subtitle {
		width: min(25rem, 80%);
		height: 0.65rem;
	}
	.loading-shop-section {
		margin-top: 2.5rem;
	}
	.loading-shop-section-heading {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
	}
	.loading-shop-eyebrow {
		width: 7rem;
		height: 0.55rem;
		margin-bottom: 0.35rem;
	}
	.loading-shop-title {
		width: 12rem;
		height: 1.1rem;
	}
	.loading-shop-count {
		width: 3rem;
		height: 0.65rem;
	}
	.loading-shop-description {
		width: 15rem;
		height: 0.6rem;
		margin-top: 0.4rem;
	}
	.loading-shop-featured-mask {
		overflow: hidden;
		padding: 0.65rem 0 1.1rem;
		mask-image: linear-gradient(to right, transparent, #000 3.5%, #000 96.5%, transparent);
		-webkit-mask-image: linear-gradient(to right, transparent, #000 3.5%, #000 96.5%, transparent);
	}
	.loading-shop-featured-track {
		display: flex;
		gap: 1rem;
		overflow: hidden;
		padding: 0.9rem 1.5rem 1.3rem;
	}
	.loading-shop-featured-card {
		display: flex;
		flex: 0 0 86%;
		flex-direction: column;
		min-width: 0;
		border-radius: 1.15rem;
	}
	.loading-shop-featured-topline {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 1rem 1rem 0;
	}
	.loading-shop-featured-badge,
	.loading-shop-featured-category,
	.loading-shop-featured-image,
	.loading-shop-featured-copy i,
	.loading-shop-count,
	.loading-shop-category-icon,
	.loading-shop-category-label,
	.loading-shop-product-action {
		display: block;
		border-radius: 0.3rem;
	}
	.loading-shop-featured-badge {
		width: 5.5rem;
		height: 1rem;
		border-radius: 999px;
	}
	.loading-shop-featured-category {
		width: 4rem;
		height: 0.6rem;
	}
	.loading-shop-featured-image {
		height: 11rem;
		margin: 0.8rem 1rem 0;
		border: 1px solid #e4eaf2;
		border-radius: 0.75rem;
	}
	.loading-shop-featured-copy {
		display: grid;
		gap: 0.45rem;
		padding: 0.85rem 1rem 1rem;
	}
	.loading-shop-featured-copy i:first-child {
		width: 75%;
		height: 0.85rem;
	}
	.loading-shop-featured-copy i:nth-child(2) {
		width: 95%;
		height: 0.65rem;
	}
	.loading-shop-featured-copy i:last-child {
		width: 42%;
		height: 1rem;
		margin-top: 0.2rem;
	}
	.loading-shop-controls {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 0.25rem;
	}
	.loading-shop-controls i {
		width: 2.4rem;
		height: 2.4rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
	}
	.loading-shop-category-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.8rem;
	}
	.loading-shop-category {
		display: grid;
		justify-items: center;
		gap: 0.5rem;
		min-width: 0;
	}
	.loading-shop-category-icon {
		width: 3.65rem;
		height: 3.65rem;
		border: 1px solid #e2e8f0;
		border-radius: 1.05rem;
	}
	.loading-shop-category-label {
		width: min(100%, 5rem);
		height: 0.55rem;
	}
	.loading-shop-discover-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.8rem;
	}
	.loading-shop-discover-card {
		border-radius: 1rem;
	}
	.loading-shop-discover-card .loading-image {
		height: 8.5rem;
	}
	.loading-shop-discover-card .loading-card-copy {
		min-height: 8rem;
		padding: 0.85rem;
	}
	.loading-shop-discover-card .loading-card-copy i:first-child {
		width: 55%;
	}
	.loading-shop-product-action {
		height: 2rem;
		margin-top: 0.2rem;
		border-radius: 999px;
	}
	.loading-shop-discover-card .loading-card-copy .loading-shop-product-action {
		width: 100%;
	}
	.loading-account {
		width: min(100%, 38rem);
		margin: 0 auto;
	}
	.loading-account-center {
		display: grid;
		justify-items: center;
		gap: 0.65rem;
		padding: 2rem 0;
	}
	.loading-profile-avatar {
		width: 6rem;
		height: 6rem;
		border-radius: 50%;
	}
	.loading-settings-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-top: 1px solid #edf1f5;
		padding-top: 1rem;
	}
	.loading-settings-row i:first-child {
		width: 7rem;
		height: 0.75rem;
	}
	.loading-settings-row i:last-child {
		width: 2.5rem;
		height: 1.3rem;
		border-radius: 1rem;
	}
	.loading-orders {
		width: min(100%, 65rem);
		margin: 0 auto;
	}
	.loading-order-filters {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}
	.loading-order-filters i {
		width: 7rem;
		height: 2.6rem;
		border-radius: 2rem;
	}
	.loading-order-filters i:nth-child(3) {
		width: 9rem;
	}
	.loading-order-panel {
		margin-bottom: 1rem;
	}
	.loading-order-title {
		width: 5rem;
		height: 1rem;
		margin-bottom: 0.5rem;
	}
	.loading-order-item {
		display: grid;
		grid-template-columns: 1.15rem 4.25rem minmax(0, 1fr) 7rem 5rem;
		align-items: center;
		gap: 0.9rem;
		border-top: 1px solid #edf1f5;
		padding: 0.85rem 0;
	}
	.loading-order-checkbox {
		width: 1rem;
		height: 1rem;
		border-radius: 0.25rem;
	}
	.loading-order-thumbnail {
		width: 4.25rem;
		height: 4.25rem;
		border-radius: 0.6rem;
	}
	.loading-order-copy {
		display: grid;
		gap: 0.45rem;
	}
	.loading-order-copy i:first-child {
		width: 70%;
		height: 0.8rem;
	}
	.loading-order-copy i:last-child {
		width: 35%;
		height: 0.6rem;
	}
	.loading-order-quantity {
		width: 6.5rem;
		height: 2.3rem;
		border-radius: 0.5rem;
	}
	.loading-order-price {
		width: 4.5rem;
		height: 0.8rem;
	}
	.loading-cart {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 16rem;
		gap: 1.5rem;
	}
	.loading-cart-item {
		display: grid;
		grid-template-columns: 5rem minmax(0, 1fr) auto;
		align-items: center;
		gap: 1rem;
		border-bottom: 1px solid #edf1f5;
		padding: 1rem 0;
	}
	.loading-cart-image {
		width: 5rem;
		height: 5rem;
		border-radius: 0.6rem;
	}
	.loading-cart-copy {
		display: grid;
		gap: 0.6rem;
	}
	.loading-cart-copy i {
		width: 65%;
		height: 0.65rem;
	}
	.loading-cart-copy i:first-child {
		width: 82%;
		height: 0.85rem;
	}
	.loading-cart-price {
		width: 4rem;
		height: 0.85rem;
	}
	.loading-cart-summary {
		display: grid;
		align-content: start;
		gap: 1rem;
	}
	.loading-cart-summary i {
		height: 0.75rem;
	}
	.loading-cart-summary i:last-child {
		height: 2.5rem;
		margin-top: 0.5rem;
		border-radius: 0.5rem;
	}
	.loading-dashboard-charts {
		display: grid;
		grid-template-columns: 1.5fr 1fr;
		gap: 0.85rem;
		margin-bottom: 1.1rem;
	}
	.loading-chart {
		display: flex;
		height: 10rem;
		align-items: flex-end;
		justify-content: space-around;
		gap: 0.5rem;
		padding-top: 1rem;
	}
	.loading-chart i {
		width: 7%;
		min-height: 20%;
	}
	.loading-chart i:nth-child(3n) {
		height: 78%;
	}
	.loading-chart i:nth-child(3n + 1) {
		height: 48%;
	}
	.loading-chart i:nth-child(3n + 2) {
		height: 62%;
	}
	.loading-report-filters {
		display: grid;
		grid-template-columns: 1fr 1fr 1.4fr auto;
		gap: 0.7rem;
		margin-top: 1.2rem;
	}
	.loading-filter {
		display: grid;
		gap: 0.45rem;
	}
	.loading-filter i:first-child {
		width: 45%;
		height: 0.55rem;
	}
	.loading-filter i:last-child {
		width: 100%;
		height: 2.4rem;
	}
	.loading-form-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
	}
	.loading-form-field {
		display: grid;
		gap: 0.45rem;
	}
	.loading-form-field i:first-child {
		width: 45%;
		height: 0.6rem;
	}
	.loading-form-field i:last-child {
		height: 2.6rem;
	}
	.loading-login {
		width: min(100% - 2rem, 27rem);
		margin: 10vh auto;
	}
	.loading-login .loading-profile-avatar {
		margin: 0 auto 1.5rem;
	}
	.loading-about-grid {
		display: grid;
		grid-template-columns: 1.2fr 0.8fr;
		gap: 1.25rem;
	}
	.loading-about-copy {
		display: grid;
		gap: 0.75rem;
	}
	.loading-about-copy i {
		height: 0.7rem;
	}
	.loading-about-copy i:nth-child(3n) {
		width: 82%;
	}
	.skeleton-block,
	.loading-block,
	.loading-stat i,
	.loading-table-row i,
	.loading-card-copy i,
	.loading-image,
	.loading-featured-art i,
	.loading-account-center i,
	.loading-cart-item i,
	.loading-cart-summary i,
	.loading-chart i,
	.loading-filter i,
	.loading-form-field i,
	.loading-panel-heading i,
	.loading-topbar-actions i {
		background: linear-gradient(100deg, #e7edf4 20%, #f5f7fa 38%, #e7edf4 56%);
		background-size: 250% 100%;
		animation: loading-sheen 1.35s ease-in-out infinite;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		clip-path: inset(50%);
	}
	@keyframes loading-sheen {
		to {
			background-position-x: -250%;
		}
	}
	:global(html[data-theme='dark'] .page-loading-overlay) {
		background: #101d35;
	}
	:global(html[data-theme='dark'] .loading-topbar),
	:global(html[data-theme='dark'] .loading-stat),
	:global(html[data-theme='dark'] .loading-panel),
	:global(html[data-theme='dark'] .loading-card),
	:global(html[data-theme='dark'] .loading-utility-topbar),
	:global(html[data-theme='dark'] .loading-utility-stat) {
		border-color: #334866;
		background-color: #172640;
	}
	:global(html[data-theme='dark'] .skeleton-block),
	:global(html[data-theme='dark'] .loading-block),
	:global(html[data-theme='dark'] .loading-stat i),
	:global(html[data-theme='dark'] .loading-table-row i),
	:global(html[data-theme='dark'] .loading-card-copy i),
	:global(html[data-theme='dark'] .loading-image),
	:global(html[data-theme='dark'] .loading-cart-item i),
	:global(html[data-theme='dark'] .loading-cart-summary i),
	:global(html[data-theme='dark'] .loading-chart i),
	:global(html[data-theme='dark'] .loading-filter i),
	:global(html[data-theme='dark'] .loading-form-field i),
	:global(html[data-theme='dark'] .loading-panel-heading i),
	:global(html[data-theme='dark'] .loading-topbar-actions i) {
		background-image: linear-gradient(100deg, #263b59 20%, #334866 38%, #263b59 56%);
	}
	@media (max-width: 900px) {
		.loading-stats {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.loading-cards {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.loading-cart {
			grid-template-columns: minmax(0, 1fr) 13rem;
		}
		.loading-dashboard-charts {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 760px) {
		:global(body:has(.admin-shell) .page-loading-overlay.staff-loading),
		:global(body:has(.admin-shell.collapsed) .page-loading-overlay.staff-loading),
		:global(body:has(.cashier-shell) .page-loading-overlay.staff-loading),
		:global(body:has(.register-shell) .page-loading-overlay.staff-loading),
		:global(body:has(.register-shell.collapsed) .page-loading-overlay.staff-loading) {
			left: 0;
		}
		:global(body:has(.admin-shell) .page-loading-overlay.staff-loading) {
			top: 3.5rem;
		}
		.loading-featured {
			grid-template-columns: 1fr;
			gap: 1.25rem;
			min-height: 0;
		}
		.loading-featured-art {
			min-height: 12rem;
		}
		.loading-report-filters {
			grid-template-columns: 1fr 1fr;
		}
		.loading-about-grid {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 560px) {
		.loading-cards {
			gap: 0.6rem;
		}
		.loading-product-card .loading-image {
			height: 7rem;
		}
		.loading-card-copy {
			padding: 0.75rem;
		}
		.loading-cart {
			grid-template-columns: 1fr;
		}
		.loading-cart-summary {
			position: sticky;
			bottom: 0;
			grid-template-columns: 1fr auto;
			align-items: center;
			border: 1px solid #e4eaf2;
			border-radius: 0.65rem;
			background: white;
			padding: 0.85rem;
		}
		.loading-cart-summary i:last-child {
			width: 7rem;
			margin: 0;
		}
		.loading-form-grid {
			grid-template-columns: 1fr;
		}
		.loading-table-row {
			grid-template-columns: 1fr 1fr;
			gap: 0.75rem;
			padding: 0.8rem 0;
		}
		.loading-table-row i:nth-child(n + 3) {
			display: none;
		}
	}
	.loading-products-grid {
		grid-template-columns: repeat(4, minmax(0, 1fr));
	}
	.loading-cart {
		display: block;
		padding-bottom: 7rem;
	}
	.loading-cart-summary {
		position: fixed;
		z-index: 2;
		right: 0;
		bottom: 0;
		left: 0;
		display: flex;
		min-height: 6.5rem;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		border-right: 0;
		border-bottom: 0;
		border-left: 0;
		border-radius: 0;
		background: rgba(255, 255, 255, 0.96);
		padding: 0 clamp(1rem, 4vw, 3rem);
	}
	.loading-cart-summary i {
		width: 9rem;
		height: 0.75rem;
	}
	.loading-cart-summary i:last-child {
		width: 11.5rem;
		height: 3rem;
		margin: 0;
		border-radius: 0.6rem;
	}
	@media (max-width: 1023px) {
		.loading-products-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (max-width: 639px) {
		.loading-products-grid {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 560px) {
		.loading-cart-summary {
			min-height: 5.75rem;
		}
		.loading-cart-summary i:first-child {
			width: 7rem;
		}
		.loading-cart-summary i:last-child {
			width: 7rem;
			height: 2.75rem;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.skeleton-block,
		.loading-block,
		.loading-stat i,
		.loading-table-row i,
		.loading-card-copy i,
		.loading-image,
		.loading-cart-item i,
		.loading-cart-summary i,
		.loading-chart i,
		.loading-filter i,
		.loading-form-field i,
		.loading-panel-heading i,
		.loading-topbar-actions i {
			animation: none;
		}
	}

	@media (min-width: 600px) {
		.loading-shop-featured-card {
			flex-basis: calc(50% - 0.5rem);
		}
		.loading-shop-category-grid {
			grid-template-columns: repeat(8, minmax(0, 1fr));
		}
		.loading-shop-category-icon {
			width: 4rem;
			height: 4rem;
		}
		.loading-shop-discover-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
		.loading-shop-discover-card .loading-image {
			height: 10rem;
		}
	}
	@media (min-width: 900px) {
		.loading-shop-featured-card {
			flex-basis: calc(33.333% - 0.68rem);
		}
		.loading-shop-discover-grid {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
		.loading-shop-discover-card .loading-image {
			height: 11rem;
		}
	}
	@media (min-width: 640px) {
		.loading-body.loading-shop-body {
			padding-right: 2rem;
			padding-left: 2rem;
		}
	}
	@media (min-width: 1024px) {
		.loading-body.loading-shop-body {
			padding-right: 2.5rem;
			padding-left: 2.5rem;
		}
	}
	@media (min-width: 1200px) {
		.loading-shop-featured-card {
			flex-basis: calc(25% - 0.75rem);
		}
	}
	@media (max-width: 420px) {
		.loading-body.loading-shop-body {
			padding-right: 0.85rem;
			padding-left: 0.85rem;
		}
		.loading-shop-category-grid {
			gap: 0.65rem 0.35rem;
		}
		.loading-shop-category-icon {
			width: 3.2rem;
			height: 3.2rem;
		}
		.loading-shop-discover-card .loading-image {
			height: 7rem;
		}
	}

	.loading-admin-settings {
		width: min(100%, 38rem);
		margin: 0;
	}
	.loading-admin-profile {
		display: grid;
		justify-items: center;
		gap: 0.65rem;
		padding: 0.75rem 0 1rem;
	}
	.loading-admin-profile > i:not(:first-child) {
		height: 0.7rem;
		border-radius: 0.3rem;
	}
	.loading-admin-details {
		display: grid;
		width: min(100%, 22rem);
		gap: 0.55rem;
		margin: 0.5rem auto 1.25rem;
	}
	.loading-admin-detail-row {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}
	.loading-admin-detail-row i {
		width: 42%;
		height: 0.65rem;
		border-radius: 0.3rem;
	}
	.loading-admin-detail-row i:last-child {
		width: 35%;
	}
	.loading-admin-preferences {
		border-top: 1px solid #edf1f5;
		padding-top: 1.1rem;
	}
	.loading-admin-section-title {
		width: 7rem;
		height: 0.8rem;
		margin-bottom: 0.8rem;
	}
	.loading-admin-setting-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.2rem;
	}
	.loading-admin-setting-row i:first-child {
		width: 7rem;
		height: 0.7rem;
	}
	.loading-admin-setting-row i:last-child {
		width: 2.5rem;
		height: 1.3rem;
		border-radius: 1rem;
	}
	.loading-admin-password {
		display: grid;
		gap: 0.75rem;
	}
	.loading-admin-password-field {
		display: grid;
		gap: 0.35rem;
	}
	.loading-admin-password-field i:first-child {
		width: 7rem;
		height: 0.6rem;
	}
	.loading-admin-password-field i:last-child {
		height: 2.4rem;
		border-radius: 0.55rem;
	}
	.loading-admin-password-button {
		width: 8rem;
		height: 2.2rem;
		margin-top: 0.75rem;
		border-radius: 0.5rem;
	}
	@media (max-width: 560px) {
		.loading-admin-detail-row {
			gap: 0.65rem;
		}
		.loading-admin-detail-row i {
			width: 48%;
		}
		.loading-admin-detail-row i:last-child {
			width: 40%;
		}
	}

	.loading-admin-accounts,
	.loading-teacher-membership {
		min-width: 0;
	}
	.loading-admin-accounts .loading-panel,
	.loading-teacher-membership .loading-panel {
		overflow-x: auto;
	}
	.loading-admin-accounts .loading-admin-title-actions,
	.loading-teacher-membership .loading-admin-title-actions {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.25rem;
	}
	.loading-admin-title-copy {
		display: grid;
		gap: 0.65rem;
	}
	.loading-admin-title-copy .loading-block.title {
		width: min(17rem, 70%);
	}
	.loading-admin-title-actions > .skeleton-block {
		width: 8rem;
		height: 2.4rem;
		flex: 0 0 auto;
		border-radius: 0.55rem;
	}
	.loading-signup-notice {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		margin-bottom: 1rem;
		border: 1px solid #dbeafe;
		border-radius: 0.6rem;
		background: #eff6ff;
		padding: 0.8rem 1rem;
	}
	.loading-signup-notice > i:first-child {
		width: 0.65rem;
		height: 0.65rem;
		flex: 0 0 auto;
		border-radius: 50%;
	}
	.loading-signup-notice > i:last-child {
		width: min(25rem, 80%);
		height: 0.7rem;
		border-radius: 0.3rem;
	}
	.loading-admin-toolbar {
		display: flex;
		align-items: flex-end;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}
	.loading-admin-toolbar-field {
		display: grid;
		width: min(19rem, 45%);
		gap: 0.4rem;
	}
	.loading-admin-toolbar-field:last-of-type {
		width: min(11rem, 30%);
	}
	.loading-admin-toolbar-field i:first-child {
		width: 4.5rem;
		height: 0.55rem;
		border-radius: 0.3rem;
	}
	.loading-admin-toolbar-field i:last-child {
		height: 2.4rem;
		border: 1px solid #e4eaf2;
		border-radius: 0.45rem;
	}
	.loading-admin-toolbar > .loading-block {
		width: 5rem;
		margin: 0 0 0.75rem auto;
	}
	.loading-admin-account-table {
		min-width: 58rem;
	}
	.loading-admin-account-row {
		display: grid;
		grid-template-columns: 1.5fr 1.25fr 0.85fr 0.65fr 1.1fr;
		gap: 1rem;
		align-items: center;
		border-top: 1px solid #edf1f5;
		padding: 0.95rem 0;
	}
	.loading-admin-account-row.table-head {
		border-top: 0;
		padding: 0.2rem 0 0.75rem;
	}
	.loading-admin-account-row.table-head i {
		height: 0.55rem;
	}
	.loading-admin-account-cell {
		display: grid;
		min-width: 0;
		gap: 0.5rem;
	}
	.loading-admin-account-cell i {
		height: 0.65rem;
		border-radius: 0.3rem;
	}
	.loading-admin-account-cell i:first-child {
		width: 76%;
		height: 0.75rem;
	}
	.loading-admin-account-cell i:last-child {
		width: 92%;
	}
	.loading-admin-account-cell:nth-child(3) i:first-child {
		width: 60%;
	}
	.loading-admin-account-cell:nth-child(4) i {
		width: 68%;
		height: 1.25rem;
		border-radius: 1rem;
	}
	.loading-admin-actions {
		display: flex;
		gap: 0.35rem;
	}
	.loading-admin-actions i {
		width: 3rem;
		height: 1.8rem;
		border-radius: 0.4rem;
	}
	.loading-teacher-table {
		min-width: 68rem;
	}
	.loading-teacher-row {
		display: grid;
		grid-template-columns: 1fr 0.8fr 1.05fr 1.05fr 1.8fr;
		gap: 1rem;
		align-items: center;
		border-top: 1px solid #edf1f5;
		padding: 0.85rem 0;
	}
	.loading-teacher-row.table-head {
		border-top: 0;
		padding: 0.15rem 0 0.75rem;
	}
	.loading-teacher-row.table-head i {
		height: 0.55rem;
	}
	.loading-teacher-cell {
		display: grid;
		min-width: 0;
		gap: 0.5rem;
	}
	.loading-teacher-cell > i {
		width: 78%;
		height: 0.65rem;
		border-radius: 0.3rem;
	}
	.loading-teacher-cell > i:last-child {
		width: 56%;
	}
	.loading-teacher-cell.membership-copy > i:first-child {
		width: 62%;
		height: 0.75rem;
	}
	.loading-teacher-form {
		display: grid;
		gap: 0.5rem;
	}
	.loading-teacher-form > i {
		height: 1.8rem;
		border: 1px solid #e4eaf2;
		border-radius: 0.4rem;
	}
	.loading-teacher-form .loading-teacher-dates {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}
	.loading-teacher-form .loading-teacher-dates i {
		height: 1.8rem;
		border: 1px solid #e4eaf2;
		border-radius: 0.4rem;
	}
	.loading-teacher-form > i:last-child {
		width: 6rem;
		height: 1.8rem;
		border: 0;
		border-radius: 0.4rem;
	}

	.loading-utility-topbar {
		display: flex;
		min-height: 3.9rem;
		align-items: center;
		justify-content: space-between;
		margin: -1.15rem calc(clamp(1rem, 3vw, 3rem) * -1) 1rem;
		border-bottom: 1px solid #e4eaf2;
		background: white;
		padding: 0.55rem clamp(1rem, 3vw, 3rem);
	}
	.loading-utility-title {
		display: grid;
		gap: 0.35rem;
	}
	.loading-utility-title i:first-child {
		width: 4.5rem;
		height: 0.9rem;
	}
	.loading-utility-title i:last-child {
		width: 7rem;
		height: 0.55rem;
	}
	.loading-utility-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.loading-utility-actions i:first-child {
		width: 7rem;
		height: 2rem;
		border: 1px solid #e4eaf2;
		border-radius: 0.45rem;
	}
	.loading-utility-actions i:nth-child(2),
	.loading-utility-actions i:last-child {
		width: 2rem;
		height: 2rem;
		border: 1px solid #e4eaf2;
		border-radius: 50%;
	}
	.loading-utility-actions i:last-child {
		background: #e7edf4;
	}
	.loading-body.loading-utilities {
		max-width: none;
		padding-top: 1.15rem;
	}
	.loading-utility-overview {
		margin-bottom: 1rem;
		padding: 1rem 1.1rem;
	}
	.loading-utility-overview-heading {
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}
	.loading-utility-overview-heading > i:first-child {
		width: 1.65rem;
		height: 1.65rem;
		flex: 0 0 auto;
		border-radius: 50%;
	}
	.loading-utility-overview-copy {
		display: grid;
		flex: 1;
		gap: 0.4rem;
	}
	.loading-utility-overview-copy i:first-child {
		width: 11rem;
		height: 0.9rem;
	}
	.loading-utility-overview-copy i:last-child {
		width: min(23rem, 90%);
		height: 0.6rem;
	}
	.loading-utility-overview-heading > i:last-child {
		width: 7rem;
		height: 2rem;
		border: 1px solid #e4eaf2;
		border-radius: 0.45rem;
	}
	.loading-utility-stats {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.65rem;
		margin-top: 0.75rem;
	}
	.loading-utility-stat {
		display: grid;
		min-height: 4.7rem;
		align-content: center;
		gap: 0.45rem;
		border: 1px solid #e6eaf0;
		border-radius: 0.6rem;
		background: #fbfcfd;
		padding: 0.7rem 0.8rem;
	}
	.loading-utility-stat i:first-child {
		width: 48%;
		height: 0.55rem;
	}
	.loading-utility-stat i:nth-child(2) {
		width: 60%;
		height: 1.1rem;
	}
	.loading-utility-stat i:last-child {
		width: 36%;
		height: 0.55rem;
	}
	.loading-utility-overview .loading-utility-stat i:last-child {
		width: 60%;
		height: 1.1rem;
	}
	.loading-utility-links {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.65rem;
		margin-top: 0.65rem;
	}
	.loading-utility-link {
		display: grid;
		gap: 0.4rem;
		border: 1px solid #e4eaf2;
		border-radius: 0.6rem;
		padding: 0.65rem 0.8rem;
	}
	.loading-utility-link i:first-child {
		width: 40%;
		height: 0.65rem;
	}
	.loading-utility-link i:last-child {
		width: 72%;
		height: 0.55rem;
	}
	.loading-utility-section-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin: 1rem 0 0.6rem;
	}
	.loading-utility-section-copy {
		display: grid;
		gap: 0.4rem;
	}
	.loading-utility-section-copy i:first-child {
		width: 9rem;
		height: 0.8rem;
	}
	.loading-utility-section-copy i:last-child {
		width: 15rem;
		height: 0.55rem;
	}
	.loading-utility-section-actions {
		display: flex;
		gap: 0.5rem;
	}
	.loading-utility-section-actions i {
		width: 7rem;
		height: 2rem;
		border: 1px solid #e4eaf2;
		border-radius: 0.45rem;
	}
	.loading-utility-section-actions i:last-child {
		width: 6.5rem;
	}
	.loading-utility-account-stats {
		margin-top: 0;
	}
	.loading-utility-account-layout {
		display: grid;
		grid-template-columns: minmax(0, 2.5fr) minmax(13rem, 0.95fr);
		gap: 0.65rem;
		margin-top: 0.65rem;
	}
	.loading-utility-account,
	.loading-utility-activity {
		min-width: 0;
		padding: 0.9rem;
	}
	.loading-utility-account-heading {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-bottom: 1rem;
	}
	.loading-utility-account-heading > i:first-child {
		width: 1.8rem;
		height: 1.8rem;
		border-radius: 0.45rem;
	}
	.loading-utility-account-heading > i:last-child {
		width: 8rem;
		height: 0.7rem;
		margin-left: auto;
		border-radius: 1rem;
	}
	.loading-utility-account-name {
		display: grid;
		gap: 0.4rem;
	}
	.loading-utility-account-name i:first-child {
		width: 12rem;
		height: 0.75rem;
	}
	.loading-utility-account-name i:last-child {
		width: 9rem;
		height: 0.55rem;
	}
	.loading-utility-details {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.8rem;
	}
	.loading-utility-detail {
		display: grid;
		gap: 0.4rem;
	}
	.loading-utility-detail i:first-child {
		width: 55%;
		height: 0.55rem;
	}
	.loading-utility-detail i:nth-child(2) {
		width: 92%;
		height: 0.65rem;
	}
	.loading-utility-detail i:last-child {
		width: 70%;
		height: 0.55rem;
	}
	.loading-utility-service-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-top: 0.8rem;
	}
	.loading-utility-service-list i {
		width: 6rem;
		height: 2rem;
		border-radius: 0.55rem;
	}
	.loading-utility-activity-heading {
		width: 70%;
		height: 0.75rem;
		margin-bottom: 1rem;
	}
	.loading-utility-activity-item {
		display: grid;
		gap: 0.4rem;
		border-left: 2px solid #e4eaf2;
		padding: 0.1rem 0 0.9rem 0.9rem;
	}
	.loading-utility-activity-item i:first-child {
		width: 86%;
		height: 0.55rem;
	}
	.loading-utility-activity-item i:nth-child(2) {
		width: 54%;
		height: 0.65rem;
	}
	.loading-utility-activity-item i:last-child {
		width: 44%;
		height: 0.5rem;
	}
	:global(html[data-theme='dark'] .loading-signup-notice) {
		border-color: #2f5289;
		background: #152b4a;
	}
	@media (max-width: 900px) {
		.loading-utility-account-layout {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 760px) {
		.loading-utility-stats {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.loading-utility-overview-heading > i:last-child {
			display: none;
		}
		.loading-admin-title-actions {
			align-items: flex-start;
		}
		.loading-utility-details {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 560px) {
		.loading-admin-title-actions {
			flex-direction: column;
		}
		.loading-admin-toolbar {
			align-items: stretch;
			flex-wrap: wrap;
		}
		.loading-admin-toolbar-field {
			width: 100%;
		}
		.loading-admin-toolbar-field:last-of-type {
			width: calc(60% - 0.4rem);
		}
		.loading-admin-toolbar > .loading-block {
			width: 4rem;
			margin: 0 0 0.7rem auto;
		}
		.loading-utility-section-heading {
			align-items: flex-start;
			flex-direction: column;
		}
		.loading-utility-section-actions {
			width: 100%;
		}
		.loading-utility-section-actions i {
			flex: 1;
		}
		.loading-utility-links {
			grid-template-columns: 1fr;
		}
	}

	/* Fade + slide entrance replayed on reload (fresh mount) or right after a successful login (key bump) */
	@keyframes dashboard-enter {
		from {
			opacity: 0;
			transform: translateY(22px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.dashboard-enter {
		animation: dashboard-enter 620ms cubic-bezier(0.22, 1, 0.36, 1) both;
	}
</style>
