<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let query = $state('');
	let roleFilter = $state('all');
	let statusFilter = $state('all');
	let selectedId = $state<string | null>(null);
	let addOpen = $state(false);
	let editOpen = $state(false);
	let newRole = $state('student');
	let profileAvatar = $state<string | null>(null);
	let profilePhotoMessage = $state('');
	let uploadingProfilePhoto = $state(false);
	let profilePhotoInput = $state<HTMLInputElement>();
	const profileAvatarKey = (id: string) => `qcu-admin-profile-avatar:${id}`;
	const roleGroup = (role: string | null) => {
		const normalized = role?.trim().toLowerCase();
		if (['student', 'customer', 'user', 'member'].includes(normalized ?? '')) return 'student';
		if (['teacher', 'faculty'].includes(normalized ?? '')) return 'teacher';
		if (['cashier', 'staff'].includes(normalized ?? '')) return 'cashier';
		if (['admin', 'administrator'].includes(normalized ?? '')) return 'admin';
		return normalized;
	};
	let filtered = $derived(
		data.accounts.filter((account) => {
			const phrase = query.trim().toLowerCase();
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
			return (
				(!phrase || haystack.includes(phrase)) &&
				(roleFilter === 'all' || roleGroup(account.role) === roleFilter) &&
				(statusFilter === 'all' ||
					(statusFilter === 'pending'
						? statusOf(account.account_status) === 'pending'
						: statusFilter === 'active'
							? isActive(account)
							: !isActive(account)))
			);
		})
	);
	let selectedAccount = $derived(
		data.accounts.find((account) => account.id === selectedId) ?? null
	);

	const statusOf = (status: string | null) => status?.trim().toLowerCase() || '';
	const roleLabels: Record<string, string> = {
		student: 'Student',
		teacher: 'Professor',
		faculty: 'Professor',
		cashier: 'Cashier',
		staff: 'Cashier',
		admin: 'Admin',
		administrator: 'Admin'
	};
	const displayRole = (role: string | null) =>
		roleLabels[role?.toLowerCase() || ''] || role || 'Unknown';
	const isApproved = (status: string | null) => ['active', 'approved'].includes(statusOf(status));
	const isActive = (account: (typeof data.accounts)[number]) => {
		if (!isApproved(account.account_status)) return false;
		const lastActivity = account.last_activity_at ?? account.created_at;
		if (!lastActivity) return false;
		const elapsed = Date.now() - new Date(lastActivity).getTime();
		return Number.isFinite(elapsed) && elapsed < 30 * 24 * 60 * 60 * 1000;
	};
	const membershipTitle = (role: string | null) => {
		const value = role?.toLowerCase();
		if (value === 'student') return 'Student';
		if (value === 'teacher' || value === 'faculty') return 'Professor';
		return displayRole(role);
	};
	const formatDate = (date: string | null) =>
		date
			? new Date(date).toLocaleDateString(undefined, {
					year: 'numeric',
					month: 'short',
					day: 'numeric'
				})
			: '—';
	const fullName = (account: (typeof data.accounts)[number]) =>
		[account.first_name, account.last_name].filter(Boolean).join(' ') || 'Name not provided';
	const accountIdNumber = (account: (typeof data.accounts)[number]) =>
		account.school_id || account.employee_no || 'Not provided';
	const permissionsFor = (role: string | null) => {
		const normalized = role?.toLowerCase();
		const all = normalized === 'admin' || normalized === 'administrator';
		const cashier = ['cashier', 'staff'].includes(normalized ?? '');
		const standard = ['student', 'teacher', 'faculty', 'customer', 'user', 'member'].includes(
			normalized ?? ''
		);
		return [
			{ name: 'Store', allowed: all || cashier || standard },
			{ name: 'History', allowed: all || standard },
			{ name: 'Cart/POS', allowed: all || cashier || standard },
			{ name: 'Inventory', allowed: all },
			{ name: 'Sales/Reports', allowed: all || cashier },
			{ name: 'Admin', allowed: all }
		];
	};

	function openProfile(id: string) {
		selectedId = id;
		editOpen = false;
		profilePhotoMessage = '';
		try {
			profileAvatar = localStorage.getItem(profileAvatarKey(id));
		} catch (error) {
			profileAvatar = null;
			profilePhotoMessage =
				error instanceof Error
					? `Could not load this profile photo: ${error.message}`
					: 'Could not load this profile photo.';
		}
	}

	async function handleProfilePhotoSelect(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		const accountId = selectedId;
		if (!file || !accountId) return;
		profilePhotoMessage = '';
		if (!file.type.startsWith('image/')) {
			profilePhotoMessage = 'Choose an image file to upload.';
			input.value = '';
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			profilePhotoMessage = 'Choose an image smaller than 5 MB.';
			input.value = '';
			return;
		}

		uploadingProfilePhoto = true;
		let bitmap: ImageBitmap | null = null;
		try {
			bitmap = await createImageBitmap(file);
			const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height));
			const canvas = document.createElement('canvas');
			canvas.width = Math.max(1, Math.round(bitmap.width * scale));
			canvas.height = Math.max(1, Math.round(bitmap.height * scale));
			const context = canvas.getContext('2d');
			if (!context) throw new Error('Your browser could not prepare the selected image.');
			context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
			const image = canvas.toDataURL('image/jpeg', 0.82);
			canvas.width = 0;
			canvas.height = 0;
			localStorage.setItem(profileAvatarKey(accountId), image);
			profileAvatar = image;
		} catch (error) {
			profilePhotoMessage =
				error instanceof DOMException && error.name === 'QuotaExceededError'
					? 'There is not enough browser storage to save this photo. Remove an existing photo or choose a smaller image.'
					: error instanceof Error
						? `Could not save this profile photo: ${error.message}`
						: 'Could not save this profile photo.';
		} finally {
			bitmap?.close();
			input.value = '';
			uploadingProfilePhoto = false;
		}
	}

	function removeProfilePhoto() {
		if (!selectedId) return;
		profilePhotoMessage = '';
		try {
			localStorage.removeItem(profileAvatarKey(selectedId));
			profileAvatar = null;
		} catch (error) {
			profilePhotoMessage =
				error instanceof Error
					? `Could not remove this profile photo: ${error.message}`
					: 'Could not remove this profile photo.';
		}
	}

	onMount(() => {
		const timer = window.setInterval(() => void invalidate('app:accounts'), 15000);
		return () => window.clearInterval(timer);
	});
