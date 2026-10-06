<script lang="ts">
	import { onMount } from 'svelte';

	let { mode, errorMessage = '', initialMode = 'login' }: { mode: 'user' | 'staff'; errorMessage?: string; initialMode?: 'login' | 'signup' } = $props();
	function getInitialMode(): 'login' | 'signup' {
		return mode === 'user' && initialMode === 'signup' ? 'signup' : 'login';
	}
	let activeMode = $state<'login' | 'signup'>(getInitialMode());
	let showPassword = $state(false);
	let studentId = $state('');
	let isDarkMode = $state(false);
	let isLoading = $state(true);

	onMount(() => {
		isDarkMode = localStorage.getItem('qcu-theme') === 'dark';
		const timer = window.setTimeout(() => {
			isLoading = false;
		}, 650);

		return () => window.clearTimeout(timer);
	});

	function toggleTheme() {
		isDarkMode = !isDarkMode;
		document.documentElement.dataset.theme = isDarkMode ? 'dark' : 'light';
		localStorage.setItem('qcu-theme', isDarkMode ? 'dark' : 'light');
	}

	function handleStudentIdInput(event: Event) {
		const digits = (event.currentTarget as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6);
		studentId = digits.length <= 2 ? digits : `${digits.slice(0, 2)}-${digits.slice(2)}`;
	}
</script>

