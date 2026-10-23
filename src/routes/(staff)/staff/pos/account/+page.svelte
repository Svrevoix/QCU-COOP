<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import PasswordChange from '$lib/components/PasswordChange.svelte';
	import StaffLogout from '$lib/components/StaffLogout.svelte';

	const AVATAR_STORAGE_KEY = 'qcu-cashier-avatar-image';
	let fileInput = $state<HTMLInputElement>();
	let avatar = $state<string | null>(null);
	let isDarkMode = $state(false);

	function handleImageSelect(event: Event) {
		const file = (event.currentTarget as HTMLInputElement).files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = () => {
			avatar = reader.result as string;
			localStorage.setItem(AVATAR_STORAGE_KEY, avatar);
		};
		reader.readAsDataURL(file);
	}

	function toggleTheme() {
		isDarkMode = !isDarkMode;
		document.documentElement.dataset.theme = isDarkMode ? 'dark' : 'light';
		localStorage.setItem('qcu-theme', isDarkMode ? 'dark' : 'light');
	}

	onMount(() => {
		avatar = localStorage.getItem(AVATAR_STORAGE_KEY);
		isDarkMode = localStorage.getItem('qcu-theme') === 'dark';
	});
</script>

<svelte:head>
	<title>Cashier Account | QCU Coop Store</title>
</svelte:head>

