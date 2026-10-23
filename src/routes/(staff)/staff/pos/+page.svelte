<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import StaffLogout from '$lib/components/StaffLogout.svelte';

	let loading = $state(true);
	let activeRegister = $state('All registers');
	let localTime = $state('');
	let timeOfDay = $state('morning');
	let today = $state(new Date());
	let notificationsOpen = $state(false);
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

	const sessions = [
		{
			initials: 'MS',
			cashier: 'Maria Santos',
			register: 'Register 01',
			status: 'Open',
			started: '08:02 AM',
			sales: '18,420',
			transactions: 64
		},
		{
			initials: 'JDC',
			cashier: 'John Dela Cruz',
			register: 'Register 02',
			status: 'Open',
			started: '08:16 AM',
			sales: '12,870',
			transactions: 42
		},
		{
			initials: 'AR',
			cashier: 'Anna Reyes',
			register: 'Register 03',
			status: 'Closed',
			started: '07:51 AM',
			sales: '9,440',
			transactions: 31
		}
	];
	const transactions = [
		{
			id: '#TX-10482',
			time: '10:42:18 AM',
			cashier: 'Maria Santos',
			register: 'Register 01',
			type: 'Sale',
			amount: '1,245.00',
			payment: 'GCash',
			state: 'Completed'
		},
		{
			id: '#TX-10481',
			time: '10:41:52 AM',
			cashier: 'John Dela Cruz',
			register: 'Register 02',
			type: 'Sale',
			amount: '380.00',
			payment: 'Cash',
			state: 'Completed'
		},
		{
			id: '#TX-10480',
			time: '10:39:07 AM',
			cashier: 'Maria Santos',
			register: 'Register 01',
			type: 'Void',
			amount: '75.00',
			payment: 'Cash',
			state: 'Approved'
		},
		{
			id: '#TX-10479',
			time: '10:36:44 AM',
			cashier: 'Anna Reyes',
			register: 'Register 03',
			type: 'Refund',
			amount: '420.00',
			payment: 'Card',
			state: 'Completed'
		}
	];
	let visibleTransactions = $derived(
		activeRegister === 'All registers'
			? transactions
			: transactions.filter((transaction) => transaction.register === activeRegister)
	);

	function exportTransactions() {
		const rows = [
			['Reference', 'Time', 'Cashier', 'Register', 'Type', 'Amount', 'Payment', 'Status'],
			...visibleTransactions.map((transaction) => [
				transaction.id,
				transaction.time,
				transaction.cashier,
				transaction.register,
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

<svelte:head>
	<title>POS Transaction Logs | QCU Coop Store</title>
</svelte:head>

<main class="cashier-shell">
	<aside class="cashier-sidebar">
		<a class="cashier-brand" href="/staff/pos"
			><span class="brand-mark">Q</span><span
				><strong>QCU COOP</strong><small>Cashier workspace</small></span
			></a
		>
		<p class="sidebar-label">Workspace</p>
		<nav aria-label="Cashier navigation">
			<a href="/staff/pos/register"
				><svg viewBox="0 0 24 24" aria-hidden="true"
					><path d="M3 5h18v14H3zM7 9h4m-4 4h2m4-4h4m-4 4h4" /><path d="M7 16h10" /></svg
				><span>Register</span></a
			>
			<a class="active" href="/staff/pos"
				><svg viewBox="0 0 24 24" aria-hidden="true"
					><path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z" /><path d="M8 8h8M8 12h8M8 16h4" /></svg
				><span>POS Transaction Logs</span></a
			>
			<a href="/staff/pos/sales"
				><svg viewBox="0 0 24 24" aria-hidden="true"
					><path d="M4 19V5M4 19h17" /><path d="m7 15 4-5 3 2 5-7" /></svg
				><span>Sales</span></a
			>
			<a href="/staff/pos/account"
				><svg viewBox="0 0 24 24" aria-hidden="true"
					><circle cx="12" cy="8" r="3.5" /><path
						d="M5 20c1.2-3.6 4.2-5.5 7-5.5s5.8 1.9 7 5.5"
					/></svg
				><span>Account</span></a
			>
		</nav>
		<StaffLogout />
	</aside>

	<section class="cashier-content">
		<header class="cashier-topbar">
			<div>
				<h1>POS Transaction Logs</h1>
				<p>Dashboard / Cashier operations overview</p>
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
							<span>3 exceptions need review.</span>
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
				<div class="skeleton-panel"></div>
				<div class="skeleton-panel activity"></div>
			</div>
		{:else}
			<div>
				<div class="cashier-title-row" in:fade={{ duration: 250 }}>
					<div class="cashier-title-copy">
						<p class="cashier-eyebrow">Operations overview</p>
						<h1 class="cashier-title">Good {timeOfDay}, Cashier</h1>
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
						<span>Open registers</span><strong>2 <small>/ 3</small></strong><em
							>All systems normal</em
						>
					</article>
					<article>
						<span>Sales today</span><strong>40,730</strong><em class="up">↑ 18.2% vs yesterday</em>
					</article>
					<article>
						<span>Transactions</span><strong>137</strong><em>12 since last hour</em>
					</article>
					<article>
						<span>Exceptions</span><strong class="exception">3</strong><em class="warn"
							>Requires review</em
						>
					</article>
				</div>

				<section class="panel" in:fade={{ duration: 250, delay: 80 }}>
					<div class="panel-heading">
						<div>
							<h2>Cashier sessions</h2>
							<p>Current register states and shift totals</p>
						</div>
						<span class="refresh-note"><i></i> Registers online</span>
					</div>
					<div class="session-grid">
						{#each sessions as session (session.register)}
							<article class="session-card">
								<div class="session-top">
									<span class="cashier-avatar">{session.initials}</span><span class="cashier-name"
										><strong>{session.cashier}</strong><small>{session.register}</small></span
									><b class:closed={session.status === 'Closed'}>{session.status}</b>
								</div>
								<div class="session-data">
									<span>Started<strong>{session.started}</strong></span><span
										>Transactions<strong>{session.transactions}</strong></span
									><span>Gross sales<strong>{session.sales}</strong></span>
								</div>
							</article>
						{/each}
					</div>
				</section>

				<section class="panel activity-panel" in:fade={{ duration: 250, delay: 120 }}>
					<div class="panel-heading">
						<div>
							<h2>Transaction activity</h2>
							<p>Recent transactions across registers</p>
						</div>
						<div class="table-actions">
							<label class="sr-only" for="register-filter">Filter by register</label><select
								id="register-filter"
								bind:value={activeRegister}
								><option>All registers</option><option>Register 01</option><option
									>Register 02</option
								><option>Register 03</option></select
							><button
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
									><th>Reference</th><th>Time</th><th>Cashier</th><th>Type</th><th>Amount</th><th
										>Payment</th
									><th>Status</th></tr
								></thead
							><tbody>
								{#each visibleTransactions as transaction (transaction.id)}
									<tr
										><td><strong>{transaction.id}</strong></td><td>{transaction.time}</td><td
											>{transaction.cashier}</td
										><td
											><span
												class="type"
												class:void={transaction.type === 'Void'}
												class:refund={transaction.type === 'Refund'}>{transaction.type}</span
											></td
										><td class="amount">{transaction.amount}</td><td>{transaction.payment}</td><td
											><span class="log-status">{transaction.state}</span></td
										></tr
									>
								{:else}
									<tr
										><td class="empty-row" colspan="7">No transactions on this register yet.</td
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
		width: 17rem;
		height: 100vh;
		flex: 0 0 17rem;
		flex-direction: column;
		background: var(--navy);
		padding: 1.5rem 1rem 1rem;
	}
	.cashier-brand {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.25rem 0.7rem 2.25rem;
		color: white;
		text-decoration: none;
	}
	.brand-mark {
		display: grid;
		width: 2.25rem;
		height: 2.25rem;
		place-items: center;
		border-radius: 0.65rem;
		background: #2d6cff;
		font-size: 1.1rem;
		font-weight: 900;
	}
	.cashier-brand strong,
	.cashier-brand small {
		display: block;
	}
	.cashier-brand strong {
		font-size: 0.8rem;
		letter-spacing: 0.12em;
	}
	.cashier-brand small {
		margin-top: 0.2rem;
		color: #8da1c3;
		font-size: 0.65rem;
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
	.cashier-sidebar nav {
		display: grid;
		gap: 0.35rem;
	}
	.cashier-sidebar nav a {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		border-radius: 0.65rem;
		color: #9aacca;
		padding: 0.75rem;
		font-size: 0.72rem;
		font-weight: 700;
		text-decoration: none;
	}
	.cashier-sidebar nav a.active {
		background: #2563eb;
		color: white;
		box-shadow: 0 8px 16px rgba(37, 99, 235, 0.22);
	}
	.cashier-sidebar nav svg {
		width: 1.15rem;
		height: 1.15rem;
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 1.8;
	}
	.cashier-sidebar :global(button) {
		margin-top: auto;
	}
	.cashier-content {
		display: flex;
		flex: 1;
		flex-direction: column;
		box-sizing: border-box;
		width: min(100%, 100rem);
		min-width: 0;
		margin: 0 auto;
		padding: 0 clamp(1rem, 2vw, 1.5rem);
	}
	.cashier-topbar {
		display: flex;
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
		font-size: clamp(2.4rem, 4vw, 4.25rem);
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
	.panel + .panel {
		margin-top: 0.85rem;
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
	.session-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.75rem;
		margin-top: 1.1rem;
	}
	.session-card {
		min-width: 0;
		border: 1px solid #e7edf4;
		border-radius: 0.6rem;
		padding: 0.85rem;
	}
	.session-top {
		display: flex;
		min-width: 0;
		align-items: center;
		gap: 0.6rem;
	}
	.cashier-avatar {
		display: grid;
		width: 2rem;
		height: 2rem;
		flex: 0 0 2rem;
		place-items: center;
		border-radius: 50%;
		background: #dbeafe;
		color: #2563eb;
		font-size: 0.62rem;
		font-weight: 900;
	}
	.cashier-name {
		min-width: 0;
	}
	.cashier-name strong,
	.cashier-name small {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.cashier-name strong {
		color: #29405f;
		font-size: 0.68rem;
	}
	.cashier-name small {
		margin-top: 0.2rem;
		color: #8a99ab;
		font-size: 0.57rem;
	}
	.session-top > b {
		margin-left: auto;
		border-radius: 1rem;
		background: #e5f8ee;
		color: #168251;
		padding: 0.28rem 0.5rem;
		font-size: 0.56rem;
	}
	.session-top > b.closed {
		background: #f1f3f6;
		color: #8291a4;
	}
	.session-data {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.7rem;
		margin-top: 1rem;
		border-top: 1px solid #edf1f5;
		padding-top: 0.8rem;
	}
	.session-data span {
		color: #8291a4;
		font-size: 0.58rem;
	}
	.session-data strong {
		display: block;
		margin-top: 0.3rem;
		color: #29405f;
		font-size: 0.67rem;
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
		min-width: 42rem;
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
	:global(html[data-theme='dark'] .session-card) {
		border-color: #415878;
		background: #101d35;
	}
	:global(html[data-theme='dark'] .cashier-title),
	:global(html[data-theme='dark'] .panel h2),
	:global(html[data-theme='dark'] .kpi-grid strong),
	:global(html[data-theme='dark'] .session-data strong),
	:global(html[data-theme='dark'] td strong) {
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .cashier-subtitle),
	:global(html[data-theme='dark'] .panel-heading p),
	:global(html[data-theme='dark'] .kpi-grid span),
	:global(html[data-theme='dark'] .kpi-grid em:not(.up):not(.warn)),
	:global(html[data-theme='dark'] .session-data span),
	:global(html[data-theme='dark'] .cashier-name small),
	:global(html[data-theme='dark'] td) {
		color: #b8c8dd;
	}
	:global(html[data-theme='dark'] .cashier-name strong) {
		color: #edf4ff;
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
	:global(html[data-theme='dark'] .session-data) {
		border-color: #334866;
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
	:global(html[data-theme='dark'] .session-top > b.closed) {
		background: #263b59;
		color: #b8c8dd;
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
		.session-grid {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 680px) {
		.cashier-shell {
			display: block;
		}
		.cashier-sidebar {
			position: static;
			width: auto;
			height: auto;
			padding: 0.85rem 1rem;
		}
		.cashier-brand {
			padding: 0 0 0.8rem;
		}
		.sidebar-label {
			display: none;
		}
		.cashier-sidebar nav a {
			padding: 0.55rem 0.7rem;
		}
		.cashier-sidebar :global(button) {
			position: absolute;
			top: 0.85rem;
			right: 1rem;
			width: auto;
			margin: 0;
			padding: 0.55rem 0.7rem;
		}
		.cashier-content {
			padding-top: 0;
		}
		.cashier-title-row {
			flex-direction: column;
		}
		.live-clock {
			align-self: flex-end;
		}
		.panel-heading {
			align-items: flex-start;
			flex-direction: column;
		}
	}
	@media (max-width: 420px) {
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
