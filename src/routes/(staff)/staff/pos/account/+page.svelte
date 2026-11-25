<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { page } from '$app/state';
	import PasswordChange from '$lib/components/PasswordChange.svelte';
	import AppearanceSelector from '$lib/components/AppearanceSelector.svelte';
	import { avatarStorageKey } from '$lib/profile';

	const cashierSidebar = getContext<{
		collapsed: boolean;
		mobileOpen: boolean;
		toggleMobile: () => void;
		closeMobile: () => void;
	}>('cashierSidebar');
	const user = $derived(page.data.user);
	const fullName = $derived([user?.firstName, user?.lastName].filter(Boolean).join(' '));
	let fileInput = $state<HTMLInputElement>();
	let avatar = $state<string | null>(null);

	function handleImageSelect(event: Event) {
		const file = (event.currentTarget as HTMLInputElement).files?.[0];
		if (!file) return;

		const storageKey = user?.profileId
			? avatarStorageKey(user.profileId)
			: null;
		const reader = new FileReader();
		reader.onload = () => {
			avatar = reader.result as string;
			if (storageKey) localStorage.setItem(storageKey, avatar);
		};
		reader.readAsDataURL(file);
	}

	onMount(() => {
		avatar = user?.profileId
			? localStorage.getItem(avatarStorageKey(user.profileId))
			: null;
	});

</script>

<svelte:window
	onkeydown={(event) => {
		if (event.key === 'Escape') cashierSidebar.closeMobile();
	}}
/>

<svelte:head>
	<title>Cashier Account | QCU Coop Store</title>
</svelte:head>

<main class="cashier-shell" class:collapsed={cashierSidebar.collapsed}>
	<section class="cashier-content">
		<header class="cashier-mobile-topbar">
			<button
				class="cashier-mobile-menu-button"
				type="button"
				aria-label={cashierSidebar.mobileOpen ? 'Close navigation' : 'Open navigation'}
				aria-expanded={cashierSidebar.mobileOpen}
				aria-controls="cashier-sidebar"
				onclick={cashierSidebar.toggleMobile}
			>
				<svg viewBox="0 0 24 24" aria-hidden="true">
					<path d={cashierSidebar.mobileOpen ? 'm6 6 12 12M18 6 6 18' : 'M4 7h16M4 12h16M4 17h16'} />
				</svg>
			</button>
			<strong>Cashier workspace</strong>
		</header>
		<section class="account-panel" aria-labelledby="account-title">
			<h2 id="account-title">Cashier Profile</h2>
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
				<p class="account-name">{fullName || 'Cashier account'}</p>
				<p class="account-role">Point of sale access</p>
				<dl class="profile-details">
					<div>
						<dt>Full Name</dt>
						<dd>{fullName || 'Not provided'}</dd>
					</div>
					<div>
						<dt>Staff ID</dt>
						<dd>{user?.id ?? 'Not provided'}</dd>
					</div>
					<div>
						<dt>Institutional Email</dt>
						<dd>{user?.email ?? 'Not provided'}</dd>
					</div>
					<div>
						<dt>Department / Office</dt>
						<dd>{user?.department ?? 'Not provided'}</dd>
					</div>
				</dl>
			</div>

			<div class="settings-section">
				<h3>Settings</h3>
				<div class="settings-row">
					<span>Appearance</span>
					<AppearanceSelector />
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
		box-sizing: border-box;
		width: 17rem;
		height: 100vh;
		flex: 0 0 17rem;
		flex-direction: column;
		background: var(--navy);
		padding: 1.5rem 1rem 1rem;
		transition:
			width 180ms ease,
			flex-basis 180ms ease,
			padding 180ms ease;
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
	.cashier-sidebar :global(.staff-logout) {
		margin-top: auto;
	}
	.cashier-content {
		width: min(100%, 100rem);
		min-width: 0;
		margin: 0 auto;
		padding: 2.25rem clamp(1rem, 3vw, 3rem) 3rem;
	}
	.cashier-mobile-topbar {
		display: none;
	}
	.cashier-mobile-menu-button,
	.cashier-sidebar-backdrop {
		display: none;
	}
	.cashier-mobile-menu-button {
		flex: 0 0 2.75rem;
		width: 2.75rem;
		height: 2.75rem;
		place-items: center;
		border: 1px solid #e2e8f0;
		border-radius: 0.65rem;
		background: white;
		color: #53647a;
		cursor: pointer;
	}
	.cashier-mobile-menu-button svg {
		width: 1.2rem;
		height: 1.2rem;
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 2;
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
		flex: 0 0 6rem;
		aspect-ratio: 1;
		width: 6rem;
		height: 6rem;
	}
	.avatar-preview {
		display: grid;
		flex: 0 0 100%;
		aspect-ratio: 1;
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
		display: block;
		aspect-ratio: 1;
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
	:global(html[data-theme='dark'] .profile-details dt) {
		color: #b8c8dd;
	}
	:global(html[data-theme='dark'] .profile-details dd) {
		color: #edf4ff;
	}
	@media (max-width: 760px) {
		.cashier-shell {
			display: block;
			position: relative;
		}
		.cashier-sidebar {
			position: fixed;
			z-index: 40;
			inset: 0 auto 0 0;
			box-sizing: border-box;
			width: min(18rem, 88vw);
			height: 100dvh;
			flex: 0 0 auto;
			overflow: hidden;
			padding: max(1rem, env(safe-area-inset-top)) 1rem max(1rem, env(safe-area-inset-bottom));
			transform: translateX(-100%);
			visibility: hidden;
			transition: transform 180ms ease, visibility 180ms ease;
			box-shadow: 12px 0 32px rgba(0, 0, 0, 0.28);
		}
		.cashier-shell.mobile-open .cashier-sidebar {
			transform: translateX(0);
			visibility: visible;
		}
		.cashier-sidebar-backdrop {
			position: fixed;
			z-index: 30;
			inset: 0;
			display: block;
			border: 0;
			background: rgba(4, 12, 26, 0.5);
		}
		.cashier-mobile-menu-button {
			display: grid;
		}
		:global(html[data-theme='dark'] .cashier-mobile-menu-button) {
			border-color: #415878;
			background: #172640;
			color: #edf4ff;
		}
		.cashier-content {
			padding: 0 1rem 2rem;
		}
		.cashier-mobile-topbar {
			display: flex;
			min-height: 3.75rem;
			align-items: center;
			gap: 0.75rem;
			margin: 0 -1rem 1.25rem;
			border-bottom: 1px solid #e5e9ef;
			background: white;
			padding: 0.4rem 1rem;
			color: #172b4d;
		}
		:global(html[data-theme='dark'] .cashier-mobile-topbar) {
			border-color: #334866;
			background: #172640;
			color: #edf4ff;
		}
	}
</style>
