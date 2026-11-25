<script lang="ts">
	let {
		collapsed,
		href = '/staff/pos',
		onToggle
	}: {
		collapsed: boolean;
		href?: string;
		onToggle?: () => void;
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
		title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
		onclick={onToggle}
	>
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<rect x="3" y="4" width="18" height="16" rx="2" />
			<path d="M9 4v16m5-11 2.5 3L14 15" />
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
	.sidebar-toggle {
		display: grid;
		width: 2rem;
		height: 2rem;
		flex: 0 0 auto;
		place-items: center;
		border: 1px solid var(--card-border);
		border-radius: 0.65rem;
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
		transition: color 200ms ease, background-color 200ms ease, border-color 200ms ease;
	}
	.sidebar-toggle:hover {
		background: var(--accent-soft);
		color: var(--text-primary);
	}
	.sidebar-toggle svg {
		width: 1.1rem;
		height: 1.1rem;
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 1.8;
	}
	.cashier-brand {
		display: flex;
		min-width: 0;
		align-items: center;
		gap: 0.75rem;
		color: var(--text-primary);
		text-decoration: none;
	}
	.brand-mark {
		display: grid;
		width: 2.25rem;
		height: 2.25rem;
		flex: 0 0 auto;
		place-items: center;
		border-radius: 0.65rem;
		background: var(--accent-gradient);
		color: white;
		font-size: 1.1rem;
		font-weight: 900;
	}
	.brand-copy {
		overflow: hidden;
		max-width: 12rem;
		opacity: 1;
		transition: max-width 200ms ease, opacity 200ms ease, transform 200ms ease;
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
		color: var(--text-muted);
		font-size: 0.65rem;
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
	.cashier-sidebar-top.collapsed .sidebar-toggle {
		margin: 0 auto;
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
	:global(.cashier-layout.collapsed .cashier-sidebar),
	:global(.cashier-shell.collapsed .cashier-sidebar),
	:global(.register-shell.collapsed .register-sidebar) {
		width: 4.5rem;
		flex: 0 0 4.5rem;
		padding: 0.65rem;
	}
	:global(.cashier-layout.collapsed .cashier-sidebar .sidebar-label),
	:global(.cashier-shell.collapsed .cashier-sidebar .sidebar-label),
	:global(.register-shell.collapsed .register-sidebar .sidebar-label) {
		max-height: 0;
		overflow: hidden;
		padding-bottom: 0;
		opacity: 0;
		visibility: hidden;
	}
	:global(.cashier-layout.collapsed .cashier-sidebar .staff-logout),
	:global(.cashier-shell.collapsed .cashier-sidebar .staff-logout),
	:global(.register-shell.collapsed .register-sidebar .staff-logout) {
		justify-content: center;
		padding-right: 0;
		padding-left: 0;
		text-align: center;
	}
	:global(.cashier-layout.collapsed .cashier-sidebar .staff-logout span),
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
		:global(.cashier-layout .cashier-sidebar),
		:global(.cashier-shell .cashier-sidebar),
		:global(.register-shell .register-sidebar) {
			overflow: hidden;
		}
	}
	@media (max-width: 760px) {
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
		:global(.cashier-layout.collapsed .cashier-sidebar),
		:global(.cashier-shell.collapsed .cashier-sidebar),
		:global(.register-shell.collapsed .register-sidebar) {
			width: min(18rem, 88vw);
			flex-basis: auto;
			padding: max(1rem, env(safe-area-inset-top)) 1rem max(1rem, env(safe-area-inset-bottom));
		}
		:global(.cashier-layout.collapsed .cashier-sidebar .staff-logout span),
		:global(.cashier-shell.collapsed .cashier-sidebar .staff-logout span),
		:global(.register-shell.collapsed .register-sidebar .staff-logout span) {
			display: inline;
		}
		:global(.cashier-layout.collapsed .cashier-sidebar .sidebar-label),
		:global(.cashier-shell.collapsed .cashier-sidebar .sidebar-label),
		:global(.register-shell.collapsed .register-sidebar .sidebar-label) {
			max-height: 1.5rem;
			padding: 0 0.75rem 0.7rem;
			opacity: 1;
			visibility: visible;
		}
		:global(.cashier-layout.collapsed .cashier-sidebar .staff-logout),
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
		:global(.cashier-layout .cashier-sidebar),
		:global(.cashier-shell .cashier-sidebar),
		:global(.register-shell .register-sidebar) {
			padding-top: max(0.65rem, env(safe-area-inset-top));
			padding-bottom: max(0.65rem, env(safe-area-inset-bottom));
		}
		:global(.cashier-layout.collapsed .cashier-sidebar),
		:global(.cashier-shell.collapsed .cashier-sidebar),
		:global(.register-shell.collapsed .register-sidebar) {
			padding: max(0.65rem, env(safe-area-inset-top)) 0.65rem max(0.65rem, env(safe-area-inset-bottom));
		}
		.cashier-sidebar-top.collapsed {
			margin-bottom: 0.55rem;
		}
		:global(.cashier-layout .cashier-sidebar .sidebar-label),
		:global(.cashier-shell .cashier-sidebar .sidebar-label),
		:global(.register-shell .register-sidebar .sidebar-label) {
			padding-bottom: 0.35rem;
		}
		:global(.cashier-layout .cashier-sidebar .staff-logout),
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
		:global(.cashier-layout.collapsed .cashier-sidebar),
		:global(.cashier-shell.collapsed .cashier-sidebar),
		:global(.register-shell.collapsed .register-sidebar) {
			padding-right: 1rem;
			padding-left: 1rem;
		}
	}
</style>