<main class="cashier-shell">
	<aside class="cashier-sidebar">
		<a class="cashier-brand" href="/staff/pos"
			><span class="brand-mark">Q</span><span
				><strong>QCU COOP</strong><small>Cashier workspace</small></span
			></a
		>
		<p class="sidebar-label">Workspace</p>
		<nav aria-label="Cashier navigation">
			<a href="/staff/pos/register"
				><svg viewBox="0 0 24 24" aria-hidden="true"
					><path d="M3 5h18v14H3zM7 9h4m-4 4h2m4-4h4m-4 4h4" /><path d="M7 16h10" /></svg
				><span>Register</span></a
			>
			<a href="/staff/pos"
				><svg viewBox="0 0 24 24" aria-hidden="true"
					><path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z" /><path d="M8 8h8M8 12h8M8 16h4" /></svg
				><span>POS Transaction Logs</span></a
			>
			<a href="/staff/pos/sales"
				><svg viewBox="0 0 24 24" aria-hidden="true"
					><path d="M4 19V5M4 19h17" /><path d="m7 15 4-5 3 2 5-7" /></svg
				><span>Sales</span></a
			>
			<a class="active" href="/staff/pos/account"
				><svg viewBox="0 0 24 24" aria-hidden="true"
					><circle cx="12" cy="8" r="3.5" /><path
						d="M5 20c1.2-3.6 4.2-5.5 7-5.5s5.8 1.9 7 5.5"
					/></svg
				><span>Account</span></a
			>
		</nav>
		<StaffLogout />
	</aside>

	<section class="cashier-content">
		<section class="account-panel" aria-labelledby="account-title">
			<h2 id="account-title">Cashier profile</h2>
			<div class="avatar-picker">
				<div class="avatar-frame">
					<button
						type="button"
						class="avatar-preview"
						onclick={() => fileInput?.click()}
						aria-label="Change profile picture"
					>
						{#if avatar}
							<img src={avatar} alt="Cashier profile" />
						{:else}
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								aria-hidden="true"
								><circle cx="12" cy="8" r="3.5" /><path
									stroke-linecap="round"
									d="M5 20c1.2-3.6 4.2-5.5 7-5.5s5.8 1.9 7 5.5"
								/></svg
							>
						{/if}
					</button>
					<button
						type="button"
						class="avatar-edit-badge"
						onclick={() => fileInput?.click()}
						aria-label="Upload or edit profile picture"
					>
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							aria-hidden="true"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M14 5h2l1.5 2H21v12H3V7h3.5L8 5h2"
							/><circle cx="12" cy="13" r="3.5" /></svg
						>
					</button>
				</div>
				<input
					bind:this={fileInput}
					type="file"
					accept="image/*"
					class="sr-only-input"
					onchange={handleImageSelect}
				/>
				<p class="account-name">Cashier account</p>
				<p class="account-role">Point of sale access</p>
				<dl class="profile-details">
					<div>
						<dt>Full Name</dt>
						<dd>Not provided</dd>
					</div>
					<div>
						<dt>Staff ID</dt>
						<dd>{page.data.user?.id ?? 'Not provided'}</dd>
					</div>
					<div>
						<dt>Assigned Counter / Terminal</dt>
						<dd>Not assigned</dd>
					</div>
					<div>
						<dt>Active Shift Schedule</dt>
						<dd>Not provided</dd>
					</div>
				</dl>
			</div>

			<div class="settings-section">
				<h3>Settings</h3>
				<div class="settings-row">
					<span>Dark mode</span>
					<button
						type="button"
						class="theme-switch"
						onclick={toggleTheme}
						aria-pressed={isDarkMode}
						aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
						><span class="switch-thumb"></span></button
					>
				</div>
				<PasswordChange />
			</div>
		</section>
	</section>
</main>

<style>
	.cashier-shell {
		--navy: #07152d;
		--ink: #172b4d;
		--line: #e4eaf2;
		display: flex;
		min-height: 100vh;
		background: #f3f6fa;
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
		padding: 2.25rem clamp(1rem, 3vw, 3rem) 3rem;
	}
	.account-panel {
		width: 100%;
		max-width: 38rem;
		border: 1px solid var(--line);
		border-radius: 0.75rem;
		background: white;
		padding: 1.5rem;
		box-shadow: 0 8px 24px rgba(32, 55, 88, 0.04);
	}
	.account-panel h2 {
		margin: 0;
		color: var(--ink);
		font-size: 0.9rem;
		font-weight: 900;
	}
	.avatar-picker {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
		padding: 1.75rem 0;
	}
	.avatar-frame {
		position: relative;
		width: 6rem;
		height: 6rem;
	}
	.avatar-preview {
		display: grid;
		width: 100%;
		height: 100%;
		place-items: center;
		overflow: hidden;
		border: 2px solid #e5e9f0;
		border-radius: 50%;
		background: #f5f7fa;
		color: #64748b;
		padding: 0;
		cursor: pointer;
	}
	.avatar-preview > svg {
		width: 2.75rem;
		height: 2.75rem;
	}
	.avatar-preview img {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
	}
	.avatar-edit-badge {
		position: absolute;
		right: -0.1rem;
		bottom: -0.1rem;
		display: grid;
		width: 1.65rem;
		height: 1.65rem;
		place-items: center;
		border: 2px solid white;
		border-radius: 50%;
		background: #2563eb;
		color: white;
		padding: 0;
		cursor: pointer;
	}
	.avatar-edit-badge svg {
		width: 0.8rem;
		height: 0.8rem;
	}
	.avatar-edit-badge:focus-visible {
		outline: 2px solid #111827;
		outline-offset: 2px;
	}
	.sr-only-input {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		opacity: 0;
	}
	.account-name {
		margin: 0.6rem 0 0;
		color: #111827;
		font-size: 0.95rem;
		font-weight: 800;
	}
	.account-role {
		margin: 0.15rem 0 0;
		color: #6b7280;
		font-size: 0.72rem;
		font-weight: 600;
	}
	.profile-details {
		display: grid;
		width: min(100%, 22rem);
		gap: 0.55rem;
		margin: 1rem 0 0;
		text-align: left;
	}
	.profile-details div {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		font-size: 0.72rem;
	}
	.profile-details dt {
		color: #6b7280;
		font-weight: 700;
	}
	.profile-details dd {
		margin: 0;
		color: #374151;
		font-weight: 600;
		text-align: right;
		overflow-wrap: anywhere;
	}
	.settings-section {
		border-top: 1px solid #eef1f6;
		padding-top: 1.25rem;
	}
	.settings-section h3 {
		margin: 0 0 0.85rem;
		color: #111827;
		font-size: 0.85rem;
		font-weight: 800;
	}
	.settings-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		color: #1f2937;
		font-size: 0.85rem;
		font-weight: 700;
	}
	.theme-switch {
		position: relative;
		width: 2.4rem;
		height: 1.3rem;
		flex-shrink: 0;
		border: 1px solid #d3dae6;
		border-radius: 9999px;
		background: #e2e8f0;
		padding: 0;
		cursor: pointer;
		transition:
			background 160ms ease,
			border-color 160ms ease;
	}
	.theme-switch[aria-pressed='true'] {
		border-color: #2563eb;
		background: #2563eb;
	}
	.switch-thumb {
		position: absolute;
		top: 1px;
		left: 1px;
		width: 1.1rem;
		height: 1.1rem;
		border-radius: 50%;
		background: white;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
		transition: transform 160ms ease;
	}
	.theme-switch[aria-pressed='true'] .switch-thumb {
		transform: translateX(1.1rem);
	}
	:global(html[data-theme='dark'] .cashier-shell) {
		background: #101d35;
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .cashier-content h1),
	:global(html[data-theme='dark'] .account-panel),
	:global(html[data-theme='dark'] .account-panel h2),
	:global(html[data-theme='dark'] .account-name),
	:global(html[data-theme='dark'] .settings-section h3),
	:global(html[data-theme='dark'] .settings-row) {
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .account-panel) {
		border-color: #334866;
		background: #172640;
	}
	:global(html[data-theme='dark'] .subtitle),
	:global(html[data-theme='dark'] .account-role) {
		color: #b8c8dd;
	}
	:global(html[data-theme='dark'] .settings-section) {
		border-color: #334866;
	}
	:global(html[data-theme='dark'] .avatar-preview) {
		border-color: #415878;
		background: #101d35;
		color: #b8c8dd;
	}
	:global(html[data-theme='dark'] .theme-switch) {
		border-color: #415878;
		background: #223957;
	}
	:global(html[data-theme='dark'] .theme-switch[aria-pressed='true']) {
		border-color: #2563eb;
		background: #2563eb;
	}
	:global(html[data-theme='dark'] .profile-details dt) {
		color: #b8c8dd;
	}
	:global(html[data-theme='dark'] .profile-details dd) {
		color: #edf4ff;
	}
	@media (max-width: 680px) {
		.cashier-shell {
			display: block;
		}
		.cashier-sidebar {
			position: static;
			width: auto;
			height: auto;
			padding: 0.85rem 1rem;
		}
		.cashier-brand {
			padding: 0 0 0.8rem;
		}
		.sidebar-label {
			display: none;
		}
		.cashier-sidebar nav a {
			padding: 0.55rem 0.7rem;
		}
		.cashier-sidebar :global(button) {
			position: absolute;
			top: 0.85rem;
			right: 1rem;
			width: auto;
			margin: 0;
			padding: 0.55rem 0.7rem;
		}
		.cashier-content {
			padding-top: 1.5rem;
		}
	}
</style>
