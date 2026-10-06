<script lang="ts">
	import { page } from '$app/state';
	import { setContext } from 'svelte';
	import StaffLogout from '$lib/components/StaffLogout.svelte';
	import ReportCatalog from '$lib/components/ReportCatalog.svelte';

	let { children } = $props();
	type ReportGroup = { label: string; reports: string[] };
	const navigation = [
		{ href: '/staff/admin', label: 'Dashboard', icon: 'grid' },
		{ href: '/staff/admin/inventory', label: 'Inventory Management', icon: 'box' },
		{ href: '/staff/admin/reports', label: 'Reports Engine', icon: 'chart' },
		{ href: '/staff/admin/settings', label: 'Settings', icon: 'settings' }
	];
	const reportGroups: ReportGroup[] = [
		{ label: 'Core planned reports', reports: ['Daily Cashier Cash-Out', 'Weekly Summary', 'Monthly Summary', 'Supplier per Item', 'Customer per Item', 'Supplier by Total Amount', 'Customer by Total Amount', 'Detailed Sales Report', 'Inventory Balance Report'] },
		{ label: 'Legacy statistical and sales', reports: ['Inventory Cost by Item', 'Warehouse Inventory', 'Branch Inventory', 'Detailed Receiving by Item', 'Detailed Sales by Item', 'Summarized Sales', 'Monthly Sales Analysis', 'Annual Sales Analysis', 'Daily Product Analysis'] },
		{ label: 'Warehouse transaction summary', reports: ['Received from Supplier to Warehouse', 'Returned from Supplier to Warehouse', 'Issued from Warehouse to Branch', 'Returned from Branch to Warehouse', 'Inter-Warehouse Transfers'] },
		{ label: 'Audit, control and exceptions', reports: ['Variance Report', 'Audit Trail Logs', 'Product Alert', 'Daily Sales Report (DSR)', 'Hourly Sales Summary', 'Paid Out Logs'] },
		{ label: 'System listings', reports: ['Dynamic Price Lists', 'Historical Posted Transactions'] }
	];
	const reportSelection = $state({ group: reportGroups[0].label, report: reportGroups[0].reports[0] });
	setContext('adminReportSelection', reportSelection);
	let sidebarCollapsed = $state(false);
	let mobileSidebarOpen = $state(false);
	let activePath = $derived(page.url.pathname);
</script>

