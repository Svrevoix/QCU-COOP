<script lang="ts">
	let newPassword = $state('');
	let confirmPassword = $state('');
	let previewPassword = $state('');
	let showNewPassword = $state(false);
	let showConfirmPassword = $state(false);
	let showPreviewPassword = $state(false);
	let statusMessage = $state('');
	let isError = $state(false);

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (newPassword.length < 8) {
			statusMessage = 'Use at least 8 characters for the new password.';
			isError = true;
			return;
		}
		if (newPassword !== confirmPassword) {
			statusMessage = 'The passwords do not match.';
			isError = true;
			return;
		}

		previewPassword = newPassword;
		newPassword = '';
		confirmPassword = '';
		showNewPassword = false;
		showConfirmPassword = false;
		showPreviewPassword = false;
		statusMessage = 'Password preview updated for this session. Sign-in credentials are unchanged.';
		isError = false;
	}
</script>

<section class="password-section" aria-labelledby="password-title">
	<h3 id="password-title">Change Password</h3>
	<form class="password-form" onsubmit={handleSubmit}>
		<label>
			<span>New password</span>
			<span class="password-input-wrap">
				<input type={showNewPassword ? 'text' : 'password'} bind:value={newPassword} placeholder="********" autocomplete="new-password" minlength="8" required />
				<button type="button" class="visibility-toggle" onclick={() => showNewPassword = !showNewPassword} aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>{#if showNewPassword}<path stroke-linecap="round" d="m3 3 18 18" />{/if}</svg>
				</button>
			</span>
		</label>
		<label>
			<span>Confirm new password</span>
			<span class="password-input-wrap">
				<input type={showConfirmPassword ? 'text' : 'password'} bind:value={confirmPassword} placeholder="********" autocomplete="new-password" minlength="8" required />
				<button type="button" class="visibility-toggle" onclick={() => showConfirmPassword = !showConfirmPassword} aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>{#if showConfirmPassword}<path stroke-linecap="round" d="m3 3 18 18" />{/if}</svg>
				</button>
			</span>
		</label>
		<button type="submit" class="save-password-button">Update password</button>
	</form>
	{#if previewPassword}
		<label class="preview-field">
			<span>Temporary password preview</span>
			<span class="password-input-wrap">
				<input type={showPreviewPassword ? 'text' : 'password'} value={previewPassword} readonly aria-label="Temporary password preview" />
				<button type="button" class="visibility-toggle" onclick={() => showPreviewPassword = !showPreviewPassword} aria-label={showPreviewPassword ? 'Hide password preview' : 'Show password preview'}>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>{#if showPreviewPassword}<path stroke-linecap="round" d="m3 3 18 18" />{/if}</svg>
				</button>
			</span>
		</label>
	{/if}
	{#if statusMessage}<p class="password-status" class:error={isError} role={isError ? 'alert' : 'status'}>{statusMessage}</p>{/if}
</section>

<style>
	.password-section { margin-top: 1.35rem; border-top: 1px solid #eef1f6; padding-top: 1.25rem; }
	.password-section h3 { margin: 0 0 .85rem; color: #111827; font-size: .85rem; font-weight: 800; }
	.password-form { display: grid; gap: .8rem; }
	.password-form label, .preview-field { display: grid; gap: .35rem; color: #4b5563; font-size: .72rem; font-weight: 700; }
	.password-input-wrap { position: relative; display: flex; align-items: center; }
	.password-input-wrap input { box-sizing: border-box; width: 100%; min-width: 0; border: 1px solid #d9e2ec; border-radius: .55rem; background: #f5f7fa; padding: .65rem 2.5rem .65rem .75rem; color: #111827; font: inherit; font-size: .8rem; outline: none; }
	.password-input-wrap input:focus { border-color: #2563eb; }
	.password-input-wrap input::placeholder { color: #94a3b8; letter-spacing: .12em; }
	.visibility-toggle { position: absolute; right: .45rem; display: grid; width: 1.6rem; height: 1.6rem; place-items: center; border: 0; background: transparent; color: #6b7280; cursor: pointer; }
	.visibility-toggle svg { width: 1rem; height: 1rem; }
	.save-password-button { justify-self: start; border: 0; border-radius: .5rem; background: #2563eb; padding: .55rem .8rem; color: white; font: inherit; font-size: .75rem; font-weight: 800; cursor: pointer; }
	.preview-field { margin-top: .85rem; }
	.password-status { margin: .7rem 0 0; color: #166534; font-size: .72rem; font-weight: 600; line-height: 1.5; }
	.password-status.error { color: #b42318; }
	:global(html[data-theme='dark'] .password-section) { border-color: #334866; }
	:global(html[data-theme='dark'] .password-section h3) { color: #edf4ff; }
	:global(html[data-theme='dark'] .password-form label), :global(html[data-theme='dark'] .preview-field) { color: #b8c8dd; }
	:global(html[data-theme='dark'] .password-input-wrap input) { border-color: #415878; background: #101d35; color: #edf4ff; }
	:global(html[data-theme='dark'] .visibility-toggle) { color: #b8c8dd; }
	:global(html[data-theme='dark'] .password-status) { color: #86efac; }
	:global(html[data-theme='dark'] .password-status.error) { color: #fca5a5; }
</style>