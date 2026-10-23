<script lang="ts">
	import { onMount } from 'svelte';
	import { avatarImage } from '$lib/profile';

	// Placeholder student identity until real auth/profile data is wired up.
	const studentId = '23-2111';
	const studentName = 'Student Account';

	let fileInput = $state<HTMLInputElement>();
	let isDarkMode = $state(false);
	let showPasswordForm = $state(false);
	let showNewPassword = $state(false);
	let newPassword = $state('');
	let confirmPassword = $state('');
	let passwordNotice = $state('');
	let passwordNoticeType = $state<'error' | 'success'>('error');
	let temporaryPassword = $state('');

	function openImagePicker() {
		fileInput?.click();
	}

	// Reads the chosen image file and stores it as a data URL shared via the avatar store.
	function handleImageSelect(event: Event) {
		const file = (event.currentTarget as HTMLInputElement).files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = () => avatarImage.set(reader.result as string);
		reader.readAsDataURL(file);
	}

	// Flips the system-wide dark/light theme and persists the choice.
	function toggleTheme() {
		isDarkMode = !isDarkMode;
		document.documentElement.dataset.theme = isDarkMode ? 'dark' : 'light';
		localStorage.setItem('qcu-theme', isDarkMode ? 'dark' : 'light');
	}

	function togglePasswordForm() {
		showPasswordForm = !showPasswordForm;
		passwordNotice = '';
	}

	function handlePasswordSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (newPassword.length < 8) {
			passwordNotice = 'Use at least 8 characters for your new password.';
			passwordNoticeType = 'error';
			return;
		}
		if (newPassword !== confirmPassword) {
			passwordNotice = 'The passwords do not match.';
			passwordNoticeType = 'error';
			return;
		}

		temporaryPassword = newPassword;
		newPassword = '';
		confirmPassword = '';
		showNewPassword = false;
		showPasswordForm = false;
		passwordNotice = 'Temporary password preview updated for this session only. Sign-in credentials are unchanged.';
		passwordNoticeType = 'success';
	}

	onMount(() => {
		isDarkMode = localStorage.getItem('qcu-theme') === 'dark';
	});
</script>

