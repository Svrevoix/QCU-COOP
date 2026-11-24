<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	let exportError = $state('');
	const money = (value: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value) || 0);
	const date = (value: string | null) => value ? new Intl.DateTimeFormat('en', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value.slice(0, 10)}T00:00:00`)) : '—';
	const serviceById = new Map(data.services.map((service) => [service.id, service]));
	const accountById = new Map(data.accounts.map((account) => [account.id, account]));
	const outstanding = (bill: (typeof data.bills)[number]) => Math.max(0, Number(bill.amount_due) - Number(bill.amount_paid));
	const openBills = data.bills.filter((bill) => !['paid', 'cancelled'].includes(bill.status.toLowerCase()));
	const totalBilled = data.bills.reduce((sum, bill) => sum + Number(bill.amount_due || 0), 0);
	const totalPaid = data.bills.reduce((sum, bill) => sum + Number(bill.amount_paid || 0), 0);
	const totalOutstanding = data.bills.reduce((sum, bill) => sum + outstanding(bill), 0);
	const generatedAt = new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date());

	async function downloadReport() {
		exportError = '';
		try {
			const XLSX = await import('xlsx');
			const rows = data.bills.map((bill) => {
				const account = accountById.get(bill.utility_account_id);
				const service = account ? serviceById.get(account.service_id)?.service_name : undefined;
				return [service ?? 'Utility', account?.account_name ?? '—', `${bill.billing_month}/${bill.billing_year}`, date(bill.due_date), bill.status, Number(bill.amount_due), Number(bill.amount_paid), outstanding(bill)];
			});
			const workbook = XLSX.utils.book_new();
			const sheet = XLSX.utils.aoa_to_sheet([
				['QCU COOP — UTILITIES SUMMARY'], ['Generated', generatedAt], [],
				['Total billed', totalBilled], ['Total paid', totalPaid], ['Outstanding', totalOutstanding], [],
				['Service', 'Account', 'Billing period', 'Due date', 'Status', 'Amount due', 'Amount paid', 'Balance'], ...rows
			]);
			XLSX.utils.book_append_sheet(workbook, sheet, 'Utilities Summary');
			XLSX.writeFile(workbook, 'qcu-utilities-summary.xlsx');
		} catch (error) {
			console.error('Unable to export utilities summary.', error);
			exportError = 'The report could not be downloaded. Please try again.';
		}
	}
</script>

<svelte:head>
	<title>Utilities Summary | QCU Coop Admin</title>
	<meta name="description" content="Printable and downloadable utility billing summary." />
</svelte:head>

<main class="summary-page">
	<div class="screen-actions">
		<a href="/staff/admin/utilities" class="back-link"><span aria-hidden="true">←</span> Back to Utilities</a>
		<div class="action-buttons"><button class="secondary" type="button" onclick={() => window.print()}>Print report</button><button class="primary" type="button" onclick={downloadReport}>Download .xlsx</button></div>
	</div>
	{#if exportError}<p class="export-error" role="alert">{exportError}</p>{/if}
	<article class="report-sheet">
		<header class="report-header">
			<div class="brand-mark">Q</div>
			<div class="report-title"><p class="eyebrow">QCU Cooperative · Administration</p><h1>Utilities Summary</h1><p>Utility accounts, billing activity, and outstanding balances</p></div>
			<div class="report-period"><span>REPORT PERIOD</span><strong>All billing records</strong><small>Generated {generatedAt}</small></div>
		</header>
		<section class="account-banner"><div><span>MASTER ACCOUNT</span><strong>QCU Coop Store Operations</strong><small>UT-02-01974 · QCU Main Building, Ground Floor</small></div><div><span>ACTIVE SERVICES</span><strong>{data.accounts.filter((account) => account.status.toLowerCase() === 'active').length}</strong></div></section>
		<section class="metrics" aria-label="Utility totals">
			<div><span>Total billed</span><strong>{money(totalBilled)}</strong><small>{data.bills.length} billing records</small></div>
			<div><span>Total paid</span><strong>{money(totalPaid)}</strong><small>Payments recorded</small></div>
			<div><span>Outstanding balance</span><strong>{money(totalOutstanding)}</strong><small>{openBills.length} open bills</small></div>
		</section>
		<section class="billing-section">
			<div class="section-title"><div><p class="eyebrow">Account activity</p><h2>Billing history</h2></div><span>{data.bills.length} records</span></div>
			<div class="table-wrap"><table><thead><tr><th>Service / account</th><th>Billing period</th><th>Due date</th><th>Status</th><th>Amount due</th><th>Paid</th><th>Balance</th></tr></thead><tbody>
				{#each data.bills as bill (bill.id)}
					{@const account = accountById.get(bill.utility_account_id)}
					{@const service = account ? serviceById.get(account.service_id)?.service_name ?? 'Utility' : 'Utility'}
					<tr><td><strong>{service}</strong><small>{account?.account_number ?? account?.account_name ?? '—'}</small></td><td>{bill.billing_month}/{bill.billing_year}</td><td>{date(bill.due_date)}</td><td><span class:paid={bill.status.toLowerCase() === 'paid'} class="status">{bill.status}</span></td><td>{money(bill.amount_due)}</td><td>{money(bill.amount_paid)}</td><td>{money(outstanding(bill))}</td></tr>
				{:else}<tr><td colspan="7" class="empty">No billing records are available for this report.</td></tr>{/each}
			</tbody></table></div>
		</section>
		<footer><span>QCU Cooperative · Utilities</span><span>Confidential administrative report</span></footer>
	</article>
</main>

<style>
	:global(body){background:#eef3fa}.summary-page{max-width:75rem;margin:0 auto;padding:1.5rem clamp(1rem,4vw,3rem) 3rem;color:#172b4d}.screen-actions{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:1rem}.back-link{display:inline-flex;align-items:center;gap:.5rem;color:#315783;text-decoration:none;font-size:.82rem;font-weight:800}.back-link:hover{color:#2563eb}.back-link span{font-size:1.2rem}.action-buttons{display:flex;gap:.55rem}.action-buttons button{min-height:2.6rem;border-radius:.5rem;padding:.65rem .9rem;font:inherit;font-size:.76rem;font-weight:800;cursor:pointer}.primary{border:1px solid #2563eb;background:#2563eb;color:white}.secondary{border:1px solid #cbd7e7;background:#fff;color:#334b6b}.export-error{border:1px solid #fecaca;border-radius:.5rem;background:#fff1f2;padding:.7rem;color:#b91c1c}.report-sheet{border:1px solid #d8e2ef;border-radius:1rem;background:#fff;padding:clamp(1.2rem,3vw,2.5rem);box-shadow:0 16px 42px #1a355012}.report-header{display:flex;align-items:center;gap:1rem;border-bottom:1px solid #e5ebf3;padding-bottom:1.5rem}.brand-mark{display:grid;width:3.2rem;height:3.2rem;flex:0 0 auto;place-items:center;border-radius:.85rem;background:#2563eb;color:white;font-size:1.7rem;font-weight:900}.report-title{flex:1}.eyebrow{margin:0 0 .35rem;color:#3476d5;font-size:.65rem;font-weight:900;letter-spacing:.13em;text-transform:uppercase}.report-title h1{margin:0;color:#122543;font-size:clamp(1.45rem,3vw,2rem);letter-spacing:-.04em}.report-title>p:last-child{margin:.35rem 0 0;color:#718198;font-size:.8rem}.report-period{text-align:right}.report-period span,.account-banner span{display:block;color:#8290a3;font-size:.58rem;font-weight:900;letter-spacing:.1em}.report-period strong,.report-period small{display:block;margin-top:.25rem}.report-period strong{color:#253a58;font-size:.8rem}.report-period small{color:#8290a3;font-size:.66rem}.account-banner{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin:1.2rem 0;padding:1rem 1.1rem;border:1px solid #dce7f4;border-radius:.7rem;background:#f6f9fd}.account-banner strong,.account-banner small{display:block;margin-top:.25rem}.account-banner strong{color:#213956;font-size:.9rem}.account-banner small{color:#75849a;font-size:.7rem}.account-banner>div:last-child{text-align:right}.account-banner>div:last-child strong{font-size:1.1rem}.metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.75rem}.metrics>div{border:1px solid #e1e8f1;border-radius:.7rem;padding:.9rem 1rem}.metrics span,.metrics small{display:block;color:#718198;font-size:.68rem}.metrics strong{display:block;margin:.35rem 0;color:#172b4d;font-size:1.15rem}.billing-section{margin-top:1.6rem}.section-title{display:flex;align-items:end;justify-content:space-between;margin-bottom:.65rem}.section-title h2{margin:0;color:#1b2e4a;font-size:1rem}.section-title>span{color:#718198;font-size:.68rem}.table-wrap{overflow-x:auto;border:1px solid #e0e7f0;border-radius:.65rem}table{width:100%;min-width:48rem;border-collapse:collapse;text-align:left}th,td{padding:.7rem .65rem;border-bottom:1px solid #e8edf4;font-size:.68rem}th{background:#f6f8fb;color:#60728a;font-size:.58rem;letter-spacing:.06em;text-transform:uppercase}td{color:#334761}td strong,td small{display:block}td small{margin-top:.18rem;color:#8290a3}.status{display:inline-block;border-radius:999px;background:#fff5df;padding:.22rem .5rem;color:#98630a;font-size:.6rem;font-weight:800;text-transform:capitalize}.status.paid{background:#e7f8ee;color:#168251}.empty{text-align:center;padding:2rem;color:#718198}footer{display:flex;justify-content:space-between;gap:1rem;margin-top:1.4rem;padding-top:.75rem;border-top:1px solid #e5ebf3;color:#8290a3;font-size:.62rem}
	:global(html[data-theme='dark'] .summary-page){color:#edf4ff}
	:global(html[data-theme='dark'] .summary-page .back-link){color:#9fc2ff}
	:global(html[data-theme='dark'] .summary-page .secondary){border-color:#415878;background:#172640;color:#edf4ff}
	:global(html[data-theme='dark'] .summary-page .report-sheet){border-color:#334866;background:#172640;color:#edf4ff;color-scheme:dark}
	:global(html[data-theme='dark'] .summary-page .report-header){border-color:#334866}
	:global(html[data-theme='dark'] .summary-page .report-sheet h1),:global(html[data-theme='dark'] .summary-page .report-sheet h2),:global(html[data-theme='dark'] .summary-page .report-sheet strong){color:#edf4ff!important}
	:global(html[data-theme='dark'] .summary-page .report-sheet p),:global(html[data-theme='dark'] .summary-page .report-sheet small),:global(html[data-theme='dark'] .summary-page .report-sheet span){color:#b8c8dd!important}
	:global(html[data-theme='dark'] .summary-page .report-sheet .eyebrow){color:#8eb5ff!important}
	:global(html[data-theme='dark'] .summary-page .report-sheet .metrics>div){border-color:#334866;background:#101d35}
	:global(html[data-theme='dark'] .summary-page .report-sheet .metrics strong){color:#edf4ff!important}
	:global(html[data-theme='dark'] .summary-page .report-sheet .account-banner){border-color:#334866;background:#1c2f4d}
	:global(html[data-theme='dark'] .summary-page .report-sheet .table-wrap){border-color:#334866;background:#101d35}
	:global(html[data-theme='dark'] .summary-page .report-sheet th){border-color:#334866;background:#101d35;color:#b8c8dd!important}
	:global(html[data-theme='dark'] .summary-page .report-sheet td){border-color:#334866;background:#172640;color:#dbe7fb!important}
	:global(html[data-theme='dark'] .summary-page .report-sheet td small){color:#a9bad0!important}
	:global(html[data-theme='dark'] .summary-page .report-sheet footer){border-color:#334866;color:#a9bad0}
	:global(html[data-theme='dark'] .summary-page .report-sheet .status){background:#49391a;color:#fcd979}
	:global(html[data-theme='dark'] .summary-page .report-sheet .status.paid){background:#153b34;color:#86efac}
	@media(max-width:600px){.screen-actions,.report-header{align-items:flex-start;flex-direction:column}.report-period{text-align:left}.metrics{grid-template-columns:1fr}.account-banner{align-items:flex-start;flex-direction:column}.account-banner>div:last-child{text-align:left}footer{flex-direction:column}}
	@media print{@page{size:landscape;margin:12mm}:global(body){background:#fff!important}.summary-page{max-width:none;padding:0;color:#172b4d!important}.screen-actions,.export-error{display:none!important}.report-sheet{border:0;border-radius:0;padding:0;box-shadow:none;background:#fff!important;color:#172b4d!important}.report-sheet :is(h1,h2,strong,td){color:#172b4d!important}.report-sheet :is(p,small,span,th){color:#475569!important}.account-banner,.metrics>div,.table-wrap,th,td{background:#fff!important}.table-wrap{overflow:visible}table{min-width:0;font-size:9pt}th,td{padding:6pt;font-size:8pt}.metrics>div,.account-banner,.report-sheet{break-inside:avoid}footer{margin-top:10mm}}
</style>
