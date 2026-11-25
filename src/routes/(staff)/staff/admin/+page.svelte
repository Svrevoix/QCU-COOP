<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	let localTime = $state('');
	let timeOfDay = $state('morning');
	let today = $state(new Date());
	let notificationsOpen = $state(false);
	const dashboard = $derived(page.data.dashboard);
	const notificationCount = $derived((dashboard.lowStockCount > 0 ? 1 : 0) + (dashboard.outstandingBalance > 0 ? 1 : 0));
	const monthLabel = $derived(dashboard.currentMonthLabel);
	const dateLabel = $derived(new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(today));
	const salesPeriod = $derived.by(() => {
		const start = new Date(today);
		start.setDate(start.getDate() - 6);
		const format = new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit' });
		return `${format.format(start)} – ${format.format(today)}`;
	});
	const salesChangeLabel = $derived(dashboard.salesChange === null ? 'No prior-month comparison' : `${dashboard.salesChange >= 0 ? '↑' : '↓'} ${Math.abs(dashboard.salesChange).toFixed(1)}% vs last month`);
	const weekChangeLabel = $derived(dashboard.weekChange === null ? 'No prior-week comparison' : `${dashboard.weekChange >= 0 ? '↑' : '↓'} ${Math.abs(dashboard.weekChange).toFixed(1)}% vs last week`);
	const chartCeiling = $derived(Math.max(...dashboard.salesTrend.map((day) => day.amount), 0));
	const formatCurrency = (value: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);

	onMount(() => {
		function updateClock() {
			const now = new Date();
			const hour = now.getHours();
			timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
			localTime = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
			today = now;
		}
		updateClock();
		const interval = setInterval(updateClock, 1000);
		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>Dashboard | QCU Coop Store</title>
	<meta name="description" content="Live operations overview for the QCU Cooperative Store." />
</svelte:head>

<main class="admin-page dashboard-page">
	<header class="dashboard-topbar">
		<div>
			<h1>Dashboard</h1>
			<p>Dashboard / Operations overview</p>
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
					class="icon-button notification-bell"
					type="button"
					aria-label="Open dashboard notifications"
					aria-haspopup="true"
					aria-expanded={notificationsOpen}
					onclick={() => (notificationsOpen = !notificationsOpen)}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true"
						><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg
					>
					{#if notificationCount > 0}<span class="notification-badge">{notificationCount > 99 ? '99+' : notificationCount}</span>{/if}
				</button>
				{#if notificationsOpen}
					<div class="notification-popover" role="region" aria-label="Dashboard notifications">
						<div class="notification-heading"><div><span class="notification-eyebrow">Updates</span><strong>Notifications</strong></div><span class="notification-count">{notificationCount} {notificationCount === 1 ? 'alert' : 'alerts'}</span></div>
						{#if notificationCount > 0}
							<div class="notification-list">
								{#if dashboard.lowStockCount > 0}
									<div class="notification-item warning"><span class="notification-symbol">!</span><div><strong>Stock needs attention</strong><p>{dashboard.lowStockCount} {dashboard.lowStockCount === 1 ? 'item is' : 'items are'} at or below the reorder point.</p><a href="/staff/admin/inventory">Review inventory <span aria-hidden="true">→</span></a></div></div>
								{/if}
								{#if dashboard.outstandingBalance > 0}
									<div class="notification-item bill"><span class="notification-symbol">₱</span><div><strong>Utility bills outstanding</strong><p>{formatCurrency(dashboard.outstandingBalance)} remains unpaid.</p><a href="/staff/admin/utilities">Review utilities <span aria-hidden="true">→</span></a></div></div>
								{/if}
							</div>
						{:else}
							<div class="notification-empty"><span class="notification-check" aria-hidden="true">✓</span><strong>You’re all caught up</strong><p>There are no stock or utility alerts right now.</p></div>
						{/if}
						<div class="notification-footer">Based on the latest dashboard data</div>
					</div>
				{/if}
			</div>
			<button class="avatar" type="button" aria-label="Administrator account">QC</button>
		</div>
	</header>

		<section class="welcome-card" aria-label="Operations overview">
			<div class="welcome-icon" aria-hidden="true"></div>
			<div class="welcome-copy">
				<p class="welcome-eyebrow">Operations overview</p>
				<h2>Good {timeOfDay}, {page.data.userName}</h2>
				<p>Here is what is happening across the cooperative store today.</p>
			</div>
			<div class="live-clock" aria-label={`Local system time ${localTime}`}>
				<span class="live-clock-label">{dateLabel} · Local time</span>
				<time>{localTime || '--:--:-- --'}</time>
				<span class="live-indicator"><i></i> Live</span>
			</div>
			<a class="reports-button" href="/staff/admin/reports">
				<svg viewBox="0 0 24 24" aria-hidden="true"
					><path d="M14 4h6v6M20 4l-9 9" /><path
						d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"
					/></svg
				>
				View reports
			</a>
		</section>

		{#if dashboard.failedTables.length}
			<p class="dashboard-data-notice" role="status">Some dashboard data is unavailable right now. Check database access for: {dashboard.failedTables.join(', ')}.</p>
		{/if}

		<section class="dashboard-stats" aria-label="Operations metrics">
			<article>
				<span>Gross sales · {monthLabel}</span><strong>{formatCurrency(dashboard.grossSales)}</strong><small class:positive={dashboard.salesChange === null || dashboard.salesChange >= 0} class:warning={dashboard.salesChange !== null && dashboard.salesChange < 0}
					>{salesChangeLabel}</small
				>
			</article>
			<article>
				<span>Units moved this month</span><strong>{dashboard.unitsMoved.toLocaleString()}</strong><small
					>From recorded sales</small
				>
			</article>
			<article>
				<span>Low stock items</span><strong class="warning">{dashboard.lowStockCount}</strong><small class="warning"
					>At or below reorder level</small
				>
			</article>
			<article>
				<span>No sales in 30 days</span><strong class="muted">{dashboard.nonSellingCount}</strong><small
					>Active catalog items</small
				>
			</article>
		</section>

		<div class="dashboard-columns">
			<div class="main-column">
				<section class="dashboard-card transactions-card">
					<div class="card-heading">
						<div>
							<h2>Recent sales</h2>
							<p>Latest recorded sale items</p>
						</div>
						<a class="compact-button" href="/staff/admin/reports">
							<svg viewBox="0 0 24 24" aria-hidden="true"
								><path d="M14 4h6v6M20 4l-9 9" /><path
									d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"
								/></svg
							>
							View reports
						</a>
					</div>
					<div class="table-wrap">
						<table>
							<thead
								><tr><th>Item / description</th><th>Category</th><th>Qty</th><th>Amount</th></tr
								></thead
							>
							<tbody>
							{#each dashboard.recentTransactions as transaction (`${transaction.reference}-${transaction.item}-${transaction.date}`)}
									<tr>
										<td
										><strong>{transaction.item}</strong><small>{transaction.reference} · {transaction.date}</small></td
										>
										<td>{transaction.category}</td>
										<td>{transaction.quantity}</td>
									<td class="amount">{formatCurrency(transaction.amount)}</td>
									</tr>
							{:else}
								<tr><td colspan="4" class="dashboard-empty">No sales have been recorded yet.</td></tr>
								{/each}
							</tbody>
						</table>
					</div>
					<a class="card-link" href="/staff/admin/reports"
						>View transaction reports <span aria-hidden="true">→</span></a
					>
				</section>

				<nav class="quick-links" aria-label="Admin workspace">
					<a href="/staff/admin/inventory"
						><span class="quick-icon blue-icon" aria-hidden="true">▤</span><span
							><strong>Inventory Management</strong><small
								>Review stock, purchasing, and item records</small
							></span
						></a
					>
					<a href="/staff/admin/reports"
						><span class="quick-icon violet-icon" aria-hidden="true">⌁</span><span
							><strong>Reports Engine</strong><small>Review sales and cooperative performance</small
							></span
						></a
					>
					<a href="/staff/admin/utilities"
						><span class="quick-icon amber-icon" aria-hidden="true">⌁</span><span
							><strong>Utilities</strong><small>Review utility accounts and bills</small
							></span
						></a
					>
				</nav>

				<section class="dashboard-card sales-card">
					<div class="card-heading">
						<div>
							<h2>Sales trend</h2>
							<p>Last 7 days · {salesPeriod}</p>
						</div>
						<a class="compact-button" href="/staff/admin/reports">
							<svg viewBox="0 0 24 24" aria-hidden="true"
								><path d="M14 4h6v6M20 4l-9 9" /><path
									d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"
								/></svg
							>
							View reports
						</a>
					</div>
					<div class="sales-summary">
						<div><span>Current 7 days</span><strong>{formatCurrency(dashboard.currentWeekSales)}</strong></div>
						<div><span>Vs previous 7 days</span><strong class:positive={dashboard.weekChange === null || dashboard.weekChange >= 0} class:warning={dashboard.weekChange !== null && dashboard.weekChange < 0}>{weekChangeLabel}</strong></div>
					</div>
					<div class="sales-chart" aria-label="Sales trend chart for the last seven days">
						<div class="chart-label">Daily sales · {formatCurrency(chartCeiling)}</div>
						<div class="chart-bars">
							{#each dashboard.salesTrend as day, index (`${day.label}-${index}`)}
								<div class="chart-day">
									<div
										class:highlight={index === 6}
										class="chart-bar"
										style={`height: ${day.height}%`}
										title={`${day.label}: ${formatCurrency(day.amount)}`}
									></div>
									<span>{day.label}</span>
								</div>
							{/each}
						</div>
					</div>
				</section>
			</div>

			<aside class="side-column" aria-label="Operations updates">
				<section class="dashboard-card low-stock-card">
					<div class="card-heading">
						<div>
							<h2>Low stock items</h2>
							<p>{dashboard.lowStockCount} items at or below reorder level</p>
						</div>
						{#if dashboard.lowStockCount}<span class="status-badge amber-badge">Action needed</span>{/if}
					</div>
					<div class="compact-list">
						{#each dashboard.lowStockItems as item (item.sku)}
							<div class="compact-row">
								<span><strong>{item.name}</strong><small>{item.sku} · {item.category}</small></span>
								<b class:urgent={item.remaining <= 2}>{item.remaining} left</b>
							</div>
						{:else}
							<p class="dashboard-empty">No low-stock items right now.</p>
						{/each}
					</div>
					<a class="card-link" href="/staff/admin/inventory">Open inventory <span aria-hidden="true">→</span></a>
				</section>

				<section class="dashboard-card operational-card">
					<div class="card-heading"><div><h2>Operational summary</h2></div></div>
					<div class="summary-list">
						<div>
							<span><i class="dot blue-dot"></i>Outstanding utility balance</span><strong>{formatCurrency(dashboard.outstandingBalance)}</strong>
						</div>
						<div>
							<span><i class="dot amber-dot"></i>Next unpaid bill due</span><strong class:warning={Boolean(dashboard.nextBillDate)}
								>{dashboard.nextBillDate ?? 'None due'}</strong
							>
						</div>
						<div>
							<span><i class="dot green-dot"></i>Active utility accounts</span><strong class="positive"
								>{dashboard.activeAccounts} / {dashboard.utilityAccountCount} active</strong
							>
						</div>
						<div>
							<span><i class="dot slate-dot"></i>Paid this year</span><strong>{formatCurrency(dashboard.ytdUtilitySpend)}</strong>
						</div>
						<div>
							<span><i class="dot slate-dot"></i>No sales in 30 days</span><strong class="muted"
								>{dashboard.nonSellingCount} items</strong
							>
						</div>
					</div>
					<a class="card-link" href="/staff/admin/utilities"
						>View utility accounts <span aria-hidden="true">→</span></a
					>
				</section>

				<section class="dashboard-card activity-card">
					<div class="card-heading">
						<div>
							<h2>Recent activity</h2>
							<p>Latest recorded audit events</p>
						</div>
					</div>
					<div class="activity-list">
						{#each dashboard.activity as activity (`${activity.title}-${activity.meta}`)}
							<div class="activity-row">
								<span><strong>{activity.title}</strong><small>{activity.meta}</small></span>
								<b class={`status-badge ${activity.tone}-badge`}>{activity.status}</b>
							</div>
						{:else}
							<p class="dashboard-empty">No audit activity has been recorded yet.</p>
						{/each}
					</div>
				</section>
			</aside>
		</div>
</main>

<style>
	.dashboard-page {
		box-sizing: border-box;
		width: 100%;
		max-width: 100%;
		min-width: 0;
		padding-top: 0;
	}
	.dashboard-columns,
	.chart-grid,
	.side-column,
	.panel,
	.welcome-card,
	.dashboard-stats,
	.quick-links {
		max-width: 100%;
		min-width: 0;
	}
	.dashboard-topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 3.35rem;
		margin: 0 calc(clamp(1rem, 3vw, 3rem) * -1) 0.75rem;
		border-bottom: 1px solid #e5e9ef;
		background: #fff;
		padding: 0.45rem clamp(1rem, 3vw, 3rem);
	}
	.dashboard-topbar h1 {
		margin: 0;
		color: #172b4d;
		font-size: 0.83rem;
		font-weight: 900;
	}
	.dashboard-topbar p {
		margin: 0.08rem 0 0;
		color: #7f8a9b;
		font-size: 0.57rem;
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
		padding: 0.38rem 0.55rem;
		font-size: 0.56rem;
	}
	.date-chip svg,
	.icon-button svg,
	.reports-button svg,
	.compact-button svg {
		width: 0.78rem;
		height: 0.78rem;
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 1.8;
	}
	.icon-button,
	.avatar {
		display: grid;
		width: 1.9rem;
		height: 1.9rem;
		place-items: center;
		border: 1px solid #e3e8ef;
		border-radius: 50%;
		background: #fff;
		color: #6d7c91;
		cursor: pointer;
	}
	.avatar {
		border: 0;
		background: #2563eb;
		color: white;
		font-size: 0.55rem;
		font-weight: 900;
	}
	.notification-wrap {
		position: relative;
	}
	.notification-bell { position: relative; transition: color 140ms ease, border-color 140ms ease, box-shadow 140ms ease; }
	.notification-bell:hover, .notification-bell[aria-expanded='true'] { border-color: #a8c5f5; color: #2563eb; box-shadow: 0 0 0 3px #2563eb14; }
	.notification-badge {
		position: absolute;
		top: -0.24rem;
		right: -0.24rem;
		display: grid;
		min-width: 1rem;
		height: 1rem;
		box-sizing: border-box;
		place-items: center;
		border: 2px solid #fff;
		border-radius: 2rem;
		background: #ef4444;
		color: #fff;
		padding: 0 0.18rem;
		font-size: 0.52rem;
		font-weight: 900;
		line-height: 1;
	}
	.notification-popover {
		position: absolute;
		z-index: 30;
		top: calc(100% + 0.7rem);
		right: 0;
		box-sizing: border-box;
		width: min(21rem, calc(100vw - 2rem));
		max-width: calc(100vw - 2rem);
		border: 1px solid #dbe4f0;
		border-radius: 0.9rem;
		background: white;
		box-shadow: 0 18px 48px #15284426;
		overflow: hidden;
	}
	.notification-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.8rem;
		border-bottom: 1px solid #e8edf4;
		padding: 0.9rem 1rem;
	}
	.notification-heading > div { display: grid; gap: 0.14rem; }
	.notification-eyebrow { color: #78869a; font-size: 0.56rem; font-weight: 850; letter-spacing: 0.1em; text-transform: uppercase; }
	.notification-heading strong { color: #1d2c47; font-size: 0.88rem; font-weight: 900; }
	.notification-count { border-radius: 2rem; background: #edf4ff; color: #2868cf; padding: 0.28rem 0.55rem; font-size: 0.62rem; font-weight: 850; white-space: nowrap; }
	.notification-list { display: grid; padding: 0.25rem 1rem; }
	.notification-item { display: grid; grid-template-columns: 2rem minmax(0, 1fr); align-items: start; gap: 0.7rem; border-bottom: 1px solid #edf1f6; padding: 0.8rem 0; }
	.notification-item:last-child { border-bottom: 0; }
	.notification-symbol { display: grid; width: 1.9rem; height: 1.9rem; place-items: center; border-radius: 0.6rem; background: #fff4df; color: #a56600; font-size: 0.85rem; font-weight: 900; }
	.notification-item.bill .notification-symbol { background: #edf4ff; color: #2868cf; }
	.notification-item strong { color: #26364f; font-size: 0.73rem; font-weight: 850; }
	.notification-item p { margin: 0.2rem 0 0.35rem; color: #728198; font-size: 0.66rem; line-height: 1.45; }
	.notification-item a { color: #2563eb; font-size: 0.65rem; font-weight: 800; text-decoration: none; }
	.notification-item a:hover { text-decoration: underline; }
	.notification-empty { display: grid; justify-items: center; padding: 1.35rem 1rem 1.1rem; text-align: center; }
	.notification-check { display: grid; width: 2.1rem; height: 2.1rem; place-items: center; margin-bottom: 0.55rem; border-radius: 50%; background: #e9fbf1; color: #09834b; font-size: 1rem; font-weight: 900; }
	.notification-empty strong { color: #26364f; font-size: 0.75rem; }
	.notification-empty p { margin: 0.25rem 0 0; color: #78869a; font-size: 0.65rem; }
	.notification-footer { border-top: 1px solid #e8edf4; background: #f8fafd; color: #8995a6; padding: 0.6rem 1rem; font-size: 0.58rem; }
	.welcome-card {
		display: flex;
		min-width: 0;
		align-items: center;
		gap: 0.6rem;
		margin-bottom: 0.65rem;
		border: 1px solid #e4eaf2;
		border-radius: 0.75rem;
		background: white;
		box-shadow: 0 6px 20px rgba(32, 55, 88, 0.04);
		padding: 0.95rem 1.1rem;
	}
	.welcome-icon {
		width: 1.65rem;
		height: 1.65rem;
		flex: 0 0 auto;
		border-radius: 50%;
		background: #eff6ff;
	}
	.welcome-copy {
		min-width: 0;
		flex: 1;
	}
	.welcome-eyebrow {
		margin: 0 0 0.12rem;
		color: #2563eb;
		font-size: 0.62rem;
		font-weight: 800;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.welcome-copy h2 {
		margin: 0;
		color: #172b4d;
		font-size: 1rem;
		font-weight: 900;
	}
	.welcome-copy > p:last-child {
		margin: 0.15rem 0 0;
		color: #8290a2;
		font-size: 0.68rem;
	}
	.live-clock {
		display: grid;
		justify-items: end;
		gap: 0.12rem;
		border-left: 1px solid #e8edf3;
		padding: 0.15rem 0.65rem;
	}
	.live-clock-label {
		color: #8291a4;
		font-size: 0.62rem;
		font-weight: 700;
	}
	.live-clock time {
		color: #172b4d;
		font-size: 0.95rem;
		font-variant-numeric: tabular-nums;
		font-weight: 900;
	}
	.live-indicator {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		color: #168251;
		font-size: 0.62rem;
		font-weight: 800;
	}
	.live-indicator i {
		width: 0.34rem;
		height: 0.34rem;
		border-radius: 50%;
		background: #20b978;
		box-shadow: 0 0 0 0.12rem #20b9781c;
	}
	.reports-button,
	.compact-button {
		display: inline-flex;
		min-height: 1.7rem;
		align-items: center;
		justify-content: center;
		gap: 0.32rem;
		border: 1px solid #e1e6ed;
		border-radius: 0.42rem;
		background: white;
		color: #44536a;
		padding: 0.35rem 0.55rem;
		font-size: 0.68rem;
		font-weight: 700;
		text-decoration: none;
		white-space: nowrap;
	}
	.reports-button:hover,
	.compact-button:hover {
		background: #f8fafc;
	}
	.dashboard-stats {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.8rem;
		margin-bottom: 0.9rem;
	}
	.dashboard-stats article,
	.dashboard-card {
		min-width: 0;
		border: 1px solid #e4eaf2;
		border-radius: 0.65rem;
		background: white;
		box-shadow: 0 5px 16px rgba(32, 55, 88, 0.04);
	}
	.dashboard-stats article {
		padding: 0.9rem 1rem;
	}
	.dashboard-stats span,
	.dashboard-stats small {
		display: block;
		color: #7f8b9d;
		font-size: 0.65rem;
	}
	.dashboard-stats span {
		font-weight: 800;
		letter-spacing: 0.035em;
		text-transform: uppercase;
	}
	.dashboard-stats strong {
		display: block;
		margin: 0.2rem 0 0.12rem;
		color: #1c2c49;
		font-size: 1.04rem;
		font-weight: 900;
	}
	.positive {
		color: #08a551 !important;
	}
	.warning {
		color: #ec7b09 !important;
	}
	.dashboard-data-notice { margin: 0 0 .85rem; border: 1px solid #f0cf91; border-radius: .6rem; background: #fff8e8; color: #8a5a08; padding: .7rem .9rem; font-size: .72rem; }
	.dashboard-empty { margin: .8rem 0; color: #8490a1; font-size: .75rem; text-align: center; }
	.muted {
		color: #788395 !important;
	}
	.dashboard-columns {
		display: grid;
		grid-template-columns: minmax(0, 2.2fr) minmax(15rem, 0.95fr);
		align-items: start;
		gap: 0.9rem;
	}
	.main-column,
	.side-column {
		display: grid;
		min-width: 0;
		align-content: start;
		gap: 0.9rem;
	}
	.dashboard-card {
		padding: 1rem 1.1rem;
	}
	.card-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.55rem;
		margin-bottom: 0.42rem;
	}
	.card-heading h2 {
		margin: 0;
		color: #1c2c49;
		font-size: 0.78rem;
		font-weight: 900;
	}
	.card-heading p {
		margin: 0.12rem 0 0;
		color: #8a96a7;
		font-size: 0.65rem;
	}
	.table-wrap {
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		min-width: 410px;
	}
	th {
		background: #f3f5f8;
		color: #7e8998;
		font-size: 0.59rem;
		text-align: left;
		text-transform: uppercase;
	}
	th:first-child {
		border-radius: 0.3rem 0 0 0.3rem;
	}
	th:last-child {
		border-radius: 0 0.3rem 0.3rem 0;
		text-align: right;
	}
	th,
	td {
		padding: 0.45rem 0.4rem;
	}
	td {
		border-bottom: 1px solid #e9edf2;
		color: #7d899b;
		font-size: 0.65rem;
	}
	td strong,
	td small {
		display: block;
	}
	td strong {
		color: #273750;
		font-size: 0.51rem;
	}
	td small {
		margin-top: 0.1rem;
		color: #9ba5b3;
		font-size: 0.45rem;
	}
	td.amount {
		color: #1e2f4a;
		font-weight: 900;
		text-align: right;
		white-space: nowrap;
	}
	.card-link {
		display: inline-flex;
		align-items: center;
		gap: 0.22rem;
		margin-top: 0.48rem;
		color: #2563eb;
		font-size: 0.5rem;
		font-weight: 700;
		text-decoration: none;
	}
	.card-link:hover {
		text-decoration: underline;
	}
	.quick-links {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.45rem;
	}
	.quick-links a {
		display: flex;
		min-width: 0;
		align-items: center;
		gap: 0.4rem;
		border: 1px solid #e4eaf2;
		border-radius: 0.55rem;
		background: white;
		padding: 0.48rem;
		text-decoration: none;
	}
	.quick-links a:hover {
		border-color: #bbd0fb;
		background: #f9fbff;
	}
	.quick-links a > span:last-child {
		display: grid;
		min-width: 0;
		gap: 0.12rem;
	}
	.quick-links strong {
		overflow: hidden;
		color: #2563eb;
		font-size: 0.65rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.quick-links small {
		overflow: hidden;
		color: #8490a1;
		font-size: 0.58rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.quick-icon {
		display: grid;
		width: 1.25rem;
		height: 1.25rem;
		flex: 0 0 auto;
		place-items: center;
		border-radius: 0.35rem;
		font-size: 0.8rem;
		font-weight: 900;
	}
	.blue-icon {
		background: #eff6ff;
		color: #4b83f4;
	}
	.violet-icon {
		background: #f2efff;
		color: #8062d4;
	}
	.amber-icon {
		background: #fff7e8;
		color: #dc9a28;
	}
	.sales-summary {
		display: flex;
		align-items: end;
		justify-content: space-between;
		margin: 0.35rem 0 0.4rem;
	}
	.sales-summary div {
		display: grid;
		gap: 0.12rem;
	}
	.sales-summary div:last-child {
		text-align: right;
	}
	.sales-summary span {
		color: #8490a1;
		font-size: 0.58rem;
		font-weight: 800;
		text-transform: uppercase;
	}
	.sales-summary strong {
		color: #1d2d49;
		font-size: 0.95rem;
		font-weight: 900;
	}
	.sales-summary div:last-child strong {
		font-size: 0.72rem;
	}
	.sales-chart {
		position: relative;
		height: 5.8rem;
		border-bottom: 1px solid #e6edf5;
		background: repeating-linear-gradient(to bottom, transparent 0, transparent 32%, #eef2f7 33%);
	}
	.chart-label {
		position: absolute;
		top: 0.05rem;
		left: 2.1rem;
		color: #8996a8;
		font-size: 0.57rem;
	}
	.chart-bars {
		display: flex;
		height: 100%;
		align-items: end;
		justify-content: space-between;
		gap: 0.35rem;
		padding-left: 2rem;
	}
	.chart-day {
		display: flex;
		height: 100%;
		min-width: 0;
		flex: 1;
		flex-direction: column;
		align-items: center;
		justify-content: end;
		gap: 0.25rem;
		color: #8793a4;
		font-size: 0.57rem;
	}
	.chart-bar {
		width: 100%;
		max-width: 3.8rem;
		min-height: 0.35rem;
		border-radius: 0.28rem 0.28rem 0 0;
		background: #edf4ff;
	}
	.chart-bar.highlight {
		background: #2863e9;
	}
	.service-list {
		display: grid;
		gap: 0.32rem;
	}
	.service-list div,
	.service-list div > span {
		display: flex;
		align-items: center;
	}
	.service-list div {
		justify-content: space-between;
		gap: 0.5rem;
		color: #8490a1;
		font-size: 0.49rem;
	}
	.service-list div > span {
		gap: 0.35rem;
	}
	.service-list i {
		width: 0.32rem;
		height: 0.32rem;
		border-radius: 50%;
		background: #0aa663;
	}
	.service-list strong {
		color: #0a9f52;
		font-size: 0.65rem;
	}
	.status-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 1rem;
		padding: 0.2rem 0.38rem;
		font-size: 0.59rem;
		font-weight: 800;
		white-space: nowrap;
	}
	.blue-badge {
		background: #edf4ff;
		color: #2563eb;
	}
	.amber-badge {
		background: #fff4d7;
		color: #c78400;
	}
	.red-badge {
		background: #ffebeb;
		color: #db4646;
	}
	.green-badge {
		background: #e8f8ef;
		color: #07894b;
	}
	.compact-list,
	.activity-list {
		display: grid;
	}
	.compact-row,
	.activity-row {
		display: flex;
		min-width: 0;
		align-items: center;
		justify-content: space-between;
		gap: 0.45rem;
		border-bottom: 1px solid #edf1f5;
		padding: 0.37rem 0;
	}
	.compact-row > span,
	.activity-row > span {
		display: grid;
		min-width: 0;
		gap: 0.1rem;
	}
	.compact-row strong,
	.activity-row strong {
		overflow: hidden;
		color: #293851;
		font-size: 0.5rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.compact-row small,
	.activity-row small {
		overflow: hidden;
		color: #8a96a7;
		font-size: 0.44rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.compact-row > b {
		flex: 0 0 auto;
		border-radius: 1rem;
		background: #fff2d7;
		color: #b87a06;
		padding: 0.17rem 0.32rem;
		font-size: 0.55rem;
	}
	.compact-row > b.urgent {
		background: #ffebeb;
		color: #de4545;
	}
	.summary-list {
		display: grid;
		gap: 0.36rem;
		padding: 0.1rem 0;
	}
	.summary-list div,
	.summary-list div > span {
		display: flex;
		align-items: center;
	}
	.summary-list div {
		justify-content: space-between;
		gap: 0.4rem;
		color: #8490a1;
		font-size: 0.61rem;
	}
	.summary-list div > span {
		gap: 0.35rem;
	}
	.summary-list strong {
		color: #253650;
		font-size: 0.63rem;
		text-align: right;
		white-space: nowrap;
	}
	.dot {
		width: 0.32rem;
		height: 0.32rem;
		border-radius: 50%;
	}
	.blue-dot {
		background: #4b83f4;
	}
	.amber-dot {
		background: #df941b;
	}
	.green-dot {
		background: #12a25b;
	}
	.slate-dot {
		background: #71809a;
	}
	.activity-row > .status-badge {
		flex: 0 0 auto;
	}
	:global(html[data-theme='dark'] .dashboard-page .dashboard-topbar),
	:global(html[data-theme='dark'] .dashboard-page .welcome-card),
	:global(html[data-theme='dark'] .dashboard-page .dashboard-card),
	:global(html[data-theme='dark'] .dashboard-page .dashboard-stats article),
	:global(html[data-theme='dark'] .dashboard-page .quick-links a),
	:global(html[data-theme='dark'] .dashboard-page .notification-popover) {
		border-color: #334866;
		background: #172640;
	}
	:global(html[data-theme='dark'] .dashboard-page .notification-heading),
	:global(html[data-theme='dark'] .dashboard-page .notification-item),
	:global(html[data-theme='dark'] .dashboard-page .notification-footer) { border-color: #334866; }
	:global(html[data-theme='dark'] .dashboard-page .notification-footer) { background: #101e34; color: #9aabc2; }
	:global(html[data-theme='dark'] .dashboard-page .notification-heading strong),
	:global(html[data-theme='dark'] .dashboard-page .notification-item strong),
	:global(html[data-theme='dark'] .dashboard-page .notification-empty strong) { color: #edf4ff; }
	:global(html[data-theme='dark'] .dashboard-page .notification-eyebrow),
	:global(html[data-theme='dark'] .dashboard-page .notification-item p),
	:global(html[data-theme='dark'] .dashboard-page .notification-empty p) { color: #aebdcb; }
	:global(html[data-theme='dark'] .dashboard-page .notification-count) { background: #243a59; color: #b9d2ff; }
	:global(html[data-theme='dark'] .dashboard-page .notification-badge) { border-color: #172640; }
	:global(html[data-theme='dark'] .dashboard-page .notification-item.warning .notification-symbol) { background: #4a3a1c; color: #ffdb8a; }
	:global(html[data-theme='dark'] .dashboard-page .notification-item.bill .notification-symbol) { background: #243a59; color: #9fc3ff; }
	:global(html[data-theme='dark'] .dashboard-page .notification-check) { background: #123b31; color: #82e2b0; }
	:global(html[data-theme='dark'] .dashboard-page .notification-bell:hover),
	:global(html[data-theme='dark'] .dashboard-page .notification-bell[aria-expanded='true']) { border-color: #5f85bf; color: #9fc3ff; box-shadow: 0 0 0 3px #6da2ff1c; }
	:global(html[data-theme='dark'] .dashboard-page .dashboard-data-notice) { border-color: #765c2d; background: #342d20; color: #f2d08a; }
	:global(html[data-theme='dark'] .dashboard-page .dashboard-empty) { color: #b8c8dd; }
	:global(html[data-theme='dark'] .dashboard-page h1),
	:global(html[data-theme='dark'] .dashboard-page h2),
	:global(html[data-theme='dark'] .dashboard-page td strong),
	:global(html[data-theme='dark'] .dashboard-page .live-clock time),
	:global(html[data-theme='dark'] .dashboard-page .sales-summary strong),
	:global(html[data-theme='dark'] .dashboard-page .summary-list strong),
	:global(html[data-theme='dark'] .dashboard-page .compact-row strong),
	:global(html[data-theme='dark'] .dashboard-page .activity-row strong) {
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .dashboard-page .compact-button),
	:global(html[data-theme='dark'] .dashboard-page .reports-button) {
		border-color: #415878;
		background: #172640;
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .dashboard-page th) {
		background: #101d35;
		color: #b8c8dd;
	}
	:global(html[data-theme='dark'] .dashboard-page td) {
		border-color: #334866;
	}
	@media (max-width: 900px) {
		.dashboard-columns {
			grid-template-columns: minmax(0, 1.7fr) minmax(14rem, 1fr);
		}
		.welcome-card {
			flex-wrap: wrap;
		}
		.reports-button {
			margin-left: auto;
		}
	}
	@media (max-width: 700px) {
		.dashboard-page {
			overflow-x: clip;
		}
		.dashboard-columns {
			grid-template-columns: 1fr;
		}
		.side-column {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			align-items: start;
		}
		.dashboard-stats {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.skeleton-stats {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (max-width: 480px) {
		.dashboard-topbar {
			min-height: 3.2rem;
		}
		.date-chip {
			font-size: 0;
		}
		.date-chip svg {
			width: 0.95rem;
			height: 0.95rem;
		}
		.welcome-card {
			align-items: flex-start;
		}
		.welcome-icon {
			width: 1.35rem;
			height: 1.35rem;
		}
		.live-clock {
			order: 3;
			width: 100%;
			justify-items: start;
			border-top: 1px solid #e8edf3;
			border-left: 0;
			padding: 0.4rem 0 0 1.95rem;
		}
		.reports-button {
			align-self: center;
		}
		.side-column {
			grid-template-columns: 1fr;
		}
		.quick-links {
			grid-template-columns: 1fr;
		}
		.quick-links small {
			white-space: normal;
		}
		.skeleton-columns {
			grid-template-columns: 1fr;
		}
	}
</style>
