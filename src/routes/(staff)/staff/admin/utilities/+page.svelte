<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	let { data, form }: { data: PageData; form?: { success?: boolean; message?: string; billAdded?: boolean; statusUpdated?: boolean } } = $props();
	let serviceDialog = $state<HTMLDialogElement>();
	let billDialog = $state<HTMLDialogElement>();
	let notificationOpen = $state(false);
	let serviceAdded = $state('');
	let billAdded = $state(false);
	let paymentUpdated = $state(false);
	let billAccountId = $state('');
	let billMonth = $state(new Date().getMonth() + 1);
	const money = (value: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value) || 0);
	const date = (value: string | null) => value ? new Intl.DateTimeFormat('en', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value.slice(0, 10)}T00:00:00`)) : '—';
	const serviceById = $derived(new Map(data.services.map((s) => [s.id, s])));
	const accountById = $derived(new Map(data.accounts.map((a) => [a.id, a])));
	const openBills = $derived(data.bills.filter((b) => !['paid', 'cancelled'].includes(b.status.toLowerCase())));
	const outstanding = (b: (typeof data.bills)[number]) => Math.max(0, Number(b.amount_due) - Number(b.amount_paid));
	const activeAccountCount = $derived(data.accounts.filter((account) => account.status.toLowerCase() === 'active').length);
	const currentBalance = $derived(openBills.reduce((sum, bill) => sum + outstanding(bill), 0));
	const ytdSpend = $derived(data.bills.filter((bill) => bill.payment_date?.slice(0, 4) === String(new Date().getFullYear())).reduce((sum, bill) => sum + Number(bill.amount_paid || 0), 0));
	const billingPeriod = (month: number, year: number) => new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(new Date(Date.UTC(year, month - 1, 1)));
	const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(
		new Date()
	);

	function onServiceSaved() {
		serviceAdded = 'Utility account';
		serviceDialog?.close();
	}

	function openBillDialog(accountId = '') {
		billAccountId = accountId;
		billDialog?.showModal();
	}
</script>

<svelte:head>
	<title>Utilities | QCU Coop Admin</title>
	<meta
		name="description"
		content="Review cooperative utility services, balances, and billing activity."
	/>
</svelte:head>

<main class="admin-page utilities-page">
	<header class="utility-topbar">
		<div>
			<h1>Utilities</h1>
			<p>Utilities overview</p>
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
					aria-expanded={notificationOpen}
					onclick={() => (notificationOpen = !notificationOpen)}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true"
						><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg
					>
				</button>
				{#if notificationOpen}
					<div class="notification-popover" role="status">
						<strong>You're all caught up</strong>
						<span>No new utility alerts.</span>
					</div>
				{/if}
			</div>
			<button class="avatar" type="button" aria-label="Administrator account">QC</button>
		</div>
	</header>

	{#if serviceAdded}
		<div class="toast" role="status">
			<strong>{serviceAdded}</strong> was added to this demo account.
			<button type="button" aria-label="Dismiss notification" onclick={() => (serviceAdded = '')}
				>×</button
			>
		</div>
	{/if}
	{#if billAdded}
		<div class="toast" role="status">Utility bill added to billing history.<button type="button" aria-label="Dismiss notification" onclick={() => (billAdded = false)}>×</button></div>
	{/if}
	{#if paymentUpdated}
		<div class="toast" role="status">Bill marked as paid and billing totals refreshed.<button type="button" aria-label="Dismiss notification" onclick={() => (paymentUpdated = false)}>×</button></div>
	{/if}
	{#if form?.message}
		<div class="form-alert" role="alert">{form.message}</div>
	{/if}

	<section class="accounts-section" aria-labelledby="utility-accounts-title">
		<div class="section-heading">
			<div>
				<h2 id="utility-accounts-title">Utility accounts</h2>
				<p>Track service accounts, outstanding bills, and payments in one place.</p>
			</div>
			<div class="section-actions">
				<a class="outline-button" href="/staff/admin/utilities/summary">
					<svg viewBox="0 0 24 24" aria-hidden="true"
						><path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.5" /><path d="M4 4v4.5h4.5M12 8v4l2.5 1.5" /></svg
					>
					Summary
				</a>
				<button class="primary-button" type="button" onclick={() => serviceDialog?.showModal()}>
					<span aria-hidden="true">+</span> Add service
				</button>
				<button class="primary-button" type="button" onclick={() => openBillDialog()}>
					<span aria-hidden="true">+</span> Add bill
				</button>
			</div>
		</div>

		<div class="account-stats">
			<article>
				<span>Active services</span><strong>{activeAccountCount}</strong><small class="positive"
					>of {data.accounts.length} utility accounts</small
				>
			</article>
			<article>
				<span>Outstanding balance</span><strong>{money(currentBalance)}</strong><small>Across {openBills.length} unpaid bills</small>
			</article>
			<article>
				<span>Paid this year</span><strong>{money(ytdSpend)}</strong><small
					>Recorded utility payments</small
				>
			</article>
		</div>

		<div class="account-table-wrap">
			<table class="account-table">
				<thead><tr><th>Service</th><th>Account</th><th>Service address</th><th>Billing contact</th><th>Cost center</th><th>Status</th><th></th></tr></thead>
				<tbody>
					{#each data.accounts as account (account.id)}
						{@const service = serviceById.get(account.service_id)}
						<tr>
							<td><strong>{service?.service_name ?? 'Utility'}</strong><small>{service?.provider || 'Provider not set'}</small></td>
							<td><strong>{account.account_name}</strong><small>{account.account_number || 'No account number'}</small></td>
							<td>{account.service_address || '—'}</td>
							<td><strong>{account.billing_contact || '—'}</strong><small>{account.contact_number || ''}</small></td>
							<td>{account.cost_center || '—'}</td>
							<td><span class="standing" class:inactive={account.status.toLowerCase() !== 'active'}><i></i>{account.status}</span></td>
							<td><button class="table-action" type="button" onclick={() => openBillDialog(String(account.id))}>Add bill</button></td>
						</tr>
					{:else}
						<tr><td colspan="7" class="billing-empty">No utility accounts yet. Add a service account to get started.</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
		<section class="billing-history-section" id="utility-summary" aria-labelledby="billing-history-title">
			<div class="section-heading"><div><h2 id="billing-history-title">Billing history</h2><p>Review billing periods, payment status, and remaining balances.</p></div><span class="billing-count">{data.bills.length} bills</span></div>
			<div class="history-table-wrap"><table><thead><tr><th>Service / account</th><th>Billing period</th><th>Due date</th><th>Status</th><th>Balance due</th><th>Action</th></tr></thead><tbody>
				{#each data.bills as bill (bill.id)}
					{@const billAccount = accountById.get(bill.utility_account_id)}
					{@const billService = serviceById.get(billAccount?.service_id ?? -1)?.service_name ?? 'Utility'}
					<tr><td><strong>{billService}</strong><small>{billAccount?.account_name ?? 'Account unavailable'}</small></td><td>{billingPeriod(bill.billing_month, bill.billing_year)}</td><td>{date(bill.due_date)}</td><td><span class="bill-status" class:paid={bill.status.toLowerCase() === 'paid'}>{bill.status}</span></td><td class="balance-value">{money(outstanding(bill))}</td><td>{#if bill.status.toLowerCase() !== 'paid' && bill.status.toLowerCase() !== 'cancelled'}<form method="POST" action="?/markBillPaid" use:enhance={() => async ({ update }) => { await update(); if (form?.success && form.statusUpdated) paymentUpdated = true; }}><input type="hidden" name="billId" value={bill.id} /><button class="table-action" type="submit">Mark paid</button></form>{:else}<span class="action-complete">—</span>{/if}</td></tr>
				{:else}<tr><td colspan="6" class="billing-empty">No billing records yet. Bills will appear here when they are added.</td></tr>{/each}
			</tbody></table></div>
		</section>
	</section>
</main>

<dialog bind:this={serviceDialog} class="utility-dialog">
	<form method="POST" action="?/addService" use:enhance={() => async ({ update }) => { await update(); if (form?.success) onServiceSaved(); }}>
		<div class="dialog-heading">
			<div>
				<span class="dialog-eyebrow">Utility account</span>
				<h2>Add a service</h2>
			</div>
			<button
				class="dialog-close"
				type="button"
				aria-label="Close dialog"
				onclick={() => serviceDialog?.close()}>×</button
			>
		</div>
		<p class="dialog-copy">Create a utility service and its campus account.</p>
		<label
			>Service<select name="serviceId" required><option value="">Choose a service</option>{#each data.services as service (service.id)}<option value={service.id}>{service.service_name}{service.provider ? ` · ${service.provider}` : ''}</option>{/each}</select></label
		>
		<label>Account number<input name="accountNumber" maxlength="80" required /></label>
		<label>Account name<input name="accountName" maxlength="120" required /></label>
		<label>Service address<input name="serviceAddress" maxlength="240" /></label>
		<label>Billing contact<input name="billingContact" maxlength="160" /></label>
		<label>Contact number<input name="contactNumber" maxlength="40" /></label>
		<label>Cost center<input name="costCenter" maxlength="80" /></label>
		<div class="dialog-actions">
			<button class="outline-button" type="button" onclick={() => serviceDialog?.close()}
				>Cancel</button
			>
			<button class="primary-button" type="submit">Add service</button>
		</div>
	</form>
</dialog>

<dialog bind:this={billDialog} class="utility-dialog">
	<form method="POST" action="?/addBill" use:enhance={() => async ({ update }) => { await update(); if (form?.success && form.billAdded) { billDialog?.close(); billAdded = true; billAccountId = ''; } }}>
		<div class="dialog-heading"><div><span class="dialog-eyebrow">Utility billing</span><h2>Add a bill</h2></div><button class="dialog-close" type="button" aria-label="Close dialog" onclick={() => billDialog?.close()}>×</button></div>
		<p class="dialog-copy">Record a utility bill. It will appear in billing history as soon as it is saved.</p>
		<label>Utility account<select name="accountId" bind:value={billAccountId} required><option value="">Choose an account</option>{#each data.accounts as account (account.id)}<option value={String(account.id)}>{account.account_name}{account.account_number ? ` · ${account.account_number}` : ''}</option>{/each}</select></label>
		<label>Billing month<select name="billingMonth" bind:value={billMonth} required>{#each Array.from({ length: 12 }, (_, i) => i + 1) as month}<option value={month}>{new Intl.DateTimeFormat('en', { month: 'long' }).format(new Date(2020, month - 1, 1))}</option>{/each}</select></label>
		<label>Billing year<input name="billingYear" type="number" min="2000" max="9999" value={new Date().getFullYear()} required /></label>
		<label>Amount due (₱)<input name="amountDue" type="number" min="0.01" step="0.01" required /></label>
		<label>Amount paid (₱)<input name="amountPaid" type="number" min="0" step="0.01" value="0" /></label>
		<label>Due date<input name="dueDate" type="date" /></label>
		<label>Payment date<input name="paymentDate" type="date" /></label>
		<label>Official receipt number<input name="receiptNumber" maxlength="100" /></label>
		<label class="wide-field">Remarks<input name="remarks" maxlength="500" placeholder="Optional note" /></label>
		<div class="dialog-actions"><button class="outline-button" type="button" onclick={() => billDialog?.close()}>Cancel</button><button class="primary-button" type="submit" disabled={data.accounts.length === 0}>Save bill</button></div>
	</form>
</dialog>



<style>
	.utilities-page {
		padding-top: 0;
	}
	.utility-topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 3.9rem;
		margin: 0 calc(clamp(1rem, 3vw, 3rem) * -1) 1rem;
		border-bottom: 1px solid #e5e9ef;
		background: #fff;
		padding: 0.55rem clamp(1rem, 3vw, 3rem);
	}
	.utility-topbar h1 {
		margin: 0;
		color: #172b4d;
		font-size: 0.88rem;
		font-weight: 900;
	}
	.utility-topbar p {
		margin: 0.1rem 0 0;
		color: #7f8a9b;
		font-size: 0.62rem;
	}
	.topbar-actions,
	.section-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.date-chip {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		border: 1px solid #e2e6ec;
		border-radius: 0.45rem;
		background: #f8f9fb;
		color: #778397;
		padding: 0.42rem 0.62rem;
		font-size: 0.6rem;
	}
	.date-chip svg,
	.icon-button svg,
	.outline-button svg,
	.activity-link svg {
		width: 0.85rem;
		height: 0.85rem;
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 1.8;
	}
	.icon-button,
	.avatar {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
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
		font-size: 0.58rem;
		font-weight: 900;
	}
	.notification-wrap {
		position: relative;
	}
	.notification-popover {
		position: absolute;
		z-index: 5;
		top: calc(100% + 0.6rem);
		right: 0;
		display: grid;
		gap: 0.3rem;
		width: 12rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.6rem;
		background: white;
		box-shadow: 0 12px 30px #182b471c;
		padding: 0.8rem;
	}
	.notification-popover strong {
		color: #1d2c47;
		font-size: 0.66rem;
	}
	.notification-popover span {
		color: #8490a2;
		font-size: 0.6rem;
	}
	.account-card,
	.activity-card {
		border: 1px solid #e4eaf2;
		border-radius: 0.8rem;
		background: white;
		box-shadow: 0 8px 24px rgba(32, 55, 88, 0.04);
	}
	.heading-icon {
		width: 1.65rem;
		height: 1.65rem;
		flex: 0 0 auto;
		border-radius: 50%;
		background: #eff6ff;
	}
	.heading-copy {
		min-width: 0;
		flex: 1;
	}
	.section-heading h2 {
		margin: 0;
		color: #172b4d;
		font-size: 0.94rem;
		font-weight: 900;
	}
	.section-heading p {
		margin: 0.2rem 0 0;
		color: #8290a2;
		font-size: 0.61rem;
	}
	.outline-button,
	.primary-button {
		display: inline-flex;
		min-height: 2rem;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		border: 1px solid #e1e6ed;
		border-radius: 0.48rem;
		background: white;
		color: #44536a;
		padding: 0.42rem 0.72rem;
		font: inherit;
		font-size: 0.61rem;
		font-weight: 700;
		text-decoration: none;
		white-space: nowrap;
		cursor: pointer;
	}
	.outline-button:hover {
		background: #f8fafc;
	}
	.primary-button {
		border-color: #2563eb;
		background: #2563eb;
		color: white;
	}
	.primary-button:hover {
		background: #1d4ed8;
	}
	.primary-button span {
		font-size: 1rem;
		line-height: 0.8;
	}
	.overview-panel {
		margin: 1.1rem 0 0.9rem;
		border: 1px solid #314d77;
		border-radius: 1rem;
		background: linear-gradient(180deg, #1b2a43 0%, #14263f 100%);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
		padding: 1rem 1.1rem 0.9rem;
		color: #edf4ff;
	}
	.overview-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.9rem;
	}
	.overview-title-wrap {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.overview-badge {
		display: inline-block;
		width: 1.05rem;
		height: 1.05rem;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.8);
		box-shadow: inset 0 0 0 2px #1c2d48;
	}
	.overview-header h2 {
		margin: 0;
		color: #edf4ff;
		font-size: 1.1rem;
		font-weight: 900;
	}
	.overview-header p {
		margin: 0.2rem 0 0;
		color: #adbed9;
		font-size: 0.62rem;
	}
	.overview-report-button {
		border-color: rgba(255, 255, 255, 0.16);
		background: rgba(10, 18, 31, 0.28);
		color: #edf4ff;
	}
	.overview-report-button svg {
		width: 0.8rem;
		height: 0.8rem;
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 1.8;
	}
	.overview-stat-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.7rem;
	}
	.overview-stat-grid article {
		min-width: 0;
		border: 1px solid rgba(148, 166, 198, 0.24);
		border-radius: 0.75rem;
		background: rgba(255, 255, 255, 0.02);
		padding: 0.8rem 0.9rem 0.7rem;
	}
	.overview-stat-grid span {
		display: block;
		color: #aebdcb;
		font-size: 0.52rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.overview-stat-grid strong {
		display: block;
		margin-top: 0.22rem;
		color: #edf4ff;
		font-size: 1.2rem;
		font-weight: 900;
		letter-spacing: -0.03em;
	}
	.overview-link-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.7rem;
		margin-top: 0.8rem;
	}
	.overview-link-card {
		display: block;
		border: 1px solid rgba(148, 166, 198, 0.24);
		border-radius: 0.75rem;
		background: rgba(255, 255, 255, 0.02);
		padding: 0.8rem 0.9rem;
		color: #edf4ff;
		text-decoration: none;
	}
	.overview-link-card strong {
		display: block;
		color: inherit;
		font-size: 0.74rem;
		font-weight: 900;
	}
	.overview-link-card span {
		display: block;
		margin-top: 0.2rem;
		color: #aebdcb;
		font-size: 0.58rem;
	}
	.accounts-section {
		margin-top: 0.95rem;
	}
	.billing-history-section {
		margin-top: 1rem;
		border: 1px solid #e1e8f1;
		border-radius: 0.8rem;
		background: #fff;
		padding: 1.1rem;
	}
	.history-table-wrap { overflow-x: auto; border: 1px solid #e5ebf3; border-radius: 0.65rem; }
	.history-table-wrap table { width: 100%; min-width: 44rem; border-collapse: collapse; text-align: left; }
	.history-table-wrap th, .history-table-wrap td { border-bottom: 1px solid #e5ebf3; padding: 0.78rem 0.85rem; font-size: 0.76rem; }
	.history-table-wrap th { background: #f5f8fc; color: #61728a; font-size: 0.66rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.035em; }
	.history-table-wrap td { color: #293a56; }
	.history-table-wrap tbody tr:last-child td { border-bottom: 0; }
	.history-table-wrap td:first-child strong, .history-table-wrap td:first-child small { display: block; }
	.history-table-wrap td:first-child small { margin-top: 0.18rem; color: #8491a3; }
	.history-table-wrap td:last-child, .history-table-wrap th:last-child { text-align: right; }
	.billing-count { flex: 0 0 auto; border-radius: 2rem; background: #edf4ff; color: #356bc2; padding: 0.4rem 0.7rem; font-size: 0.7rem; font-weight: 800; }
	.bill-status { display: inline-flex; border-radius: 2rem; background: #fff4df; color: #9a6500; padding: 0.25rem 0.55rem; font-size: 0.68rem; font-weight: 800; text-transform: capitalize; }
	.bill-status.paid { background: #e9fbf1; color: #09834b; }
	.balance-value { font-weight: 800; white-space: nowrap; }
	.history-table-wrap td form { margin: 0; }
	.action-complete { color: #8491a3; }
	.billing-empty { height: 5rem; color: #718096 !important; text-align: center !important; }
	.account-empty { display: grid; justify-items: start; gap: 0.55rem; border: 1px dashed #cbd6e4; border-radius: 0.8rem; background: #f8fafd; padding: 1.2rem; color: #64748b; }
	.account-empty strong { color: #26364f; }
	.account-table-wrap { overflow-x: auto; margin-top: 0.9rem; border: 1px solid #e1e8f1; border-radius: 0.8rem; background: #fff; }
	.account-table { width: 100%; min-width: 62rem; border-collapse: collapse; text-align: left; }
	.account-table th, .account-table td { border-bottom: 1px solid #e7edf4; padding: 0.8rem 0.9rem; font-size: 0.75rem; vertical-align: middle; }
	.account-table th { background: #f5f8fc; color: #61728a; font-size: 0.64rem; font-weight: 850; text-transform: uppercase; letter-spacing: 0.035em; white-space: nowrap; }
	.account-table tbody tr:last-child td { border-bottom: 0; }
	.account-table tbody tr:hover { background: #f8fafd; }
	.account-table td strong, .account-table td small { display: block; }
	.account-table td strong { color: #293a56; font-size: 0.75rem; }
	.account-table td small { margin-top: 0.18rem; color: #8491a3; font-size: 0.68rem; }
	.table-action { border: 1px solid #c9d9f2; border-radius: 0.45rem; background: #f4f8ff; color: #2868cf; padding: 0.45rem 0.65rem; font: inherit; font-weight: 800; white-space: nowrap; cursor: pointer; }
	.table-action:hover { background: #e7f0ff; }
	.form-alert { margin: 0 0 0.8rem; border: 1px solid #f0c2c2; border-radius: 0.55rem; background: #fff4f4; color: #9d3434; padding: 0.65rem 0.8rem; font-size: 0.75rem; }
	.section-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.6rem;
	}
	.section-heading h2 {
		font-size: 0.82rem;
	}
	.section-heading p {
		font-size: 0.59rem;
	}
	.account-stats {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.85rem;
		width: 100%;
	}
	.account-stats article {
		min-width: 0;
		border: 1px solid #e4eaf2;
		border-radius: 0.7rem;
		background: white;
		padding: 1rem 1.1rem;
		box-shadow: 0 5px 16px rgba(32, 55, 88, 0.04);
	}
	.account-stats article > span {
		color: #718096;
		font-size: 0.72rem;
		font-weight: 750;
	}
	.account-stats strong {
		display: block;
		margin-top: 0.28rem;
		color: #1b2d4b;
		font-size: 1.25rem;
		font-weight: 900;
		letter-spacing: -0.015em;
	}
	.account-stats small {
		display: block;
		margin-top: 0.16rem;
		color: #8793a4;
		font-size: 0.68rem;
	}
	.account-stats .positive {
		color: #16a05b;
	}
	.account-stats .due {
		color: #e75121;
	}
	.account-layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		align-items: start;
		gap: 0.85rem;
		margin-top: 0.9rem;
	}
	.account-card {
		min-width: 0;
		padding: 1.2rem 1.3rem;
	}
	.account-title-row {
		display: flex;
		align-items: center;
		gap: 0.55rem;
	}
	.service-mark {
		display: grid;
		width: 1.75rem;
		height: 1.75rem;
		flex: 0 0 auto;
		place-items: center;
		border-radius: 0.45rem;
		background: #eff6ff;
		color: #4c8bff;
	}
	.service-mark svg {
		width: 1.05rem;
		height: 1.05rem;
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 1.5;
	}
	.account-title {
		min-width: 0;
		flex: 1;
	}
	.account-title h3,
	.activity-heading h3 {
		margin: 0;
		color: #1b2b46;
		font-size: 0.9rem;
		font-weight: 900;
	}
	.account-title p {
		margin: 0.15rem 0 0;
		color: #8a96a7;
		font-size: 0.7rem;
	}
	.standing {
		display: inline-flex;
		align-items: center;
		gap: 0.32rem;
		border-radius: 1rem;
		background: #e9fbf1;
		color: #099754;
		padding: 0.28rem 0.5rem;
		font-size: 0.68rem;
		font-weight: 800;
		white-space: nowrap;
	}
	.standing i {
		width: 0.34rem;
		height: 0.34rem;
		border-radius: 50%;
		background: #0bbd70;
	}
	.account-details {
		display: grid;
		grid-template-columns: 1.2fr 1fr 0.9fr;
		gap: 0.8rem;
		margin-top: 0.75rem;
		padding-left: 2.3rem;
	}
	.account-details div {
		min-width: 0;
	}
	.account-details span,
	.account-details strong,
	.account-details small {
		display: block;
	}
	.account-details span {
		color: #718096;
		font-size: 0.64rem;
		font-weight: 800;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}
	.account-details strong {
		overflow: hidden;
		margin-top: 0.18rem;
		color: #293a56;
		font-size: 0.75rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.account-details small {
		margin-top: 0.18rem;
		color: #8c98a9;
		font-size: 0.68rem;
	}
	.service-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
		margin: 0.65rem 0 0 2.3rem;
	}
	.service-list span {
		display: grid;
		gap: 0.08rem;
		border-radius: 0.45rem;
		background: #f2f6fc;
		color: #61728a;
		padding: 0.28rem 0.45rem;
		font-size: 0.66rem;
	}
	.service-list strong {
		color: inherit;
		font-size: inherit;
	}
	.service-list small {
		color: #8b97a8;
		font-size: 0.61rem;
	}
	.activity-card {
		padding: 0.75rem 0.8rem;
	}
	.activity-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.3rem;
	}
	.activity-link {
		display: grid;
		width: 1.25rem;
		height: 1.25rem;
		place-items: center;
		border: 0;
		background: transparent;
		color: #26364f;
		cursor: pointer;
	}
	.activity-item {
		position: relative;
		display: grid;
		grid-template-columns: 0.35rem minmax(0, 1fr);
		column-gap: 0.4rem;
		margin-left: 0.08rem;
		border-left: 2px solid #e8edf4;
		padding: 0.38rem 0 0.38rem 0.45rem;
	}
	.activity-marker {
		position: absolute;
		top: 0.51rem;
		left: -0.22rem;
		width: 0.35rem;
		height: 0.35rem;
		border: 1px solid white;
		border-radius: 50%;
		background: #21ba76;
	}
	.activity-marker.blue {
		background: #4285f4;
	}
	.activity-marker.teal {
		background: #20b7a4;
	}
	.activity-label {
		grid-column: 2;
		color: #8591a2;
		font-size: 0.53rem;
	}
	.activity-item strong {
		grid-column: 2;
		margin-top: 0.06rem;
		color: #1e2f4a;
		font-size: 0.6rem;
	}
	.activity-item small {
		grid-column: 2;
		margin-top: 0.06rem;
		color: #98a2b1;
		font-size: 0.5rem;
	}
	.toast {
		display: flex;
		align-items: center;
		gap: 0.22rem;
		margin: 0 0 0.75rem;
		border: 1px solid #bcebd2;
		border-radius: 0.5rem;
		background: #effcf5;
		color: #168251;
		padding: 0.55rem 0.7rem;
		font-size: 0.62rem;
	}
	.toast button {
		margin-left: auto;
		border: 0;
		background: transparent;
		color: inherit;
		font-size: 1rem;
		cursor: pointer;
	}
	.utility-dialog {
		position: fixed;
		inset: 50% auto auto 50%;
		transform: translate(-50%, -50%);
		margin: 0;
		box-sizing: border-box;
		width: min(46rem, calc(100vw - 2rem));
		max-width: none;
		max-height: calc(100dvh - 2rem);
		overflow-y: auto;
		border: 1px solid rgba(142, 168, 208, 0.3);
		border-radius: 1rem;
		background: linear-gradient(180deg, rgba(12, 25, 43, 0.97), rgba(18, 32, 53, 0.97));
		box-shadow: 0 30px 90px rgba(2, 10, 28, 0.5);
		padding: 1.2rem 1.3rem 1rem;
		color: #edf4ff;
	}
	.utility-dialog form {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.9rem 1.1rem;
	}
	.utility-dialog form .dialog-heading,
	.utility-dialog form .dialog-copy,
	.utility-dialog form .dialog-actions { grid-column: 1 / -1; }
	.utility-dialog form > .wide-field { grid-column: 1 / -1; }
	.utility-dialog form > label { min-width: 0; }
	.utility-dialog::backdrop {
		background: rgba(7, 19, 35, 0.72);
		backdrop-filter: blur(2px);
	}
	.dialog-heading {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.25rem;
	}
	.dialog-eyebrow {
		color: #8ab7ff;
		font-size: 0.7rem;
		font-weight: 900;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}
	.dialog-heading h2 {
		margin: 0.3rem 0 0;
		color: #edf4ff;
		font-size: 1.5rem;
		line-height: 1.2;
		font-weight: 900;
	}
	.dialog-close {
		width: 2.35rem;
		height: 2.35rem;
		border: 0;
		border-radius: 50%;
		background: #eef2f8;
		color: #0f2139;
		font-size: 1.3rem;
		font-weight: 700;
		cursor: pointer;
		flex-shrink: 0;
	}
	.dialog-copy {
		margin: 0 0 0.7rem;
		color: #a9bfdc;
		font-size: 0.72rem;
		line-height: 1.5;
	}
	.utility-dialog form > label {
		display: block;
		margin-top: 0.1rem;
		color: #edf4ff;
		font-size: 0.8rem;
		font-weight: 800;
	}
	.utility-dialog select,
	.utility-dialog input {
		display: block;
		box-sizing: border-box;
		width: 100%;
		margin-top: 0.45rem;
		border: 1px solid rgba(140, 169, 211, 0.45);
		border-radius: 0.7rem;
		background: rgba(13, 26, 44, 0.85);
		color: #edf4ff;
		padding: 0.7rem 0.8rem;
		font: inherit;
		font-size: 0.76rem;
	}
	.utility-dialog select {
		appearance: none;
		background-image: linear-gradient(45deg, transparent 50%, #cfe0ff 50%), linear-gradient(135deg, #cfe0ff 50%, transparent 50%);
		background-position: calc(100% - 1.2rem) calc(50% - 0.15rem), calc(100% - 0.9rem) calc(50% - 0.15rem);
		background-size: 0.35rem 0.35rem, 0.35rem 0.35rem;
		background-repeat: no-repeat;
		padding-right: 2.5rem;
	}
	.utility-dialog input::placeholder {
		color: #8093b0;
	}
	.utility-dialog input:focus,
	.utility-dialog select:focus { outline: 2px solid #3f8cff; outline-offset: 1px; }
	.optional {
		color: #98a2b1;
		font-weight: 500;
	}
	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.7rem;
		margin-top: 0.5rem;
	}
	.dialog-actions .outline-button {
		border-color: rgba(184, 203, 230, 0.26);
		background: rgba(255, 255, 255, 0.03);
		color: #edf4ff;
		padding: 0.68rem 1.2rem;
		border-radius: 0.7rem;
		min-height: 2.5rem;
	}
	.dialog-actions .primary-button {
		padding: 0.72rem 1.5rem;
		min-height: 2.5rem;
		border-radius: 0.7rem;
		font-weight: 800;
	}
	.history-list {
		border-top: 1px solid #edf1f5;
	}
	.history-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		border-bottom: 1px solid #edf1f5;
		padding: 0.75rem 0.1rem;
	}
	.history-row div,
	.history-row span {
		display: block;
	}
	.history-row strong {
		color: #293a56;
		font-size: 0.63rem;
	}
	.history-row span {
		margin-top: 0.2rem;
		color: #8b97a8;
		font-size: 0.56rem;
	}
	.history-row b {
		color: #1f304c;
		font-size: 0.65rem;
		white-space: nowrap;
	}
	:global(html[data-theme='dark'] .utilities-page .utility-topbar),
	:global(html[data-theme='dark'] .utilities-page .account-card),
	:global(html[data-theme='dark'] .utilities-page .activity-card),
	:global(html[data-theme='dark'] .utilities-page .account-stats article),
	:global(html[data-theme='dark'] .utilities-page .billing-history-section),
	:global(html[data-theme='dark'] .utilities-page .account-table-wrap),
	:global(html[data-theme='dark'] .utilities-page .account-empty),
	:global(html[data-theme='dark'] .utilities-page .notification-popover),
	:global(html[data-theme='dark'] .utility-dialog) {
		border-color: #334866;
		background: #172640;
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .utilities-page .history-table-wrap) { border-color: #334866; }
	:global(html[data-theme='dark'] .utilities-page .account-table-wrap) { border-color: #334866; background: #172640; }
	:global(html[data-theme='dark'] .utilities-page .account-table th) { border-color: #334866; background: #101e34; color: #b8c8dd; }
	:global(html[data-theme='dark'] .utilities-page .account-table td) { border-color: #334866; color: #edf4ff; }
	:global(html[data-theme='dark'] .utilities-page .account-table td strong) { color: #edf4ff; }
	:global(html[data-theme='dark'] .utilities-page .account-table td small) { color: #aebdcb; }
	:global(html[data-theme='dark'] .utilities-page .account-table tbody tr:hover) { background: #1c2e49; }
	:global(html[data-theme='dark'] .utilities-page .table-action) { border-color: #415878; background: #172640; color: #8ab7ff; }
	:global(html[data-theme='dark'] .utilities-page .form-alert) { border-color: #74434b; background: #3c242c; color: #ffc6c6; }
	:global(html[data-theme='dark'] .utilities-page .history-table-wrap th) { border-color: #334866; background: #101e34; color: #b8c8dd; }
	:global(html[data-theme='dark'] .utilities-page .history-table-wrap td) { border-color: #334866; color: #edf4ff; }
	:global(html[data-theme='dark'] .utilities-page .history-table-wrap td:first-child small),
	:global(html[data-theme='dark'] .utilities-page .billing-empty) { color: #aebdcb !important; }
	:global(html[data-theme='dark'] .utilities-page .billing-count) { background: #243a59; color: #c1d0e4; }
	:global(html[data-theme='dark'] .utilities-page .account-empty) { border-color: #415878; color: #b8c8dd; }
	:global(html[data-theme='dark'] .utilities-page .account-empty strong) { color: #edf4ff; }
	:global(html[data-theme='dark'] .utilities-page .standing.inactive) { background: #3b2b22; color: #ffcf9c; }
	:global(html[data-theme='dark'] .utilities-page .bill-status:not(.paid)) { background: #4a3a1c; color: #ffdb8a; }
	:global(html[data-theme='dark'] .utilities-page .bill-status.paid) { background: #123b31; color: #82e2b0; }
	:global(html[data-theme='dark'] .utilities-page h1),
	:global(html[data-theme='dark'] .utilities-page h2),
	:global(html[data-theme='dark'] .utilities-page h3),
	:global(html[data-theme='dark'] .utilities-page strong),
	:global(html[data-theme='dark'] .utilities-page .account-stats strong),
	:global(html[data-theme='dark'] .utilities-page .activity-item strong) {
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .utilities-page .outline-button),
	:global(html[data-theme='dark'] .utilities-page .icon-button) {
		border-color: #415878;
		background: #172640;
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .utilities-page .service-list span) {
		background: #243a59;
		color: #c1d0e4;
	}
	:global(html[data-theme='dark'] .utilities-page .service-list small) {
		color: #b8c8dd;
	}
	@media (max-width: 820px) {
		.account-layout { grid-template-columns: minmax(0, 1fr); }
		.standing { font-size: 0.64rem; }
		.account-details {
			grid-template-columns: 1fr 1fr;
		}
		.account-details div:last-child {
			grid-column: 1 / -1;
		}
	}
	@media (max-width: 640px) {
		.utility-topbar {
			min-height: 3.5rem;
		}
		.account-stats {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.account-stats article:last-child { grid-column: 1 / -1; }
		.account-layout {
			grid-template-columns: 1fr;
		}
		.section-heading {
			align-items: flex-start;
		}
		.section-actions {
			flex-wrap: wrap;
			justify-content: flex-end;
		}
		.account-details {
			padding-left: 0;
		}
		.service-list {
			margin-left: 0;
		}
	}
	@media (max-width: 420px) {
		.utility-dialog { width: calc(100vw - 1rem); max-height: calc(100dvh - 1rem); padding: 1rem; }
		.utility-dialog form { grid-template-columns: 1fr; }
		.utility-dialog form > * { grid-column: 1; }
		.date-chip {
			font-size: 0;
		}
		.date-chip svg {
			width: 0.95rem;
			height: 0.95rem;
		}
		.section-heading {
			flex-direction: column;
		}
		.section-actions {
			width: 100%;
			justify-content: flex-start;
		}
		.account-title-row {
			flex-wrap: wrap;
		}
		.standing {
			margin-left: 2.3rem;
		}
		.account-details {
			grid-template-columns: 1fr;
		}
		.account-details div:last-child {
			grid-column: auto;
		}
	}
</style>



