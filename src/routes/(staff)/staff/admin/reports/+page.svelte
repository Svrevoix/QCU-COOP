<script lang="ts">
	import { getContext } from 'svelte';
	import ReportCatalog from '$lib/components/ReportCatalog.svelte';

	type ReportGroup = { label: string; reports: string[] };
	type ReportSelection = { group: string; report: string };

	const selection = getContext<ReportSelection>('adminReportSelection');
	const reportGroups = getContext<ReportGroup[]>('adminReportGroups');
	const rows = [
		['15 Sep 2026', 'TX-10482', 'QCU ID Lace', 'Maria Santos', '₱1,245.00'],
		['16 Sep 2026', 'TX-10491', 'Ballpen set · 10 pcs', 'J. Dela Cruz', '₱350.00'],
		['18 Sep 2026', 'TX-10519', 'Faculty essentials bundle', 'R. Manalo', '₱2,180.00'],
		['20 Sep 2026', 'TX-10534', 'Printing services', 'Maria Santos', '₱480.50'],
		['22 Sep 2026', 'TX-10548', 'School supplies assorted', 'L. Cruz', '₱653.00']
	];

	let report = $derived(selection.report);
	let period = $state('This month');
	let warehouse = $state('All warehouses');
	let search = $state('');
	let generatedAt = $state('09:42 AM');
	let exported = $state(false);
	let exportError = $state('');
	let notificationsOpen = $state(false);

	const academicYear = (() => {
		const year = new Date().getFullYear();
		return `Academic Year ${year}-${String(year + 1).slice(-2)}`;
	})();
	const filteredRows = $derived(
		rows.filter((row) => row.join(' ').toLowerCase().includes(search.trim().toLowerCase()))
	);

	function generateReport() {
		generatedAt = new Date().toLocaleTimeString(undefined, {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	async function exportWorkbook() {
		exportError = '';
		try {
			const XLSX = await import('xlsx');
			const data = [
				['QCU COOP STORE', report],
				['Period', period],
				['Warehouse', warehouse],
				[],
				['Date', 'Reference', 'Item', 'Operator', 'Amount'],
				...filteredRows
			];
			const sheet = XLSX.utils.aoa_to_sheet(data);
			const workbook = XLSX.utils.book_new();
			XLSX.utils.book_append_sheet(workbook, sheet, 'Report');
			XLSX.writeFile(workbook, `${report.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.xlsx`);
			exported = true;
			setTimeout(() => (exported = false), 2800);
		} catch (error) {
			console.error('Unable to export report workbook.', error);
			exportError = 'The workbook could not be exported. Please try again.';
		}
	}
</script>

<svelte:head>
	<title>Reports | QCU Coop Admin</title>
	<meta name="description" content="Build, preview, and export cooperative store reports." />
</svelte:head>

<main class="admin-page reports-page">
	<header class="reports-topbar">
		<div>
			<h1>Reports</h1>
			<p>Dashboard / Reports / Reports Engine</p>
		</div>
		<div class="topbar-actions">
			<span class="date-chip">
				<svg viewBox="0 0 24 24" aria-hidden="true"
					><rect x="3.5" y="5" width="17" height="15" rx="2" /><path
						d="M7.5 3v4M16.5 3v4M3.5 9h17"
					/></svg
				>
				{academicYear}
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
					<div class="notification-popover" role="status">No new report notifications.</div>
				{/if}
			</div>
			<button class="avatar" type="button" aria-label="Administrator account">QC</button>
		</div>
	</header>

	{#if exported}<div class="toast" role="status">Workbook downloaded successfully.</div>{/if}
	{#if exportError}<div class="toast error-toast" role="alert">{exportError}</div>{/if}

	<div class="reports-heading">
		<div>
			<p class="admin-eyebrow">Business intelligence / Export center</p>
			<h2>Reports engine</h2>
			<p>Build, preview, and export operational reports from one controlled workspace.</p>
		</div>
		<button class="export-button" type="button" onclick={exportWorkbook}>
			<svg viewBox="0 0 24 24" aria-hidden="true"
				><path d="M14 4h6v6M20 4l-9 9" /><path
					d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"
				/></svg
			>
			Export .xlsx
		</button>
	</div>

	<div class="report-layout">
		<div class="catalog-column">
			<ReportCatalog groups={reportGroups} {selection} variant="light" />
		</div>

		<div class="report-main">
			<section class="builder">
				<div class="builder-heading">
					<div>
						<p class="selected-label">Selected report</p>
						<h2>{report}</h2>
						<p>Configure the scope before generating or exporting the workbook.</p>
					</div>
					<span class="ready"><i></i> Ready</span>
				</div>
				<div class="filters">
					<label
						>Date range
						<select bind:value={period}>
							<option>This month</option><option>Today</option><option>Last month</option><option
								>Quarter to date</option
							>
						</select>
					</label>
					<label
						>Warehouse
						<select bind:value={warehouse}>
							<option>All warehouses</option><option>Main warehouse</option><option
								>North storage</option
							><option>Retail floor</option>
						</select>
					</label>
					<label class="search-label"
						>Search records
						<input bind:value={search} placeholder="SKU, reference, operator..." />
					</label>
					<button class="generate-button" type="button" onclick={generateReport}>Generate</button>
				</div>
			</section>

			<section class="metrics" aria-label="Report summary">
				<article><span>Rows available</span><strong>4,862</strong><small>{period}</small></article>
				<article>
					<span>Report value</span><strong>₱284,620</strong><small>Gross amount</small>
				</article>
				<article>
					<span>Last generated</span><strong>{generatedAt}</strong><small>Administrator</small>
				</article>
				<article>
					<span>Export target</span><strong>.xlsx</strong><small>Excel workbook</small>
				</article>
			</section>

			<section class="preview">
				<div class="preview-heading">
					<div>
						<h2>Report preview</h2>
						<p>{report} / {warehouse} / {period}</p>
					</div>
					<button class="secondary" type="button" onclick={exportWorkbook}>
						<svg viewBox="0 0 24 24" aria-hidden="true"
							><path d="M14 4h6v6M20 4l-9 9" /><path
								d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"
							/></svg
						>
						Export current report
					</button>
				</div>
				<div class="table-wrap">
					<table>
						<thead
							><tr><th>Date</th><th>Reference</th><th>Item</th><th>Operator</th><th>Amount</th></tr
							></thead
						>
						<tbody>
							{#each filteredRows as row (row[1])}
								<tr
									>{#each row as cell, index (`${row[1]}-${index}`)}<td
											class:amount={index === 4}
											class:reference={index === 1}>{cell}</td
										>{/each}</tr
								>
							{:else}
								<tr><td class="no-results" colspan="5">No preview rows match your search.</td></tr>
							{/each}
						</tbody>
					</table>
				</div>
				<div class="preview-footer">
					<div>
						<strong
							>Showing {filteredRows.length} of 4,862 rows — scroll or export for full dataset</strong
						><small>Sorted by date ascending · {warehouse} · {period}</small>
					</div>
					<svg viewBox="0 0 24 24" aria-label="Report chart" role="img"
						><path d="M4 20V11h4v9m2 0V5h4v15m2 0v-7h4v7M2 20h20" /></svg
					>
				</div>
			</section>
		</div>
	</div>
</main>

<style>
	.reports-page {
		padding-top: 0;
	}
	.reports-topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 3.5rem;
		margin: 0 calc(clamp(1rem, 3vw, 3rem) * -1) 0.85rem;
		border-bottom: 1px solid #e5e9ef;
		background: #fff;
		padding: 0.45rem clamp(1rem, 3vw, 3rem);
	}
	.reports-topbar h1 {
		margin: 0;
		color: #172b4d;
		font-size: 0.83rem;
		font-weight: 900;
	}
	.reports-topbar p {
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
	.icon-button svg {
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
		width: 12rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.6rem;
		background: white;
		box-shadow: 0 12px 30px #182b471c;
		padding: 0.75rem;
		color: #607087;
		font-size: 0.58rem;
	}
	.reports-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.8rem;
	}
	.admin-eyebrow {
		margin: 0 0 0.18rem;
		color: #347af5;
		font-size: 0.53rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.reports-heading h2 {
		margin: 0;
		color: #172b4d;
		font-size: 1.08rem;
		font-weight: 900;
	}
	.reports-heading p:last-child {
		margin: 0.2rem 0 0;
		color: #8290a2;
		font-size: 0.63rem;
	}
	.export-button,
	.generate-button {
		display: inline-flex;
		min-height: 2rem;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		border: 0;
		border-radius: 0.48rem;
		background: #347af5;
		color: white;
		padding: 0.5rem 0.8rem;
		font: inherit;
		font-size: 0.6rem;
		font-weight: 800;
		cursor: pointer;
		white-space: nowrap;
	}
	.export-button:hover,
	.generate-button:hover {
		background: #1d5fdb;
	}
	.export-button svg,
	.secondary svg {
		width: 0.9rem;
		height: 0.9rem;
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 1.8;
	}
	.report-layout {
		display: grid;
		grid-template-columns: minmax(12rem, 17rem) minmax(0, 1fr);
		align-items: stretch;
		gap: 0.65rem;
		min-height: calc(100vh - 15rem);
	}
	.report-main {
		display: grid;
		min-width: 0;
		grid-template-rows: auto auto minmax(15rem, 1fr);
		gap: 0.55rem;
	}
	.builder,
	.preview,
	.metrics article {
		border: 1px solid #e4eaf2;
		border-radius: 0.72rem;
		background: white;
		box-shadow: 0 6px 18px rgba(32, 55, 88, 0.045);
	}
	.builder {
		padding: 0.78rem 0.85rem;
	}
	.builder-heading,
	.preview-heading {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.7rem;
	}
	.selected-label {
		margin: 0 0 0.16rem;
		color: #8b9ab0;
		font-size: 0.46rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.builder h2,
	.preview h2 {
		margin: 0;
		color: #1b2b48;
		font-size: 0.85rem;
		font-weight: 900;
	}
	.builder-heading > div > p:last-child,
	.preview-heading p {
		margin: 0.16rem 0 0;
		color: #8b99ab;
		font-size: 0.53rem;
	}
	.ready {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		border-radius: 1rem;
		background: #e8faf1;
		color: #07894b;
		padding: 0.3rem 0.5rem;
		font-size: 0.5rem;
		font-weight: 800;
	}
	.ready i {
		width: 0.3rem;
		height: 0.3rem;
		border-radius: 50%;
		background: #12a35e;
	}
	.filters {
		display: grid;
		grid-template-columns: minmax(5.5rem, 0.8fr) minmax(6rem, 0.85fr) minmax(9rem, 1.9fr) auto;
		align-items: end;
		gap: 0.5rem;
		margin-top: 0.65rem;
	}
	.filters label {
		min-width: 0;
		color: #61738d;
		font-size: 0.5rem;
		font-weight: 700;
	}
	.filters select,
	.filters input {
		display: block;
		box-sizing: border-box;
		width: 100%;
		height: 1.8rem;
		margin-top: 0.25rem;
		border: 1px solid #dfe6ef;
		border-radius: 0.4rem;
		background: white;
		color: #29405f;
		padding: 0.4rem 0.5rem;
		font: inherit;
		font-size: 0.53rem;
	}
	.filters input::placeholder {
		color: #9aa7b8;
	}
	.generate-button {
		min-height: 1.8rem;
		padding: 0.4rem 0.65rem;
	}
	.metrics {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.5rem;
	}
	.metrics article {
		min-width: 0;
		padding: 0.55rem 0.65rem;
	}
	.metrics span,
	.metrics small {
		display: block;
		overflow: hidden;
		color: #8391a4;
		font-size: 0.46rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.metrics span {
		font-weight: 800;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}
	.metrics strong {
		display: block;
		margin: 0.2rem 0 0.12rem;
		color: #1b2c4a;
		font-size: 0.88rem;
		font-weight: 900;
	}
	.preview {
		min-height: 0;
		padding: 0.75rem 0.8rem;
	}
	.preview-heading {
		align-items: center;
		margin-bottom: 0.55rem;
	}
	.preview h2 {
		font-size: 0.72rem;
	}
	.preview-heading p {
		font-size: 0.49rem;
	}
	.secondary {
		display: inline-flex;
		min-height: 1.75rem;
		align-items: center;
		gap: 0.35rem;
		border: 1px solid #dfe6ef;
		border-radius: 0.42rem;
		background: white;
		color: #465771;
		padding: 0.35rem 0.55rem;
		font: inherit;
		font-size: 0.51rem;
		font-weight: 700;
		cursor: pointer;
		white-space: nowrap;
	}
	.secondary:hover {
		background: #f8fafc;
	}
	.table-wrap {
		overflow-x: auto;
	}
	table {
		width: 100%;
		min-width: 490px;
		border-collapse: collapse;
	}
	th {
		background: #f5f7fa;
		color: #8290a2;
		font-size: 0.45rem;
		font-weight: 700;
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
		padding: 0.48rem 0.42rem;
	}
	td {
		border-bottom: 1px solid #e9edf2;
		color: #71809a;
		font-size: 0.5rem;
	}
	td.reference {
		color: #2563eb;
		font-weight: 700;
	}
	td.amount {
		color: #172b4d;
		font-weight: 900;
		text-align: right;
		white-space: nowrap;
	}
	td.no-results {
		padding: 1.5rem;
		color: #8291a4;
		text-align: center;
	}
	.preview-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-top: 0.5rem;
		border-radius: 0.45rem;
		background: #eef5ff;
		padding: 0.45rem 0.55rem;
	}
	.preview-footer div {
		display: grid;
		gap: 0.12rem;
	}
	.preview-footer strong {
		color: #2563eb;
		font-size: 0.48rem;
	}
	.preview-footer small {
		color: #8290a2;
		font-size: 0.44rem;
	}
	.preview-footer svg {
		width: 1.1rem;
		height: 1.1rem;
		flex: 0 0 auto;
		fill: none;
		stroke: #347af5;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 1.6;
	}
	.toast {
		margin: 0 0 0.6rem;
		border: 1px solid #bcebd2;
		border-radius: 0.5rem;
		background: #effcf5;
		color: #168251;
		padding: 0.55rem 0.75rem;
		font-size: 0.58rem;
		font-weight: 800;
	}
	.error-toast {
		border-color: #f2c7c7;
		background: #fff5f5;
		color: #b42318;
	}
	:global(html[data-theme='dark'] .reports-page .reports-topbar),
	:global(html[data-theme='dark'] .reports-page .builder),
	:global(html[data-theme='dark'] .reports-page .preview),
	:global(html[data-theme='dark'] .reports-page .metrics article),
	:global(html[data-theme='dark'] .reports-page .notification-popover),
	:global(html[data-theme='dark'] .reports-page .report-catalog.light) {
		border-color: #334866;
		background: #172640;
	}
	:global(html[data-theme='dark'] .reports-page h1),
	:global(html[data-theme='dark'] .reports-page h2),
	:global(html[data-theme='dark'] .reports-page .metrics strong),
	:global(html[data-theme='dark'] .reports-page td.amount),
	:global(html[data-theme='dark'] .reports-page .report-catalog.light .catalog-heading),
	:global(html[data-theme='dark'] .reports-page .report-catalog.light .group-button) {
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .reports-page .filters select),
	:global(html[data-theme='dark'] .reports-page .filters input),
	:global(html[data-theme='dark'] .reports-page .secondary) {
		border-color: #415878;
		background: #101d35;
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .reports-page th) {
		background: #101d35;
		color: #b8c8dd;
	}
	:global(html[data-theme='dark'] .reports-page td) {
		border-color: #334866;
	}
	:global(html[data-theme='dark'] .reports-page .report-catalog.light section) {
		border-color: #334866;
	}
	:global(html[data-theme='dark'] .reports-page .report-catalog.light .report-list button) {
		color: #b8c8dd;
	}
	:global(html[data-theme='dark'] .reports-page .report-catalog.light .report-list button.chosen) {
		background: #203a60;
		color: #8eb5ff;
	}
	@media (max-width: 900px) {
		.report-layout {
			grid-template-columns: minmax(11rem, 14rem) minmax(0, 1fr);
		}
		.filters {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.generate-button {
			align-self: end;
		}
		.metrics {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (max-width: 650px) {
		.reports-topbar {
			min-height: 3.2rem;
		}
		.date-chip {
			font-size: 0;
		}
		.date-chip svg {
			width: 0.95rem;
			height: 0.95rem;
		}
		.reports-heading {
			align-items: flex-start;
		}
		.reports-heading h2 {
			font-size: 0.98rem;
		}
		.report-layout {
			grid-template-columns: 1fr;
			min-height: auto;
		}
		.catalog-column {
			max-height: 17rem;
			overflow-y: auto;
		}
		.report-main {
			grid-template-rows: auto auto auto;
		}
	}
	@media (max-width: 420px) {
		.reports-heading {
			flex-direction: column;
		}
		.filters {
			grid-template-columns: 1fr;
		}
		.builder-heading,
		.preview-heading {
			align-items: flex-start;
			flex-direction: column;
		}
		.metrics {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
