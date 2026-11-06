<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';
	let { data, form }: PageProps = $props();
	let query = $state('');
	let roleFilter = $state('All roles');
	let statusFilter = $state('all');
	let addOpen = $state(false);
	let newRole = $state('student');
	const statusOf = (status: string | null) => status?.trim().toLowerCase() || '';
	onMount(() => {
		const timer = window.setInterval(() => void invalidate('app:accounts'), 15000);
		return () => window.clearInterval(timer);
	});
	let filtered = $derived(
		[...data.accounts]
			.sort(
				(a, b) =>
					Number(statusOf(b.account_status) === 'pending') -
					Number(statusOf(a.account_status) === 'pending')
			)
			.filter((account) => {
				const phrase = query.trim().toLowerCase();
				const status = statusOf(account.account_status);
				const haystack = [
					account.first_name,
					account.last_name,
					account.school_id,
					account.employee_no,
					account.email,
					account.department,
					account.course
				]
					.filter(Boolean)
					.join(' ')
					.toLowerCase();
				const matchesStatus =
					statusFilter === 'all' ||
					(statusFilter === 'pending' && status === 'pending') ||
					(statusFilter === 'approved' && ['active', 'approved'].includes(status)) ||
					(statusFilter === 'other' && !['pending', 'active', 'approved'].includes(status));
				return (
					(!phrase || haystack.includes(phrase)) &&
					matchesStatus &&
					(roleFilter === 'All roles' || account.role?.toLowerCase() === roleFilter.toLowerCase())
				);
			})
	);
	const roleLabels: Record<string, string> = {
		student: 'Student',
		teacher: 'Teacher',
		faculty: 'Teacher',
		cashier: 'Cashier',
		staff: 'Cashier',
		admin: 'Admin',
		administrator: 'Admin'
	};
	const displayRole = (role: string | null) =>
		roleLabels[role?.toLowerCase() || ''] || role || 'Unknown';
	const isApproved = (status: string | null) => ['active', 'approved'].includes(statusOf(status));
	const displayStatus = (status: string | null) =>
		isApproved(status) ? 'Approved' : status?.trim() || 'Unknown';
</script>

