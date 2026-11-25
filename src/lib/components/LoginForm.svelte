<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { theme } from '$lib/stores/theme';
	import {
		departmentCourses,
		maxYearLevelForCourse,
		type Department
	} from '$lib/academic-programs';

	let { mode, errorMessage = '', successMessage = '', initialMode = 'login' }: { mode: 'user' | 'staff'; errorMessage?: string; successMessage?: string; initialMode?: 'login' | 'signup' } = $props();
	function getInitialMode(): 'login' | 'signup' {
		return mode === 'user' && initialMode === 'signup' ? 'signup' : 'login';
	}
	let activeMode = $state<'login' | 'signup'>(getInitialMode());
	$effect(() => {
		activeMode = getInitialMode();
	});
	let isSignUp = $derived(activeMode === 'signup');
	let showPassword = $state(false);
	let loginId = $state('');
	let signupId = $state('');
	let signupRole = $state<'student' | 'teacher'>('student');
	let signupDepartment = $state<Department | ''>('');
	let signupCourse = $state('');
	let signupYearLevel = $state('');
	let signupCourses = $derived(signupDepartment ? departmentCourses[signupDepartment] : []);
	let signupMaxYearLevel = $derived(maxYearLevelForCourse(signupCourse));
	let isDarkMode = $derived($theme === 'dark');
	let isLoading = $state(true);

	function handleIdInput(event: Event, field: 'login' | 'signup') {
		const input = event.currentTarget as HTMLInputElement;
		const value = input.value;
		const digits = value.replace(/\D/g, '').slice(0, 6);
		const formatted = digits.length > 2 ? `${digits.slice(0, 2)}-${digits.slice(2)}` : digits;
		const caret = input.selectionStart ?? value.length;
		const digitsBeforeCaret = Math.min(value.slice(0, caret).replace(/\D/g, '').length, digits.length);
		const formattedCaret = digitsBeforeCaret + (digitsBeforeCaret > 2 ? 1 : 0);

		input.value = formatted;
		input.setSelectionRange(formattedCaret, formattedCaret);
		if (field === 'login') loginId = formatted;
		else {
			signupId = formatted;
			if (digits.startsWith('23')) signupRole = 'student';
			else if (digits.startsWith('10')) signupRole = 'teacher';
		}
	}

	function handleLoginIdInput(event: Event) {
		handleIdInput(event, 'login');
	}

	function handleSignupIdInput(event: Event) {
		handleIdInput(event, 'signup');
	}

	onMount(() => {
		const timer = window.setTimeout(() => {
			isLoading = false;
		}, 650);

		return () => window.clearTimeout(timer);
	});

</script>

