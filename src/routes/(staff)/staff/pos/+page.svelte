<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import CashierNavigation from '$lib/components/CashierNavigation.svelte';
	import CashierSidebarHeader from '$lib/components/CashierSidebarHeader.svelte';
	import StaffLogout from '$lib/components/StaffLogout.svelte';

	const cashierSidebar = getContext<{ collapsed: boolean }>('cashierSidebar');
	let { data } = $props();
	let loading = $state(true);
	let localTime = $state('');
	let timeOfDay = $state('morning');
	let today = $state(new Date());
	let notificationsOpen = $state(false);
	let mobileSidebarOpen = $state(false);
	const monthLabel = $derived(
		new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(today)
	);

	onMount(() => {
		function updateClock() {
			const now = new Date();
			const hour = now.getHours();

			today = now;
			timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
			localTime = now.toLocaleTimeString(undefined, {
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit'
			});
		}

		updateClock();
		const interval = setInterval(updateClock, 1000);
		loading = false;
		return () => clearInterval(interval);
	});

	const visibleTransactions = $derived(data.transactions);

	function exportTransactions() {
		const rows = [
			['Reference', 'Time', 'Cashier', 'Customer', 'Type', 'Amount', 'Payment', 'Status'],
			...visibleTransactions.map((transaction) => [
				transaction.id,
				transaction.time,
				transaction.cashier,
				transaction.customer,
				transaction.type,
				transaction.amount,
				transaction.payment,
				transaction.state
			])
		];
		const csv = rows
			.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(','))
			.join('\r\n');
		const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
		const link = document.createElement('a');
		link.href = url;
		link.download = 'pos-transactions.csv';
		link.click();
		URL.revokeObjectURL(url);
	}
</script>

<svelte:window
	onkeydown={(event) => {
		if (event.key === 'Escape') mobileSidebarOpen = false;
	}}
/>

<svelte:head>
	<title>POS Transaction Logs | QCU Coop Store</title>
</svelte:head>