<div class="admin-shell" class:collapsed={sidebarCollapsed} class:mobile-open={mobileSidebarOpen}>
	<aside class="admin-sidebar" id="admin-sidebar" aria-label="Admin workspace sidebar">
		<div class="sidebar-top">
			<div class="admin-brand"><div class="brand-mark">Q</div><div class="brand-copy"><strong>QCU COOP</strong><span>Admin workspace</span></div></div>
			<button class="sidebar-toggle" type="button" aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!sidebarCollapsed} aria-controls="admin-sidebar" title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} onclick={() => sidebarCollapsed = !sidebarCollapsed}>
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d={sidebarCollapsed ? 'm9 18 6-6-6-6' : 'm15 18-6-6 6-6'}/></svg>
			</button>
		</div>
		<div class="sidebar-label">Workspace</div>
		<nav aria-label="Admin navigation">
			{#each navigation as item}
				<a class:active={activePath === item.href} href={item.href} title={sidebarCollapsed ? item.label : undefined} onclick={() => mobileSidebarOpen = false}>
					<span class="nav-icon" aria-hidden="true">
						{#if item.icon === 'grid'}<svg viewBox="0 0 24 24"><rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><rect x="14" y="14" width="6" height="6"/></svg>
						{:else if item.icon === 'box'}<svg viewBox="0 0 24 24"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4.5 7.5 7.5 4 7.5-4M12 12v9"/></svg>
						{:else if item.icon === 'chart'}<svg viewBox="0 0 24 24"><path d="M4 19V5M4 19h17"/><path d="m7 15 4-5 3 2 5-7"/></svg>
						{:else}<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 0 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 0 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 0 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 0 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 0 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z"/></svg>{/if}
					</span><span class="nav-label">{item.label}</span>
				</a>
				{#if item.href === '/staff/admin/reports' && activePath.startsWith(item.href) && !sidebarCollapsed}
					<ReportCatalog groups={reportGroups} selection={reportSelection} />
				{/if}
			{/each}
		</nav>
		<div class="sidebar-footer"><div class="online-dot"></div><div><strong>System online</strong><span>Last sync just now</span></div></div>
		<StaffLogout />
	</aside>
	{#if mobileSidebarOpen}<button class="admin-backdrop" type="button" aria-label="Close navigation" onclick={() => mobileSidebarOpen = false}></button>{/if}
	<section class="admin-content"><div class="admin-mobile-bar"><button class="mobile-menu-button" type="button" aria-label={mobileSidebarOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileSidebarOpen} aria-controls="admin-sidebar" onclick={() => mobileSidebarOpen = !mobileSidebarOpen}><svg viewBox="0 0 24 24" aria-hidden="true"><path d={mobileSidebarOpen ? 'm6 6 12 12M18 6 6 18' : 'M4 7h16M4 12h16M4 17h16'}/></svg></button><span class="mobile-brand">QCU COOP</span><span class="mobile-status">LIVE</span></div>
		{#key activePath}
			<div class="admin-route-content">{@render children()}</div>
		{/key}
	</section>
</div>

<style>
	:global(.admin-shell) { --navy: #07152d; --ink: #17233d; --muted: #71809a; --line: #e2e8f0; --blue: #2563eb; display: flex; min-height: 100vh; background: #f4f7fb; color: var(--ink); font-family: 'Montserrat', sans-serif; }
	:global(html[data-theme='dark'] .admin-shell) { background: #101d35; color: #edf4ff; }
	:global(html[data-theme='dark'] .admin-content) { background: #101d35; color: #edf4ff; }
	:global(html[data-theme='dark'] .admin-content .admin-title), :global(html[data-theme='dark'] .admin-content h2), :global(html[data-theme='dark'] .admin-content h3), :global(html[data-theme='dark'] .admin-content strong), :global(html[data-theme='dark'] .admin-content td) { color: #edf4ff; }
	:global(html[data-theme='dark'] .admin-content .admin-subtitle), :global(html[data-theme='dark'] .admin-content p), :global(html[data-theme='dark'] .admin-content th) { color: #b8c8dd; }
	:global(html[data-theme='dark'] .admin-content .admin-eyebrow) { color: #60a5fa; }
	:global(html[data-theme='dark'] .admin-content .kpi-card), :global(html[data-theme='dark'] .admin-content .panel), :global(html[data-theme='dark'] .admin-content .movement-card), :global(html[data-theme='dark'] .admin-content .dashboard-stats article), :global(html[data-theme='dark'] .admin-content .dashboard-links a), :global(html[data-theme='dark'] .admin-content .operations-panel), :global(html[data-theme='dark'] .admin-content .directory-panel), :global(html[data-theme='dark'] .admin-content .profile-form), :global(html[data-theme='dark'] .admin-content .settings-card) { border-color: #334866; background: #172640; }
	:global(html[data-theme='dark'] .admin-content input), :global(html[data-theme='dark'] .admin-content select), :global(html[data-theme='dark'] .admin-content textarea) { border-color: #415878; background: #101d35; color: #edf4ff; }
	:global(html[data-theme='dark'] .admin-content .admin-button.secondary) { border-color: #415878; background: #172640; color: #edf4ff; }
	.admin-sidebar { display: flex; width: 17rem; flex-shrink: 0; flex-direction: column; background: var(--navy); color: #dbe7fb; padding: 1.5rem 1rem 1rem; }
	.admin-brand { display: flex; align-items: center; gap: .75rem; padding: .25rem .7rem 2.25rem; }.brand-mark { display: grid; place-items: center; width: 2.25rem; height: 2.25rem; border-radius: .65rem; background: #2d6cff; color: white; font-size: 1.25rem; font-weight: 900; }.admin-brand strong, .admin-brand span, .sidebar-footer strong, .sidebar-footer span { display: block; }.admin-brand strong { color: white; font-size: .8rem; letter-spacing: .12em; }.admin-brand span { margin-top: .2rem; color: #8da1c3; font-size: .65rem; }
	.sidebar-label { padding: 0 .75rem .7rem; color: #6e82a5; font-size: .6rem; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }nav { display: grid; flex: 1; min-height: 0; align-content: start; gap: .35rem; overflow-y: auto; overscroll-behavior: contain; scrollbar-color: #344968 transparent; scrollbar-width: thin; }nav a { display: flex; align-items: center; gap: .75rem; border-radius: .65rem; color: #9aacca; padding: .75rem; font-size: .72rem; font-weight: 700; line-height: 1.25; text-decoration: none; transition: background 150ms ease, color 150ms ease; }nav a:hover { background: #12274b; color: white; }nav a.active { background: #2563eb; color: white; box-shadow: 0 8px 16px rgba(37, 99, 235, .22); }.nav-icon { display: grid; place-items: center; width: 1.15rem; height: 1.15rem; flex-shrink: 0; }.nav-icon svg { width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; }
	.sidebar-footer { display: flex; align-items: center; gap: .6rem; margin-top: auto; border-top: 1px solid #1c3153; padding: 1rem .7rem .25rem; }.online-dot { width: .5rem; height: .5rem; border-radius: 50%; background: #42d392; box-shadow: 0 0 0 .2rem rgba(66, 211, 146, .12); }.sidebar-footer strong { color: #dbe7fb; font-size: .65rem; }.sidebar-footer span { margin-top: .15rem; color: #7086a9; font-size: .58rem; }.admin-content { min-width: 0; flex: 1; }.admin-mobile-bar { display: none; }
	.admin-route-content { animation: admin-route-appear 220ms ease-out both; }
	@keyframes admin-route-appear { from { transform: translateY(8px); } to { transform: translateY(0); } }
	@media (prefers-reduced-motion: reduce) { .admin-route-content { animation: none; } }
	:global(.admin-page) { max-width: 88rem; margin: 0 auto; padding: 2.25rem clamp(1rem, 3vw, 3rem) 3rem; }:global(.admin-eyebrow) { margin: 0 0 .5rem; color: #2563eb; font-size: .65rem; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }:global(.admin-title-row) { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; margin-bottom: 1.75rem; }:global(.admin-title) { margin: 0; color: #0c1d3b; font-size: clamp(1.45rem, 2.4vw, 2rem); font-weight: 900; letter-spacing: -.04em; }:global(.admin-subtitle) { margin: .45rem 0 0; color: var(--muted); font-size: .76rem; }:global(.admin-button) { border: 0; border-radius: .55rem; background: #2563eb; color: white; padding: .7rem 1rem; font: inherit; font-size: .7rem; font-weight: 800; cursor: pointer; }:global(.admin-button:hover) { background: #1d4ed8; }:global(.admin-button.secondary) { border: 1px solid var(--line); background: white; color: #395170; }
	.admin-sidebar { position: sticky; top: 0; align-self: flex-start; box-sizing: border-box; height: 100vh; min-height: 100vh; overflow: visible; transition: width 180ms ease, flex-basis 180ms ease, padding 180ms ease; }
	.sidebar-top { display: flex; align-items: center; justify-content: space-between; gap: .5rem; margin-bottom: 2.25rem; padding: .25rem .25rem 0 .7rem; }
	.admin-brand { min-width: 0; padding: 0; }
	.sidebar-toggle, .mobile-menu-button { display: grid; place-items: center; width: 2rem; height: 2rem; flex: 0 0 auto; border: 1px solid #263b5b; border-radius: .55rem; background: transparent; color: #b8c8dd; cursor: pointer; }
	.sidebar-toggle:hover, .mobile-menu-button:hover { background: #12274b; color: white; }
	.sidebar-toggle svg, .mobile-menu-button svg { width: 1.1rem; height: 1.1rem; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2; }
	.admin-sidebar nav a { min-width: 0; }
	.brand-copy, .sidebar-label, .nav-label, .sidebar-footer > div:last-child { overflow: hidden; opacity: 1; transform: translateX(0); transition: max-width 180ms ease, max-height 180ms ease, opacity 140ms ease, transform 180ms ease, padding 180ms ease; }
	.brand-copy, .nav-label, .sidebar-footer > div:last-child { max-width: 12rem; }
	.sidebar-label { max-height: 1.5rem; }
	.nav-label { min-width: 0; white-space: nowrap; }
	.admin-backdrop { display: none; }
	.mobile-menu-button { border-color: transparent; }
	:global(.admin-shell.collapsed) .admin-sidebar { width: 5rem; flex-basis: 5rem; padding-right: .65rem; padding-left: .65rem; }
	:global(.admin-shell.collapsed) .sidebar-top { flex-direction: column; gap: .75rem; margin-bottom: 1.5rem; padding: .25rem 0 0; }
	:global(.admin-shell.collapsed) .brand-copy, :global(.admin-shell.collapsed) .nav-label, :global(.admin-shell.collapsed) .sidebar-footer > div:last-child { max-width: 0; opacity: 0; transform: translateX(-.4rem); visibility: hidden; }
	:global(.admin-shell.collapsed) .sidebar-label { max-height: 0; padding-bottom: 0; opacity: 0; transform: translateX(-.4rem); visibility: hidden; }
	:global(.admin-shell.collapsed) .admin-brand { justify-content: center; }
	:global(.admin-shell.collapsed) .admin-sidebar nav a { justify-content: center; padding: .75rem 0; }
	:global(.admin-shell.collapsed) .sidebar-footer { justify-content: center; padding-right: 0; padding-left: 0; }
	:global(.admin-shell.collapsed) :global(.staff-logout) { justify-content: center; padding-right: 0; padding-left: 0; text-align: center; }
	:global(.admin-shell.collapsed) :global(.staff-logout span) { display: none; }
	:global(.admin-shell.collapsed) :global(.report-catalog) { display: none; }
	@media (min-width: 761px) { .mobile-menu-button { display: none; } }
	@media (max-width: 760px) {
		.admin-shell { display: block; position: relative; }
		.admin-sidebar { position: fixed; z-index: 40; top: 3.5rem; bottom: 0; left: 0; width: min(18rem, 88vw); height: auto; min-height: 0; padding: 1rem; transform: translateX(-100%); visibility: hidden; transition: transform 180ms ease, visibility 180ms ease; box-shadow: 12px 0 32px rgba(0, 0, 0, .28); }
		.admin-shell.mobile-open .admin-sidebar { transform: translateX(0); visibility: visible; }
		.admin-shell.collapsed .admin-sidebar { width: min(18rem, 88vw); flex-basis: auto; }
		.admin-shell.collapsed .brand-copy, .admin-shell.collapsed .nav-label, .admin-shell.collapsed .sidebar-footer > div:last-child { max-width: 12rem; opacity: 1; transform: translateX(0); visibility: visible; }
		.admin-shell.collapsed .sidebar-label { max-height: 1.5rem; padding-bottom: .7rem; opacity: 1; transform: translateX(0); visibility: visible; }
		.admin-shell.collapsed .sidebar-top { flex-direction: row; gap: .5rem; margin-bottom: 2.25rem; padding: .25rem .25rem 0 .7rem; }
		.admin-shell.collapsed .admin-brand { justify-content: flex-start; }
		.admin-shell.collapsed .admin-sidebar nav a { justify-content: flex-start; padding: .75rem; }
		.admin-shell.collapsed .sidebar-footer { justify-content: flex-start; padding: 1rem .7rem .25rem; }
		.admin-shell.collapsed :global(.staff-logout) { justify-content: flex-start; padding-right: .75rem; padding-left: .75rem; text-align: left; }
		.admin-shell.collapsed :global(.staff-logout span) { display: inline; }
		.admin-shell.collapsed :global(.report-catalog) { display: block; }
		.sidebar-toggle { display: none; }
		.admin-backdrop { position: fixed; z-index: 30; inset: 3.5rem 0 0; display: block; border: 0; background: rgba(4, 12, 26, .5); }
		.admin-mobile-bar { position: sticky; z-index: 29; top: 0; display: flex; height: 3.5rem; align-items: center; justify-content: space-between; background: var(--navy); color: white; padding: 0 .75rem; }
		.mobile-brand { font-size: .75rem; font-weight: 900; letter-spacing: .12em; }
		.mobile-status { color: #63e6a1; font-size: .58rem; font-weight: 800; letter-spacing: .12em; }
		:global(.admin-title-row) { align-items: flex-start; flex-direction: column; }
	}
</style>