<svelte:head><title>Manage Accounts | QCU Coop Admin</title></svelte:head>
<main class="admin-page accounts-page">
	<header class="admin-title-row">
		<div>
			<p class="admin-eyebrow">Administration</p>
			<h1 class="admin-title">Manage Accounts</h1>
			<p class="admin-subtitle">
				Review registrations, approve access, create accounts, and archive accounts.
			</p>
		</div>
		<button class="add-button" type="button" onclick={() => (addOpen = true)}>+ Add account</button>
	</header>
	{#if data.pendingCount}<aside class="new-signups" role="status">
			<span class="notification-dot"></span>
			<div>
				<strong
					>{data.pendingCount} new sign-up{data.pendingCount === 1 ? '' : 's'} need review</strong
				><small>Approve or reject pending student and teacher accounts below.</small>
			</div>
			<button type="button" class="view-pending" onclick={() => (statusFilter = 'pending')}
				>View pending</button
			>
		</aside>{/if}
	{#if form?.success}<p class="notice" role="status">{form.success}</p>{/if}
	{#if form?.message}<p class="notice error" role="alert">{form.message}</p>{/if}
	<section class="account-panel" aria-label="User accounts">
		<div class="toolbar">
			<label class="search"
				>Search accounts<input
					bind:value={query}
					placeholder="Name, ID, email, department"
				/></label
			><label class="filter"
				>Role<select bind:value={roleFilter}
					><option>All roles</option><option>Student</option><option>Teacher</option><option
						>Cashier</option
					><option>Admin</option></select
				></label
			><label class="filter"
				>Status<select bind:value={statusFilter}
					><option value="all">All statuses</option><option value="pending">Pending review</option
					><option value="approved">Approved</option><option value="other">Other / inactive</option
					></select
				></label
			><span class="count">{filtered.length} accounts</span>
		</div>
		<div class="table-wrap">
			<table>
				<thead
					><tr
						><th>Account</th><th>Role / Profile</th><th>Registration</th><th>Status</th><th
							>Admin review</th
						></tr
					></thead
				><tbody>
					{#each filtered as account (account.id)}
						{@const role = account.role?.toLowerCase()}
						<tr>
							<td
								><strong
									>{[account.first_name, account.last_name].filter(Boolean).join(' ') ||
										'Name not provided'}</strong
								><small
									>{account.school_id || account.employee_no || 'No school/employee number'} · {account.email ||
										'No email'}</small
								></td
							>
							<td
								><span class="role">{displayRole(account.role)}</span><small
									>{#if role === 'student'}{account.course || 'Course not set'} · {account.year_level
											? `Year ${account.year_level}`
											: 'Year not set'}{:else}{account.department ||
											'Department not set'}{/if}</small
								></td
							>
							<td
								>{account.registration_source || '—'}<small
									>{account.created_at
										? new Date(account.created_at).toLocaleDateString()
										: ''}</small
								></td
							>
							<td
								><span
									class:pending={statusOf(account.account_status) === 'pending'}
									class:inactive={['suspended', 'rejected', 'inactive', 'archived'].includes(
										statusOf(account.account_status)
									)}
									class="status">{displayStatus(account.account_status)}</span
								></td
							>
							<td class="review-actions">
								{#if ['student', 'teacher', 'faculty'].includes(role || '') && !isApproved(account.account_status) && statusOf(account.account_status) !== 'archived'}
									<form method="POST" action="?/setStatus" use:enhance>
										<input type="hidden" name="id" value={account.id} /><input
											type="hidden"
											name="status"
											value="approved"
										/><button type="submit" class="approve">Approve</button>
									</form>
								{/if}
								{#if statusOf(account.account_status) === 'pending'}
									<form method="POST" action="?/setStatus" use:enhance>
										<input type="hidden" name="id" value={account.id} /><input
											type="hidden"
											name="status"
											value="rejected"
										/><button type="submit" class="reject">Reject</button>
									</form>
								{:else if isApproved(account.account_status)}
									<form method="POST" action="?/setStatus" use:enhance>
										<input type="hidden" name="id" value={account.id} /><input
											type="hidden"
											name="status"
											value="suspended"
										/><button type="submit" class="reject">Suspend</button>
									</form>
								{/if}
								{#if statusOf(account.account_status) === 'archived'}<form
										method="POST"
										action="?/setStatus"
										use:enhance
									>
										<input type="hidden" name="id" value={account.id} /><input
											type="hidden"
											name="status"
											value="approved"
										/><button type="submit" class="approve">Restore</button>
									</form>
								{:else if account.id !== data.currentAdminId}<form
										method="POST"
										action="?/setStatus"
										use:enhance
									>
										<input type="hidden" name="id" value={account.id} /><input
											type="hidden"
											name="status"
											value="archived"
										/><button type="submit" class="archive">Archive</button>
									</form>{/if}
							</td>
						</tr>
					{:else}<tr
							><td colspan="5" class="empty"
								>{statusFilter === 'pending'
									? 'No pending registrations. Choose All statuses to see every account.'
									: 'No accounts match your search and filters.'}</td
							></tr
						>{/each}
				</tbody>
			</table>
		</div>
		<p class="storage-note">
			New student and teacher registrations stay pending until approved here. Cashier and admin
			profiles are provisioned by an administrator.
		</p>
	</section>
</main>

{#if addOpen}
	<div
		class="modal-backdrop"
		role="presentation"
		onclick={(event) => {
			if (event.target === event.currentTarget) addOpen = false;
		}}
	>
		<section
			class="create-modal"
			role="dialog"
			aria-modal="true"
			aria-labelledby="create-account-title"
		>
			<header>
				<div>
					<p class="admin-eyebrow">User access</p>
					<h2 id="create-account-title">Add account</h2>
				</div>
				<button
					type="button"
					class="close-button"
					aria-label="Close"
					onclick={() => (addOpen = false)}>×</button
				>
			</header>
			<form
				method="POST"
				action="?/createAccount"
				use:enhance={() =>
					async ({ result, update }) => {
						await update();
						if (result.type === 'success') addOpen = false;
					}}
			>
				<label
					>Account role<select name="role" bind:value={newRole}
						><option value="student">Student</option><option value="teacher">Teacher</option><option
							value="cashier">Cashier</option
						><option value="admin">Admin</option></select
					></label
				>
				<div class="name-fields">
					<label>First name<input name="firstName" required /></label><label
						>Last name<input name="lastName" required /></label
					>
				</div>
				<label
					>{newRole === 'student' ? 'Student number' : 'Employee number'}<input
						name={newRole === 'student' ? 'schoolId' : 'employeeNo'}
						required
					/></label
				>
				<label>Email address<input type="email" name="email" required /></label>
				{#if newRole === 'student'}<label>Course / program<input name="course" required /></label
					><label
						>Year level<select name="yearLevel" required
							><option value="">Select year</option>{#each [1, 2, 3, 4, 5, 6] as year}<option
									value={year}>{year}</option
								>{/each}</select
						></label
					>{:else}<label>Department<input name="department" required /></label>{/if}
				<label
					>Temporary password<input
						type="password"
						name="password"
						minlength="8"
						autocomplete="new-password"
						required
					/></label
				>
				{#if form?.message}<p class="form-error" role="alert">{form.message}</p>{/if}
				<footer>
					<button type="button" class="cancel-button" onclick={() => (addOpen = false)}
						>Cancel</button
					><button type="submit" class="add-button">Create account</button>
				</footer>
			</form>
		</section>
	</div>
{/if}

<style>
	.account-panel {
		overflow: hidden;
		border: 1px solid #e2e8f0;
		border-radius: 0.8rem;
		background: white;
		box-shadow: 0 8px 24px rgba(32, 55, 88, 0.04);
	}
	.toolbar {
		display: flex;
		align-items: end;
		gap: 1rem;
		padding: 1rem;
		border-bottom: 1px solid #e9edf3;
	}
	.search,
	.filter {
		display: grid;
		gap: 0.4rem;
		color: #51627b;
		font-size: 0.68rem;
		font-weight: 800;
	}
	.search {
		width: min(25rem, 55%);
		flex: 1;
	}
	.search input,
	.filter select {
		width: 100%;
		min-height: 2.5rem;
		border: 1px solid #dce3ed;
		border-radius: 0.5rem;
		background: #fff;
		padding: 0.55rem 0.7rem;
		color: #17233d;
		font: inherit;
		font-size: 0.75rem;
	}
	.filter {
		width: 10rem;
	}
	.count {
		margin-left: auto;
		padding-bottom: 0.65rem;
		color: #75839a;
		font-size: 0.7rem;
		font-weight: 700;
	}
	.table-wrap {
		overflow: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		min-width: 850px;
	}
	th {
		background: #f7f9fc;
		color: #71809a;
		font-size: 0.62rem;
		font-weight: 800;
		text-align: left;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}
	th,
	td {
		padding: 0.9rem 1rem;
	}
	td {
		border-top: 1px solid #edf1f5;
		color: #34445d;
		font-size: 0.75rem;
		vertical-align: top;
	}
	td strong,
	td small {
		display: block;
	}
	td strong {
		color: #1b2c48;
		font-size: 0.77rem;
	}
	td small {
		margin-top: 0.25rem;
		color: #7b8799;
		font-size: 0.67rem;
	}
	.role,
	.status {
		display: inline-flex;
		border-radius: 2rem;
		background: #edf4ff;
		color: #2563eb;
		padding: 0.3rem 0.55rem;
		font-size: 0.65rem;
		font-weight: 800;
		text-transform: capitalize;
	}
	.status {
		background: #e8f8ef;
		color: #07894b;
	}
	.status.pending {
		background: #fff7df;
		color: #946200;
	}
	.status.inactive {
		background: #fff1ed;
		color: #c24132;
	}
	.review-actions {
		display: flex;
		gap: 0.5rem;
	}
	.review-actions form {
		display: inline;
	}
	.review-actions button {
		border: 0;
		border-radius: 0.4rem;
		background: #e8f8ef;
		color: #07894b;
		padding: 0.4rem 0.55rem;
		font: inherit;
		font-size: 0.68rem;
		font-weight: 800;
		cursor: pointer;
	}
	.review-actions button.reject,
	.review-actions button.archive {
		background: #fff1ed;
		color: #c24132;
	}
	.empty {
		text-align: center;
		color: #71809a;
		padding: 2rem;
	}
	.storage-note {
		margin: 0;
		padding: 0.8rem 1rem;
		color: #7b8799;
		font-size: 0.65rem;
	}
	.notice {
		margin: 0 0 1rem;
		border: 1px solid #bde8ce;
		border-radius: 0.55rem;
		background: #f0fbf4;
		color: #187342;
		padding: 0.7rem 0.85rem;
		font-size: 0.72rem;
		font-weight: 700;
	}
	.notice.error,
	.form-error {
		border-color: #fecaca;
		background: #fff1f2;
		color: #b91c1c;
	}
	.admin-title-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.25rem;
	}
	.admin-eyebrow {
		color: #2563eb;
		font-size: 0.68rem;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	.admin-title {
		margin: 0.25rem 0;
		font-size: 1.55rem;
		font-weight: 800;
	}
	.admin-subtitle {
		margin: 0;
		color: #73829a;
		font-size: 0.78rem;
	}
	.admin-page {
		padding: 1.5rem;
	}
	.admin-title-row + .notice {
		margin-bottom: 1rem;
	}
	.add-button {
		border: 0;
		border-radius: 0.55rem;
		background: #2563eb;
		color: white;
		padding: 0.75rem 1rem;
		font: inherit;
		font-size: 0.75rem;
		font-weight: 800;
		cursor: pointer;
	}
	.new-signups {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin: 0 0 1rem;
		border: 1px solid #fedf91;
		border-radius: 0.65rem;
		background: #fffbeb;
		padding: 0.8rem 1rem;
		color: #854d0e;
	}
	.new-signups strong,
	.new-signups small {
		display: block;
	}
	.new-signups small {
		margin-top: 0.2rem;
		color: #9a6700;
		font-size: 0.68rem;
	}
	.view-pending {
		flex: 0 0 auto;
		border: 0;
		border-radius: 0.45rem;
		background: #d97706;
		color: white;
		padding: 0.5rem 0.7rem;
		font: inherit;
		font-size: 0.68rem;
		font-weight: 800;
		cursor: pointer;
	}
	.view-pending:hover {
		background: #b45309;
	}
	.notification-dot {
		width: 0.6rem;
		height: 0.6rem;
		flex: 0 0 auto;
		border-radius: 50%;
		background: #f59e0b;
		box-shadow: 0 0 0 4px #fef3c7;
	}
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 150;
		display: grid;
		place-items: center;
		overflow: auto;
		background: rgba(7, 21, 45, 0.58);
		padding: 1rem;
	}
	.create-modal {
		width: min(100%, 36rem);
		max-height: 95vh;
		overflow: auto;
		border-radius: 0.85rem;
		background: white;
		padding: 1.4rem;
		box-shadow: 0 24px 70px rgba(7, 21, 45, 0.3);
	}
	.create-modal header,
	.create-modal footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.8rem;
	}
	.create-modal h2 {
		margin: 0;
		color: #17233d;
		font-size: 1.1rem;
	}
	.create-modal form {
		display: grid;
		gap: 0.75rem;
		margin-top: 1rem;
	}
	.create-modal label {
		display: grid;
		gap: 0.35rem;
		color: #51627b;
		font-size: 0.7rem;
		font-weight: 800;
	}
	.create-modal input,
	.create-modal select {
		box-sizing: border-box;
		width: 100%;
		min-height: 2.5rem;
		border: 1px solid #dce3ed;
		border-radius: 0.5rem;
		background: #fff;
		padding: 0.55rem 0.7rem;
		color: #17233d;
		font: inherit;
		font-size: 0.75rem;
	}
	.name-fields {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}
	.create-modal footer {
		justify-content: flex-end;
		margin-top: 0.4rem;
	}
	.close-button,
	.cancel-button {
		border: 1px solid #dce3ed;
		border-radius: 0.5rem;
		background: white;
		color: #51627b;
		padding: 0.6rem 0.8rem;
		font: inherit;
		font-size: 0.75rem;
		font-weight: 800;
		cursor: pointer;
	}
	.close-button {
		border: 0;
		font-size: 1.4rem;
	}
	.form-error {
		margin: 0;
		padding: 0.6rem;
		border: 1px solid;
		border-radius: 0.45rem;
		font-size: 0.72rem;
	}
	.toolbar input,
	.toolbar select {
		color-scheme: light;
		color: #17233d;
		background: #fff;
	}
	.toolbar input::placeholder {
		color: #8290a5;
	}
	.create-modal {
		color-scheme: light;
		color: #17233d;
	}
	.create-modal .admin-eyebrow {
		color: #2563eb;
	}
	.create-modal input::placeholder {
		color: #94a3b8;
	}
	:global(html[data-theme='dark'] .account-panel) {
		background: #172640;
		border-color: #334866;
		box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22);
	}
	:global(html[data-theme='dark'] .toolbar) {
		border-color: #334866;
		background: #172640;
	}
	:global(html[data-theme='dark'] .toolbar label),
	:global(html[data-theme='dark'] .count) {
		color: #b8c8dd;
	}
	:global(html[data-theme='dark'] .toolbar input),
	:global(html[data-theme='dark'] .toolbar select) {
		color-scheme: dark;
		border-color: #415878;
		background: #101d35;
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .toolbar input::placeholder) {
		color: #8192ab;
	}
	:global(html[data-theme='dark'] .account-panel th) {
		background: #101d35;
		color: #b8c8dd;
	}
	:global(html[data-theme='dark'] .account-panel td) {
		border-color: #334866;
		color: #c9d6e8;
	}
	:global(html[data-theme='dark'] .account-panel td strong) {
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .account-panel td small),
	:global(html[data-theme='dark'] .storage-note) {
		color: #a9bad0;
	}
	:global(html[data-theme='dark'] .new-signups) {
		border-color: #76591d;
		background: #382d16;
		color: #fde68a;
	}
	:global(html[data-theme='dark'] .new-signups small) {
		color: #fcd978;
	}
	:global(html[data-theme='dark'] .notification-dot) {
		box-shadow: 0 0 0 4px #53421c;
	}
	:global(html[data-theme='dark'] .create-modal) {
		color-scheme: dark;
		background: #172640;
		color: #edf4ff;
		border: 1px solid #334866;
	}
	:global(html[data-theme='dark'] .create-modal h2) {
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .create-modal label) {
		color: #b8c8dd;
	}
	:global(html[data-theme='dark'] .create-modal .admin-eyebrow) {
		color: #7cb5ff;
	}
	:global(html[data-theme='dark'] .create-modal input),
	:global(html[data-theme='dark'] .create-modal select) {
		border-color: #415878;
		background: #101d35;
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .create-modal select option) {
		background: #101d35;
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .create-modal .close-button),
	:global(html[data-theme='dark'] .create-modal .cancel-button) {
		border-color: #415878;
		background: #172640;
		color: #d8e4f4;
	}
	@media (max-width: 900px) {
		.toolbar {
			align-items: stretch;
			flex-wrap: wrap;
		}
		.search {
			width: 100%;
			flex-basis: 100%;
		}
		.filter {
			flex: 1;
			min-width: 8rem;
		}
		.count {
			align-self: end;
		}
	}
	@media (max-width: 600px) {
		.admin-title-row {
			align-items: flex-start;
			gap: 0.8rem;
			flex-direction: column;
		}
		.name-fields {
			grid-template-columns: 1fr;
		}
	}
</style>
