<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	let { data, form }: { data: PageData; form?: { success?: boolean; message?: string } } = $props();
	type BillingActivity = {
		label: string;
		amount: string;
		date: string;
		tone: string;
	};

		let serviceDialog = $state<HTMLDialogElement>();
	let billingDialog = $state<HTMLDialogElement>();
	let serviceName = $state('');
	let serviceAdded = $state('');
	const money = (value: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value) || 0);
	const date = (value: string | null) => value ? new Intl.DateTimeFormat('en', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value.slice(0, 10)}T00:00:00`)) : '—';
	const serviceById = $derived(new Map(data.services.map((s) => [s.id, s])));
	const accountById = $derived(new Map(data.accounts.map((a) => [a.id, a])));
	const utilityServices = $derived(
		data.accounts.slice(0, 5).map((account) => {
			const service = serviceById.get(account.service_id);
			return {
				name: service?.service_name ?? 'Utility Service',
				provider: service?.provider ?? '',
				account: account.account_number ?? account.account_name
			};
		})
	);
	const openBills = $derived(data.bills.filter((b) => !['paid', 'cancelled'].includes(b.status.toLowerCase())));
	const outstanding = (b: (typeof data.bills)[number]) => Math.max(0, Number(b.amount_due) - Number(b.amount_paid));
	const nextBill = $derived(
		openBills.filter((b) => b.due_date).sort((a, b) => a.due_date!.localeCompare(b.due_date!))[0]
	);
	const billingActivity: BillingActivity[] = $derived(
		data.bills.slice(0, 5).map((b) => ({
			label: `${serviceById.get(accountById.get(b.utility_account_id)?.service_id ?? -1)?.service_name ?? 'Utility'} bill � ${b.status}`,
			amount: money(outstanding(b)),
			date: date(b.created_at),
			tone: b.status.toLowerCase() === 'paid' ? 'green' : 'blue'
		}))
	);

	function onServiceSaved() {
		serviceAdded = serviceName.trim();
		serviceName = '';
		serviceDialog?.close();
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
	{#if serviceAdded}
		<div class="toast" role="status">
			<strong>{serviceAdded}</strong> was added to this demo account.
			<button type="button" aria-label="Dismiss notification" onclick={() => (serviceAdded = '')}
				>×</button
			>
		</div>
	{/if}

	<section class="overview-panel" aria-labelledby="operations-overview-title">
		<div class="overview-header">
			<div class="overview-title-wrap">
				<span class="overview-badge" aria-hidden="true"></span>
				<div>
					<h2 id="operations-overview-title">Operations overview</h2>
					<p>Here what is happening across the cooperative store today.</p>
				</div>
			</div>
			<button class="outline-button overview-report-button" type="button">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19.5h12M8 16V8m4 8V5m4 11v-6" /><path d="M3.5 20.5h17" /></svg>
				View reports
			</button>
		</div>

		<div class="overview-stat-grid">
			<article>
				<span>Gross sales</span>
				<strong>₱284,620</strong>
			</article>
			<article>
				<span>Units moved</span>
				<strong>1,846</strong>
			</article>
			<article>
				<span>Low stock items</span>
				<strong>18</strong>
			</article>
			<article>
				<span>Non-selling items</span>
				<strong>24</strong>
			</article>
		</div>

		<div class="overview-link-grid">
			<a href="#!" class="overview-link-card">
				<strong>Inventory Management</strong>
				<span>Review stock, purchasing, and item records</span>
			</a>
			<a href="#!" class="overview-link-card">
				<strong>Reports Engine</strong>
				<span>Review sales and cooperative performance</span>
			</a>
		</div>
	</section>

	<section class="accounts-section" aria-labelledby="utility-accounts-title">
		<div class="section-heading">
			<div>
				<h2 id="utility-accounts-title">Utility accounts</h2>
				<p>Monitor active campus services, balances, and due dates.</p>
			</div>
			<div class="section-actions">
				<button class="outline-button" type="button" onclick={() => billingDialog?.showModal()}>
					<svg viewBox="0 0 24 24" aria-hidden="true"
						><path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.5" /><path d="M4 4v4.5h4.5M12 8v4l2.5 1.5" /></svg
					>
					Billing history
				</button>
				<button class="primary-button" type="button" onclick={() => serviceDialog?.showModal()}>
					<span aria-hidden="true">+</span> Add service
				</button>
			</div>
		</div>

		<div class="account-stats">
			<article>
				<span>Active services</span><strong>{data.accounts.filter((a) => a.status.toLowerCase() === 'active').length}</strong><small class="positive"
					>All services operational</small
				>
			</article>
			<article>
				<span>Current balance</span><strong>₱18,940.75</strong><small>Across {openBills.length} open bills</small>
			</article>
			<article>
				<span>Next due date</span>
				<strong>{nextBill ? date(nextBill.due_date).replace(/ \d{4}$/, '') : '—'}</strong>
				<small class={openBills.length ? 'due' : ''}>
					{openBills.length ? `Electricity · ${money(nextBill?.amount_due ?? 0)}` : 'No open bills'}
				</small>
			</article>
			<article>
				<span>YTD utility spend</span><strong>₱186,420</strong><small class="positive"
					>↓ 4.8% versus 2025</small
				>
			</article>
		</div>

		<div class="account-layout">
			<article class="account-card">
				<div class="account-title-row">
					<div class="service-mark" aria-hidden="true">
						<svg viewBox="0 0 24 24"
							><path d="M4 20V9l4 2V6l4 3V4l8 4v12Z" /><path
								d="M8 20v-4h3v4m3-7h1m-1 3h1m3-3h1m-1 3h1"
							/></svg
						>
					</div>
					<div class="account-title">
						<h3>QCU Coop Store Operations</h3>
						<p>Master account · UT-02-01974</p>
					</div>
					<span class="standing"><i></i> Account in good standing</span>
				</div>
				<div class="account-details">
					<div>
						<span>Service address</span><strong>QCU Main Building, Ground Floor</strong><small
							>San Bartolome, Novaliches</small
						>
					</div>
					<div>
						<span>Billing contact</span><strong>cooperative@qcu.edu.ph</strong><small
							>(02) 8806 3470 local 214</small
						>
					</div>
					<div>
						<span>Cost center</span><strong>COOP-OPS-014</strong><small
							>Campus auxiliary services</small
						>
					</div>
				</div>
				<div class="service-list" aria-label="Services on this account">
					{#each utilityServices as service (service.name + ':' + service.account)}
						<span title={[service.provider, service.account].filter(Boolean).join(' · ')}>
							<strong>{service.name}</strong>
							{#if service.provider || service.account}
								<small>{[service.provider, service.account].filter(Boolean).join(' · ')}</small>
							{/if}
						</span>
					{/each}
				</div>
			</article>

			<aside class="activity-card" aria-labelledby="recent-billing-title">
				<div class="activity-heading">
					<h3 id="recent-billing-title">Recent billing activity</h3>
					<button
						type="button"
						class="activity-link"
						aria-label="Open billing history"
						onclick={() => billingDialog?.showModal()}
					>
						<svg viewBox="0 0 24 24" aria-hidden="true"
							><path d="M14 4h6v6M20 4l-9 9" /><path
								d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"
							/></svg
						>
					</button>
				</div>
				{#each billingActivity as activity}
					<div class="activity-item">
						<span class={`activity-marker ${activity.tone}`}></span>
						<span class="activity-label">{activity.label}</span>
						<strong>{activity.amount}</strong>
						<small>{activity.date}</small>
					</div>
				{/each}
			</aside>
		</div>
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

<dialog bind:this={billingDialog} class="utility-dialog billing-dialog">
	<div class="dialog-heading">
		<div>
			<span class="dialog-eyebrow">Utility account</span>
			<h2>Billing history</h2>
		</div>
		<button
			class="dialog-close"
			type="button"
			aria-label="Close dialog"
			onclick={() => billingDialog?.close()}>×</button
		>
	</div>
	<p class="dialog-copy">Recent account activity · QCU Coop Store Operations</p>
	<div class="history-list">
		{#each billingActivity as activity}
			<div class="history-row">
				<div><strong>{activity.label}</strong><span>{activity.date}</span></div>
				<b>{activity.amount}</b>
			</div>
		{/each}
	</div>
	<div class="dialog-actions">
		<button class="primary-button" type="button" onclick={() => billingDialog?.close()}>Done</button
		>
	</div>
</dialog>

<style>
	.section-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
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
		grid-template-columns: repeat(4, minmax(0, 1fr));
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
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.65rem;
	}
	.account-stats article {
		background: white;
		padding: 0.72rem 0.8rem;
		box-shadow: 0 4px 14px rgba(32, 55, 88, 0.025);
	}
	.account-stats strong {
		display: block;
		margin-top: 0.28rem;
		color: #1b2d4b;
		font-size: 1rem;
		font-weight: 900;
		letter-spacing: -0.015em;
	}
	.account-stats small {
		display: block;
		margin-top: 0.16rem;
		color: #8793a4;
		font-size: 0.56rem;
	}
	.account-stats .positive {
		color: #16a05b;
	}
	.account-stats .due {
		color: #e75121;
	}
	.account-layout {
		display: grid;
		grid-template-columns: minmax(0, 2.5fr) minmax(13rem, 0.95fr);
		align-items: start;
		gap: 0.65rem;
		margin-top: 0.65rem;
	}
	.account-card {
		min-width: 0;
		padding: 0.85rem 0.9rem 0.65rem;
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
		font-size: 0.64rem;
		font-weight: 900;
	}
	.account-title p {
		margin: 0.15rem 0 0;
		color: #8a96a7;
		font-size: 0.55rem;
	}
	.standing {
		display: inline-flex;
		align-items: center;
		gap: 0.32rem;
		border-radius: 1rem;
		background: #e9fbf1;
		color: #099754;
		padding: 0.28rem 0.5rem;
		font-size: 0.53rem;
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
		font-size: 0.51rem;
		font-weight: 800;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}
	.account-details strong {
		overflow: hidden;
		margin-top: 0.18rem;
		color: #293a56;
		font-size: 0.56rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.account-details small {
		margin-top: 0.18rem;
		color: #8c98a9;
		font-size: 0.52rem;
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
		font-size: 0.5rem;
	}
	.service-list strong {
		color: inherit;
		font-size: inherit;
	}
	.service-list small {
		color: #8b97a8;
		font-size: 0.46rem;
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
	:global(html[data-theme='dark'] .utilities-page .notification-popover),
	:global(html[data-theme='dark'] .utility-dialog) {
		border-color: #334866;
		background: #172640;
		color: #edf4ff;
	}
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
		.account-layout {
			grid-template-columns: minmax(0, 1.7fr) minmax(12rem, 1fr);
		}
		.standing {
			font-size: 0.48rem;
		}
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



