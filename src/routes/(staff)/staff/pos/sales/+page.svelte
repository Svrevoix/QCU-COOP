<script lang="ts">
	import StaffLogout from '$lib/components/StaffLogout.svelte';

	type SalesPeriod = 'Daily Sales' | 'Weekly' | 'Monthly';
	type ChartPoint = { label: string; amount: number };

	let period = $state<SalesPeriod>('Daily Sales');
	const monthlyChart: ChartPoint[] = [
		{ label: 'May', amount: 390 },
		{ label: 'Jun', amount: 520 },
		{ label: 'Jul', amount: 460 },
		{ label: 'Aug', amount: 680 },
		{ label: 'Sep', amount: 610 },
		{ label: 'Oct', amount: 840 }
	];
	const weeklyChart: ChartPoint[] = [
		{ label: 'Mon', amount: 420 },
		{ label: 'Tue', amount: 570 },
		{ label: 'Wed', amount: 490 },
		{ label: 'Thu', amount: 700 },
		{ label: 'Fri', amount: 650 },
		{ label: 'Sat', amount: 820 },
		{ label: 'Sun', amount: 760 }
	];
	const dailyChart: ChartPoint[] = [
		{ label: 'Mon', amount: 360 },
		{ label: 'Tue', amount: 440 },
		{ label: 'Wed', amount: 390 },
		{ label: 'Thu', amount: 650 }
	];
	const chartPoints = $derived(
		period === 'Daily Sales' ? dailyChart : period === 'Weekly' ? weeklyChart : monthlyChart
	);
	const chartDescription = $derived(
		period === 'Daily Sales'
			? 'Monday through Thursday · this week'
			: period === 'Weekly'
				? 'Daily revenue · this week'
				: 'Monthly revenue · this year'
	);
	const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(
		new Date()
	);
	const chartPolyline = $derived(
		chartPoints
			.map((point, index) => {
				const x = 50 + (index * 430) / Math.max(chartPoints.length - 1, 1);
				const y = 196 - ((point.amount - 250) / 700) * 170;
				return `${x},${Math.max(18, Math.min(196, y))}`;
			})
			.join(' ')
	);
	const markerPoints = $derived(
		chartPoints.map((point, index) => {
			const x = 50 + (index * 430) / Math.max(chartPoints.length - 1, 1);
			const y = 196 - ((point.amount - 250) / 700) * 170;
			return { ...point, x, y: Math.max(18, Math.min(196, y)) };
		})
	);

	function exportSales() {
		const rows = [
			['Period', period],
			['Metric', 'Value'],
			['Total revenue', '48250'],
			['Transactions', '1284'],
			['Active members', '342'],
			['Average basket', '37.58'],
			[],
			['Category', 'Share'],
			['Grocery', '68%'],
			['Services', '24%'],
			['Other', '8%'],
			[],
			['Chart period', 'Revenue (₱)'],
			...chartPoints.map((point) => [point.label, String(point.amount * 100)])
		];
		const csv = rows
			.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
			.join('\r\n');
		const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
		const link = document.createElement('a');
		link.href = url;
		link.download = `sales-${period.toLowerCase().replace(/\s+/g, '-')}.csv`;
		link.click();
		URL.revokeObjectURL(url);
	}
</script>

<svelte:head>
	<title>Sales | QCU Coop Cashier</title>
	<meta name="description" content="Sales overview and trends for the cashier workspace." />
</svelte:head>