</script>

<svelte:head><title>Manage Accounts | QCU Coop Admin</title></svelte:head>

<main class="admin-page accounts-page">
	{#if selectedAccount}
		<header class="detail-header">
			<div>
				<button class="back-button" type="button" onclick={() => (selectedId = null)}>
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
					All accounts
				</button>
				<p class="admin-eyebrow">Account profile</p>
				<h1 class="admin-title">{fullName(selectedAccount)}</h1>
			</div>
			<div class="detail-actions" aria-label="Account actions">
				<button
					class="icon-action"
					type="button"
					aria-label="Edit account"
					title="Edit account"
					onclick={() => (editOpen = true)}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
					</svg>
				</button>
				<form
					method="POST"
					action="?/setStatus"
					use:enhance
					onsubmit={(event) => {
						if (
							!window.confirm(
								`Delete ${fullName(selectedAccount!)}? The account will be archived and can be restored later.`
							)
						)
							event.preventDefault();
					}}
				>
					<input type="hidden" name="id" value={selectedAccount.id} />
					<input type="hidden" name="status" value="archived" />
					<button
						class="icon-action delete-action"
						type="submit"
						aria-label="Delete account"
						title="Delete account"
						disabled={selectedAccount.id === data.currentAdminId}
					>
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" />
						</svg>
					</button>
				</form>
			</div>
		</header>

		{#if form?.success}<p class="notice success" role="status">{form.success}</p>{/if}
		{#if form?.message}<p class="notice error" role="alert">{form.message}</p>{/if}

		<div class="profile-layout">
			<section class="profile-card main-profile-card" aria-labelledby="main-profile-title">
				<div class="avatar" aria-hidden="true">
					{#if profileAvatar}
						<img src={profileAvatar} alt="" />
					{:else if selectedAccount.first_name || selectedAccount.last_name}
						{(selectedAccount.first_name?.[0] ?? '') + (selectedAccount.last_name?.[0] ?? '')}
					{:else}
						<svg viewBox="0 0 24 24"
							><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg
						>
					{/if}
				</div>
				<div class="photo-actions">
					<input
						bind:this={profilePhotoInput}
						class="photo-file-input"
						type="file"
						accept="image/*"
						aria-label="Choose profile photo"
						onchange={handleProfilePhotoSelect}
					/>
					<button
						class="photo-action"
						type="button"
						onclick={() => profilePhotoInput?.click()}
						disabled={uploadingProfilePhoto}
					>
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<path
								d="M14 5h-4L8.5 7H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.5Z"
							/>
							<circle cx="12" cy="13" r="3" />
						</svg>
						{uploadingProfilePhoto ? 'Uploading…' : profileAvatar ? 'Change' : 'Upload'}
					</button>
					{#if profileAvatar}
						<button
							class="photo-action"
							type="button"
							onclick={removeProfilePhoto}
							disabled={uploadingProfilePhoto}
						>
							<svg viewBox="0 0 24 24" aria-hidden="true">
								<path d="m6 6 12 12M18 6 6 18" />
							</svg>
							Remove
						</button>
					{/if}
				</div>
				{#if profilePhotoMessage}
					<p class="photo-message" role="alert">{profilePhotoMessage}</p>
				{/if}
				<span class:inactive={!isActive(selectedAccount)} class="status">
					<span class="status-dot"></span>{isActive(selectedAccount) ? 'Active' : 'Inactive'}
				</span>
				<h2 id="main-profile-title">{fullName(selectedAccount)}</h2>
				<p class="profile-subtitle">{displayRole(selectedAccount.role)} account</p>

				<dl class="profile-details">
					<div>
						<dt>Institutional Email</dt>
						<dd>{selectedAccount.email || 'Not provided'}</dd>
					</div>
					<div>
						<dt>Program / Department</dt>
						<dd>
							{[selectedAccount.course, selectedAccount.department].filter(Boolean).join(' · ') ||
								'Not provided'}
						</dd>
					</div>
				</dl>
				<hr />
				<dl class="profile-details compact-details">
					<div>
						<dt>Joined Date</dt>
						<dd>{formatDate(selectedAccount.created_at)}</dd>
					</div>
					<div>
						<dt>ID Number</dt>
						<dd>{accountIdNumber(selectedAccount)}</dd>
					</div>
				</dl>

				{#if statusOf(selectedAccount.account_status) === 'pending'}
					<div class="profile-admin-actions">
						<form method="POST" action="?/setStatus" use:enhance>
							<input type="hidden" name="id" value={selectedAccount.id} />
							<input type="hidden" name="status" value="approved" />
							<button class="primary-button" type="submit">Approve account</button>
						</form>
						<form method="POST" action="?/setStatus" use:enhance>
							<input type="hidden" name="id" value={selectedAccount.id} />
							<input type="hidden" name="status" value="rejected" />
							<button class="secondary-button danger-text" type="submit">Reject</button>
						</form>
					</div>
				{:else if statusOf(selectedAccount.account_status) === 'archived'}
					<form class="profile-admin-actions" method="POST" action="?/setStatus" use:enhance>
						<input type="hidden" name="id" value={selectedAccount.id} />
						<input type="hidden" name="status" value="approved" />
						<button class="primary-button" type="submit">Restore account</button>
					</form>
				{:else if isApproved(selectedAccount.account_status) && selectedAccount.id !== data.currentAdminId}
					<form class="profile-admin-actions" method="POST" action="?/setStatus" use:enhance>
						<input type="hidden" name="id" value={selectedAccount.id} />
						<input type="hidden" name="status" value="suspended" />
						<button class="secondary-button danger-text" type="submit">Suspend account</button>
					</form>
				{/if}
			</section>

			<div class="profile-side">
				<section class="profile-card permissions-card" aria-labelledby="permissions-title">
					<div class="card-heading">
						<div class="section-icon" aria-hidden="true">
							<svg viewBox="0 0 24 24"
								><path d="M12 3 4 6v5c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6Z" /><path
									d="m9 12 2 2 4-4"
								/></svg
							>
						</div>
						<div>
							<h2 id="permissions-title">Access Permissions</h2>
							<p>Role-based access for this account</p>
						</div>
					</div>
					<ul class="permission-list">
						{#each permissionsFor(selectedAccount.role) as permission}
							<li>
								<span>{permission.name}</span>
								<span class:granted={permission.allowed} class="permission-level">
									{permission.allowed ? 'Granted' : 'No access'}
								</span>
							</li>
						{/each}
					</ul>
				</section>

				<section class="profile-card personal-card" aria-labelledby="personal-title">
					<div class="card-heading">
						<div class="section-icon" aria-hidden="true">
							<svg viewBox="0 0 24 24"
								><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg
							>
						</div>
						<div>
							<h2 id="personal-title">Personal Information</h2>
							<p>Additional account details</p>
						</div>
					</div>
					<dl class="personal-details">
						<div>
							<dt>Gender</dt>
							<dd>Not provided</dd>
						</div>
						<div>
							<dt>Birthday</dt>
							<dd>Not provided</dd>
						</div>
						<div>
							<dt>Co-op Employee</dt>
							<dd>{selectedAccount.employee_no ? 'Yes' : 'No'}</dd>
						</div>
					</dl>
				</section>

				<section class="profile-card activity-card" aria-label="Account activity">
					<div>
						<p class="activity-label">Last Activity</p>
						<strong
							>{selectedAccount.last_activity_at
								? formatDate(selectedAccount.last_activity_at)
								: 'Never signed in'}</strong
						>
					</div>
					<p class="activity-note">
						Accounts without a sign-in for 30 days are marked inactive. Signing in restores active
						status.
					</p>
				</section>
			</div>
		</div>
	{:else}
		<header class="admin-title-row">
			<div>
				<p class="admin-eyebrow">Administration</p>
				<h1 class="admin-title">Manage Accounts</h1>
				<p class="admin-subtitle">View account activity, status, and access details.</p>
			</div>
			<button class="add-button" type="button" onclick={() => (addOpen = true)}
				>+ Add account</button
			>
		</header>

		{#if data.pendingCount}
			<aside class="new-signups" role="status">
				<span class="notification-dot"></span>
				<div>
					<strong
						>{data.pendingCount} new sign-up{data.pendingCount === 1 ? '' : 's'} need review</strong
					>
					<small>Open a profile to approve or reject a pending account.</small>
				</div>
				<button type="button" class="view-pending" onclick={() => (statusFilter = 'pending')}
					>View pending</button
				>
			</aside>
		{/if}
		{#if form?.success}<p class="notice success" role="status">{form.success}</p>{/if}
		{#if form?.message}<p class="notice error" role="alert">{form.message}</p>{/if}

		<section class="account-panel" aria-label="User accounts">
			<div class="toolbar">
				<label class="search"
					>Search accounts
					<input bind:value={query} placeholder="Name, ID, email, department" />
				</label>
				<label class="filter"
					>Role
					<select bind:value={roleFilter}>
						<option value="all">All roles</option>
						<option value="student">Student</option>
						<option value="teacher">Professor</option>
						<option value="cashier">Cashier</option>
						<option value="admin">Admin</option>
					</select>
				</label>
				<label class="filter"
					>Status
					<select bind:value={statusFilter}>
						<option value="all">All statuses</option>
						<option value="active">Active</option>
						<option value="inactive">Inactive</option>
						<option value="pending">Pending review</option>
					</select>
				</label>
				<span class="count">{filtered.length} accounts</span>
			</div>
			<div class="table-wrap">
				<table>
					<thead>
						<tr
							><th>Name</th><th>Role</th><th>Last Activity</th><th>First Created</th><th>Status</th
							></tr
						>
					</thead>
					<tbody>
						{#each filtered as account (account.id)}
							{@const active = isActive(account)}
							<tr
								class="account-row"
								role="button"
								tabindex="0"
								aria-label={`View ${fullName(account)} profile`}
								onclick={() => openProfile(account.id)}
								onkeydown={(event) => {
									if (event.key === 'Enter' || event.key === ' ') {
										event.preventDefault();
										openProfile(account.id);
									}
								}}
							>
								<td
									><strong>{fullName(account)}</strong><small>{membershipTitle(account.role)}</small
									></td
								>
								<td><span class="role">{displayRole(account.role)}</span></td>
								<td
									>{account.last_activity_at
										? formatDate(account.last_activity_at)
										: 'Never signed in'}</td
								>
								<td>{formatDate(account.created_at)}</td>
								<td
									><span class:inactive={!active} class="status"
										><span class="status-dot"></span>{active ? 'Active' : 'Inactive'}</span
									></td
								>
							</tr>
						{:else}
							<tr><td colspan="5" class="empty">No accounts match your search and filters.</td></tr>
						{/each}
					</tbody>
				</table>
			</div>
			<p class="storage-note">
				Accounts become inactive after 30 days without a successful sign-in; logging in makes them
				active again.
			</p>
		</section>
	{/if}
</main>

{#if addOpen || editOpen}
	{@const editing = editOpen && selectedAccount}
	<div
		class="modal-backdrop"
		role="presentation"
		onclick={(event) => {
			if (event.target === event.currentTarget) {
				addOpen = false;
				editOpen = false;
			}
		}}
	>
		<div class="create-modal" role="dialog" aria-modal="true" aria-labelledby="account-modal-title">
			<header>
				<div>
					<p class="admin-eyebrow">{editing ? 'Account profile' : 'User access'}</p>
					<h2 id="account-modal-title">{editing ? 'Edit account' : 'Add account'}</h2>
				</div>
				<button
					class="close-button"
					type="button"
					aria-label="Close"
					onclick={() => {
						addOpen = false;
						editOpen = false;
					}}>×</button
				>
			</header>

			{#if editing}
				<form
					method="POST"
					action="?/updateAccount"
					use:enhance={() =>
						async ({ result, update }) => {
							await update();
							if (result.type === 'success') editOpen = false;
						}}
				>
					<input type="hidden" name="id" value={editing.id} />
					<div class="name-fields">
						<label
							>First name<input name="firstName" value={editing.first_name ?? ''} required /></label
						>
						<label
							>Last name<input name="lastName" value={editing.last_name ?? ''} required /></label
						>
					</div>
					<label
						>Institutional email<input value={editing.email ?? ''} disabled /><small
							>Email updates are managed through the sign-in provider.</small
						></label
					>
					<label
						>{editing.role?.toLowerCase() === 'student'
							? 'Student ID number'
							: 'Employee ID number'}<input
							name="idNumber"
							value={accountIdNumber(editing) === 'Not provided' ? '' : accountIdNumber(editing)}
							required
						/></label
					>
					<label>Department<input name="department" value={editing.department ?? ''} /></label>
					{#if editing.role?.toLowerCase() === 'student'}<label
							>Program / Course<input name="course" value={editing.course ?? ''} /></label
						>{:else}<input type="hidden" name="course" value="" />{/if}
					{#if form?.message}<p class="form-error" role="alert">{form.message}</p>{/if}
					<footer>
						<button class="cancel-button" type="button" onclick={() => (editOpen = false)}
							>Cancel</button
						>
						<button class="add-button" type="submit">Save changes</button>
					</footer>
				</form>
			{:else}
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
						>Account role
						<select name="role" bind:value={newRole}>
							<option value="student">Student</option><option value="teacher">Professor</option>
							<option value="cashier">Cashier</option><option value="admin">Admin</option>
						</select>
					</label>
					<div class="name-fields">
						<label>First name<input name="firstName" required /></label>
						<label>Last name<input name="lastName" required /></label>
					</div>
					<label
						>{newRole === 'student' ? 'Student number' : 'Employee number'}
						<input name={newRole === 'student' ? 'schoolId' : 'employeeNo'} required />
					</label>
					<label>Email address<input type="email" name="email" required /></label>
					{#if newRole === 'student'}
						<label>Department / college<input name="department" required /></label>
						<label>Course / program<input name="course" required /></label>
						<label
							>Year level
							<select name="yearLevel" required>
								<option value="">Select year</option>
								{#each [1, 2, 3, 4, 5, 6] as year}<option value={year}>{year}</option>{/each}
							</select>
						</label>
					{:else}
						<label>Department<input name="department" required /></label>
					{/if}
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
						<button class="cancel-button" type="button" onclick={() => (addOpen = false)}
							>Cancel</button
						>
						<button class="add-button" type="submit">Create account</button>
					</footer>
				</form>
			{/if}
		</div>
	</div>
{/if}

<style>
	.accounts-page {
		max-width: 100%;
		padding: 1.5rem;
	}
	.admin-title-row,
	.detail-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.25rem;
	}
	.admin-eyebrow {
		margin: 0;
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
	.add-button,
	.primary-button {
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
	.add-button:hover,
	.primary-button:hover {
		background: #1d4ed8;
	}
	.account-panel,
	.profile-card {
		border: 1px solid #e2e8f0;
		border-radius: 0.85rem;
		background: white;
		box-shadow: 0 8px 24px rgba(32, 55, 88, 0.04);
	}
	.account-panel {
		overflow: hidden;
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
		box-sizing: border-box;
		width: 100%;
		min-height: 2.5rem;
		border: 1px solid #dce3ed;
		border-radius: 0.5rem;
		background: white;
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
		white-space: nowrap;
	}
	.table-wrap {
		overflow: auto;
	}
	table {
		width: 100%;
		min-width: 760px;
		border-collapse: collapse;
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
		vertical-align: middle;
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
	.account-row {
		cursor: pointer;
		outline: none;
		transition: background 0.15s ease;
	}
	.account-row:hover,
	.account-row:focus-visible {
		background: #f5f8ff;
	}
	.role {
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
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		border-radius: 2rem;
		background: #e8f8ef;
		color: #07894b;
		padding: 0.34rem 0.65rem;
		font-size: 0.68rem;
		font-weight: 800;
		white-space: nowrap;
	}
	.status.inactive {
		background: #eef1f5;
		color: #68758a;
	}
	.status-dot {
		width: 0.43rem;
		height: 0.43rem;
		border-radius: 50%;
		background: currentColor;
	}
	.empty {
		padding: 2rem;
		color: #71809a;
		text-align: center;
	}
	.storage-note {
		margin: 0;
		padding: 0.8rem 1rem;
		color: #7b8799;
		font-size: 0.67rem;
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
	.notification-dot {
		width: 0.6rem;
		height: 0.6rem;
		flex: 0 0 auto;
		border-radius: 50%;
		background: #f59e0b;
		box-shadow: 0 0 0 4px #fef3c7;
	}
	.view-pending {
		flex: 0 0 auto;
		margin-left: auto;
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
	.notice.success {
		border-color: #bde8ce;
		background: #f0fbf4;
		color: #187342;
	}
	.detail-header {
		align-items: flex-end;
	}
	.back-button {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		margin-bottom: 0.85rem;
		border: 0;
		background: none;
		padding: 0;
		color: #52637c;
		font: inherit;
		font-size: 0.75rem;
		font-weight: 700;
		cursor: pointer;
	}
	.back-button svg {
		width: 1rem;
		height: 1rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
	}
	.detail-actions {
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}
	.detail-actions form {
		margin: 0;
	}
	.icon-action {
		display: grid;
		width: 2.75rem;
		height: 2.75rem;
		place-items: center;
		border: 1px solid #d9e1eb;
		border-radius: 0.65rem;
		background: white;
		color: #42536d;
		cursor: pointer;
		transition: 0.15s ease;
	}
	.icon-action:hover {
		border-color: #2563eb;
		color: #2563eb;
		background: #f5f8ff;
	}
	.icon-action svg {
		width: 1.15rem;
		height: 1.15rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.8;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.delete-action:hover {
		border-color: #dc2626;
		color: #dc2626;
		background: #fff6f6;
	}
	.icon-action:disabled {
		cursor: not-allowed;
		opacity: 0.45;
	}
	.profile-layout {
		display: grid;
		grid-template-columns: minmax(17rem, 0.8fr) minmax(0, 1.35fr);
		align-items: start;
		gap: 1rem;
	}
	.profile-card {
		padding: 1.35rem;
	}
	.main-profile-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}
	.avatar {
		position: relative;
		display: grid;
		box-sizing: border-box;
		width: 5.4rem;
		height: 5.4rem;
		place-items: center;
		margin-bottom: 0.9rem;
		overflow: hidden;
		border: 4px solid #e7eef9;
		border-radius: 50%;
		background: #f3f6fb;
		color: #526b91;
		font-size: 1.5rem;
		font-weight: 800;
		text-transform: uppercase;
		flex: 0 0 5.4rem;
	}
	.avatar img {
		position: absolute;
		inset: 0;
		display: block;
		width: 100%;
		height: 100%;
		border-radius: inherit;
		object-fit: cover;
	}
	.avatar svg {
		width: 2.3rem;
		height: 2.3rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.7;
	}
	.photo-actions {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		margin: -0.15rem 0 0.9rem;
	}
	.photo-file-input {
		display: none;
	}
	.photo-action {
		display: inline-flex;
		min-height: 2rem;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
		border: 0;
		border-radius: 9999px;
		background: #596eff;
		color: #fff;
		padding: 0.35rem 0.75rem;
		font: inherit;
		font-size: 0.7rem;
		font-weight: 800;
		cursor: pointer;
		transition:
			background 0.15s ease,
			transform 0.15s ease;
	}
	.photo-action:hover:not(:disabled) {
		background: #4058ed;
		transform: translateY(-1px);
	}
	.photo-action:disabled {
		cursor: wait;
		opacity: 0.7;
	}
	.photo-action svg {
		width: 0.95rem;
		height: 0.95rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.8;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.photo-message {
		margin: -0.35rem 0 0.75rem;
		color: #b91c1c;
		font-size: 0.68rem;
		line-height: 1.45;
	}
	.main-profile-card h2 {
		margin: 0.8rem 0 0.25rem;
		font-size: 1.1rem;
		font-weight: 800;
	}
	.profile-subtitle {
		margin: 0 0 1.2rem;
		color: #71809a;
		font-size: 0.75rem;
	}
	.profile-details,
	.personal-details {
		display: grid;
		width: 100%;
		gap: 0.85rem;
		margin: 0;
		text-align: left;
	}
	.profile-details div,
	.personal-details div {
		display: flex;
		justify-content: space-between;
		gap: 0.8rem;
	}
	.profile-details dt,
	.personal-details dt {
		color: #687891;
		font-size: 0.7rem;
		font-weight: 700;
	}
	.profile-details dd,
	.personal-details dd {
		margin: 0;
		color: #243650;
		font-size: 0.72rem;
		font-weight: 700;
		text-align: right;
		overflow-wrap: anywhere;
	}
	.main-profile-card hr {
		width: 100%;
		margin: 1.2rem 0;
		border: 0;
		border-top: 1px solid #e7edf4;
	}
	.compact-details {
		gap: 0.7rem;
	}
	.profile-admin-actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.55rem;
		width: 100%;
		margin-top: 1.25rem;
	}
	.profile-admin-actions form {
		margin: 0;
	}
	.profile-admin-actions button {
		padding: 0.6rem 0.8rem;
	}
	.secondary-button {
		border: 1px solid #d9e1eb;
		border-radius: 0.55rem;
		background: white;
		color: #475569;
		padding: 0.7rem 0.9rem;
		font: inherit;
		font-size: 0.72rem;
		font-weight: 800;
		cursor: pointer;
	}
	.danger-text {
		color: #bd3434;
	}
	.profile-side {
		display: grid;
		gap: 1rem;
	}
	.card-heading {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}
	.section-icon {
		display: grid;
		width: 2.35rem;
		height: 2.35rem;
		flex: 0 0 auto;
		place-items: center;
		border-radius: 0.65rem;
		background: #edf4ff;
		color: #2563eb;
	}
	.section-icon svg {
		width: 1.2rem;
		height: 1.2rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.7;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.card-heading h2 {
		margin: 0;
		font-size: 0.9rem;
		font-weight: 800;
	}
	.card-heading p {
		margin: 0.2rem 0 0;
		color: #7b8799;
		font-size: 0.68rem;
	}
	.permission-list {
		display: grid;
		gap: 0.15rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.permission-list li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		border-top: 1px solid #edf1f5;
		padding: 0.65rem 0;
		color: #34445d;
		font-size: 0.73rem;
		font-weight: 700;
	}
	.permission-level {
		border-radius: 2rem;
		background: #eef1f5;
		color: #68758a;
		padding: 0.28rem 0.55rem;
		font-size: 0.63rem;
		font-weight: 800;
	}
	.permission-level.granted {
		background: #e8f8ef;
		color: #07894b;
	}
	.personal-details {
		gap: 0;
	}
	.personal-details div {
		border-top: 1px solid #edf1f5;
		padding: 0.7rem 0;
	}
	.activity-card {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
	}
	.activity-label {
		margin: 0 0 0.3rem;
		color: #71809a;
		font-size: 0.67rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.activity-card strong {
		font-size: 0.78rem;
	}
	.activity-note {
		max-width: 19rem;
		margin: 0;
		color: #71809a;
		font-size: 0.67rem;
		line-height: 1.5;
		text-align: right;
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
		box-sizing: border-box;
		width: min(100%, 36rem);
		max-height: 95vh;
		overflow: auto;
		border: 1px solid #e2e8f0;
		border-radius: 0.85rem;
		background: white;
		padding: 1.4rem;
		color: #17233d;
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
	.create-modal label small {
		color: #7b8799;
		font-size: 0.64rem;
		font-weight: 500;
	}
	.create-modal input,
	.create-modal select {
		box-sizing: border-box;
		width: 100%;
		min-height: 2.5rem;
		border: 1px solid #dce3ed;
		border-radius: 0.5rem;
		background: white;
		padding: 0.55rem 0.7rem;
		color: #17233d;
		font: inherit;
		font-size: 0.75rem;
	}
	.create-modal input:disabled {
		background: #f4f6f9;
		color: #748199;
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
	:global(html[data-theme='dark'] .account-panel),
	:global(html[data-theme='dark'] .profile-card) {
		border-color: #334866;
		background: #172640;
		color: #edf4ff;
		box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22);
	}
	:global(html[data-theme='dark'] .toolbar) {
		border-color: #334866;
		background: #172640;
	}
	:global(html[data-theme='dark'] .toolbar label),
	:global(html[data-theme='dark'] .count),
	:global(html[data-theme='dark'] .profile-details dt),
	:global(html[data-theme='dark'] .personal-details dt),
	:global(html[data-theme='dark'] .activity-label) {
		color: #b8c8dd;
	}
	:global(html[data-theme='dark'] .toolbar input),
	:global(html[data-theme='dark'] .toolbar select) {
		color-scheme: dark;
		border-color: #415878;
		background: #101d35;
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .account-panel th) {
		background: #101d35;
		color: #b8c8dd;
	}
	:global(html[data-theme='dark'] .account-panel td),
	:global(html[data-theme='dark'] .permission-list li),
	:global(html[data-theme='dark'] .personal-details div) {
		border-color: #334866;
		color: #c9d6e8;
	}
	:global(html[data-theme='dark'] .account-panel td strong),
	:global(html[data-theme='dark'] .main-profile-card h2),
	:global(html[data-theme='dark'] .profile-details dd),
	:global(html[data-theme='dark'] .personal-details dd),
	:global(html[data-theme='dark'] .activity-card strong),
	:global(html[data-theme='dark'] .card-heading h2) {
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .account-panel td small),
	:global(html[data-theme='dark'] .storage-note),
	:global(html[data-theme='dark'] .profile-subtitle),
	:global(html[data-theme='dark'] .card-heading p),
	:global(html[data-theme='dark'] .activity-note) {
		color: #a9bad0;
	}
	:global(html[data-theme='dark'] .account-row:hover),
	:global(html[data-theme='dark'] .account-row:focus-visible) {
		background: #1d3150;
	}
	:global(html[data-theme='dark'] .icon-action),
	:global(html[data-theme='dark'] .secondary-button),
	:global(html[data-theme='dark'] .cancel-button) {
		border-color: #415878;
		background: #172640;
		color: #d8e4f4;
	}
	:global(html[data-theme='dark'] .icon-action:hover) {
		border-color: #60a5fa;
		color: #8eb5ff;
		background: #203a60;
	}
	:global(html[data-theme='dark'] .delete-action:hover) {
		border-color: #f87171;
		background: #3b1f27;
		color: #fecaca;
	}
	:global(html[data-theme='dark'] .add-button),
	:global(html[data-theme='dark'] .primary-button) {
		background: #3478ed;
		color: #fff;
	}
	:global(html[data-theme='dark'] .add-button:hover),
	:global(html[data-theme='dark'] .primary-button:hover) {
		background: #4a8bff;
		color: #fff;
	}
	:global(html[data-theme='dark'] .photo-action) {
		background: #596eff;
		color: #fff;
	}
	:global(html[data-theme='dark'] .photo-action:hover:not(:disabled)) {
		background: #7182ff;
		color: #fff;
	}
	:global(html[data-theme='dark'] .back-button) {
		color: #b8c8dd;
	}
	:global(html[data-theme='dark'] .back-button:hover) {
		color: #8eb5ff;
	}
	:global(html[data-theme='dark'] .avatar) {
		border-color: #334866;
		background: #101d35;
		color: #a9c5eb;
	}
	:global(html[data-theme='dark'] .main-profile-card hr) {
		border-color: #334866;
	}
	:global(html[data-theme='dark'] .section-icon) {
		background: #203a60;
		color: #8eb5ff;
	}
	:global(html[data-theme='dark'] .permission-level) {
		background: #27354a;
		color: #b8c8dd;
	}
	:global(html[data-theme='dark'] .permission-level.granted) {
		background: #153b34;
		color: #86efac;
	}
	:global(html[data-theme='dark'] .status) {
		background: #153b34;
		color: #86efac;
	}
	:global(html[data-theme='dark'] .status.inactive) {
		background: #27354a;
		color: #b8c8dd;
	}
	:global(html[data-theme='dark'] .create-modal) {
		border-color: #334866;
		background: #172640;
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .create-modal label) {
		color: #b8c8dd;
	}
	:global(html[data-theme='dark'] .create-modal input),
	:global(html[data-theme='dark'] .create-modal select) {
		border-color: #415878;
		background: #101d35;
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .create-modal input:disabled) {
		background: #172640;
		color: #a9bad0;
	}
	:global(html[data-theme='dark'] .close-button) {
		background: transparent;
		color: #d8e4f4;
	}
	:global(html[data-theme='dark'] .close-button:hover) {
		background: #203a60;
		color: #fff;
	}
	:global(html[data-theme='dark'] .secondary-button),
	:global(html[data-theme='dark'] .cancel-button) {
		border-color: #415878;
		background: #203652;
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .secondary-button:hover),
	:global(html[data-theme='dark'] .cancel-button:hover) {
		border-color: #6684aa;
		background: #294464;
		color: #fff;
	}
	:global(html[data-theme='dark'] .danger-text) {
		color: #fca5a5;
	}
	:global(html[data-theme='dark'] .photo-message) {
		color: #fecaca;
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
		.profile-layout {
			grid-template-columns: minmax(15rem, 0.85fr) minmax(0, 1.15fr);
		}
	}
	@media (max-width: 650px) {
		.accounts-page {
			padding: 1rem;
		}
		.admin-title-row {
			align-items: flex-start;
			flex-direction: column;
		}
		.detail-header {
			align-items: flex-start;
		}
		.profile-layout {
			grid-template-columns: 1fr;
		}
		.activity-card {
			flex-direction: column;
		}
		.activity-note {
			text-align: left;
		}
	}
	@media (max-width: 480px) {
		.name-fields {
			grid-template-columns: 1fr;
		}
		.new-signups {
			align-items: flex-start;
			flex-wrap: wrap;
		}
		.view-pending {
			margin-left: 1.35rem;
		}
	}
</style>