<div class="auth-overlay">
	<button
		type="button"
		class="theme-toggle"
		aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
		aria-pressed={isDarkMode}
		onclick={() => theme.toggle()}
	>
		{#if isDarkMode}
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path stroke-linecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></svg>
			<span>Light mode</span>
		{:else}
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" /></svg>
			<span>Dark mode</span>
		{/if}
	</button>
	<div class="auth-modal w-full max-w-5xl lg:h-[610px]" role="dialog" aria-modal="true" aria-label={activeMode === 'login' ? 'Log in' : 'Sign up'}>
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
			<div class="panels-track" class:signup={isSignUp}>
				{#snippet passwordField()}
					<label class="field">
						<span class="field-label">Password</span>
						<div class="password-field">
							<input class="h-10 text-sm" name="password" type={showPassword ? 'text' : 'password'} placeholder="Password" autocomplete={activeMode === 'signup' ? 'new-password' : 'current-password'} minlength={activeMode === 'signup' ? 8 : undefined} required />
							<button type="button" class="reveal-toggle" onclick={() => showPassword = !showPassword} aria-label={showPassword ? 'Hide password' : 'Show password'}>
								{#if showPassword}
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3l18 18"/><path stroke-linecap="round" stroke-linejoin="round" d="M10.6 10.6a2.25 2.25 0 0 0 3.18 3.18M9.4 5.4A10.8 10.8 0 0 1 12 5c5 0 9 4 10 7-.35 1.02-1 2.1-1.9 3.1M6.6 6.7C4.6 8 3.2 10 2 12c1 3 5 7 10 7 1.2 0 2.3-.2 3.3-.6"/></svg>
								{:else}
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
								{/if}
							</button>
						</div>
					</label>
				{/snippet}
				<div class="image-panel hidden lg:flex transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" aria-hidden="true">
					{#key isSignUp}
						<img
							class="branding-photo h-full w-full object-cover"
							src="/images/logo/coop-cover-signup-login-sided.jpg"
							alt=""
							in:fade={{ duration: 400, delay: 120 }}
							out:fade={{ duration: 220 }}
						/>
					{/key}
				</div>

				<div class="form-panel h-full w-full flex flex-col justify-center items-center px-8 sm:px-12 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/60 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700">
					<div class="auth-form">
						{#if !isSignUp}
							<form
								method="POST"
								class="auth-view login-view"
								in:fly={{ x: isSignUp ? -28 : 28, duration: 380, delay: 120, easing: cubicOut }}
								out:fade={{ duration: 140 }}
							>
								<input type="hidden" name="mode" value="login" />
								<div class="form-header">
									<span class="brand-logo" aria-hidden="true">
										<img src={isDarkMode ? '/images/logo/qcu_cooplogo-dark-mode_bg.jpeg' : '/images/logo/qcu_cooplogo-light-mode_bg.png'} alt="" />
									</span>
									<h1>Welcome back</h1>
									<p class="form-subtitle">Sign in with your QCU account</p>
								</div>
								<div class="login-fields">
									<label class="field"><span class="field-label">ID Number</span><input class="h-10 text-sm" name="loginId" type="text" placeholder="e.g. 23-2111" value={loginId} oninput={handleLoginIdInput} autocomplete="username" required /></label>
									{@render passwordField()}
								</div>
								{#if successMessage}<p class="auth-success" role="status">{successMessage}</p>{/if}
								{#if errorMessage}<p class="auth-error" role="alert">{errorMessage}</p>{/if}
								<div class="action-panel grid grid-cols-2 gap-3 w-full" class:staff={mode === 'staff'}>
									{#if mode === 'user'}
										<button type="button" class="pill-button h-11 box-border flex items-center justify-center rounded-xl border border-sky-300/80 bg-gradient-to-r from-sky-100 to-blue-100 px-4 text-sm font-semibold text-[#0C2340] transition-all duration-300 hover:border-transparent hover:from-blue-600 hover:to-sky-500 hover:text-white dark:border-sky-400/25 dark:from-slate-800/90 dark:to-blue-950/80 dark:text-sky-100" onclick={() => activeMode = 'signup'}>Sign Up</button>
									{/if}
									<button type="submit" class="pill-button h-11 box-border flex items-center justify-center rounded-xl border border-transparent bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 px-4 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all duration-300 hover:from-blue-500 hover:via-sky-500 hover:to-cyan-400">Login</button>
								</div>
								{#if mode === 'user'}<a href="/account" class="forgot-link mt-5">Forgot your password?</a>{/if}
							</form>
						{:else}
							<form
								method="POST"
								class="auth-view signup-view"
								in:fly={{ x: isSignUp ? -28 : 28, duration: 380, delay: 120, easing: cubicOut }}
								out:fade={{ duration: 140 }}
							>
								<input type="hidden" name="mode" value="signup" />
								<div class="form-header">
									<span class="brand-logo" aria-hidden="true">
										<img src={isDarkMode ? '/images/logo/qcu_cooplogo-dark-mode_bg.jpeg' : '/images/logo/qcu_cooplogo-light-mode_bg.png'} alt="" />
									</span>
									<h1>Create your account</h1>
									<p class="form-subtitle">Register with your email address</p>
								</div>
								<div class="signup-fields space-y-3">
									<label class="field"><span class="field-label">Account type</span><select class="h-10 w-full min-w-0 truncate pr-8 text-sm" name="role" bind:value={signupRole}><option value="student">Student</option><option value="teacher">Teacher</option></select></label>
									<div class="signup-grid-row grid grid-cols-1 gap-3.5 sm:grid-cols-2">
										<label class="field"><span class="field-label">First name</span><input class="h-10 text-sm" name="firstName" autocomplete="given-name" required /></label>
										<label class="field"><span class="field-label">Last name</span><input class="h-10 text-sm" name="lastName" autocomplete="family-name" required /></label>
									</div>
									<div class="signup-grid-row grid grid-cols-1 gap-3.5 sm:grid-cols-2">
										<label class="field"><span class="field-label">ID Number</span><input class="h-10 text-sm" name={signupRole === 'student' ? 'schoolId' : 'employeeNo'} type="text" inputmode="numeric" placeholder="e.g. 23-2111" value={signupId} oninput={handleSignupIdInput} required /></label>
										<label class="field"><span class="field-label">Email address</span><input class="h-10 text-sm" name="email" type="email" autocomplete="email" placeholder="name@qcu.edu.ph" required /></label>
									</div>
									{#if signupRole === 'student'}
										<div class="signup-grid-row grid grid-cols-1 gap-3.5 sm:grid-cols-2">
											<label class="field"><span class="field-label">Department</span><select class="h-10 w-full min-w-0 truncate pr-8 text-sm" name="department" bind:value={signupDepartment} onchange={() => { signupCourse = ''; signupYearLevel = ''; }} required><option value="" disabled>Select college</option>{#each Object.keys(departmentCourses) as department}<option value={department}>{department}</option>{/each}</select></label>
											<label class="field"><span class="field-label">Course / Program</span><select class="h-10 w-full min-w-0 truncate pr-8 text-sm" name="course" bind:value={signupCourse} onchange={() => signupYearLevel = ''} required disabled={!signupDepartment}><option value="" disabled>Select program</option>{#each signupCourses as course}<option value={course}>{course}</option>{/each}</select></label>
										</div>
									{:else}
										<label class="field"><span class="field-label">Department</span><select class="h-10 w-full min-w-0 truncate pr-8 text-sm" name="department" bind:value={signupDepartment} onchange={() => { signupCourse = ''; signupYearLevel = ''; }} required><option value="" disabled>Select college</option>{#each Object.keys(departmentCourses) as department}<option value={department}>{department}</option>{/each}</select></label>
									{/if}
									<div class="signup-grid-row signup-final-row grid grid-cols-1 gap-3.5 sm:grid-cols-2" class:password-only={signupRole !== 'student'}>
										{#if signupRole === 'student'}
											<label class="field"><span class="field-label">Year level</span><select class="h-10 w-full min-w-0 truncate pr-8 text-sm" name="yearLevel" bind:value={signupYearLevel} required disabled={!signupCourse}><option value="" disabled>Select year</option>{#each Array.from({ length: signupMaxYearLevel }, (_, index) => index + 1) as year}<option value={year}>{year}{year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'} year</option>{/each}</select></label>
										{/if}
										{@render passwordField()}
									</div>
								</div>
								{#if successMessage}<p class="auth-success" role="status">{successMessage}</p>{/if}
								{#if errorMessage}<p class="auth-error" role="alert">{errorMessage}</p>{/if}
								<div class="action-panel grid grid-cols-2 gap-3 w-full">
									<button type="submit" class="pill-button h-11 box-border flex items-center justify-center rounded-xl border border-transparent bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 px-4 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all duration-300 hover:from-blue-500 hover:via-sky-500 hover:to-cyan-400">Sign Up</button>
									<button type="button" class="pill-button h-11 box-border flex items-center justify-center rounded-xl border border-sky-300/80 bg-gradient-to-r from-sky-100 to-blue-100 px-4 text-sm font-semibold text-[#0C2340] transition-all duration-300 hover:border-transparent hover:from-blue-600 hover:to-sky-500 hover:text-white dark:border-sky-400/25 dark:from-slate-800/90 dark:to-blue-950/80 dark:text-sky-100" onclick={() => activeMode = 'login'}>Login</button>
								</div>
							</form>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.auth-overlay { position: fixed; inset: 0; z-index: 100; display: grid; width: 100%; min-height: 100dvh; place-items: center; overflow-y: auto; background: rgba(2, 6, 23, .6); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); padding: clamp(.5rem, 3vw, 1.5rem); }
	.auth-modal { --form-bg: #f4f9ff; --form-text: #0c2340; --form-muted: #3b5578; --field-bg: #fff; --field-border: #d9e2ec; position: relative; width: 100%; max-width: 64rem; height: min(610px, calc(100dvh - 2rem)); min-height: min(26rem, calc(100dvh - 1rem)); margin: auto; overflow: hidden; border: 1px solid rgba(15, 23, 42, .08); border-radius: 1.5rem; background: var(--form-bg); box-shadow: 0 32px 80px rgba(7, 21, 45, .35); }
	.theme-toggle { position: fixed; top: 1.25rem; right: 1.25rem; z-index: 101; display: inline-flex; align-items: center; gap: .55rem; border: 1px solid rgba(148, 163, 184, .38); border-radius: 9999px; background: rgba(255, 255, 255, .88); padding: .6rem .9rem; color: #0c2340; box-shadow: 0 8px 24px rgba(15, 23, 42, .12); backdrop-filter: blur(12px); cursor: pointer; font-size: .8rem; font-weight: 700; transition: background-color 180ms ease, color 180ms ease, border-color 180ms ease; }
	.theme-toggle:hover { border-color: #38bdf8; }
	.theme-toggle:focus-visible { outline: 2px solid #38bdf8; outline-offset: 3px; }
	.theme-toggle svg { width: 1rem; height: 1rem; flex-shrink: 0; }
	:global(html[data-theme='dark'] .theme-toggle) { border-color: rgba(148, 163, 184, .3); background: rgba(15, 23, 42, .9); color: #e2e8f0; }
	.skeleton-panel { display: flex; width: 100%; height: 100%; flex-direction: column; justify-content: center; gap: 1.1rem; padding: 2.25rem 2rem; background: linear-gradient(135deg, #eef4fb, #f7f9fc); }
	.skeleton-avatar { width: 6.25rem; height: 6.25rem; margin: 0 auto 1rem; border-radius: 50%; background: linear-gradient(90deg, #dfeaf5 25%, #edf3f9 50%, #dfeaf5 75%); background-size: 200% 100%; animation: shimmer 1.2s linear infinite; }
	.skeleton-line { height: 1.05rem; border-radius: .75rem; background: linear-gradient(90deg, #dfeaf5 25%, #edf3f9 50%, #dfeaf5 75%); background-size: 200% 100%; animation: shimmer 1.2s linear infinite; }
	.skeleton-line-wide { width: 100%; height: 3.1rem; }
	.skeleton-line-mid { width: 90%; height: 3.1rem; margin-left: 5%; }
	.skeleton-line-tall { width: 100%; height: 3.75rem; }
	.skeleton-line-short { width: 70%; height: 2.5rem; margin-left: 15%; }
	@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
	.panels-track { position: relative; width: 100%; height: 100%; min-height: 0; }
	.image-panel { position: absolute; inset: 0 auto 0 0; display: none; width: 41.666667%; height: 100%; flex-direction: column; align-items: center; justify-content: center; gap: .85rem; overflow: hidden; background: linear-gradient(160deg, #1d4ed8, #0f172a); color: #eaf1ff; transform: translateX(0); }
	.image-panel::after { position: absolute; inset: 0; z-index: 1; background: linear-gradient(to top, rgba(11, 17, 32, .45), transparent 58%, rgba(23, 37, 84, .15)), linear-gradient(to left, var(--form-bg), transparent 30%); content: ''; }
	.panels-track.signup .image-panel::after { background: linear-gradient(to top, rgba(11, 17, 32, .45), transparent 58%, rgba(23, 37, 84, .15)), linear-gradient(to right, var(--form-bg), transparent 30%); }
	.panels-track.signup .image-panel { transform: translateX(140%); }
	.branding-photo { position: absolute; inset: 0; z-index: 0; width: 100%; height: 100%; object-fit: cover; animation: cover-photo-settle 700ms cubic-bezier(.22, 1, .36, 1) both; }
	@keyframes cover-photo-settle { from { transform: scale(1.035); } to { transform: scale(1); } }
	@media (prefers-reduced-motion: reduce) { .branding-photo { animation: none; } }
	.form-panel { position: absolute; top: 0; left: 41.666667%; display: flex; box-sizing: border-box; width: 58.333333%; height: 100%; min-width: 0; min-height: 0; flex-direction: column; justify-content: center; align-items: center; overflow-y: hidden; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: rgba(148, 163, 184, .6) transparent; background: var(--form-bg); color: var(--form-text); transition: left 500ms cubic-bezier(.22, 1, .36, 1); }
	.panels-track.signup .form-panel { left: 0; }
	.form-header { width: 100%; margin-bottom: .75rem; text-align: center; }
	.brand-logo { display: block; width: 7rem; flex-shrink: 0; margin: 0 auto .5rem; }
	.brand-logo img { display: block; width: 7rem; height: auto; margin: 0 auto; }
	.panels-track.signup .form-header { margin-bottom: .5rem; }
	.panels-track.signup .brand-logo, .panels-track.signup .brand-logo img { width: 5.5rem; }
	.form-header h1 { margin: 0; overflow-wrap: break-word; font-size: 1.15rem; font-weight: 800; }
	.form-subtitle { margin: .35rem 0 0; color: var(--form-muted); overflow-wrap: break-word; font-size: .75rem; font-weight: 600; }
	.auth-form { display: grid; width: 100%; min-height: 0; flex: 0 1 auto; grid-template-areas: 'auth'; }
	.auth-view { display: flex; width: 100%; min-width: 0; flex-direction: column; grid-area: auth; align-self: center; }
	.login-fields { display: flex; flex-direction: column; gap: .75rem; }
	.field { display: flex; min-width: 0; flex-direction: column; gap: .25rem; color: var(--form-muted); font-size: .75rem; font-weight: 700; }
	.field input { box-sizing: border-box; width: 100%; min-width: 0; border: 1px solid var(--field-border); border-radius: .7rem; background: var(--field-bg); padding: .45rem .75rem; color: var(--form-text); outline: none; font-size: .875rem; font-weight: 600; transition: border-color 150ms ease; }
	.field input:focus { border-color: #2563eb; }
	.password-field { position: relative; display: flex; min-width: 0; align-items: center; }
	.password-field input { padding-right: 2.5rem; }
	.reveal-toggle { position: absolute; right: .65rem; display: grid; width: 1.6rem; height: 1.6rem; flex-shrink: 0; place-items: center; border: 0; background: transparent; color: var(--form-muted); cursor: pointer; }
	.reveal-toggle svg { width: 1.1rem; height: 1.1rem; }
	.action-panel { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: .75rem; margin-top: .75rem; }
	.action-panel.staff { grid-template-columns: 1fr; }
	.pill-button { min-width: 0; cursor: pointer; }
	.forgot-link { align-self: center; margin-inline: auto; color: #2563eb; font-size: .75rem; font-weight: 700; text-decoration: none; }
	.forgot-link:hover { text-decoration: underline; }
	.auth-error { margin: -.25rem 0 0; color: #dc2626; font-size: .72rem; font-weight: 700; }
	.auth-success { margin: -.25rem 0 0; color: #15803d; font-size: .72rem; font-weight: 700; line-height: 1.5; }
	.field select { box-sizing: border-box; width: 100%; min-width: 0; height: 2.5rem; border: 1px solid var(--field-border); border-radius: .7rem; background: var(--field-bg); padding: .45rem 2rem .45rem .75rem; color: var(--form-text); font: inherit; font-size: .875rem; }
	.signup-final-row.password-only { grid-template-columns: 1fr; }
	:global(html[data-theme='dark'] .auth-modal) { --form-bg: #162038; --form-text: #f1f5f9; --form-muted: #94a3b8; --field-bg: #101d35; --field-border: #415878; }
	@media (min-width: 1024px) { .image-panel { display: flex; } }
	@media (max-width: 1023px) { .image-panel { display: none; } .form-panel { position: relative; left: 0; width: 100%; overflow-y: auto; } }
	@media (max-height: 640px) { .form-panel { overflow-y: auto; } }
	@media (max-height: 540px) { .auth-modal { border-radius: 1rem; } .form-panel { padding-top: 1rem; padding-bottom: 1rem; } .form-header { margin-bottom: .5rem; } .brand-logo, .brand-logo img { width: 6rem; } .brand-logo { margin-bottom: .35rem; } }
</style>