<div class="auth-overlay">
	<div class="auth-modal" role="dialog" aria-modal="true" aria-label={activeMode === 'login' ? 'Log in' : 'Sign up'}>
		{#if isLoading}
			<div class="skeleton-panel" aria-live="polite" aria-busy="true">
				<div class="skeleton-avatar"></div>
				<div class="skeleton-line skeleton-line-wide"></div>
				<div class="skeleton-line skeleton-line-mid"></div>
				<div class="skeleton-line skeleton-line-tall"></div>
				<div class="skeleton-line skeleton-line-tall"></div>
				<div class="skeleton-line skeleton-line-short"></div>
			</div>
		{:else}
			<div class="panels-track">
				<div class="image-panel" class:signup={activeMode === 'signup'} aria-hidden="true">
					<svg class="brand-graphic" viewBox="0 0 200 200" fill="none">
						<circle cx="100" cy="100" r="88" stroke="rgba(255,255,255,0.35)" stroke-width="2" />
						<circle cx="100" cy="100" r="58" stroke="rgba(255,255,255,0.5)" stroke-width="2" />
						<path d="M100 42v116M42 100h116" stroke="rgba(255,255,255,0.55)" stroke-width="2" stroke-linecap="round" />
					</svg>
					<p class="brand-tagline">QCU COOP STORE</p>
					<span class="edge-fade edge-fade-right"></span>
					<span class="edge-fade edge-fade-left"></span>
				</div>

				<div class="form-panel" class:signup={activeMode === 'signup'}>
					<button type="button" class="theme-toggle-corner" onclick={toggleTheme} aria-pressed={isDarkMode} aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}>
						{#if isDarkMode}
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path stroke-linecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41"/></svg>
						{:else}
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/></svg>
						{/if}
					</button>

					<div class="form-header">
						<span class="brand-logo" aria-hidden="true">
							<img src={isDarkMode ? '/images/logo/qcu_cooplogo-dark-mode_bg.jpeg' : '/images/logo/qcu_cooplogo-light-mode_bg.png'} alt="" />
						</span>
						<h1>{activeMode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
						<p class="form-subtitle">{mode === 'staff' ? 'Sign in with your employee credentials' : activeMode === 'login' ? 'Sign in with your student credentials' : 'Register using your student ID'}</p>
					</div>

					<form method="POST" class="auth-form">
						<label class="field">
							<span class="field-label">{mode === 'staff' ? 'Employee ID' : 'ID Number'}</span>
							<input name="studentId" type="text" inputmode="numeric" placeholder="01-2345" maxlength="7" value={studentId} oninput={handleStudentIdInput} autocomplete="username" required />
						</label>

						<label class="field">
							<span class="field-label">Password</span>
							<div class="password-field">
								<input name="password" type={showPassword ? 'text' : 'password'} placeholder="Type your password" autocomplete={activeMode === 'signup' ? 'new-password' : 'current-password'} minlength={activeMode === 'signup' ? 8 : undefined} required />
								<button type="button" class="reveal-toggle" onclick={() => showPassword = !showPassword} aria-label={showPassword ? 'Hide password' : 'Show password'}>
									{#if showPassword}
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3l18 18"/><path stroke-linecap="round" stroke-linejoin="round" d="M10.6 10.6a2.25 2.25 0 0 0 3.18 3.18M9.4 5.4A10.8 10.8 0 0 1 12 5c5 0 9 4 10 7-.35 1.02-1 2.1-1.9 3.1M6.6 6.7C4.6 8 3.2 10 2 12c1 3 5 7 10 7 1.2 0 2.3-.2 3.3-.6"/></svg>
									{:else}
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
									{/if}
								</button>
							</div>
						</label>

						{#if errorMessage}<p class="auth-error" role="alert">{errorMessage}</p>{/if}

						<div class="action-panel" class:staff={mode === 'staff'}>
							{#if mode === 'user'}
								{#if activeMode === 'signup'}
									<button type="submit" name="mode" value="signup" class="pill-button pill-outline active">Sign Up</button>
								{:else}
									<button type="button" class="pill-button pill-outline" onclick={() => activeMode = 'signup'}>Sign Up</button>
								{/if}
							{/if}
							{#if mode === 'user' && activeMode === 'signup'}
								<button type="button" class="pill-button pill-filled" onclick={() => activeMode = 'login'}>Login</button>
							{:else}
								<button type="submit" name="mode" value="login" class="pill-button pill-filled">Login</button>
							{/if}
						</div>

						{#if mode === 'user'}<a href="/account" class="forgot-link">Forgot your password?</a>{/if}
					</form>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.auth-overlay { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; background: rgba(5, 12, 30, .45); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); padding: 1.5rem; }
	.auth-modal { --form-bg: #fff; --form-text: #111827; --form-muted: #6b7280; --field-bg: #f5f7fa; --field-border: #d9e2ec; position: relative; width: clamp(20rem, 92vw, 54rem); height: clamp(26rem, 90vh, 34rem); border: 1px solid rgba(15, 23, 42, .08); border-radius: 1.5rem; overflow: hidden; background: var(--form-bg); box-shadow: 0 32px 80px rgba(7, 21, 45, .35); }
	.skeleton-panel { display: flex; width: 100%; height: 100%; flex-direction: column; justify-content: center; gap: 1.1rem; padding: 2.25rem 2rem; background: linear-gradient(135deg, #eef4fb, #f7f9fc); }
	.skeleton-avatar { width: 6.25rem; height: 6.25rem; margin: 0 auto 1rem; border-radius: 50%; background: linear-gradient(90deg, #dfeaf5 25%, #edf3f9 50%, #dfeaf5 75%); background-size: 200% 100%; animation: shimmer 1.2s linear infinite; }
	.skeleton-line { height: 1.05rem; border-radius: .75rem; background: linear-gradient(90deg, #dfeaf5 25%, #edf3f9 50%, #dfeaf5 75%); background-size: 200% 100%; animation: shimmer 1.2s linear infinite; }
	.skeleton-line-wide { width: 100%; height: 3.1rem; }
	.skeleton-line-mid { width: 90%; height: 3.1rem; margin-left: 5%; }
	.skeleton-line-tall { width: 100%; height: 3.75rem; }
	.skeleton-line-short { width: 70%; height: 2.5rem; margin-left: 15%; }
	@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
	.panels-track { position: relative; width: 100%; height: 100%; }
	.image-panel { position: absolute; inset: 0 auto 0 0; display: flex; width: 50%; height: 100%; flex-direction: column; align-items: center; justify-content: center; gap: .85rem; background: linear-gradient(160deg, #1d4ed8, #0f172a); color: #eaf1ff; transition: transform 550ms cubic-bezier(.65, 0, .35, 1); }
	.image-panel.signup { transform: translateX(100%); }
	.brand-graphic { width: 6.5rem; height: 6.5rem; }
	.brand-tagline { margin: 0; color: #cfe0ff; font-size: .75rem; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
	.edge-fade { position: absolute; top: 0; bottom: 0; width: 4.5rem; pointer-events: none; transition: opacity 400ms ease; }
	.edge-fade-right { right: 0; background: linear-gradient(to right, transparent, var(--form-bg)); opacity: 1; }
	.edge-fade-left { left: 0; background: linear-gradient(to left, transparent, var(--form-bg)); opacity: 0; }
	.image-panel.signup .edge-fade-right { opacity: 0; }
	.image-panel.signup .edge-fade-left { opacity: 1; }
	.form-panel { position: absolute; inset: 0 0 0 auto; left: 50%; display: flex; width: 50%; height: 100%; flex-direction: column; overflow-y: auto; padding: clamp(1.25rem, 4vw, 2.25rem) clamp(1.25rem, 5vw, 2.5rem); background: var(--form-bg); color: var(--form-text); transition: transform 550ms cubic-bezier(.65, 0, .35, 1); }
	.form-panel.signup { transform: translateX(-100%); }
	.theme-toggle-corner { position: absolute; bottom: 1.25rem; left: 1.5rem; display: grid; width: 2.1rem; height: 2.1rem; place-items: center; border: 1px solid var(--field-border); border-radius: .6rem; background: var(--field-bg); color: #2563eb; cursor: pointer; transition: background 150ms ease, border-color 150ms ease; }
	.theme-toggle-corner:hover { background: #e2e8f0; }
	.theme-toggle-corner svg { width: 1.05rem; height: 1.05rem; }
	.form-header { margin-bottom: clamp(1rem, 3vh, 1.4rem); text-align: center; }
	.brand-logo { display: block; width: 8rem; flex-shrink: 0; margin: 0 auto .75rem; }
	.brand-logo img { display: block; width: 8rem; height: auto; margin: 0 auto; }
	.form-header h1 { margin: 0; overflow-wrap: break-word; font-size: 1.15rem; font-weight: 800; }
	.form-subtitle { margin: .35rem 0 0; color: var(--form-muted); overflow-wrap: break-word; font-size: .75rem; font-weight: 600; }
	.auth-form { display: flex; min-height: 0; flex: 1; flex-direction: column; gap: clamp(.75rem, 2.5vh, 1rem); }
	.field { display: flex; min-width: 0; flex-direction: column; gap: .4rem; color: var(--form-muted); font-size: .75rem; font-weight: 700; }
	.field input { box-sizing: border-box; width: 100%; min-width: 0; border: 1px solid var(--field-border); border-radius: .7rem; background: var(--field-bg); padding: .65rem .85rem; color: var(--form-text); outline: none; font-size: .85rem; font-weight: 600; transition: border-color 150ms ease; }
	.field input:focus { border-color: #2563eb; }
	.password-field { position: relative; display: flex; min-width: 0; align-items: center; }
	.password-field input { padding-right: 2.5rem; }
	.reveal-toggle { position: absolute; right: .65rem; display: grid; width: 1.6rem; height: 1.6rem; flex-shrink: 0; place-items: center; border: 0; background: transparent; color: var(--form-muted); cursor: pointer; }
	.reveal-toggle svg { width: 1.1rem; height: 1.1rem; }
	.action-panel { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: .75rem; margin-top: .25rem; }
	.action-panel.staff { grid-template-columns: 1fr; }
	.pill-button { min-width: 0; border-radius: 9999px; padding: .65rem 1rem; font-size: .8rem; font-weight: 800; cursor: pointer; transition: background 150ms ease, color 150ms ease, border-color 150ms ease; }
	.pill-outline { border: 1.5px solid var(--field-border); background: transparent; color: var(--form-text); }
	.pill-outline:hover, .pill-outline.active { border-color: #2563eb; color: #2563eb; }
	.pill-filled { border: 1.5px solid #2563eb; background: #2563eb; color: #fff; }
	.pill-filled:hover { background: #1d4ed8; }
	.forgot-link { margin: .65rem auto 0; color: #2563eb; font-size: .75rem; font-weight: 700; text-decoration: none; }
	.forgot-link:hover { text-decoration: underline; }
	.auth-error { margin: -.25rem 0 0; color: #dc2626; font-size: .72rem; font-weight: 700; }
	:global(html[data-theme='dark'] .auth-modal) { --form-bg: #172640; --form-text: #edf4ff; --form-muted: #b8c8dd; --field-bg: #101d35; --field-border: #415878; }
	:global(html[data-theme='dark'] .theme-toggle-corner:hover) { background: #223957; }
	:global(html[data-theme='dark'] .pill-outline:hover), :global(html[data-theme='dark'] .pill-outline.active) { border-color: #7ec8ff; color: #7ec8ff; }
	@media (max-width: 640px) { .auth-modal { height: min(34rem, 94vh); } .image-panel { display: none; } .form-panel { left: 0; width: 100%; } .form-panel.signup { transform: none; } }
</style>