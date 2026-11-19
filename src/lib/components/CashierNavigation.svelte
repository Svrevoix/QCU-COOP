<script lang="ts">
	import { page } from '$app/state';

	let { collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void } = $props();

	const links = [
		{ href: '/staff/pos/register', label: 'Register', icon: 'register' },
		{ href: '/staff/pos', label: 'POS Transaction Logs', icon: 'logs' },
		{ href: '/staff/pos/sales', label: 'Sales', icon: 'sales' },
		{ href: '/staff/pos/account', label: 'Account', icon: 'account' }
	];
	let activePath = $derived(page.url.pathname);
	let activeIndex = $derived.by(() => {
		const exactIndex = links.findIndex((link) => activePath === link.href);
		if (exactIndex >= 0) return exactIndex;
		return links.findIndex(
			(link) => link.href !== '/staff/pos' && activePath.startsWith(`${link.href}/`)
		);
	});
</script>

<nav class="cashier-navigation" class:collapsed aria-label="Cashier navigation">
	{#if activeIndex >= 0}
		<span
			class="nav-active-indicator"
			style={`--active-nav-index: ${activeIndex}`}
			aria-hidden="true"
		></span>
	{/if}
	{#each links as link, index (link.href)}
		<a
			class:active={activeIndex === index}
			href={link.href}
			aria-current={activeIndex === index ? 'page' : undefined}
			title={collapsed ? link.label : undefined}
			onclick={onNavigate}
		>
			<span class="nav-icon" aria-hidden="true">
				<svg viewBox="0 0 24 24">
					{#if link.icon === 'register'}
						<path d="M3 5h18v14H3zM7 9h4m-4 4h2m4-4h4m-4 4h4" /><path d="M7 16h10" />
					{:else if link.icon === 'logs'}
						<path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z" /><path d="M8 8h8M8 12h8M8 16h4" />
					{:else if link.icon === 'sales'}
						<path d="M4 19V5M4 19h17" /><path d="m7 15 4-5 3 2 5-7" />
					{:else}
						<circle cx="12" cy="8" r="3.5" /><path d="M5 20c1.2-3.6 4.2-5.5 7-5.5s5.8 1.9 7 5.5" />
					{/if}
				</svg>
			</span>
			<span class="nav-label">{link.label}</span>
		</a>
	{/each}
</nav>

<style>
	.cashier-navigation {
		position: relative;
		--nav-item-height: 2.65rem;
		--nav-item-step: 3rem;
		display: grid;
		flex: 1 1 0;
		grid-auto-rows: var(--nav-item-height);
		align-content: start;
		gap: 0.35rem;
		min-height: 0;
		overflow: hidden;
	}
	.nav-active-indicator {
		position: absolute;
		z-index: 0;
		top: 0;
		right: 0;
		left: 0;
		height: var(--nav-item-height);
		transform: translateY(calc(var(--active-nav-index) * var(--nav-item-step)));
		border-radius: 0.65rem;
		background: #2563eb;
		box-shadow: 0 8px 16px rgba(37, 99, 235, 0.22);
		pointer-events: none;
		view-transition-name: cashier-nav-active;
	}
	.cashier-navigation a {
		position: relative;
		z-index: 1;
		display: flex;
		box-sizing: border-box;
		height: var(--nav-item-height);
		min-width: 0;
		align-items: center;
		gap: 0.75rem;
		border-radius: 0.65rem;
		color: #9aacca;
		padding: 0.75rem;
		font-size: 0.72rem;
		font-weight: 700;
		line-height: 1.25;
		text-decoration: none;
		transition: color 150ms ease;
	}
	.cashier-navigation a:hover:not(.active) {
		background: #12274b;
		color: white;
	}
	.cashier-navigation a.active {
		color: white;
	}
	.nav-icon {
		display: grid;
		width: 1.15rem;
		height: 1.15rem;
		flex: 0 0 auto;
		place-items: center;
	}
	.nav-icon svg {
		width: 100%;
		height: 100%;
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 1.8;
	}
	.cashier-navigation.collapsed a {
		justify-content: center;
		padding: 0.75rem 0;
	}
	.cashier-navigation.collapsed .nav-label {
		display: none;
	}
	@media (max-width: 760px) {
		.cashier-navigation {
			--nav-item-height: 2.75rem;
			--nav-item-step: 3.1rem;
		}
		.cashier-navigation a {
			min-height: 2.75rem;
		}
		.cashier-navigation.collapsed a {
			justify-content: flex-start;
			padding: 0.75rem;
		}
		.cashier-navigation.collapsed .nav-label {
			display: inline;
		}
	}
	@media (max-height: 600px) {
		.cashier-navigation {
			--nav-item-height: 2.3rem;
			--nav-item-step: 2.55rem;
			gap: 0.25rem;
		}
		.cashier-navigation a {
			min-height: 0;
		}
	}
	@media (max-height: 430px) {
		.cashier-navigation {
			--nav-item-height: 2rem;
			--nav-item-step: 2.2rem;
			gap: 0.15rem;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.cashier-navigation a {
			transition: none;
		}
	}
</style>
