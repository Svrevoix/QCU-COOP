<script lang="ts">
	import { onMount } from 'svelte';
	import type { Role } from '$lib/session';

	/**
	 * Split-screen authentication overlay shown after logging out.
	 * `open` is bindable so the parent (layout) controls when it mounts.
	 * `onAuthenticated` reports the resolved role/id back to the parent, which
	 * owns the session store, the dashboard entrance animation, and routing.
	 * `resetSignal` is bumped by the parent on logout to wipe typed credentials.
	 */
	let { open = $bindable(false), onAuthenticated, resetSignal = 0 }: { open: boolean; onAuthenticated: (role: Role, id: string) => void; resetSignal?: number } = $props();

	// Two exact credential match targets: the standard student route and the admin bypass.
	const USER_ID = '23-2111';
	const USER_PASSWORD = 'password';
	const ADMIN_ID = '00-0000';
	const ADMIN_PASSWORD = 'password1';

	type AuthMode = 'login' | 'signup';
	let mode = $state<AuthMode>('login');
	let showPassword = $state(false);
	let studentId = $state('');
	let password = $state('');
	let isDarkMode = $state(false);
	let authError = $state('');

	onMount(() => {
		isDarkMode = localStorage.getItem('qcu-theme') === 'dark';
	});

	// Total credential erasure whenever the parent signals a sign-out.
	$effect(() => {
		resetSignal;
		studentId = '';
		password = '';
		showPassword = false;
		authError = '';
	});

	function close() {
		open = false;
	}

	// Only close when the click lands on the dimmed backdrop, not the modal itself.
	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) close();
	}

	function switchMode(next: AuthMode) {
		mode = next;
	}

	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}

	function toggleTheme() {
		isDarkMode = !isDarkMode;
		document.documentElement.dataset.theme = isDarkMode ? 'dark' : 'light';
		localStorage.setItem('qcu-theme', isDarkMode ? 'dark' : 'light');
	}

	// Digits-only typing mask: auto-inserts a dash after the first 2 digits, capped at "NN-NNNN".
	function handleStudentIdInput(event: Event) {
		const raw = (event.currentTarget as HTMLInputElement).value;
		const digits = raw.replace(/\D/g, '').slice(0, 6);
		studentId = digits.length <= 2 ? digits : `${digits.slice(0, 2)}-${digits.slice(2)}`;
	}

	function handleSubmit(event: Event) {
		event.preventDefault();
		authError = '';

		// Strict intercept: only these two exact credential pairs are authorized.
		const isAdmin = studentId === ADMIN_ID && password === ADMIN_PASSWORD;
		const isUser = studentId === USER_ID && password === USER_PASSWORD;

		if (!isAdmin && !isUser) {
			authError = 'Invalid Student ID or password.';
			return;
		}

		onAuthenticated(isAdmin ? 'admin' : 'student', studentId);
		close();
	}
</script>

