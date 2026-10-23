<script lang="ts">
	type BillingActivity = {
		label: string;
		amount: string;
		date: string;
		tone: string;
	};

	type UtilityService = { name: string; provider: string; account: string };

	let utilityServices = $state<UtilityService[]>([
		{ name: 'Electricity', provider: 'Mercalo', account: 'UT-02-01974-E' },
		{ name: 'Water', provider: 'QCU Campus Services', account: 'UT-02-01974-W' },
		{ name: 'Internet', provider: 'PLDT', account: 'UT-02-01974-I' },
		{ name: 'Telecommunications', provider: 'PLDT', account: 'UT-02-01974-T' }
	]);
	let serviceDialog = $state<HTMLDialogElement>();
	let billingDialog = $state<HTMLDialogElement>();
	let notificationOpen = $state(false);
	let serviceName = $state('');
	let serviceProvider = $state('');
	let serviceAccount = $state('');
	let serviceAdded = $state('');

	const billingActivity: BillingActivity[] = [
		{ label: 'Mercalo statement posted', amount: '₱11,280.40', date: '02 Oct 2026', tone: 'green' },
		{ label: 'PLDT payment cleared', amount: '₱3,899.00', date: '28 Sep 2026', tone: 'blue' },
		{ label: 'Water meter read', amount: '24.2 m³', date: '26 Sep 2026', tone: 'teal' }
	];

	const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(
		new Date()
	);

	function addService(event: SubmitEvent) {
		event.preventDefault();
		const name = serviceName.trim();
		if (!name) return;

		utilityServices = [
			...utilityServices,
			{ name, provider: serviceProvider.trim(), account: serviceAccount.trim() }
		];
		serviceAdded = name;
		serviceName = '';
		serviceProvider = '';
		serviceAccount = '';
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

	<section class="overview-card" aria-labelledby="operations-title">
		<div class="overview-heading">
			<div class="heading-icon" aria-hidden="true"></div>
			<div class="heading-copy">
				<h2 id="operations-title">Operations overview</h2>
				<p>Here is what is happening across the cooperative store today.</p>
			</div>
			<a class="outline-button" href="/staff/admin/reports">
				<svg viewBox="0 0 24 24" aria-hidden="true"
					><path d="M14 4h6v6M20 4l-9 9" /><path
						d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"
					/></svg
				>
				View reports
			</a>
		</div>
		<div class="overview-stats">
			<article><span>Gross sales</span><strong>₱284,620</strong></article>
			<article><span>Units moved</span><strong>1,846</strong></article>
			<article><span>Low stock items</span><strong class="warning">18</strong></article>
			<article><span>Non-selling items</span><strong class="muted">24</strong></article>
		</div>
		<div class="overview-links">
			<a href="/staff/admin/inventory"
				><strong>Inventory Management</strong><span>Review stock, purchasing, and item records</span
				></a
			>
			<a href="/staff/admin/reports"
				><strong>Reports Engine</strong><span>Review sales and cooperative performance</span></a
			>
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
				<span>Active services</span><strong>{utilityServices.length}</strong><small class="positive"
					>All services operational</small
				>
			</article>
			<article>
				<span>Current balance</span><strong>₱18,940.75</strong><small>Across 3 open bills</small>
			</article>
			<article>
				<span>Next due date</span><strong>05 Nov</strong><small class="due"
					>Electricity · ₱11,280.40</small
				>
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
					{#each utilityServices as service, index (index)}
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
	<form onsubmit={addService}>
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
		<p class="dialog-copy">
			Add a service to the local demo account. This information is not saved to a backend.
		</p>
		<label
			>Service name<input
				bind:value={serviceName}
				required
				maxlength="60"
				placeholder="e.g. Waste collection"
			/></label
		>
		<label
			>Provider <span class="optional">(optional)</span><input
				bind:value={serviceProvider}
				maxlength="80"
				placeholder="Provider name"
			/></label
		>
		<label
			>Account number <span class="optional">(optional)</span><input
				bind:value={serviceAccount}
				maxlength="40"
				placeholder="Provider account number"
			/></label
		>
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
	.overview-card,
	.account-card,
	.activity-card {
		border: 1px solid #e4eaf2;
		border-radius: 0.8rem;
		background: white;
		box-shadow: 0 8px 24px rgba(32, 55, 88, 0.04);
	}
	.overview-card {
		padding: 1rem 1.1rem;
	}
	.overview-heading {
		display: flex;
		align-items: center;
		gap: 0.65rem;
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
	.overview-heading h2,
	.section-heading h2 {
		margin: 0;
		color: #172b4d;
		font-size: 0.94rem;
		font-weight: 900;
	}
	.overview-heading p,
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
	.overview-stats {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.65rem;
		margin-top: 0.75rem;
	}
	.overview-stats article,
	.account-stats article {
		min-width: 0;
		border: 1px solid #e6eaf0;
		border-radius: 0.6rem;
		background: #fbfcfd;
		padding: 0.72rem 0.8rem;
	}
	.overview-stats span,
	.account-stats article > span {
		display: block;
		color: #7c8798;
		font-size: 0.55rem;
		font-weight: 800;
		letter-spacing: 0.035em;
		text-transform: uppercase;
	}
	.overview-stats strong {
		display: block;
		margin-top: 0.32rem;
		color: #1b2d4b;
		font-size: 1.05rem;
		font-weight: 900;
	}
	.overview-stats .warning {
		color: #e84812;
	}
	.overview-stats .muted {
		color: #7b8492;
	}
	.overview-links {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.65rem;
		margin-top: 0.65rem;
	}
	.overview-links a {
		display: block;
		border: 1px solid #e4eaf2;
		border-radius: 0.6rem;
		padding: 0.65rem 0.8rem;
		text-decoration: none;
	}
	.overview-links a:hover {
		border-color: #b8cdfd;
		background: #f8faff;
	}
	.overview-links strong,
	.overview-links span {
		display: block;
	}
	.overview-links strong {
		color: #2563eb;
		font-size: 0.64rem;
	}
	.overview-links span {
		margin-top: 0.2rem;
		color: #8490a1;
		font-size: 0.57rem;
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
		width: min(26rem, calc(100% - 2rem));
		max-width: none;
		max-height: min(90vh, 40rem);
		overflow-y: auto;
		border: 1px solid #e2e8f0;
		border-radius: 0.85rem;
		background: white;
		box-shadow: 0 24px 80px #07152d40;
		padding: 1.25rem;
		color: #172b4d;
	}
	.utility-dialog::backdrop {
		background: #07152d70;
		backdrop-filter: blur(2px);
	}
	.dialog-heading {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
	}
	.dialog-eyebrow {
		color: #2563eb;
		font-size: 0.55rem;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	.dialog-heading h2 {
		margin: 0.18rem 0 0;
		color: #172b4d;
		font-size: 1.05rem;
	}
	.dialog-close {
		width: 1.8rem;
		height: 1.8rem;
		border: 0;
		border-radius: 50%;
		background: #f2f5f9;
		color: #59677a;
		font-size: 1.15rem;
		cursor: pointer;
	}
	.dialog-copy {
		margin: 0.4rem 0 1rem;
		color: #7f8da0;
		font-size: 0.64rem;
		line-height: 1.5;
	}
	.utility-dialog form > label {
		display: block;
		margin-top: 0.75rem;
		color: #52647b;
		font-size: 0.61rem;
		font-weight: 800;
	}
	.utility-dialog input {
		display: block;
		box-sizing: border-box;
		width: 100%;
		margin-top: 0.35rem;
		border: 1px solid #dfe6ef;
		border-radius: 0.45rem;
		background: white;
		color: #263a58;
		padding: 0.65rem 0.7rem;
		font: inherit;
		font-size: 0.65rem;
	}
	.optional {
		color: #98a2b1;
		font-weight: 500;
	}
	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 1.15rem;
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
	:global(html[data-theme='dark'] .utilities-page .overview-card),
	:global(html[data-theme='dark'] .utilities-page .account-card),
	:global(html[data-theme='dark'] .utilities-page .activity-card),
	:global(html[data-theme='dark'] .utilities-page .account-stats article),
	:global(html[data-theme='dark'] .utilities-page .overview-stats article),
	:global(html[data-theme='dark'] .utilities-page .overview-links a),
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
	:global(html[data-theme='dark'] .utilities-page .overview-stats strong),
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
		.overview-heading {
			flex-wrap: wrap;
		}
		.overview-heading .outline-button {
			margin-left: auto;
		}
		.overview-stats,
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
		.date-chip {
			font-size: 0;
		}
		.date-chip svg {
			width: 0.95rem;
			height: 0.95rem;
		}
		.overview-links {
			grid-template-columns: 1fr;
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