<main class="cashier-shell" class:collapsed={cashierSidebar.collapsed} class:mobile-open={mobileSidebarOpen}>
	<aside class="cashier-sidebar" id="cashier-sidebar" aria-label="Cashier workspace sidebar">
		<CashierSidebarHeader
			collapsed={cashierSidebar.collapsed}
		/>
		<p class="sidebar-label">Workspace</p>
		<CashierNavigation
			collapsed={cashierSidebar.collapsed}
			onNavigate={() => (mobileSidebarOpen = false)}
		/>
		<StaffLogout />
	</aside>
	{#if mobileSidebarOpen}
		<button
			class="cashier-sidebar-backdrop"
			type="button"
			aria-label="Close navigation"
			onclick={() => (mobileSidebarOpen = false)}
		></button>
	{/if}

	<section class="cashier-content">
		<header class="cashier-topbar">
			<div class="cashier-heading">
				<button
					class="cashier-mobile-menu-button"
					type="button"
					aria-label={mobileSidebarOpen ? 'Close navigation' : 'Open navigation'}
					aria-expanded={mobileSidebarOpen}
					aria-controls="cashier-sidebar"
					onclick={() => (mobileSidebarOpen = !mobileSidebarOpen)}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<path d={mobileSidebarOpen ? 'm6 6 12 12M18 6 6 18' : 'M4 7h16M4 12h16M4 17h16'} />
					</svg>
				</button>
				<div class="cashier-heading-copy">
					<h1>POS Transaction Logs</h1>
					<p>Dashboard / Cashier operations overview</p>
				</div>
			</div>
			<div class="topbar-actions">
				<span class="date-chip">
					<svg viewBox="0 0 24 24" aria-hidden="true"
						><rect x="3.5" y="5" width="17" height="15" rx="2" /><path
							d="M7.5 3v4M16.5 3v4M3.5 9h17"
						/></svg
					>
					{monthLabel}
				</span>
				<div class="notification-wrap">
					<button
						class="icon-button"
						type="button"
						aria-label="Notifications"
						aria-expanded={notificationsOpen}
						onclick={() => (notificationsOpen = !notificationsOpen)}
					>
						<svg viewBox="0 0 24 24" aria-hidden="true"
							><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg
						>
					</button>
					{#if notificationsOpen}
						<div class="notification-popover" role="status">
							<strong>Cashier alerts</strong>
							<span>{data.exceptions} unresolved stock alerts.</span>
						</div>
					{/if}
				</div>
				<button class="topbar-avatar" type="button" aria-label="Cashier account">QC</button>
			</div>
		</header>
		{#if loading}
			<div class="cashier-skeleton" aria-label="Loading cashier dashboard" aria-busy="true">
				<div class="skeleton-header"></div>
				<div class="skeleton-kpis">
					{#each [1, 2, 3, 4] as item (item)}<div class="skeleton-block"></div>{/each}
				</div>
				<div class="skeleton-panel activity"></div>
			</div>
		{:else}
			<div>
				<div class="cashier-title-row" in:fade={{ duration: 250 }}>
					<div class="cashier-title-copy">
						<p class="cashier-eyebrow">Operations overview</p>
						<h1 class="cashier-title">Good {timeOfDay}, {data.cashierName}</h1>
						<p class="cashier-subtitle">Here is what is happening across the store today.</p>
					</div>
					<div class="live-clock" aria-label="Local system time">
						<span class="live-clock-label">Local time</span>
						<time>{localTime || '--:--:-- --'}</time>
						<span class="live-indicator"><i></i> Live</span>
					</div>
				</div>
				<div class="kpi-grid" in:fade={{ duration: 250, delay: 40 }}>
					<article>
						<span>Open registers</span><strong>{data.openRegisters} <small>/ {data.registerCount}</small></strong><em
							>Active cashier sessions</em
						>
					</article>
					<article>
						<span>Sales today</span><strong>₱{data.salesToday.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong><em class="up">{data.yesterdaySales ? `${((data.salesToday - data.yesterdaySales) / data.yesterdaySales * 100).toFixed(1)}% vs yesterday` : 'Cash sales today'}</em>
					</article>
					<article>
						<span>Transactions</span><strong>{data.transactionsToday}</strong><em>{data.recentHour} since last hour</em>
					</article>
					<article>
						<span>Open stock alerts</span><strong class="exception">{data.exceptions}</strong><em class="warn"
							>Requires review</em
						>
					</article>
				</div>

				<section class="panel activity-panel" in:fade={{ duration: 250, delay: 120 }}>
					<div class="panel-heading">
						<div>
							<h2>Transaction activity</h2>
							<p>Recent POS sales and pickup-order checkouts</p>
							{#if !data.pickupOrderLinkAvailable}
								<p class="schema-note">Pickup-order labels require Supabase migration 202611250008_reserve_customer_order_stock.sql.</p>
							{/if}
						</div>
						<div class="table-actions">
							<span class="log-status">{visibleTransactions.length} recent</span><button
								class="export-button"
								type="button"
								aria-label="Export transaction logs"
								title="Export transaction logs"
								onclick={exportTransactions}
								><svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									aria-hidden="true"
									><path d="M12 3v12m0 0 4-4m-4 4-4-4" /><path d="M5 17v4h14v-4" /></svg
								></button
							>
						</div>
					</div>
					<div class="table-wrap">
						<table>
							<thead
								><tr
									><th>Reference</th><th>Time</th><th>Cashier</th><th>Customer</th><th>Type</th><th>Amount</th><th
										>Payment</th
									><th>Status</th></tr
								></thead
							><tbody>
								{#each visibleTransactions as transaction (transaction.id)}
									<tr
										><td><strong>{transaction.id}</strong></td><td>{transaction.time}</td><td
											>{transaction.cashier}</td
										><td>{transaction.customer}</td
										><td
											><span
												class="type"
												class:void={transaction.type === 'Void'}
												class:refund={transaction.type === 'Refund'}
												class:pickup={transaction.type === 'Pickup order'}>{transaction.type}</span
											></td
										><td class="amount">{transaction.amount}</td><td>{transaction.payment}</td><td
											><span class="log-status">{transaction.state}</span></td
										></tr
									>
								{:else}
									<tr
										><td class="empty-row" colspan="8">No saved sales for this cashier yet.</td
										></tr
									>
								{/each}
							</tbody>
						</table>
					</div>
				</section>
			</div>
		{/if}
		<footer class="cashier-footer">
			<span>© {today.getFullYear()} QCU Coop Store · Admin Portal</span>
			<span>Member pricing and patronage benefits are subject to cooperative policy.</span>
			<span><a href="/about">Privacy</a><a href="/about">Support</a></span>
		</footer>
	</section>
</main>

<style>
	.cashier-shell {
		--navy: #07152d;
		--ink: #172b4d;
		--muted: #8291a4;
		--line: #e4eaf2;
		display: flex;
		min-height: 100vh;
		background: #f3f6fa;
		color: var(--ink);
		font-family: 'Montserrat', sans-serif;
	}
	.cashier-sidebar {
		position: sticky;
		top: 0;
		display: flex;
		box-sizing: border-box;
		width: 17rem;
		height: 100vh;
		flex: 0 0 17rem;
		flex-direction: column;
		background: var(--navy);
		padding: 1.5rem 1rem 1rem;
		transition:
			width 180ms ease,
			flex-basis 180ms ease,
			padding 180ms ease;
	}
	.sidebar-label {
		margin: 0;
		padding: 0 0.75rem 0.7rem;
		color: #6e82a5;
		font-size: 0.6rem;
		font-weight: 800;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}
	.cashier-sidebar :global(.staff-logout) {
		margin-top: auto;
	}
	.cashier-content {
		display: flex;
		flex: 1;
		flex-direction: column;
		box-sizing: border-box;
		width: 100%;
		max-width: 100rem;
		min-width: 0;
		margin: 0 auto;
		padding: 0 clamp(1rem, 2vw, 1.5rem);
	}
	.cashier-topbar {
		display: flex;
		box-sizing: border-box;
		align-items: center;
		justify-content: space-between;
		min-height: 3.7rem;
		margin: 0 calc(clamp(1rem, 2vw, 1.5rem) * -1) 0.9rem;
		border-bottom: 1px solid #e5e9ef;
		background: white;
		padding: 0.45rem clamp(1rem, 2vw, 1.5rem);
	}
	.cashier-topbar h1 {
		margin: 0;
		color: #172b4d;
		font-size: 0.83rem;
		font-weight: 900;
	}
	.cashier-topbar p {
		margin: 0.12rem 0 0;
		color: #7f8a9b;
		font-size: 0.58rem;
	}
	.cashier-heading {
		display: flex;
		min-width: 0;
		align-items: center;
		gap: 0.65rem;
	}
	.cashier-heading-copy {
		min-width: 0;
	}
	.cashier-mobile-menu-button,
	.cashier-sidebar-backdrop {
		display: none;
	}
	.cashier-mobile-menu-button {
		flex: 0 0 2.75rem;
		width: 2.75rem;
		height: 2.75rem;
		place-items: center;
		border: 1px solid #e2e8f0;
		border-radius: 0.65rem;
		background: white;
		color: #53647a;
		cursor: pointer;
	}
	.cashier-mobile-menu-button svg {
		width: 1.2rem;
		height: 1.2rem;
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 2;
	}
	.topbar-actions {
		display: flex;
		align-items: center;
		gap: 0.45rem;
	}
	.date-chip {
		display: flex;
		align-items: center;
		gap: 0.38rem;
		border: 1px solid #e2e6ec;
		border-radius: 0.45rem;
		background: #f8f9fb;
		color: #778397;
		padding: 0.4rem 0.55rem;
		font-size: 0.56rem;
	}
	.date-chip svg,
	.icon-button svg {
		width: 0.8rem;
		height: 0.8rem;
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 1.8;
	}
	.icon-button,
	.topbar-avatar {
		display: grid;
		width: 1.9rem;
		height: 1.9rem;
		place-items: center;
		border: 1px solid #e3e8ef;
		border-radius: 50%;
		background: white;
		color: #6d7c91;
		cursor: pointer;
	}
	.topbar-avatar {
		border: 0;
		background: #2563eb;
		color: white;
		font-size: 0.55rem;
		font-weight: 900;
	}
	.notification-wrap {
		position: relative;
	}
	.notification-popover {
		position: absolute;
		z-index: 5;
		top: calc(100% + 0.55rem);
		right: 0;
		display: grid;
		width: 12rem;
		gap: 0.25rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.6rem;
		background: white;
		box-shadow: 0 12px 30px #182b471c;
		padding: 0.75rem;
	}
	.notification-popover strong {
		color: #1d2c47;
		font-size: 0.62rem;
	}
	.notification-popover span {
		color: #8490a2;
		font-size: 0.56rem;
	}
	.cashier-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		min-height: 2.8rem;
		margin: auto calc(clamp(1rem, 2vw, 1.5rem) * -1) 0;
		border-top: 1px solid #e5e9ef;
		background: white;
		padding: 0.5rem clamp(1rem, 2vw, 1.5rem);
		color: #8490a1;
		font-size: 0.48rem;
	}
	.cashier-footer > span:last-child {
		display: flex;
		gap: 0.8rem;
	}
	.cashier-footer a {
		color: #1356dd;
		text-decoration: none;
	}
	.cashier-skeleton {
		min-height: 42rem;
	}
	.skeleton-header,
	.skeleton-block,
	.skeleton-panel {
		border-radius: 0.75rem;
		background: linear-gradient(90deg, #e8edf4 25%, #f3f6fa 50%, #e8edf4 75%);
		background-size: 200% 100%;
		animation: cashier-skeleton-shimmer 1.2s ease-in-out infinite;
	}
	.skeleton-header {
		width: min(100%, 40rem);
		height: 7rem;
		margin-bottom: 2rem;
	}
	.skeleton-kpis {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.85rem;
		margin-bottom: 1.25rem;
	}
	.skeleton-block {
		min-height: 5rem;
	}
	.skeleton-panel {
		min-height: 11rem;
		margin-bottom: 0.85rem;
	}
	.skeleton-panel.activity {
		min-height: 19rem;
	}
	@keyframes cashier-skeleton-shimmer {
		to {
			background-position: -200% 0;
		}
	}
	.cashier-title-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1.25rem;
		margin-bottom: 2rem;
	}
	.cashier-title-copy {
		flex: 1;
		min-width: 0;
	}
	.live-clock {
		display: grid;
		flex: 0 0 auto;
		justify-items: end;
		gap: 0.2rem;
		border: 1px solid #e1e8f2;
		border-radius: 0.7rem;
		background: rgba(255, 255, 255, 0.8);
		padding: 0.7rem 0.9rem;
	}
	.live-clock-label {
		color: #8291a4;
		font-size: 0.58rem;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	.live-clock time {
		color: #13284b;
		font-size: 1rem;
		font-variant-numeric: tabular-nums;
		font-weight: 900;
	}
	.live-indicator {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		color: #168251;
		font-size: 0.58rem;
		font-weight: 800;
	}
	.live-indicator i {
		width: 0.4rem;
		height: 0.4rem;
		border-radius: 50%;
		background: #20b978;
	}
	.cashier-eyebrow {
		margin: 0 0 0.55rem;
		color: #2563eb;
		font-size: 0.68rem;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	.cashier-title {
		margin: 0;
		color: #091b35;
		font-size: clamp(1.75rem, 3vw, 2.75rem);
		letter-spacing: -0.06em;
		line-height: 0.96;
		font-weight: 900;
	}
	.cashier-subtitle {
		margin: 0.45rem 0 0;
		color: #71809a;
		font-size: 1rem;
	}
	.kpi-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.85rem;
		margin-bottom: 1.25rem;
	}
	.kpi-grid article,
	.panel {
		border: 1px solid var(--line);
		border-radius: 0.75rem;
		background: white;
	}
	.kpi-grid article {
		padding: 1rem 1.1rem;
	}
	.kpi-grid span,
	.kpi-grid em {
		display: block;
		color: var(--muted);
		font-size: 0.61rem;
		font-style: normal;
	}
	.kpi-grid strong {
		display: block;
		margin: 0.45rem 0 0.25rem;
		color: var(--ink);
		font-size: 1.3rem;
	}
	.kpi-grid strong small {
		color: #8796a8;
		font-size: 0.7rem;
	}
	.kpi-grid .up {
		color: #168251;
	}
	.kpi-grid .warn,
	.kpi-grid .exception {
		color: #d4771a;
	}
	.panel {
		padding: 1.25rem;
		box-shadow: 0 8px 24px rgba(32, 55, 88, 0.04);
	}
	.panel-heading {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
	}
	.panel h2 {
		margin: 0;
		color: var(--ink);
		font-size: 0.9rem;
		font-weight: 900;
	}
	.panel-heading p {
		margin: 0.3rem 0 0;
		color: #8b99ab;
		font-size: 0.65rem;
	}
	.panel-heading .schema-note {
		color: #b45309;
	}
	.table-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.table-actions select,
	.export-button {
		min-height: 2.5rem;
		border: 1px solid #dfe6ef;
		border-radius: 0.5rem;
		background: white;
		color: #53647c;
	}
	.table-actions select {
		padding: 0 0.65rem;
		font: inherit;
		font-size: 0.63rem;
	}
	.export-button {
		display: grid;
		width: 2.5rem;
		place-items: center;
		cursor: pointer;
	}
	.export-button:hover {
		background: #f8fafc;
	}
	.export-button svg {
		width: 1rem;
		height: 1rem;
	}
	.table-wrap {
		overflow-x: auto;
		margin-top: 1rem;
	}
	table {
		width: 100%;
		min-width: 48rem;
		border-collapse: collapse;
		text-align: left;
	}
	th {
		background: #f8fafc;
		color: #8997a9;
		font-size: 0.57rem;
		font-weight: 800;
		text-transform: uppercase;
	}
	th,
	td {
		border-bottom: 1px solid #edf1f5;
		padding: 0.75rem 1rem;
	}
	td {
		color: #687991;
		font-size: 0.65rem;
	}
	td strong {
		color: #233a5d;
	}
	td.amount {
		color: #233a5d;
		font-weight: 800;
	}
	.type,
	.log-status {
		display: inline-block;
		border-radius: 1rem;
		background: #e5f8ee;
		color: #168251;
		padding: 0.25rem 0.5rem;
		font-size: 0.56rem;
		font-weight: 800;
	}
	.type.void {
		background: #fff2d9;
		color: #bd7311;
	}
	.type.refund {
		background: #fef0f0;
		color: #c2414a;
	}
	.type.pickup {
		background: #eaf2ff;
		color: #2563eb;
	}
	.empty-row {
		padding: 2rem;
		text-align: center;
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
	:global(html[data-theme='dark'] .cashier-shell) {
		background: #101d35;
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .kpi-grid article),
	:global(html[data-theme='dark'] .panel) {
		border-color: #334866;
		background: #172640;
	}
	:global(html[data-theme='dark'] .cashier-title),
	:global(html[data-theme='dark'] .panel h2),
	:global(html[data-theme='dark'] .kpi-grid strong),
	:global(html[data-theme='dark'] td strong) {
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .cashier-subtitle),
	:global(html[data-theme='dark'] .panel-heading p),
	:global(html[data-theme='dark'] .kpi-grid span),
	:global(html[data-theme='dark'] .kpi-grid em:not(.up):not(.warn)),
	:global(html[data-theme='dark'] td) {
		color: #b8c8dd;
	}
	:global(html[data-theme='dark'] .panel-heading .schema-note) {
		color: #f4c85b;
	}
	:global(html[data-theme='dark'] .live-clock) {
		border-color: #334866;
		background: #172640;
	}
	:global(html[data-theme='dark'] .live-clock-label) {
		color: #b8c8dd;
	}
	:global(html[data-theme='dark'] .live-clock time) {
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .table-actions select),
	:global(html[data-theme='dark'] .export-button) {
		border-color: #415878;
		background: #101d35;
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .export-button:hover) {
		background: #223957;
	}
	:global(html[data-theme='dark'] th) {
		border-color: #334866;
		background: #101d35;
		color: #b8c8dd;
	}
	:global(html[data-theme='dark'] td) {
		border-color: #334866;
	}
	:global(html[data-theme='dark'] td.amount) {
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .cashier-topbar),
	:global(html[data-theme='dark'] .cashier-footer),
	:global(html[data-theme='dark'] .notification-popover) {
		border-color: #334866;
		background: #172640;
	}
	:global(html[data-theme='dark'] .cashier-topbar h1),
	:global(html[data-theme='dark'] .notification-popover strong) {
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .icon-button) {
		border-color: #415878;
		background: #172640;
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .date-chip) {
		border-color: #415878;
		background: #101d35;
		color: #c4d2e5;
	}
	@media (prefers-reduced-motion: reduce) {
		.skeleton-header,
		.skeleton-block,
		.skeleton-panel {
			animation: none;
		}
	}
	@media (max-width: 980px) {
		.cashier-sidebar {
			width: 14rem;
			flex-basis: 14rem;
		}
		.kpi-grid,
		.skeleton-kpis {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (max-width: 760px) {
		.cashier-shell {
			display: block;
			position: relative;
		}
		.cashier-sidebar {
			position: fixed;
			z-index: 40;
			inset: 0 auto 0 0;
			box-sizing: border-box;
			width: min(18rem, 88vw);
			height: 100dvh;
			flex: 0 0 auto;
			overflow: hidden;
			padding: max(1rem, env(safe-area-inset-top)) 1rem max(1rem, env(safe-area-inset-bottom));
			transform: translateX(-100%);
			visibility: hidden;
			transition: transform 180ms ease, visibility 180ms ease;
			box-shadow: 12px 0 32px rgba(0, 0, 0, 0.28);
		}
		.cashier-shell.mobile-open .cashier-sidebar {
			transform: translateX(0);
			visibility: visible;
		}
		.cashier-sidebar-backdrop {
			position: fixed;
			z-index: 30;
			inset: 0;
			display: block;
			border: 0;
			background: rgba(4, 12, 26, 0.5);
		}
		.cashier-mobile-menu-button {
			display: grid;
		}
		:global(.cashier-content button.icon-button),
		:global(.cashier-content button.topbar-avatar) {
			box-sizing: border-box;
			width: 2.75rem;
			height: 2.75rem;
			min-width: 2.75rem;
			min-height: 2.75rem;
			flex: 0 0 2.75rem;
			aspect-ratio: 1;
			border-radius: 50%;
		}
		:global(html[data-theme='dark'] .cashier-mobile-menu-button) {
			border-color: #415878;
			background: #172640;
			color: #edf4ff;
		}
		.cashier-content {
			padding-top: 0;
		}
	}
	@media (max-width: 680px) {
		.cashier-title-row {
			flex-direction: column;
		}
		.live-clock {
			align-self: flex-start;
		}
		.panel-heading {
			align-items: flex-start;
			flex-direction: column;
		}
	}
	@media (max-width: 420px) {
		.cashier-topbar {
			align-items: flex-start;
			flex-wrap: wrap;
		}
		.cashier-heading {
			flex: 1 1 11rem;
		}
		.topbar-actions {
			margin-left: auto;
		}
		.date-chip {
			font-size: 0;
		}
		.date-chip svg {
			width: 0.95rem;
			height: 0.95rem;
		}
		.kpi-grid {
			grid-template-columns: 1fr;
		}
		.cashier-footer {
			align-items: flex-start;
			flex-direction: column;
			gap: 0.35rem;
			padding-top: 0.65rem;
			padding-bottom: 0.65rem;
		}
		.table-actions {
			width: 100%;
		}
		.table-actions select {
			flex: 1;
		}
	}
</style>