{#if open}
	<div class="auth-overlay" onclick={handleBackdropClick} role="presentation">
		<div class="auth-modal" role="dialog" aria-modal="true" aria-label={mode === 'login' ? 'Log in' : 'Sign up'}>
			<div class="panels-track">
				<!-- Image panel: purely decorative brand graphic, slides between left/right -->
				<div class="image-panel" class:signup={mode === 'signup'} aria-hidden="true">
					<svg class="brand-graphic" viewBox="0 0 200 200" fill="none">
						<circle cx="100" cy="100" r="88" stroke="rgba(255,255,255,0.35)" stroke-width="2" />
						<circle cx="100" cy="100" r="58" stroke="rgba(255,255,255,0.5)" stroke-width="2" />
						<path d="M100 42v116M42 100h116" stroke="rgba(255,255,255,0.55)" stroke-width="2" stroke-linecap="round" />
					</svg>
					<p class="brand-tagline">QCU COOP STORE</p>
					<span class="edge-fade edge-fade-right"></span>
					<span class="edge-fade edge-fade-left"></span>
				</div>

				<!-- Credentials form panel: slides between right/left -->
				<div class="form-panel" class:signup={mode === 'signup'}>
					<button type="button" class="theme-toggle-corner" onclick={toggleTheme} aria-pressed={isDarkMode} aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}>
						{#if isDarkMode}
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path stroke-linecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41"/></svg>
						{:else}
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/></svg>
						{/if}
					</button>

					<div class="form-header">
						<span class="brand-logo" aria-hidden="true">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4Z" stroke-linejoin="round" /></svg>
						</span>
						<h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
						<p class="form-subtitle">{mode === 'login' ? 'Sign in with your student credentials' : 'Register using your student ID'}</p>
					</div>

					<form class="auth-form" onsubmit={handleSubmit}>
						<label class="field">
							<span class="field-label">ID Number</span>
							<input
								type="text"
								inputmode="numeric"
								placeholder="01-2345"
								maxlength="7"
								value={studentId}
								oninput={handleStudentIdInput}
								autocomplete="off"
								required
							/>
						</label>

						<label class="field">
							<span class="field-label">Password</span>
							<div class="password-field">
								<input type={showPassword ? 'text' : 'password'} placeholder="Type your password" bind:value={password} autocomplete="current-password" required />
								<button type="button" class="reveal-toggle" onclick={togglePasswordVisibility} aria-label={showPassword ? 'Hide password' : 'Show password'}>
									{#if showPassword}
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3l18 18"/><path stroke-linecap="round" stroke-linejoin="round" d="M10.6 10.6a2.25 2.25 0 0 0 3.18 3.18M9.4 5.4A10.8 10.8 0 0 1 12 5c5 0 9 4 10 7-.35 1.02-1 2.1-1.9 3.1M6.6 6.7C4.6 8 3.2 10 2 12c1 3 5 7 10 7 1.2 0 2.3-.2 3.3-.6"/></svg>
									{:else}
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
									{/if}
								</button>
							</div>
						</label>

						{#if authError}
							<p class="auth-error" role="alert">{authError}</p>
						{/if}

						<div class="action-panel">
							<button type="button" class="pill-button pill-outline" class:active={mode === 'signup'} onclick={() => switchMode('signup')}>
								Sign Up
							</button>
							<button type="submit" class="pill-button pill-filled" class:active={mode === 'login'} onclick={() => switchMode('login')}>
								Login
							</button>
						</div>

						<a href="/account" class="forgot-link" onclick={close}>Forgot your password?</a>
					</form>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.auth-overlay {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: grid;
		place-items: center;
		background: rgba(5, 12, 30, 0.45);
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
		padding: 1.5rem;
	}

	.auth-modal {
		--form-bg: #ffffff;
		--form-text: #111827;
		--form-muted: #6b7280;
		--field-bg: #f5f7fa;
		--field-border: #d9e2ec;
		position: relative;
		width: clamp(20rem, 92vw, 54rem);
		height: clamp(26rem, 90vh, 34rem);
		border-radius: 1.5rem;
		overflow: hidden;
		background: var(--form-bg);
		border: 1px solid rgba(15, 23, 42, 0.08);
		box-shadow: 0 32px 80px rgba(7, 21, 45, 0.35);
	}

	.panels-track {
		position: relative;
		width: 100%;
		height: 100%;
	}

	/* Image panel: purely decorative, slides left <-> right */
	.image-panel {
		position: absolute;
		inset: 0 auto 0 0;
		width: 50%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.85rem;
		background: linear-gradient(160deg, #1d4ed8, #0f172a);
		color: #eaf1ff;
		transition: transform 550ms cubic-bezier(0.65, 0, 0.35, 1);
	}

	.image-panel.signup { transform: translateX(100%); }

	.brand-graphic { width: 6.5rem; height: 6.5rem; }
	.brand-tagline { margin: 0; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; color: #cfe0ff; }

	/* Fades the panel edge touching the form so the split line never looks harsh */
	.edge-fade {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 4.5rem;
		pointer-events: none;
		transition: opacity 400ms ease;
	}
	.edge-fade-right { right: 0; background: linear-gradient(to right, transparent, var(--form-bg)); opacity: 1; }
	.edge-fade-left { left: 0; background: linear-gradient(to left, transparent, var(--form-bg)); opacity: 0; }
	.image-panel.signup .edge-fade-right { opacity: 0; }
	.image-panel.signup .edge-fade-left { opacity: 1; }

	/* Credentials form panel: slides right <-> left */
	.form-panel {
		position: absolute;
		inset: 0 0 0 auto;
		left: 50%;
		width: 50%;
		height: 100%;
		background: var(--form-bg);
		color: var(--form-text);
		padding: clamp(1.25rem, 4vw, 2.25rem) clamp(1.25rem, 5vw, 2.5rem);
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		transition: transform 550ms cubic-bezier(0.65, 0, 0.35, 1);
	}

	.form-panel.signup { transform: translateX(-100%); }

	.theme-toggle-corner {
		position: absolute;
		bottom: 1.25rem;
		left: 1.5rem;
		display: grid;
		place-items: center;
		width: 2.1rem;
		height: 2.1rem;
		border: 1px solid var(--field-border);
		border-radius: 0.6rem;
		background: var(--field-bg);
		color: #2563eb;
		cursor: pointer;
		transition: background 150ms ease, border-color 150ms ease;
	}
	.theme-toggle-corner:hover { background: #e2e8f0; }
	.theme-toggle-corner svg { width: 1.05rem; height: 1.05rem; }

	.form-header { text-align: center; margin-bottom: clamp(1rem, 3vh, 1.4rem); }
	.brand-logo {
		display: grid;
		place-items: center;
		width: 3rem;
		height: 3rem;
		margin: 0 auto 0.75rem;
		border-radius: 9999px;
		background: #2563eb;
		color: #ffffff;
		flex-shrink: 0;
	}
	.brand-logo svg { width: 1.5rem; height: 1.5rem; }
	.form-header h1 { margin: 0; font-size: clamp(0.95rem, 2.2vw, 1.15rem); font-weight: 800; overflow-wrap: break-word; }
	.form-subtitle { margin: 0.35rem 0 0; font-size: clamp(0.68rem, 1.6vw, 0.75rem); font-weight: 600; color: var(--form-muted); overflow-wrap: break-word; }

	.auth-form { display: flex; flex-direction: column; gap: clamp(0.75rem, 2.5vh, 1rem); flex: 1; min-height: 0; }
	.field { display: flex; flex-direction: column; gap: 0.4rem; font-size: clamp(0.7rem, 1.5vw, 0.75rem); font-weight: 700; color: var(--form-muted); min-width: 0; }
	.field input {
		width: 100%;
		min-width: 0;
		box-sizing: border-box;
		padding: clamp(0.5rem, 1.6vw, 0.65rem) clamp(0.6rem, 2vw, 0.85rem);
		border: 1px solid var(--field-border);
		border-radius: 0.7rem;
		background: var(--field-bg);
		color: var(--form-text);
		font-size: clamp(0.78rem, 1.8vw, 0.85rem);
		font-weight: 600;
		outline: none;
		transition: border-color 150ms ease;
	}
	.field input:focus { border-color: #2563eb; }

	.password-field { position: relative; display: flex; align-items: center; min-width: 0; }
	.password-field input { padding-right: 2.5rem; }
	.reveal-toggle {
		position: absolute;
		right: 0.65rem;
		display: grid;
		place-items: center;
		width: 1.6rem;
		height: 1.6rem;
		border: 0;
		background: transparent;
		color: var(--form-muted);
		cursor: pointer;
		flex-shrink: 0;
	}
	.reveal-toggle svg { width: 1.1rem; height: 1.1rem; }

	.action-panel { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(0.5rem, 2vw, 0.75rem); margin-top: 0.25rem; }
	.pill-button {
		min-width: 0;
		padding: clamp(0.55rem, 1.8vw, 0.65rem) clamp(0.75rem, 3vw, 1rem);
		border-radius: 9999px;
		font-size: clamp(0.72rem, 1.6vw, 0.8rem);
		font-weight: 800;
		cursor: pointer;
		transition: background 150ms ease, color 150ms ease, border-color 150ms ease;
	}
	.pill-outline { border: 1.5px solid var(--field-border); background: transparent; color: var(--form-text); }
	.pill-outline:hover, .pill-outline.active { border-color: #2563eb; color: #2563eb; }
	.pill-filled { border: 1.5px solid #2563eb; background: #2563eb; color: #ffffff; }
	.pill-filled:hover { background: #1d4ed8; }

	.forgot-link { margin: 0.65rem auto 0; font-size: 0.75rem; font-weight: 700; color: #2563eb; text-decoration: none; }
	.forgot-link:hover { text-decoration: underline; }
	.auth-error { margin: -0.25rem 0 0; font-size: 0.72rem; font-weight: 700; color: #dc2626; }

	:global(html[data-theme='dark'] .auth-modal) {
		--form-bg: #172640;
		--form-text: #edf4ff;
		--form-muted: #b8c8dd;
		--field-bg: #101d35;
		--field-border: #415878;
	}
	:global(html[data-theme='dark'] .theme-toggle-corner:hover) { background: #223957; }
	:global(html[data-theme='dark'] .pill-outline:hover), :global(html[data-theme='dark'] .pill-outline.active) { color: #7ec8ff; border-color: #7ec8ff; }

	@media (max-width: 640px) {
		.auth-modal { height: min(34rem, 94vh); }
		.image-panel { display: none; }
		.form-panel { left: 0; width: 100%; }
		.form-panel.signup { transform: none; }
	}
</style>
