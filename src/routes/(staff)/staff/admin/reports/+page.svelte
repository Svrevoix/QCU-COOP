<script lang="ts">
	import { getContext } from 'svelte';
	const selection = getContext<{ group: string; report: string }>('adminReportSelection');
	const rows = [['15 Sep 2026', 'TX-10482', 'QCU ID Lace', 'Maria Santos', '1,245.00'], ['15 Sep 2026', 'TX-10481', 'Yellow Pad 8.5 x 11', 'John Dela Cruz', '380.00'], ['14 Sep 2026', 'TX-10479', 'QCU PE Shirt - Medium', 'Anna Reyes', '420.00'], ['14 Sep 2026', 'TX-10451', 'Bond Paper A4', 'Maria Santos', '2,140.00']];
	let report = $derived(selection.report);
	let period = $state('This month');
	let warehouse = $state('All warehouses');
	let search = $state('');
	let generated = $state(false);
	let exported = $state(false);
	let filteredRows = $derived(rows.filter((row) => row.join(' ').toLowerCase().includes(search.toLowerCase())));
	async function exportWorkbook() {
		const XLSX = await import('xlsx');
		const data = [['QCU COOP STORE', report], ['Period', period], ['Warehouse', warehouse], [], ['Date', 'Reference', 'Item', 'Operator', 'Amount'], ...filteredRows];
		const sheet = XLSX.utils.aoa_to_sheet(data);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, sheet, 'Report');
		XLSX.writeFile(workbook, `${report.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.xlsx`);
		exported = true;
		setTimeout(() => exported = false, 2800);
	}
</script>
<svelte:head><title>Reports Engine | QCU Coop Admin</title></svelte:head>
<div class="admin-page">
	<div class="admin-title-row"><div><p class="admin-eyebrow">Business intelligence / Export center</p><h1 class="admin-title">Reports engine</h1><p class="admin-subtitle">Build, preview, and export operational reports from one controlled workspace.</p></div><button class="admin-button" type="button" onclick={exportWorkbook}>Export .xlsx</button></div>
	{#if exported}<div class="toast" role="status">Workbook downloaded successfully.</div>{/if}
	<div class="report-layout">
		<main class="report-main"><section class="builder"><div class="builder-heading"><div><p class="admin-eyebrow">Selected report</p><h2>{report}</h2><p>Configure the scope before generating or exporting the workbook.</p></div><span class="ready">Ready</span></div><div class="filters"><label>Date range<select bind:value={period}><option>This month</option><option>Today</option><option>Last month</option><option>Quarter to date</option></select></label><label>Warehouse<select bind:value={warehouse}><option>All warehouses</option><option>Main warehouse</option><option>North storage</option><option>Retail floor</option></select></label><label>Search records<input bind:value={search} placeholder="SKU, reference, operator..." /></label><button class="admin-button" type="button" onclick={() => generated = true}>Generate</button></div></section>
			<div class="metrics"><div><span>Rows available</span><strong>4,862</strong><small>{period}</small></div><div><span>Report value</span><strong>284,620.00</strong><small>Gross amount</small></div><div><span>Last generated</span><strong>{generated ? 'Just now' : '09:42 AM'}</strong><small>Administrator</small></div><div><span>Export target</span><strong>.xlsx</strong><small>Excel workbook</small></div></div>
			<section class="preview"><div class="preview-heading"><div><h2>Report preview</h2><p>{report} / {warehouse} / {period}</p></div><button class="secondary" type="button" onclick={exportWorkbook}>Export current report</button></div><div class="table-wrap"><table><thead><tr><th>Date</th><th>Reference</th><th>Item</th><th>Operator</th><th>Amount</th></tr></thead><tbody>{#each filteredRows as row}<tr>{#each row as cell, index}<td class:amount={index === 4}>{cell}</td>{/each}</tr>{/each}</tbody></table></div><div class="footer"><span>Showing {filteredRows.length} preview rows of 4,862 records</span><span>Source: posted transactions</span></div></section>
		</main></div>
</div>
<style>
.report-layout{display:grid;grid-template-columns:minmax(0,1fr);gap:1rem}.report-main{min-width:0}.builder,.preview{border:1px solid #e4eaf2;border-radius:.75rem;background:white;box-shadow:0 8px 24px rgba(32,55,88,.04);padding:1.25rem}.builder-heading,.preview-heading{display:flex;justify-content:space-between;gap:1rem}.builder h2,.preview h2{margin:0;color:#172b4d;font-size:1rem}.builder p,.preview p{margin:.3rem 0 0;color:#8b99ab;font-size:.65rem}.ready{border-radius:1rem;background:#e5f8ee;color:#168251;padding:.4rem .6rem;font-size:.58rem;font-weight:800}.filters{display:grid;grid-template-columns:1fr 1fr 1.4fr auto;align-items:end;gap:.7rem;margin-top:1.2rem}.filters label{color:#63758e;font-size:.6rem;font-weight:800}.filters select,.filters input{display:block;width:100%;box-sizing:border-box;margin-top:.35rem;border:1px solid #dfe6ef;border-radius:.45rem;background:white;color:#29405f;padding:.62rem;font:inherit;font-size:.65rem}.admin-button,.secondary{border:0;border-radius:.55rem;background:#2563eb;color:white;padding:.7rem 1rem;font:inherit;font-size:.68rem;font-weight:800;cursor:pointer}.secondary{border:1px solid #dfe6ef;background:white;color:#395170}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:.8rem;margin:1rem 0}.metrics div{border-left:3px solid #2563eb;background:white;padding:.8rem 1rem}.metrics span,.metrics small{display:block;color:#8391a4;font-size:.58rem}.metrics strong{display:block;margin:.4rem 0 .2rem;color:#172b4d;font-size:1rem}.table-wrap{overflow-x:auto;margin:1rem -1.25rem 0}table{width:100%;min-width:650px;border-collapse:collapse}th{background:#f8fafc;color:#8997a9;font-size:.56rem;text-align:left;text-transform:uppercase}th,td{border-top:1px solid #edf1f5;padding:.75rem 1.25rem}td{color:#687991;font-size:.63rem}.amount{color:#29405f;font-weight:800}.footer{display:flex;justify-content:space-between;padding-top:.8rem;color:#8a99ab;font-size:.58rem}.toast{margin:-1rem 0 1rem;border:1px solid #bcebd2;border-radius:.5rem;background:#effcf5;color:#168251;padding:.7rem 1rem;font-size:.68rem;font-weight:800}@media(max-width:980px){.filters{grid-template-columns:1fr 1fr}.metrics{grid-template-columns:repeat(2,1fr)}}@media(max-width:560px){.filters,.metrics{grid-template-columns:1fr}.builder-heading,.preview-heading,.footer{flex-direction:column}}
</style>