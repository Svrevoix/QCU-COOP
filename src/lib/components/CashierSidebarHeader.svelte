<script lang="ts">
	let {
		collapsed,
		sidebarId,
		href = '/staff/pos',
		onToggle
	}: {
		collapsed: boolean;
		sidebarId: string;
		href?: string;
		onToggle: () => void;
	} = $props();
</script>

<div class="cashier-sidebar-top" class:collapsed>
	<a class="cashier-brand" {href}>
		<span class="brand-mark">Q</span>
		<span class="brand-copy"><strong>QCU COOP</strong><small>Cashier workspace</small></span>
	</a>
	<button
		class="sidebar-toggle"
		type="button"
		aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
		aria-expanded={!collapsed}
		aria-controls={sidebarId}
		title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
		onclick={onToggle}
	>
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path d={collapsed ? 'm9 18 6-6-6-6' : 'm15 18-6-6 6-6'} />
		</svg>
	</button>
</div>

<style>
	:global(.cashier-shell .cashier-sidebar),
	:global(.register-shell .register-sidebar) {
		height: 100vh;
		height: 100dvh;
		overflow: hidden;
		justify-content: space-between;
	}
	:global(.cashier-shell .cashier-sidebar .sidebar-label),
	:global(.register-shell .register-sidebar .sidebar-label),
	:global(.cashier-shell .cashier-sidebar .staff-logout),
	:global(.register-shell .register-sidebar .staff-logout),
	:global(.register-shell .register-sidebar .sidebar-footer) {
		flex: 0 0 auto;
	}
	.cashier-sidebar-top {
		display: flex;
		flex: 0 0 auto;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-bottom: 1rem;
		padding: 0.25rem 0.25rem 0 0.7rem;
	}
	.cashier-brand {
		display: flex;
		min-width: 0;
		align-items: center;
		gap: 0.75rem;
		color: white;
		text-decoration: none;
	}
	.brand-mark {
		display: grid;
		width: 2.25rem;
		height: 2.25rem;
		flex: 0 0 auto;
		place-items: center;
		border-radius: 0.65rem;
		background: #2d6cff;
		font-size: 1.1rem;
		font-weight: 900;
	}
	.brand-copy {
		overflow: hidden;
		max-width: 12rem;
		opacity: 1;
		transition:
			max-width 180ms ease,
			opacity 140ms ease;
	}
	.brand-copy strong,
	.brand-copy small {
		display: block;
		white-space: nowrap;
	}
	.brand-copy strong {
		font-size: 0.8rem;
		letter-spacing: 0.12em;
	}
	.brand-copy small {
		margin-top: 0.2rem;
		color: #8da1c3;
		font-size: 0.65rem;
	}
	.sidebar-toggle {
		display: grid;
		box-sizing: border-box;
		width: 2rem;
		height: 2rem;
		flex: 0 0 auto;
		place-items: center;
		margin: 0;
		border: 1px solid #263b5b;
		border-radius: 0.55rem;
		background: transparent;
		color: #b8c8dd;
		padding: 0;
		cursor: pointer;
	}
	.sidebar-toggle:hover {
		background: #12274b;
		color: white;
	}
	:global(html[data-theme='dark'] .cashier-sidebar-top .sidebar-toggle) {
		border-color: #415878;
		background: #122440;
		color: #dbe7fb;
	}
	.sidebar-toggle svg {
		display: block;
		width: 1.1rem;
		height: 1.1rem;
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 2;
	}
	.cashier-sidebar-top.collapsed {
		box-sizing: border-box;
		width: 100%;
		align-items: center;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1rem;
		padding: 0.25rem 0 0;
	}
	.cashier-sidebar-top.collapsed .cashier-brand {
		width: 100%;
		justify-content: center;
	}
	.cashier-sidebar-top.collapsed .brand-copy {
		max-width: 0;
		opacity: 0;
		visibility: hidden;
	}
	.cashier-sidebar-top.collapsed .sidebar-toggle {
		align-self: center;
	}
	:global(.cashier-shell.collapsed .cashier-sidebar),
	:global(.register-shell.collapsed .register-sidebar) {
		width: 5rem;
		flex: 0 0 5rem;
		padding: 0.65rem;
	}
	:global(.cashier-shell.collapsed .cashier-sidebar .sidebar-label),
	:global(.register-shell.collapsed .register-sidebar .sidebar-label) {
		max-height: 0;
		overflow: hidden;
		padding-bottom: 0;
		opacity: 0;
		visibility: hidden;
	}
	:global(.cashier-shell.collapsed .cashier-sidebar .staff-logout),
	:global(.register-shell.collapsed .register-sidebar .staff-logout) {
		justify-content: center;
		padding-right: 0;
		padding-left: 0;
		text-align: center;
	}
	:global(.cashier-shell.collapsed .cashier-sidebar .staff-logout span),
	:global(.register-shell.collapsed .register-sidebar .staff-logout span) {
		display: none;
	}
	:global(.register-shell.collapsed .sidebar-footer-copy) {
		max-width: 0;
		opacity: 0;
		visibility: hidden;
	}
	@media (max-width: 760px) {
		.cashier-sidebar-top.collapsed {
			margin-bottom: 1rem;
		}
		:global(.cashier-shell .cashier-sidebar),
		:global(.register-shell .register-sidebar) {
			overflow: hidden;
		}
	}
	@media (max-width: 760px) {
		.sidebar-toggle {
			display: none;
		}
		.cashier-sidebar-top.collapsed {
			flex-direction: row;
			gap: 0.5rem;
			margin-bottom: 1rem;
			padding: 0.25rem 0.25rem 0 0.7rem;
		}
		.cashier-sidebar-top.collapsed .cashier-brand {
			width: auto;
			justify-content: flex-start;
		}
		.cashier-sidebar-top.collapsed .brand-copy {
			max-width: 12rem;
			opacity: 1;
			visibility: visible;
		}
		:global(.cashier-shell.collapsed .cashier-sidebar),
		:global(.register-shell.collapsed .register-sidebar) {
			width: min(18rem, 88vw);
			flex-basis: auto;
			padding: max(1rem, env(safe-area-inset-top)) 1rem max(1rem, env(safe-area-inset-bottom));
		}
		:global(.cashier-shell.collapsed .cashier-sidebar .staff-logout span),
		:global(.register-shell.collapsed .register-sidebar .staff-logout span) {
			display: inline;
		}
		:global(.cashier-shell.collapsed .cashier-sidebar .sidebar-label),
		:global(.register-shell.collapsed .register-sidebar .sidebar-label) {
			max-height: 1.5rem;
			padding: 0 0.75rem 0.7rem;
			opacity: 1;
			visibility: visible;
		}
		:global(.cashier-shell.collapsed .cashier-sidebar .staff-logout),
		:global(.register-shell.collapsed .register-sidebar .staff-logout) {
			justify-content: flex-start;
			padding-right: 0.75rem;
			padding-left: 0.75rem;
			text-align: left;
		}
		:global(.register-shell.collapsed .sidebar-footer-copy) {
			max-width: 12rem;
			opacity: 1;
			visibility: visible;
		}
		:global(.register-shell.collapsed .sidebar-footer) {
			justify-content: flex-start;
			padding: 0.8rem 0.55rem;
		}
	}
	@media (max-height: 600px) {
		:global(.cashier-shell .cashier-sidebar),
		:global(.register-shell .register-sidebar) {
			padding-top: max(0.65rem, env(safe-area-inset-top));
			padding-bottom: max(0.65rem, env(safe-area-inset-bottom));
		}
		:global(.cashier-shell.collapsed .cashier-sidebar),
		:global(.register-shell.collapsed .register-sidebar) {
			padding: max(0.65rem, env(safe-area-inset-top)) 0.65rem max(0.65rem, env(safe-area-inset-bottom));
		}
		.cashier-sidebar-top.collapsed {
			margin-bottom: 0.55rem;
		}
		:global(.cashier-shell .cashier-sidebar .sidebar-label),
		:global(.register-shell .register-sidebar .sidebar-label) {
			padding-bottom: 0.35rem;
		}
		:global(.cashier-shell .cashier-sidebar .staff-logout),
		:global(.register-shell .register-sidebar .staff-logout) {
			margin-top: 0.5rem;
			padding-top: 0.5rem;
			padding-bottom: 0.5rem;
		}
		:global(.register-shell .sidebar-footer) {
			padding-top: 0.5rem;
			padding-bottom: 0.5rem;
		}
	}
	@media (max-width: 760px) and (max-height: 600px) {
		:global(.cashier-shell.collapsed .cashier-sidebar),
		:global(.register-shell.collapsed .register-sidebar) {
			padding-right: 1rem;
			padding-left: 1rem;
		}
	}
</style>