<main class="cashier-shell">
	<aside class="cashier-sidebar">
		<a class="cashier-brand" href="/staff/pos">
			<span class="brand-mark">Q</span>
			<span><strong>QCU COOP</strong><small>Cashier workspace</small></span>
		</a>
		<p class="sidebar-label">Workspace</p>
		<nav aria-label="Cashier navigation">
			<a href="/staff/pos/register">
				<svg viewBox="0 0 24 24" aria-hidden="true"
					><path d="M3 5h18v14H3zM7 9h4m-4 4h2m4-4h4m-4 4h4" /><path d="M7 16h10" /></svg
				>
				<span>Register</span>
			</a>
			<a href="/staff/pos">
				<svg viewBox="0 0 24 24" aria-hidden="true"
					><path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z" /><path d="M8 8h8M8 12h8M8 16h4" /></svg
				>
				<span>POS Transaction Logs</span>
			</a>
			<a class="active" href="/staff/pos/sales" aria-current="page">
				<svg viewBox="0 0 24 24" aria-hidden="true"
					><path d="M4 19V5M4 19h17" /><path d="m7 15 4-5 3 2 5-7" /></svg
				>
				<span>Sales</span>
			</a>
			<a href="/staff/pos/account">
				<svg viewBox="0 0 24 24" aria-hidden="true"
					><circle cx="12" cy="8" r="3.5" /><path
						d="M5 20c1.2-3.6 4.2-5.5 7-5.5s5.8 1.9 7 5.5"
					/></svg
				>
				<span>Account</span>
			</a>
		</nav>
		<StaffLogout />
	</aside>

	<section class="cashier-content sales-content">
		<header class="sales-topbar">
			<div>
				<h1>Sales</h1>
				<p>Sales overview</p>
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
				<button class="icon-button" type="button" aria-label="Notifications">
					<svg viewBox="0 0 24 24" aria-hidden="true"
						><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg
					>
				</button>
				<button class="avatar" type="button" aria-label="Cashier account">QC</button>
			</div>
		</header>

		<section class="sales-metrics" aria-label="Sales summary">
			<article>
				<span>Total revenue</span><strong>₱48,250</strong><small class="up"
					>↑ 12.4% <i>vs last week</i></small
				>
			</article>
			<article>
				<span>Transactions</span><strong>1,284</strong><small class="up"
					>↑ 8.1% <i>vs last week</i></small
				>
			</article>
			<article>
				<span>Active members</span><strong>342</strong><small class="steady"
					>→ 0.0% <i>no change</i></small
				>
			</article>
			<article>
				<span>Avg. basket</span><strong>₱37.58</strong><small class="down"
					>↓ 2.3% <i>vs last week</i></small
				>
			</article>
		</section>

		<div class="sales-toolbar">
			<div class="period-tabs" role="tablist" aria-label="Sales period">
				{#each ['Daily Sales', 'Weekly', 'Monthly'] as option}
					<button
						type="button"
						role="tab"
						aria-selected={period === option}
						class:active={period === option}
						onclick={() => (period = option as SalesPeriod)}>{option}</button
					>
				{/each}
			</div>
			<button class="export-button" type="button" onclick={exportSales}>
				Export <span aria-hidden="true">↓</span>
			</button>
		</div>

		<div class="sales-panels">
			<section class="sales-panel analysis-panel" aria-labelledby="sales-analysis-title">
				<div class="panel-heading">
					<div>
						<h2 id="sales-analysis-title">Sales Analysis</h2>
						<p>{chartDescription}</p>
					</div>
					<span class="trend-badge">↑ Trending up</span>
				</div>
				<div class="chart-wrap">
					<div class="y-axis" aria-hidden="true">
						<span>₱900</span><span>₱700</span><span>₱500</span><span>₱300</span>
					</div>
					<div class="line-chart">
						<svg
							viewBox="0 0 500 220"
							role="img"
							aria-label={`${period} sales analysis line chart`}
						>
							<line x1="50" y1="25" x2="480" y2="25" class="gridline" />
							<line x1="50" y1="68" x2="480" y2="68" class="gridline" />
							<line x1="50" y1="111" x2="480" y2="111" class="gridline" />
							<line x1="50" y1="154" x2="480" y2="154" class="gridline" />
							<line x1="50" y1="196" x2="480" y2="196" class="axisline" />
							<line x1="50" y1="25" x2="50" y2="196" class="axisline" />
							<polyline points={chartPolyline} class="sales-line" />
							{#each markerPoints as point (point.label)}
								<circle cx={point.x} cy={point.y} r="4.5" class="sales-point">
									<title>{point.label}: ₱{(point.amount * 100).toLocaleString()}</title>
								</circle>
							{/each}
						</svg>
						<div class="x-axis">
							{#each chartPoints as point (point.label)}<span>{point.label}</span>{/each}
						</div>
					</div>
				</div>
			</section>

			<section class="sales-panel category-panel" aria-labelledby="category-sales-title">
				<div class="panel-heading">
					<div>
						<h2 id="category-sales-title">This week's sales</h2>
						<p>By category</p>
					</div>
				</div>
				<div
					class="category-chart"
					role="img"
					aria-label="Grocery 68 percent, services 24 percent, other 8 percent"
				>
					<div class="donut"><strong>68%</strong><span>Grocery</span></div>
				</div>
				<div class="category-legend">
					<div class="grocery"><span><i></i>Grocery</span><strong>68%</strong></div>
					<div class="services"><span><i></i>Services</span><strong>24%</strong></div>
					<div class="other"><span><i></i>Other</span><strong>8%</strong></div>
				</div>
			</section>
		</div>
		<footer class="sales-footer">
			<span>© {new Date().getFullYear()} QCU Coop Store · Admin Portal</span>
			<span>Member pricing and patronage benefits are subject to cooperative policy.</span>
			<span><a href="/about">Privacy</a><a href="/about">Support</a></span>
		</footer>
	</section>
</main>

<style>
	.cashier-shell {
		--navy: #07152d;
		--ink: #172b4d;
		--line: #e4eaf2;
		display: flex;
		min-height: 100vh;
		background: #f7f8fa;
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
	.cashier-sidebar nav a:hover {
		background: #12274b;
		color: white;
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
		width: min(100%, 100rem);
		min-width: 0;
		margin: 0 auto;
		padding: 0 clamp(1rem, 2vw, 1.5rem);
	}
	.sales-topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 3.7rem;
		margin: 0 calc(clamp(1rem, 2vw, 1.5rem) * -1) 0.9rem;
		border-bottom: 1px solid #e5e9ef;
		background: white;
		padding: 0.45rem clamp(1rem, 2vw, 1.5rem);
	}
	.sales-topbar h1 {
		margin: 0;
		color: #172b4d;
		font-size: 0.83rem;
		font-weight: 900;
	}
	.sales-topbar p {
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
	.avatar {
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
	.avatar {
		border: 0;
		background: #2563eb;
		color: white;
		font-size: 0.55rem;
		font-weight: 900;
	}
	.sales-metrics {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.7rem;
		margin: 1rem 0 1.15rem;
	}
	.sales-metrics article {
		min-width: 0;
		border: 1px solid #e4e9ef;
		border-radius: 0.7rem;
		background: white;
		box-shadow: 0 4px 14px rgba(32, 55, 88, 0.035);
		padding: 0.82rem 0.9rem;
	}
	.sales-metrics article > span {
		display: block;
		color: #778397;
		font-size: 0.54rem;
		font-weight: 700;
		text-transform: uppercase;
	}
	.sales-metrics article > strong {
		display: block;
		margin: 0.3rem 0 0.16rem;
		color: #131f35;
		font-size: 1.15rem;
		font-weight: 900;
	}
	.sales-metrics small {
		font-size: 0.52rem;
		font-weight: 800;
	}
	.sales-metrics small i {
		color: #8792a1;
		font-style: normal;
		font-weight: 500;
	}
	.up {
		color: #0b9d52;
	}
	.steady {
		color: #da8a11;
	}
	.down {
		color: #e44949;
	}
	.sales-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin: 0 0.1rem 0.65rem;
	}
	.period-tabs {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}
	.period-tabs button,
	.export-button {
		min-height: 1.85rem;
		border: 1px solid #e2e7ee;
		border-radius: 0.45rem;
		background: white;
		color: #65738a;
		padding: 0.4rem 0.75rem;
		font: inherit;
		font-size: 0.56rem;
		font-weight: 700;
		cursor: pointer;
	}
	.period-tabs button:hover,
	.export-button:hover {
		background: #f3f6fb;
	}
	.period-tabs button.active {
		border-color: #2863ed;
		background: #2863ed;
		color: white;
	}
	.export-button {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		background: #f4f5f7;
	}
	.export-button span {
		font-size: 0.75rem;
	}
	.sales-panels {
		display: grid;
		grid-template-columns: minmax(0, 2.18fr) minmax(14rem, 0.86fr);
		gap: 0.7rem;
	}
	.sales-panel {
		min-width: 0;
		min-height: 26rem;
		border: 1px solid #e4e9ef;
		border-radius: 0.8rem;
		background: white;
		box-shadow: 0 5px 17px rgba(32, 55, 88, 0.035);
		padding: 1rem;
	}
	.panel-heading {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.6rem;
	}
	.panel-heading h2 {
		margin: 0;
		color: #1b2b47;
		font-size: 0.7rem;
		font-weight: 900;
	}
	.panel-heading p {
		margin: 0.2rem 0 0;
		color: #8490a1;
		font-size: 0.55rem;
	}
	.trend-badge {
		border-radius: 1rem;
		background: #d8f8e9;
		color: #09874a;
		padding: 0.25rem 0.48rem;
		font-size: 0.5rem;
		font-weight: 800;
		white-space: nowrap;
	}
	.chart-wrap {
		display: flex;
		width: min(100%, 27rem);
		height: 12rem;
		margin-top: 1.2rem;
	}
	.y-axis {
		display: flex;
		flex: 0 0 2.1rem;
		flex-direction: column;
		justify-content: space-between;
		padding: 0.05rem 0.3rem 0.8rem 0;
		color: #8b99ab;
		font-size: 0.48rem;
	}
	.line-chart {
		position: relative;
		min-width: 0;
		flex: 1;
	}
	.line-chart svg {
		display: block;
		width: 100%;
		height: 10.8rem;
		overflow: visible;
	}
	.gridline {
		stroke: #edf1f5;
		stroke-width: 1;
	}
	.axisline {
		stroke: #b6c4d5;
		stroke-width: 1.1;
	}
	.sales-line {
		fill: none;
		stroke: #ff3028;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 3;
	}
	.sales-point {
		fill: #ff3028;
		stroke: white;
		stroke-width: 1.4;
	}
	.x-axis {
		display: flex;
		position: absolute;
		right: 0.4rem;
		bottom: 0;
		left: 2.2rem;
		justify-content: space-between;
		color: #667891;
		font-size: 0.5rem;
	}
	.category-chart {
		display: grid;
		min-height: 13rem;
		place-items: center;
	}
	.donut {
		display: grid;
		width: 7.5rem;
		height: 7.5rem;
		place-content: center;
		border-radius: 50%;
		background:
			radial-gradient(white 55%, transparent 56%),
			conic-gradient(#ff3028 0 68%, #f7d978 68% 92%, #dce4ed 92% 100%);
		text-align: center;
	}
	.donut strong {
		color: #1d2737;
		font-size: 0.88rem;
		font-weight: 900;
	}
	.donut span {
		margin-top: 0.1rem;
		color: #79869a;
		font-size: 0.45rem;
	}
	.category-legend {
		display: grid;
		gap: 0.4rem;
	}
	.category-legend > div {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-radius: 0.42rem;
		padding: 0.38rem 0.5rem;
		color: #334158;
		font-size: 0.53rem;
	}
	.category-legend > div span {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}
	.category-legend i {
		width: 0.38rem;
		height: 0.38rem;
		border-radius: 50%;
		background: #ff3028;
	}
	.category-legend strong {
		color: #27344a;
		font-size: 0.53rem;
	}
	.category-legend .grocery {
		background: #ffe3e2;
	}
	.category-legend .services {
		background: #fff5cc;
	}
	.category-legend .services i {
		background: #f4d56f;
	}
	.category-legend .other {
		background: #f0f2f5;
	}
	.category-legend .other i {
		background: #cbd5e1;
	}
	.sales-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		min-height: 2.8rem;
		margin: 1rem calc(clamp(1rem, 2vw, 1.5rem) * -1) 0;
		border-top: 1px solid #e5e9ef;
		background: white;
		padding: 0.5rem clamp(1rem, 2vw, 1.5rem);
		color: #8490a1;
		font-size: 0.48rem;
	}
	.sales-footer > span:last-child {
		display: flex;
		gap: 0.8rem;
	}
	.sales-footer a {
		color: #1356dd;
		text-decoration: none;
	}
	:global(html[data-theme='dark'] .cashier-shell) {
		background: #101d35;
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .sales-topbar),
	:global(html[data-theme='dark'] .sales-metrics article),
	:global(html[data-theme='dark'] .sales-panel),
	:global(html[data-theme='dark'] .sales-footer) {
		border-color: #334866;
		background: #172640;
	}
	:global(html[data-theme='dark'] .sales-topbar h1),
	:global(html[data-theme='dark'] .sales-metrics article > strong),
	:global(html[data-theme='dark'] .panel-heading h2) {
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .period-tabs button),
	:global(html[data-theme='dark'] .export-button),
	:global(html[data-theme='dark'] .icon-button) {
		border-color: #415878;
		background: #172640;
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .period-tabs button.active) {
		border-color: #2863ed;
		background: #2863ed;
	}
	:global(html[data-theme='dark'] .donut) {
		background:
			radial-gradient(#172640 55%, transparent 56%),
			conic-gradient(#ff3028 0 68%, #f7d978 68% 92%, #52647c 92% 100%);
	}
	:global(html[data-theme='dark'] .category-legend strong) {
		color: #1d2737;
	}
	@media (max-width: 850px) {
		.cashier-sidebar {
			width: 13rem;
			flex-basis: 13rem;
		}
		.sales-panels {
			grid-template-columns: minmax(0, 1.7fr) minmax(12rem, 0.9fr);
		}
		.sales-panel {
			min-height: 23rem;
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
			min-height: 0;
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
			padding: 0.55rem 0.7rem;
		}
		.cashier-brand {
			padding: 0;
		}
		.brand-mark {
			width: 1.9rem;
			height: 1.9rem;
		}
		.cashier-brand strong {
			font-size: 0.68rem;
		}
		.cashier-brand small,
		.sidebar-label {
			display: none;
		}
		.cashier-sidebar nav {
			display: flex;
			gap: 0.15rem;
		}
		.cashier-sidebar nav a {
			gap: 0.3rem;
			padding: 0.5rem;
			font-size: 0.55rem;
		}
		.cashier-sidebar nav svg {
			width: 0.9rem;
			height: 0.9rem;
		}
		.cashier-sidebar :global(button) {
			display: none;
		}
		.cashier-content {
			padding-top: 0;
		}
		.sales-panels {
			grid-template-columns: 1fr;
		}
		.sales-panel {
			min-height: auto;
		}
		.category-chart {
			min-height: 11rem;
		}
	}
	@media (max-width: 460px) {
		.cashier-sidebar {
			align-items: flex-start;
			flex-direction: column;
			gap: 0.55rem;
		}
		.cashier-sidebar nav {
			width: 100%;
		}
		.cashier-sidebar nav a {
			flex: 1;
			justify-content: center;
		}
		.date-chip {
			font-size: 0;
		}
		.date-chip svg {
			width: 0.95rem;
			height: 0.95rem;
		}
		.sales-metrics {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.sales-metrics article {
			padding: 0.65rem;
		}
		.sales-metrics article > strong {
			font-size: 1rem;
		}
		.sales-footer {
			align-items: flex-start;
			flex-direction: column;
			gap: 0.35rem;
			padding-top: 0.65rem;
			padding-bottom: 0.65rem;
		}
	}
</style>
