<script lang="ts">
	import { onMount } from 'svelte';

	let loading = $state(true);
	let localTime = $state('');
	let timeOfDay = $state('morning');
	let today = $state(new Date());
	let notificationsOpen = $state(false);

	const recentTransactions = [
		{
			item: 'Canned Sardines 155g',
			reference: 'TXN-2026-10481',
			category: 'Canned Goods',
			quantity: 12,
			amount: '₱204.00'
		},
		{
			item: 'Cooking Oil 1L',
			reference: 'TXN-2026-10480',
			category: 'Grocery',
			quantity: 6,
			amount: '₱474.00'
		},
		{
			item: 'Instant Noodles 6-pack',
			reference: 'TXN-2026-10479',
			category: 'Dry Goods',
			quantity: 24,
			amount: '₱936.00'
		},
		{
			item: 'Distilled Water 5L',
			reference: 'TXN-2026-10478',
			category: 'Beverages',
			quantity: 8,
			amount: '₱320.00'
		},
		{
			item: 'Laundry Detergent 1kg',
			reference: 'TXN-2026-10477',
			category: 'Household',
			quantity: 10,
			amount: '₱870.00'
		}
	];
	const lowStockItems = [
		{ name: 'White Sugar 1kg', sku: 'SKU-0041', category: 'Dry Goods', remaining: 3 },
		{ name: 'Canned Tuna 180g', sku: 'SKU-0087', category: 'Canned Goods', remaining: 5 },
		{ name: 'Iodized Salt 250g', sku: 'SKU-0013', category: 'Condiments', remaining: 2 },
		{ name: 'Vinegar 350ml', sku: 'SKU-0092', category: 'Condiments', remaining: 1 },
		{ name: 'Bar Soap 90g', sku: 'SKU-0119', category: 'Household', remaining: 4 }
	];
	const recentActivity = [
		{
			title: 'Inventory sync completed',
			meta: '09:42 AM · System',
			status: 'Synced',
			tone: 'blue'
		},
		{
			title: 'Low-stock alert triggered',
			meta: '08:17 AM · Inventory',
			status: 'Review',
			tone: 'amber'
		},
		{ title: 'Utility payment posted', meta: '07:55 AM · Finance', status: 'Posted', tone: 'blue' },
		{
			title: 'Maintenance request assigned',
			meta: '07:12 AM · Maintenance',
			status: 'Open',
			tone: 'red'
		},
		{ title: 'Sales report exported', meta: '06:48 AM · Reports', status: 'Exported', tone: 'blue' }
	];
	const maintenanceSchedule = [
		{
			title: 'Refrigerator inspection',
			date: '18 Oct · 09:00 AM',
			status: 'Due soon',
			tone: 'amber'
		},
		{ title: 'POS software update', date: '21 Oct · 06:00 PM', status: 'Scheduled', tone: 'blue' },
		{
			title: 'Utility meter calibration',
			date: '26 Oct · 10:30 AM',
			status: 'Scheduled',
			tone: 'blue'
		},
		{
			title: 'Quarterly inventory audit',
			date: '31 Oct · 08:00 AM',
			status: 'Due soon',
			tone: 'amber'
		}
	];
	const services = ['Point of sale', 'Inventory sync', 'Reporting engine', 'Member portal'];
	const salesBars = [52, 76, 62, 88, 100, 73, 100];
	const weekDays = $derived.by(() => {
		const start = new Date(today);
		start.setDate(start.getDate() - 6);
		return Array.from({ length: 7 }, (_, index) => {
			const day = new Date(start);
			day.setDate(start.getDate() + index);
			return new Intl.DateTimeFormat('en', { weekday: 'short' }).format(day);
		});
	});
	const monthLabel = $derived(
		new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(today)
	);
	const dateLabel = $derived(
		new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(today)
	);
	const salesPeriod = $derived.by(() => {
		const start = new Date(today);
		start.setDate(start.getDate() - 6);
		const dateFormat = new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit' });
		return `${dateFormat.format(start)}–${dateFormat.format(today)}`;
	});

	onMount(() => {
		function updateClock() {
			const now = new Date();
			const hour = now.getHours();
			timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
			localTime = now.toLocaleTimeString(undefined, {
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit'
			});
			today = now;
		}

		updateClock();
		const interval = setInterval(updateClock, 1000);
		loading = false;
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
						<strong>Dashboard alerts</strong>
						<span>18 inventory items need restocking.</span>
						<a href="/staff/admin/inventory">Review low stock</a>
					</div>
				{/if}
			</div>
			<button class="avatar" type="button" aria-label="Administrator account">QC</button>
		</div>
	</header>

	{#if loading}
		<div class="dashboard-skeleton" aria-label="Loading dashboard" aria-busy="true">
			<div class="skeleton-header"></div>
			<div class="skeleton-stats">
				{#each [1, 2, 3, 4] as item (item)}<div class="skeleton-card"></div>{/each}
			</div>
			<div class="skeleton-columns">
				<div class="skeleton-card"></div>
				<div class="skeleton-card"></div>
			</div>
		</div>
	{:else}
		<section class="welcome-card" aria-label="Operations overview">
			<div class="welcome-icon" aria-hidden="true"></div>
			<div class="welcome-copy">
				<p class="welcome-eyebrow">Operations overview</p>
				<h2>Good {timeOfDay}, Administrator</h2>
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

		<section class="dashboard-stats" aria-label="Operations metrics">
			<article>
				<span>Gross sales</span><strong>₱284,620</strong><small class="positive"
					>↑ 8.2% vs last month</small
				>
			</article>
			<article>
				<span>Units moved</span><strong>1,846</strong><small class="positive"
					>↑ 3.1% vs last month</small
				>
			</article>
			<article>
				<span>Low stock items</span><strong class="warning">18</strong><small class="warning"
					>Needs restocking</small
				>
			</article>
			<article>
				<span>Non-selling items</span><strong class="muted">24</strong><small
					>Review recommended</small
				>
			</article>
		</section>

		<div class="dashboard-columns">
			<div class="main-column">
				<section class="dashboard-card transactions-card">
					<div class="card-heading">
						<div>
							<h2>Recent transactions</h2>
							<p>Today · {dateLabel}</p>
						</div>
						<a class="compact-button" href="/staff/admin/reports">
							<svg viewBox="0 0 24 24" aria-hidden="true"
								><path d="M14 4h6v6M20 4l-9 9" /><path
									d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"
								/></svg
							>
							Export
						</a>
					</div>
					<div class="table-wrap">
						<table>
							<thead
								><tr><th>Item / description</th><th>Category</th><th>Qty</th><th>Amount</th></tr
								></thead
							>
							<tbody>
								{#each recentTransactions as transaction (transaction.reference)}
									<tr>
										<td
											><strong>{transaction.item}</strong><small>{transaction.reference}</small></td
										>
										<td>{transaction.category}</td>
										<td>{transaction.quantity}</td>
										<td class="amount">{transaction.amount}</td>
									</tr>
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
					<a href="/staff/admin/inventory/adjustments/actual-count"
						><span class="quick-icon amber-icon" aria-hidden="true">⌁</span><span
							><strong>Maintenance Logs</strong><small>Track service requests and repairs</small
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
							Export
						</a>
					</div>
					<div class="sales-summary">
						<div><span>Current week</span><strong>₱284,620</strong></div>
						<div><span>Vs last week</span><strong class="positive">+8.2%</strong></div>
					</div>
					<div class="sales-chart" aria-label="Sales trend chart for the last seven days">
						<div class="chart-label">₱18k</div>
						<div class="chart-bars">
							{#each salesBars as height, index (`${weekDays[index]}-${index}`)}
								<div class="chart-day">
									<div
										class:highlight={index === 4 || index === 6}
										class="chart-bar"
										style={`height: ${height}%`}
										title={`${weekDays[index]} sales`}
									></div>
									<span>{weekDays[index]}</span>
								</div>
							{/each}
						</div>
					</div>
				</section>

				<section class="dashboard-card service-card">
					<div class="card-heading">
						<div>
							<h2>Service status</h2>
							<p>Live operational health</p>
						</div>
						<span class="status-badge blue-badge">4 / 4 online</span>
					</div>
					<div class="service-list">
						{#each services as service (service)}
							<div><span><i></i>{service}</span><strong>Healthy</strong></div>
						{/each}
					</div>
				</section>
			</div>

			<aside class="side-column" aria-label="Operations updates">
				<section class="dashboard-card low-stock-card">
					<div class="card-heading">
						<div>
							<h2>Low stock items</h2>
							<p>18 items need restocking</p>
						</div>
						<span class="status-badge amber-badge">Action needed</span>
					</div>
					<div class="compact-list">
						{#each lowStockItems as item (item.sku)}
							<div class="compact-row">
								<span><strong>{item.name}</strong><small>{item.sku} · {item.category}</small></span>
								<b class:urgent={item.remaining <= 2}>{item.remaining} left</b>
							</div>
						{/each}
					</div>
					<a class="card-link" href="/staff/admin/inventory"
						>View all 18 low-stock items <span aria-hidden="true">→</span></a
					>
				</section>

				<section class="dashboard-card operational-card">
					<div class="card-heading"><div><h2>Operational summary</h2></div></div>
					<div class="summary-list">
						<div>
							<span><i class="dot blue-dot"></i>Utility balance</span><strong>₱18,940.75</strong>
						</div>
						<div>
							<span><i class="dot amber-dot"></i>Next bill due</span><strong class="warning"
								>05 Nov</strong
							>
						</div>
						<div>
							<span><i class="dot green-dot"></i>Active services</span><strong class="positive"
								>4 / 4 operational</strong
							>
						</div>
						<div>
							<span><i class="dot slate-dot"></i>YTD utility spend</span><strong>₱186,420</strong>
						</div>
						<div>
							<span><i class="dot slate-dot"></i>Non-selling SKUs</span><strong class="muted"
								>24 items</strong
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
							<p>Latest system events</p>
						</div>
						<span class="status-badge amber-badge">3 alerts</span>
					</div>
					<div class="activity-list">
						{#each recentActivity as activity (activity.title)}
							<div class="activity-row">
								<span><strong>{activity.title}</strong><small>{activity.meta}</small></span>
								<b class={`status-badge ${activity.tone}-badge`}>{activity.status}</b>
							</div>
						{/each}
					</div>
				</section>

				<section class="dashboard-card maintenance-card">
					<div class="card-heading">
						<div>
							<h2>Upcoming maintenance</h2>
							<p>Scheduled tasks</p>
						</div>
						<span class="status-badge amber-badge">2 due soon</span>
					</div>
					<div class="activity-list">
						{#each maintenanceSchedule as task (task.title)}
							<div class="activity-row">
								<span><strong>{task.title}</strong><small>{task.date}</small></span>
								<b class={`status-badge ${task.tone}-badge`}>{task.status}</b>
							</div>
						{/each}
					</div>
				</section>
			</aside>
		</div>
	{/if}
</main>

<style>
	.dashboard-page {
		padding-top: 0;
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
	.notification-popover {
		position: absolute;
		z-index: 5;
		top: calc(100% + 0.55rem);
		right: 0;
		display: grid;
		gap: 0.3rem;
		width: 13rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.6rem;
		background: white;
		box-shadow: 0 12px 30px #182b471c;
		padding: 0.8rem;
	}
	.notification-popover strong {
		color: #1d2c47;
		font-size: 0.64rem;
	}
	.notification-popover span,
	.notification-popover a {
		color: #8490a2;
		font-size: 0.58rem;
	}
	.notification-popover a {
		color: #2563eb;
		text-decoration: none;
	}
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
		padding: 0.7rem 0.85rem;
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
		font-size: 0.48rem;
		font-weight: 800;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.welcome-copy h2 {
		margin: 0;
		color: #172b4d;
		font-size: 0.83rem;
		font-weight: 900;
	}
	.welcome-copy > p:last-child {
		margin: 0.15rem 0 0;
		color: #8290a2;
		font-size: 0.57rem;
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
		font-size: 0.49rem;
		font-weight: 700;
	}
	.live-clock time {
		color: #172b4d;
		font-size: 0.83rem;
		font-variant-numeric: tabular-nums;
		font-weight: 900;
	}
	.live-indicator {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		color: #168251;
		font-size: 0.49rem;
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
		font-size: 0.55rem;
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
		gap: 0.55rem;
		margin-bottom: 0.65rem;
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
		padding: 0.65rem 0.75rem;
	}
	.dashboard-stats span,
	.dashboard-stats small {
		display: block;
		color: #7f8b9d;
		font-size: 0.51rem;
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
	.muted {
		color: #788395 !important;
	}
	.dashboard-columns {
		display: grid;
		grid-template-columns: minmax(0, 2.2fr) minmax(15rem, 0.95fr);
		align-items: start;
		gap: 0.6rem;
	}
	.main-column,
	.side-column {
		display: grid;
		min-width: 0;
		align-content: start;
		gap: 0.6rem;
	}
	.dashboard-card {
		padding: 0.65rem 0.72rem;
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
		font-size: 0.62rem;
		font-weight: 900;
	}
	.card-heading p {
		margin: 0.12rem 0 0;
		color: #8a96a7;
		font-size: 0.5rem;
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
		font-size: 0.46rem;
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
		font-size: 0.49rem;
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
		font-size: 0.52rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.quick-links small {
		overflow: hidden;
		color: #8490a1;
		font-size: 0.43rem;
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
		font-size: 0.44rem;
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
		font-size: 0.43rem;
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
		font-size: 0.43rem;
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
		font-size: 0.5rem;
	}
	.status-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 1rem;
		padding: 0.2rem 0.38rem;
		font-size: 0.44rem;
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
		font-size: 0.43rem;
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
		font-size: 0.47rem;
	}
	.summary-list div > span {
		gap: 0.35rem;
	}
	.summary-list strong {
		color: #253650;
		font-size: 0.48rem;
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
	.dashboard-skeleton {
		min-height: 30rem;
	}
	.skeleton-header,
	.skeleton-card {
		border-radius: 0.7rem;
		background: linear-gradient(90deg, #e8edf4 25%, #f3f6fa 50%, #e8edf4 75%);
		background-size: 200% 100%;
		animation: skeleton-shimmer 1.2s ease-in-out infinite;
	}
	.skeleton-header {
		height: 5rem;
		margin-bottom: 0.8rem;
	}
	.skeleton-stats,
	.skeleton-columns {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.6rem;
		margin-bottom: 0.6rem;
	}
	.skeleton-columns {
		grid-template-columns: 2fr 1fr;
	}
	.skeleton-card {
		min-height: 5rem;
	}
	.skeleton-columns .skeleton-card {
		min-height: 22rem;
	}
	@keyframes skeleton-shimmer {
		to {
			background-position: -200% 0;
		}
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
	@media (prefers-reduced-motion: reduce) {
		.skeleton-header,
		.skeleton-card {
			animation: none;
		}
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