<main class="account-page">
	<section class="account-card">
		<h1>Account</h1>

		<!-- Centered, changeable profile picture -->
		<div class="avatar-picker">
			<div class="avatar-frame">
				<button type="button" class="avatar-preview" onclick={openImagePicker} aria-label="Change profile picture">
					{#if $avatarImage}
						<img src={$avatarImage} alt="Your profile" />
					{:else}
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path stroke-linecap="round" d="M5 20c1.2-3.6 4.2-5.5 7-5.5s5.8 1.9 7 5.5"/></svg>
					{/if}
				</button>
				<span class="avatar-edit-badge" aria-hidden="true">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/></svg>
				</span>
			</div>
			<input
				bind:this={fileInput}
				type="file"
				accept="image/*"
				class="sr-only-input"
				onchange={handleImageSelect}
			/>
			<p class="account-name">{studentName}</p>
			<p class="account-id">Student ID: {studentId}</p>
			<dl class="profile-details">
				<div><dt>Full Name</dt><dd>Not provided</dd></div>
				<div><dt>Institutional Email</dt><dd>Not provided</dd></div>
				<div><dt>Program / Department</dt><dd>Not provided</dd></div>
			</dl>
		</div>

		<!-- Settings section: houses the light/dark mode toggle -->
		<div class="settings-section">
			<h2>Settings</h2>
			<div class="settings-row">
				<span>Dark Mode</span>
				<button
					type="button"
					class="theme-switch"
					onclick={toggleTheme}
					aria-pressed={isDarkMode}
					aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
				>
					<span class="switch-thumb"></span>
				</button>
			</div>
			<div class="password-settings-row">
				<span>Change Password</span>
				<button type="button" class="password-action" aria-expanded={showPasswordForm} onclick={togglePasswordForm}>
					{showPasswordForm ? 'Cancel' : 'Change'}
				</button>
			</div>
			{#if showPasswordForm}
				<form class="password-form" onsubmit={handlePasswordSubmit}>
					<label>
						<span>New password</span>
						<span class="password-input-wrap">
							<input type={showNewPassword ? 'text' : 'password'} bind:value={newPassword} autocomplete="new-password" minlength="8" required />
							<button type="button" class="visibility-toggle" onclick={() => showNewPassword = !showNewPassword} aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}>
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>{#if showNewPassword}<path stroke-linecap="round" d="m3 3 18 18" />{/if}</svg>
							</button>
						</span>
					</label>
					<label>
						<span>Confirm new password</span>
						<input class="confirm-password-input" type="password" bind:value={confirmPassword} autocomplete="new-password" minlength="8" required />
					</label>
					<button type="submit" class="save-password-button">Update password</button>
				</form>
			{/if}
			{#if passwordNotice}
				<p class="password-notice" class:error={passwordNoticeType === 'error'} role={passwordNoticeType === 'error' ? 'alert' : 'status'}>
					{passwordNotice}{#if passwordNoticeType === 'success' && temporaryPassword} <span class="password-preview" aria-label="Masked temporary password">{'*'.repeat(temporaryPassword.length)}</span>{/if}
				</p>
			{/if}
		</div>
	</section>
</main>

<style>
	.account-page { min-height: calc(100vh - 4rem); display: grid; place-items: start center; padding: 2.5rem 1rem; }
	.account-card { width: 100%; max-width: 26rem; background: #ffffff; border: 1px solid #e5e9f0; border-radius: 1rem; box-shadow: 0 14px 32px rgba(15, 23, 42, 0.08); padding: 2rem; }
	.account-card h1 { margin: 0 0 1.5rem; font-size: 1.15rem; font-weight: 800; color: #111827; text-align: center; }

	.avatar-picker { display: flex; flex-direction: column; align-items: center; gap: 0.35rem; }
	.avatar-frame { position: relative; width: 6rem; height: 6rem; }
	.avatar-preview { display: grid; place-items: center; width: 100%; height: 100%; padding: 0; border: 2px solid #e5e9f0; border-radius: 9999px; background: #f5f7fa; color: #64748b; cursor: pointer; overflow: hidden; transition: border-color 150ms ease; }
	.avatar-preview:hover { border-color: #93b4e8; }
	.avatar-preview svg { width: 2.75rem; height: 2.75rem; }
	.avatar-preview img { width: 100%; height: 100%; object-fit: cover; border-radius: 9999px; }
	.avatar-edit-badge { position: absolute; bottom: 0; right: 0; display: grid; place-items: center; width: 1.6rem; height: 1.6rem; border-radius: 9999px; background: #2563eb; color: #fff; border: 2px solid #ffffff; pointer-events: none; }
	.avatar-edit-badge svg { width: 0.8rem; height: 0.8rem; }
	.sr-only-input { position: absolute; width: 1px; height: 1px; overflow: hidden; opacity: 0; }
	.account-name { margin: 0.6rem 0 0; font-size: 0.95rem; font-weight: 800; color: #111827; }
	.account-id { margin: 0.15rem 0 0; font-size: 0.72rem; font-weight: 600; color: #6b7280; }
	.profile-details { display: grid; width: 100%; gap: 0.65rem; margin: 1rem 0 0; text-align: left; }
	.profile-details div { display: flex; justify-content: space-between; gap: 1rem; font-size: 0.72rem; }
	.profile-details dt { color: #6b7280; font-weight: 700; }
	.profile-details dd { margin: 0; color: #374151; font-weight: 600; text-align: right; overflow-wrap: anywhere; }

	.settings-section { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #eef1f6; }
	.settings-section h2 { margin: 0 0 0.85rem; font-size: 0.85rem; font-weight: 800; color: #111827; }
	.settings-row { display: flex; align-items: center; justify-content: space-between; font-size: 0.85rem; font-weight: 700; color: #1f2937; }
	.password-settings-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-top: 1rem; color: #1f2937; font-size: 0.85rem; font-weight: 700; }
	.password-action { border: 0; background: transparent; padding: 0.25rem 0; color: #2563eb; font: inherit; font-size: 0.78rem; font-weight: 800; cursor: pointer; }
	.password-form { display: grid; gap: 0.8rem; margin-top: 0.8rem; }
	.password-form label { display: grid; gap: 0.35rem; color: #4b5563; font-size: 0.72rem; font-weight: 700; }
	.password-input-wrap { position: relative; display: flex; align-items: center; }
	.password-input-wrap input, .confirm-password-input { box-sizing: border-box; width: 100%; min-width: 0; border: 1px solid #d9e2ec; border-radius: 0.55rem; background: #f5f7fa; padding: 0.65rem 0.75rem; color: #111827; font: inherit; font-size: 0.8rem; outline: none; }
	.password-input-wrap input { padding-right: 2.5rem; }
	.password-input-wrap input:focus, .confirm-password-input:focus { border-color: #2563eb; }
	.visibility-toggle { position: absolute; right: 0.45rem; display: grid; width: 1.6rem; height: 1.6rem; place-items: center; border: 0; background: transparent; color: #6b7280; cursor: pointer; }
	.visibility-toggle svg { width: 1rem; height: 1rem; }
	.save-password-button { justify-self: start; border: 0; border-radius: 0.5rem; background: #2563eb; padding: 0.55rem 0.8rem; color: white; font: inherit; font-size: 0.75rem; font-weight: 800; cursor: pointer; }
	.password-notice { margin: 0.7rem 0 0; color: #166534; font-size: 0.72rem; font-weight: 600; line-height: 1.5; overflow-wrap: anywhere; }
	.password-notice.error { color: #b42318; }
	.password-preview { display: inline-block; margin-left: 0.25rem; letter-spacing: 0.08em; }

	.theme-switch { position: relative; width: 2.4rem; height: 1.3rem; flex-shrink: 0; border: 1px solid #d3dae6; border-radius: 9999px; background: #e2e8f0; padding: 0; cursor: pointer; transition: background 160ms ease, border-color 160ms ease; }
	.theme-switch[aria-pressed='true'] { background: #2563eb; border-color: #2563eb; }
	.switch-thumb { position: absolute; top: 1px; left: 1px; width: 1.1rem; height: 1.1rem; border-radius: 9999px; background: #ffffff; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25); transition: transform 160ms ease; }
	.theme-switch[aria-pressed='true'] .switch-thumb { transform: translateX(1.1rem); }

	:global(html[data-theme='dark'] .account-card) { background: #172640; border-color: #334866; box-shadow: 0 14px 32px rgba(0, 0, 0, 0.4); }
	:global(html[data-theme='dark'] .account-card h1), :global(html[data-theme='dark'] .account-name), :global(html[data-theme='dark'] .settings-section h2), :global(html[data-theme='dark'] .settings-row), :global(html[data-theme='dark'] .profile-details dd), :global(html[data-theme='dark'] .password-settings-row) { color: #edf4ff; }
	:global(html[data-theme='dark'] .account-id) { color: #b8c8dd; }
	:global(html[data-theme='dark'] .profile-details dt) { color: #b8c8dd; }
	:global(html[data-theme='dark'] .avatar-preview) { background: #101d35; border-color: #415878; color: #b8c8dd; }
	:global(html[data-theme='dark'] .settings-section) { border-color: #334866; }
	:global(html[data-theme='dark'] .theme-switch) { background: #223957; border-color: #415878; }
	:global(html[data-theme='dark'] .theme-switch[aria-pressed='true']) { background: #2563eb; border-color: #2563eb; }
	:global(html[data-theme='dark'] .password-form label) { color: #b8c8dd; }
	:global(html[data-theme='dark'] .password-input-wrap input), :global(html[data-theme='dark'] .confirm-password-input) { border-color: #415878; background: #101d35; color: #edf4ff; }
	:global(html[data-theme='dark'] .visibility-toggle) { color: #b8c8dd; }
	:global(html[data-theme='dark'] .password-notice) { color: #86efac; }
	:global(html[data-theme='dark'] .password-notice.error) { color: #fca5a5; }
</style>
