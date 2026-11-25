<script lang="ts">
	import { page } from '$app/state';
	import { setContext } from 'svelte';
	import { fade } from 'svelte/transition';
	import CashierNavigation from '$lib/components/CashierNavigation.svelte';
	import CashierSidebarHeader from '$lib/components/CashierSidebarHeader.svelte';
	import StaffLogout from '$lib/components/StaffLogout.svelte';

	let { children } = $props();
	let sidebarState = $state({ collapsed: true, mobileOpen: false });
	const sidebar = {
		get collapsed() {
			return sidebarState.collapsed;
		},
		get mobileOpen() {
			return sidebarState.mobileOpen;
		},
		toggleCollapsed() {
			sidebarState.collapsed = !sidebarState.collapsed;
		},
		toggleMobile() {
			sidebarState.mobileOpen = !sidebarState.mobileOpen;
		},
		closeMobile() {
			sidebarState.mobileOpen = false;
		}
	};
	setContext('cashierSidebar', sidebar);

	$effect(() => {
		if (!sidebarState.mobileOpen) return;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = previousOverflow;
		};
	});
</script>

<svelte:window
	onkeydown={(event) => {
		if (event.key === 'Escape') sidebar.closeMobile();
	}}
/>

<div class="cashier-layout" class:collapsed={sidebar.collapsed} class:mobile-open={sidebar.mobileOpen}>
	<aside class="cashier-sidebar" id="cashier-sidebar" aria-label="Cashier workspace navigation">
		<CashierSidebarHeader
			collapsed={sidebar.collapsed}
			href="/staff/pos/register"
			onToggle={sidebar.toggleCollapsed}
		/>
		<p class="sidebar-label">Workspace</p>
		<CashierNavigation collapsed={sidebar.collapsed} onNavigate={sidebar.closeMobile} />
		<StaffLogout />
	</aside>
	{#if sidebar.mobileOpen}
		<button
			class="cashier-sidebar-backdrop"
			type="button"
			aria-label="Close navigation"
			onclick={sidebar.closeMobile}
		></button>
	{/if}
	<main class="cashier-layout-content">
		{#key page.url.pathname}
			<div class="cashier-route-content" in:fade={{ duration: 180 }}>
				{@render children()}
			</div>
		{/key}
	</main>
</div>

<style>
	:global(html:has(.cashier-layout)) {
		font-size: 17.5px;
	}

	.cashier-layout {
		display: flex;
		min-height: 100dvh;
		background: var(--bg-gradient);
		color: var(--text-primary);
		font-family: 'Montserrat', sans-serif;
	}

	.cashier-sidebar {
		position: sticky;
		z-index: 20;
		top: 0;
		display: flex;
		box-sizing: border-box;
		width: 15rem;
		height: 100dvh;
		flex: 0 0 15rem;
		flex-direction: column;
		overflow: hidden;
		border-right: 1px solid var(--card-border);
		background: var(--card-surface);
		padding: 1.25rem 0.9rem 0.9rem;
		backdrop-filter: blur(18px);
		transition: width 300ms ease-out, flex-basis 300ms ease-out, padding 300ms ease-out;
	}

	.cashier-layout.collapsed .cashier-sidebar {
		width: 4.5rem;
		flex-basis: 4.5rem;
		padding: 0.65rem 0.5rem;
	}

	.sidebar-label {
		max-height: 1.5rem;
		margin: 0;
		overflow: hidden;
		padding: 0 0.8rem 0.65rem;
		color: var(--text-muted);
		font-size: 0.6rem;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		opacity: 1;
		transition: max-height 200ms ease, opacity 200ms ease, padding 200ms ease;
	}

	.cashier-layout.collapsed .sidebar-label {
		max-height: 0;
		padding-bottom: 0;
		opacity: 0;
	}

	.cashier-layout-content {
		box-sizing: border-box;
		min-width: 0;
		min-height: 100dvh;
		flex: 1;
	}

	.cashier-route-content {
		min-width: 0;
		min-height: 100dvh;
	}

	.cashier-sidebar-backdrop {
		display: none;
	}

	:global(html[data-appearance] .cashier-layout) {
		background: var(--bg-gradient);
		color: var(--text-primary);
	}

	:global(html[data-appearance] .cashier-sidebar) {
		border-color: var(--card-border);
		background: var(--card-surface);
		color: var(--text-primary);
	}

	:global(html[data-appearance] .cashier-shell),
	:global(html[data-appearance] .register-shell) {
		background: var(--bg-gradient) !important;
		color: var(--text-primary) !important;
	}

	:global(html[data-appearance] .cashier-shell :is(.cashier-topbar, .cashier-mobile-topbar, .cashier-footer, .panel, .kpi-grid article, .notification-popover, .live-clock)),
	:global(html[data-appearance] .sales-content :is(.sales-topbar, .sales-metrics article, .sales-panel, .sales-footer)),
	:global(html[data-appearance] .register-shell :is(.register-topbar, .order-panel, .register-footer, .product-card, .register-dialog, .notification-popover, .pickup-orders)) {
		border-color: var(--card-border) !important;
		background: var(--card-surface) !important;
		color: var(--text-primary);
		backdrop-filter: blur(14px);
	}

	:global(html[data-appearance] .register-shell :is(.customer-control, .product-search, .cart-item, .quantity-control, .register-filter-panel)),
	:global(html[data-appearance] .register-shell .image-placeholder) {
		border-color: var(--card-border) !important;
		background: var(--card-surface) !important;
		color: var(--text-primary);
	}

	:global(html[data-appearance] .cashier-shell :is(.cashier-topbar h1, .cashier-title, .panel h2, .kpi-grid strong, td strong)),
	:global(html[data-appearance] .sales-content :is(.sales-topbar h1, .sales-metrics article > strong, .panel-heading h2, .category-legend strong)),
	:global(html[data-appearance] .register-shell :is(.topbar-title h1, .register-state > strong, .cashier-name, .products-heading h2, .order-heading h2, .product-card h3, .cart-item-top h3, .cart-item-top > strong, .totals strong, .grand-total)) {
		color: var(--text-primary) !important;
	}

	:global(html[data-appearance] .cashier-shell :is(.cashier-subtitle, .panel-heading p, .kpi-grid span, .kpi-grid em, td)),
	:global(html[data-appearance] .sales-content :is(.sales-topbar p, .sales-metrics article > span, .sales-metrics small, .panel-heading p, .y-axis, .x-axis, .category-legend > div)),
	:global(html[data-appearance] .register-shell :is(.topbar-title p, .product-variant, .product-category, .product-footer, .cart-item-top p, .totals > div, .register-dialog p, .discount-note)) {
		color: var(--text-muted) !important;
	}

	:global(html[data-appearance] .register-shell .product-image) {
		border-color: var(--card-border);
		background: var(--image-surface);
	}

	:global(html[data-appearance] .register-shell .add-to-order:not(:disabled)) {
		background: var(--accent-gradient);
		color: white;
	}

	:global(html[data-appearance] .register-shell .add-to-order:hover:not(:disabled)) {
		background: var(--accent-gradient-hover);
	}

	:global(html[data-appearance='qcu-navy-gold'] .cashier-navigation .nav-active-indicator) {
		border: 1px solid var(--accent-border);
		background: linear-gradient(90deg, #1e325c, #2b4375);
		box-shadow: 0 8px 18px rgb(2 8 23 / 24%);
	}

	:global(html[data-appearance='qcu-navy-gold'] .cashier-navigation a.active) {
		color: #fcd34d;
	}

	@media (max-width: 760px) {
		.cashier-layout {
			display: block;
			position: relative;
		}

		.cashier-sidebar {
			position: fixed;
			z-index: 60;
			inset: 0 auto 0 0;
			width: min(15rem, 88vw);
			height: 100dvh;
			transform: translateX(-100%);
			visibility: hidden;
			transition: transform 300ms ease-out, visibility 300ms ease-out;
			box-shadow: 12px 0 32px rgb(0 0 0 / 28%);
		}

		.cashier-layout.mobile-open .cashier-sidebar {
			transform: translateX(0);
			visibility: visible;
		}

		.cashier-layout.collapsed .cashier-sidebar {
			width: min(15rem, 88vw);
			flex-basis: auto;
			padding: max(1rem, env(safe-area-inset-top)) 1rem max(1rem, env(safe-area-inset-bottom));
		}

		.cashier-layout.collapsed .sidebar-label {
			max-height: 1.5rem;
			padding: 0 0.8rem 0.65rem;
			opacity: 1;
		}

		.cashier-sidebar-backdrop {
			position: fixed;
			z-index: 50;
			inset: 0;
			display: block;
			border: 0;
			background: rgb(4 12 26 / 54%);
			backdrop-filter: blur(2px);
		}

		.cashier-layout-content {
			width: 100%;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.cashier-sidebar {
			transition: none;
		}
	}
</style>
