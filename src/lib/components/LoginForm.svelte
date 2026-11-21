<script lang="ts">
	import { onMount } from 'svelte';
	import {
		departmentCourses,
		maxYearLevelForCourse,
		type Department
	} from '$lib/academic-programs';

	let {
		mode = 'user',
		errorMessage = '',
		successMessage = '',
		initialMode = 'login'
	}: {
		mode?: 'user' | 'staff';
		errorMessage?: string;
		successMessage?: string;
		initialMode?: 'login' | 'signup';
	} = $props();

	function getInitialMode(): 'login' | 'signup' {
		return mode === 'user' && initialMode === 'signup' ? 'signup' : 'login';
	}

	let activeMode = $state<'login' | 'signup'>(getInitialMode());
	$effect(() => {
		activeMode = getInitialMode();
	});

	let showPassword = $state(false);
	let loginId = $state('');
	let signupId = $state('');
	let signupRole = $state<'student' | 'teacher'>('student');
	let signupFirstName = $state('');
	let signupLastName = $state('');
	let signupEmail = $state('');
	let signupDepartment = $state<Department | ''>('');
	let signupCourse = $state('');
	let signupYearLevel = $state('');
	let signupPassword = $state('');
	let isSubmitting = $state(false);
	let isDarkMode = $state(false);
	let isLoading = $state(true);
	let openDropdown = $state<'department' | 'course' | 'yearLevel' | null>(null);

	function toggleDropdown(name: 'department' | 'course' | 'yearLevel') {
		openDropdown = openDropdown === name ? null : name;
	}

	let signupCourses = $derived(signupDepartment ? departmentCourses[signupDepartment] : []);
	let signupMaxYearLevel = $derived(maxYearLevelForCourse(signupCourse));

	// Dynamic password strength computation (inspired by Farm-Match)
	let passwordCriteria = $derived({
		hasMinLength: signupPassword.length >= 8,
		hasUpper: /[A-Z]/.test(signupPassword),
		hasLower: /[a-z]/.test(signupPassword),
		hasNumberOrSpecial: /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(signupPassword)
	});

	let passwordStrength = $derived.by(() => {
		if (!signupPassword) return { score: 0, label: 'Too short', colorClass: 'text-slate-400' };
		let score = 0;
		if (passwordCriteria.hasMinLength) score++;
		if (passwordCriteria.hasUpper && passwordCriteria.hasLower) score++;
		if (passwordCriteria.hasNumberOrSpecial) score++;

		if (score <= 1) return { score: 1, label: 'Weak', colorClass: 'text-rose-600 dark:text-rose-400' };
		if (score === 2) return { score: 2, label: 'Medium', colorClass: 'text-amber-600 dark:text-amber-400' };
		return { score: 3, label: 'Strong', colorClass: 'text-emerald-600 dark:text-emerald-400' };
	});

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
		if (field === 'login') {
			loginId = formatted;
		} else {
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
		const savedTheme = localStorage.getItem('qcu-theme');
		isDarkMode = savedTheme === 'dark' || document.documentElement.dataset.theme === 'dark';
		const timer = window.setTimeout(() => {
			isLoading = false;
		}, 400);

		return () => window.clearTimeout(timer);
	});

	function toggleTheme() {
		isDarkMode = !isDarkMode;
		document.documentElement.dataset.theme = isDarkMode ? 'dark' : 'light';
		localStorage.setItem('qcu-theme', isDarkMode ? 'dark' : 'light');
	}

	function handleFormSubmit() {
		isSubmitting = true;
	}
</script>

<svelte:window
	onclick={(e) => {
		const target = e.target as HTMLElement | null;
		if (target && !target.closest('.custom-dropdown-container')) {
			openDropdown = null;
		}
	}}
	onkeydown={(e) => {
		if (e.key === 'Escape') {
			openDropdown = null;
		}
	}}
/>

<div class="auth-page-root relative flex min-h-screen w-full items-center justify-center p-4 sm:p-6 lg:p-8">
	<!-- Floating Back Button (Upper Left, Outside the Sign In Modal) -->
	<div class="absolute left-4 top-4 z-20 sm:left-6 sm:top-6">
		<a
			href="/"
			class="theme-toggle-btn flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800"
			aria-label="Back to store"
			title="Back to store"
		>
			<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
				<path d="M19 12H5M12 19l-7-7 7-7" />
			</svg>
		</a>
	</div>

	<!-- Top Theme Toggle Floating Control -->
	<div class="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
		<button
			type="button"
			class="theme-toggle-btn flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm"
			onclick={toggleTheme}
			aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
			title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
		>
			{#if isDarkMode}
				<svg class="h-4 w-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="4" />
					<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
				</svg>
			{:else}
				<svg class="h-4 w-4 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
				</svg>
			{/if}
		</button>
	</div>

	<!-- Main Auth Shell Container -->
	<div class="auth-shell relative z-10 w-full max-w-[460px] lg:max-w-[1000px] max-h-[calc(100vh-2.5rem)] sm:max-h-[calc(100vh-3.5rem)] overflow-hidden rounded-2xl sm:rounded-3xl border shadow-xl backdrop-blur-2xl transition-all duration-300 my-auto flex flex-col">
		{#if isLoading}
			<!-- High-end shimmer loading skeleton -->
			<div class="skeleton-wrapper flex min-h-[520px] w-full flex-col justify-center p-6 sm:p-12">
				<div class="skeleton-avatar mx-auto mb-4 h-16 w-16 rounded-full animate-pulse"></div>
				<div class="skeleton-line mx-auto mb-3 h-5 w-44 rounded-lg animate-pulse"></div>
				<div class="skeleton-line mx-auto mb-8 h-3.5 w-64 rounded-lg animate-pulse"></div>
				<div class="mx-auto flex w-full max-w-sm flex-col gap-3.5">
					<div class="skeleton-line h-11 w-full rounded-xl animate-pulse"></div>
					<div class="skeleton-line h-11 w-full rounded-xl animate-pulse"></div>
					<div class="skeleton-line h-11 w-full rounded-xl animate-pulse"></div>
				</div>
			</div>
		{:else}
			<div class="grid w-full h-full max-h-[calc(100vh-2.5rem)] sm:max-h-[calc(100vh-3.5rem)] lg:min-h-[560px] lg:grid-cols-[0.82fr_1.18fr] overflow-hidden flex-1">
				<!-- Left Showcase Brand Panel: Ultra-Premium Midnight Sapphire with Precision University Insignia (Desktop Only) -->
				<aside class="auth-side-panel image-panel relative select-none h-full" aria-hidden="true">
					<!-- Subtle ambient spotlight for depth behind the emblem -->
					<div class="emblem-halo pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full" aria-hidden="true"></div>

					<div class="relative z-10 flex flex-col items-center justify-center text-center p-6">
						<!-- Precision Multi-Ring Insignia with Luminous Depth -->
						<div class="brand-graphic-wrapper relative flex items-center justify-center">
							<svg class="brand-graphic" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
								<!-- Outer Precision Ring with subtle dash rhythm -->
								<circle cx="100" cy="100" r="92" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" stroke-dasharray="3 3" />
								<circle cx="100" cy="100" r="84" stroke="rgba(255,255,255,0.5)" stroke-width="2" />
								
								<!-- Cardinal Direction Precision Pointers -->
								<line x1="100" y1="10" x2="100" y2="18" stroke="rgba(255,255,255,0.85)" stroke-width="2" stroke-linecap="round" />
								<line x1="100" y1="182" x2="100" y2="190" stroke="rgba(255,255,255,0.85)" stroke-width="2" stroke-linecap="round" />
								<line x1="10" y1="100" x2="18" y2="100" stroke="rgba(255,255,255,0.85)" stroke-width="2" stroke-linecap="round" />
								<line x1="182" y1="100" x2="190" y2="100" stroke="rgba(255,255,255,0.85)" stroke-width="2" stroke-linecap="round" />

								<!-- Middle Core Ring -->
								<circle cx="100" cy="100" r="56" stroke="rgba(255,255,255,0.8)" stroke-width="2.2" />

								<!-- Inner Accent Ring -->
								<circle cx="100" cy="100" r="32" stroke="rgba(191,219,254,0.4)" stroke-width="1.5" />

								<!-- Focal Crosshairs -->
								<line x1="100" y1="36" x2="100" y2="164" stroke="rgba(255,255,255,0.95)" stroke-width="2.2" stroke-linecap="round" />
								<line x1="36" y1="100" x2="164" y2="100" stroke="rgba(255,255,255,0.95)" stroke-width="2.2" stroke-linecap="round" />

								<!-- Solid Center Core Node -->
								<circle cx="100" cy="100" r="3.5" fill="#ffffff" />
							</svg>
						</div>

						<!-- Premium Typography -->
						<div class="mt-6 flex flex-col items-center">
							<h2 class="brand-tagline">
								QCU Coop Store
							</h2>
						</div>
					</div>
				</aside>

				<!-- Right Authentication Form Panel -->
				<section class="auth-form-panel relative z-10 flex w-full flex-col px-6 py-7 sm:px-9 sm:py-8 lg:px-11 lg:py-8 overflow-y-auto max-h-[calc(100vh-2.5rem)] sm:max-h-[calc(100vh-3.5rem)]">
					<!-- Brand Logo on top of Sign In and Create Account buttons -->
					<div class="brand-logo-container mb-4 flex flex-col items-center justify-center">
						<a href="/" class="inline-flex transition-opacity hover:opacity-90 active:opacity-80" aria-label="QCU Coop Home">
							<img
								src={isDarkMode ? '/images/logo/qcu_cooplogo-dark-mode_bg.jpeg' : '/images/logo/qcu_cooplogo-light-mode_bg.png'}
								alt="QCU Coop Store Logo"
								class="h-13 sm:h-15 w-auto max-w-[195px] object-contain rounded-lg select-none drop-shadow-2xs"
							/>
						</a>
					</div>

					<!-- Segmented Tab Switcher (Sign In vs Create Account) -->
					{#if mode === 'user'}
						<div class="mode-tabs-container mb-5 flex w-full justify-center">
							<div class="mode-tabs-pill flex w-full max-w-[310px] items-center rounded-2xl p-1.5 border shadow-inner">
								<button
									type="button"
									class="mode-tab-button flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200"
									class:active={activeMode === 'login'}
									onclick={() => (activeMode = 'login')}
								>
									Sign In
								</button>
								<button
									type="button"
									class="mode-tab-button flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200"
									class:active={activeMode === 'signup'}
									onclick={() => (activeMode = 'signup')}
								>
									Create Account
								</button>
							</div>
						</div>
					{/if}

					<!-- Form Heading -->
					<div class="form-heading-block mb-5 text-center sm:text-left">
						<h2 class="form-heading-title text-2xl sm:text-[1.65rem] font-black tracking-tight">
							{activeMode === 'login' ? 'Welcome back' : 'Register with QCU'}
						</h2>
						<p class="mt-1.5 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
							{activeMode === 'login'
								? 'Enter your student or faculty ID to access the store'
								: 'Fill in your academic profile to create your member account'}
						</p>
					</div>

					<!-- Alerts: Error & Success Messages -->
					{#if errorMessage}
						<div class="alert-banner alert-error mb-4 flex items-start gap-2.5 rounded-xl border p-3 shadow-sm" role="alert">
							<svg class="h-4 w-4 shrink-0 text-rose-600 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<circle cx="12" cy="12" r="10" />
								<line x1="12" y1="8" x2="12" y2="12" />
								<line x1="12" y1="16" x2="12.01" y2="16" />
							</svg>
							<div class="text-xs font-semibold text-rose-700 dark:text-rose-300">
								{errorMessage}
							</div>
						</div>
					{/if}

					{#if successMessage}
						<div class="alert-banner alert-success mb-4 flex items-start gap-2.5 rounded-xl border p-3 shadow-sm" role="status">
							<svg class="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							<div class="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
								{successMessage}
							</div>
						</div>
					{/if}

					<!-- The Form Component -->
					<form method="POST" class="auth-form flex flex-col gap-3" onsubmit={handleFormSubmit}>
						<input type="hidden" name="mode" value={activeMode} />

						{#if activeMode === 'signup'}
							<!-- Role Selection (Student vs Teacher) -->
							<div class="field-group">
								<span class="field-label block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
									Account Role
								</span>
								<div class="grid grid-cols-2 gap-2">
									<button
										type="button"
										class="role-select-card flex items-center justify-center gap-2 rounded-xl border p-2.5 font-bold text-xs transition-all duration-200"
										class:selected={signupRole === 'student'}
										onclick={() => (signupRole = 'student')}
									>
										<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<path d="M22 10v6M2 10l10-5 10 5-10 5z" />
											<path d="M6 12v5c3 3 9 3 12 0v-5" />
										</svg>
										Student
									</button>
									<button
										type="button"
										class="role-select-card flex items-center justify-center gap-2 rounded-xl border p-2.5 font-bold text-xs transition-all duration-200"
										class:selected={signupRole === 'teacher'}
										onclick={() => (signupRole = 'teacher')}
									>
										<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
										</svg>
										Teacher / Staff
									</button>
								</div>
								<input type="hidden" name="role" value={signupRole} />
							</div>

							<!-- Full Name Fields (2-column on desktop) -->
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
								<div class="field-group">
									<label for="firstName" class="field-label block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
										First Name
									</label>
									<div class="input-wrapper relative">
										<input
											id="firstName"
											name="firstName"
											type="text"
											bind:value={signupFirstName}
											autocomplete="given-name"
											placeholder="e.g. Juan"
											required
											class="form-input w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition-all focus:outline-none"
										/>
									</div>
								</div>

								<div class="field-group">
									<label for="lastName" class="field-label block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
										Last Name
									</label>
									<div class="input-wrapper relative">
										<input
											id="lastName"
											name="lastName"
											type="text"
											bind:value={signupLastName}
											autocomplete="family-name"
											placeholder="e.g. Dela Cruz"
											required
											class="form-input w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition-all focus:outline-none"
										/>
									</div>
								</div>
							</div>

							<!-- ID Number with Format Helper -->
							<div class="field-group">
								<div class="flex items-center justify-between mb-1">
									<label for="signupId" class="field-label block text-xs font-semibold text-slate-700 dark:text-slate-300">
										{signupRole === 'student' ? 'Student ID Number' : 'Employee ID Number'}
									</label>
									<span class="text-[11px] font-medium text-blue-600 dark:text-blue-400">
										Format: {signupRole === 'student' ? '23-XXXX' : '10-XXXX'}
									</span>
								</div>
								<div class="input-wrapper relative">
									<input
										id="signupId"
										name={signupRole === 'student' ? 'schoolId' : 'employeeNo'}
										type="text"
										inputmode="numeric"
										placeholder={signupRole === 'student' ? '23-XXXX' : '10-XXXX'}
										value={signupId}
										oninput={handleSignupIdInput}
										required
										class="form-input w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition-all focus:outline-none"
									/>
								</div>
							</div>

							<!-- QCU Email Address -->
							<div class="field-group">
								<label for="email" class="field-label block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
									Email Address
								</label>
								<div class="input-wrapper relative">
									<input
										id="email"
										name="email"
										type="email"
										bind:value={signupEmail}
										autocomplete="email"
										placeholder="username@qcu.edu.ph"
										required
										class="form-input w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition-all focus:outline-none"
									/>
								</div>
							</div>

							<!-- Department / College Custom Dropdown -->
							<div class="field-group custom-dropdown-container relative">
								<label for="department-trigger" class="field-label block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
									College Department
								</label>
								<button
									id="department-trigger"
									type="button"
									class="custom-dropdown-trigger flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition-all text-left {openDropdown === 'department' ? 'border-blue-600 ring-2 ring-blue-500/20' : ''}"
									onclick={() => toggleDropdown('department')}
									aria-haspopup="listbox"
									aria-expanded={openDropdown === 'department'}
								>
									<span class={signupDepartment ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-400 font-normal'}>
										{signupDepartment || 'Select your college'}
									</span>
									<svg class="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 {openDropdown === 'department' ? 'rotate-180 text-blue-600' : ''}" viewBox="0 0 20 20" fill="currentColor">
										<path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
									</svg>
								</button>

								{#if openDropdown === 'department'}
									<div class="custom-dropdown-menu absolute left-0 right-0 top-full mt-1.5 z-50 max-h-56 overflow-y-auto rounded-xl border bg-white dark:bg-slate-900 shadow-xl backdrop-blur-md p-1.5 space-y-0.5" role="listbox">
										{#each Object.keys(departmentCourses) as department}
											{@const isSelected = signupDepartment === department}
											<button
												type="button"
												role="option"
												aria-selected={isSelected}
												class="custom-dropdown-item flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-colors text-left {isSelected ? 'bg-blue-50 text-blue-700 font-bold dark:bg-blue-900/40 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}"
												onclick={() => {
													signupDepartment = department as Department;
													signupCourse = '';
													signupYearLevel = '';
													openDropdown = null;
												}}
											>
												<span>{department}</span>
												{#if isSelected}
													<svg class="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 ml-2" viewBox="0 0 20 20" fill="currentColor">
														<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
													</svg>
												{/if}
											</button>
										{/each}
									</div>
								{/if}
								<input type="hidden" name="department" value={signupDepartment} required />
							</div>

							<!-- Course & Year Level for Students -->
							{#if signupRole === 'student'}
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
									<!-- Course / Program Custom Dropdown -->
									<div class="field-group custom-dropdown-container relative">
										<label for="course-trigger" class="field-label block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
											Course / Program
										</label>
										<button
											id="course-trigger"
											type="button"
											disabled={!signupDepartment}
											class="custom-dropdown-trigger flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed {openDropdown === 'course' ? 'border-blue-600 ring-2 ring-blue-500/20' : ''}"
											onclick={() => toggleDropdown('course')}
											aria-haspopup="listbox"
											aria-expanded={openDropdown === 'course'}
										>
											<span class={signupCourse ? 'text-slate-900 dark:text-white font-semibold line-clamp-1' : 'text-slate-400 font-normal line-clamp-1'}>
												{signupCourse || (signupDepartment ? 'Select course' : 'Choose college first')}
											</span>
											<svg class="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ml-1.5 {openDropdown === 'course' ? 'rotate-180 text-blue-600' : ''}" viewBox="0 0 20 20" fill="currentColor">
												<path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
											</svg>
										</button>

										{#if openDropdown === 'course' && signupDepartment}
											<div class="custom-dropdown-menu absolute left-0 right-0 top-full mt-1.5 z-50 max-h-56 overflow-y-auto rounded-xl border bg-white dark:bg-slate-900 shadow-xl backdrop-blur-md p-1.5 space-y-0.5" role="listbox">
												{#each signupCourses as course}
													{@const isSelected = signupCourse === course}
													<button
														type="button"
														role="option"
														aria-selected={isSelected}
														class="custom-dropdown-item flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-colors text-left {isSelected ? 'bg-blue-50 text-blue-700 font-bold dark:bg-blue-900/40 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}"
														onclick={() => {
															signupCourse = course;
															signupYearLevel = '';
															openDropdown = null;
														}}
													>
														<span class="line-clamp-2">{course}</span>
														{#if isSelected}
															<svg class="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 ml-2" viewBox="0 0 20 20" fill="currentColor">
																<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
															</svg>
														{/if}
													</button>
												{/each}
											</div>
										{/if}
										<input type="hidden" name="course" value={signupCourse} required />
									</div>

									<!-- Year Level Custom Dropdown -->
									<div class="field-group custom-dropdown-container relative">
										<label for="yearLevel-trigger" class="field-label block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
											Year Level
										</label>
										<button
											id="yearLevel-trigger"
											type="button"
											disabled={!signupCourse}
											class="custom-dropdown-trigger flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed {openDropdown === 'yearLevel' ? 'border-blue-600 ring-2 ring-blue-500/20' : ''}"
											onclick={() => toggleDropdown('yearLevel')}
											aria-haspopup="listbox"
											aria-expanded={openDropdown === 'yearLevel'}
										>
											<span class={signupYearLevel ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-400 font-normal'}>
												{signupYearLevel ? `${signupYearLevel}${signupYearLevel === '1' ? 'st' : signupYearLevel === '2' ? 'nd' : signupYearLevel === '3' ? 'rd' : 'th'} Year` : (signupCourse ? 'Select year' : 'Choose course first')}
											</span>
											<svg class="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ml-1.5 {openDropdown === 'yearLevel' ? 'rotate-180 text-blue-600' : ''}" viewBox="0 0 20 20" fill="currentColor">
												<path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
											</svg>
										</button>

										{#if openDropdown === 'yearLevel' && signupCourse}
											<div class="custom-dropdown-menu absolute left-0 right-0 top-full mt-1.5 z-50 max-h-56 overflow-y-auto rounded-xl border bg-white dark:bg-slate-900 shadow-xl backdrop-blur-md p-1.5 space-y-0.5" role="listbox">
												{#each Array.from({ length: signupMaxYearLevel }, (_, index) => index + 1) as year}
													{@const isSelected = signupYearLevel === String(year)}
													<button
														type="button"
														role="option"
														aria-selected={isSelected}
														class="custom-dropdown-item flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-colors text-left {isSelected ? 'bg-blue-50 text-blue-700 font-bold dark:bg-blue-900/40 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}"
														onclick={() => {
															signupYearLevel = String(year);
															openDropdown = null;
														}}
													>
														<span>{year}{year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'} Year</span>
														{#if isSelected}
															<svg class="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 ml-2" viewBox="0 0 20 20" fill="currentColor">
																<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
															</svg>
														{/if}
													</button>
												{/each}
											</div>
										{/if}
										<input type="hidden" name="yearLevel" value={signupYearLevel} required />
									</div>
								</div>
							{/if}

							<!-- Password Input with Strength Meter -->
							<div class="field-group">
								<label for="signupPassword" class="field-label block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
									Create Password
								</label>
								<div class="input-wrapper relative">
									<input
										id="signupPassword"
										name="password"
										type={showPassword ? 'text' : 'password'}
										bind:value={signupPassword}
										placeholder="At least 8 characters"
										autocomplete="new-password"
										minlength={8}
										required
										class="form-input w-full rounded-xl border px-3.5 py-2.5 pr-11 text-xs sm:text-sm font-semibold transition-all focus:outline-none"
									/>
									<button
										type="button"
										class="password-reveal-btn absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
										onclick={() => (showPassword = !showPassword)}
										aria-label={showPassword ? 'Hide password' : 'Show password'}
									>
										{#if showPassword}
											<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
												<path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
											</svg>
										{:else}
											<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
												<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
												<path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
											</svg>
										{/if}
									</button>
								</div>

								<!-- Interactive Password Strength Meter -->
								{#if signupPassword.length > 0}
									<div class="strength-meter-card mt-2.5 rounded-xl border p-2.5 shadow-2xs">
										<div class="flex items-center justify-between mb-1.5">
											<span class="text-xs font-semibold text-slate-700 dark:text-slate-300">Password Strength</span>
											<span class={`text-xs font-bold ${passwordStrength.colorClass}`}>
												{passwordStrength.label}
											</span>
										</div>
										<div class="grid grid-cols-3 gap-1 h-1.5 w-full">
											<div class={`h-full rounded-full transition-all duration-300 ${passwordStrength.score >= 1 ? (passwordStrength.score === 1 ? 'bg-rose-500' : passwordStrength.score === 2 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-200 dark:bg-slate-700'}`}></div>
											<div class={`h-full rounded-full transition-all duration-300 ${passwordStrength.score >= 2 ? (passwordStrength.score === 2 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-200 dark:bg-slate-700'}`}></div>
											<div class={`h-full rounded-full transition-all duration-300 ${passwordStrength.score >= 3 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
										</div>
									</div>
								{/if}
							</div>
						{:else}
							<!-- Sign In Mode Fields -->
							<div class="field-group">
								<div class="flex items-center justify-between mb-1.5">
									<label for="loginId" class="field-label block text-xs font-semibold text-slate-700 dark:text-slate-300">
										Student / Faculty ID
									</label>
									<span class="text-[11px] font-medium text-blue-600 dark:text-blue-400">
										e.g. 23-2111
									</span>
								</div>
								<div class="input-wrapper relative">
									<input
										id="loginId"
										name="loginId"
										type="text"
										placeholder="23-XXXX or 10-XXXX"
										value={loginId}
										oninput={handleLoginIdInput}
										autocomplete="username"
										required
										class="form-input w-full rounded-xl border px-4 py-3 text-sm font-semibold transition-all focus:outline-none"
									/>
								</div>
							</div>

							<div class="field-group">
								<label for="loginPassword" class="field-label block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
									Password
								</label>
								<div class="input-wrapper relative">
									<input
										id="loginPassword"
										name="password"
										type={showPassword ? 'text' : 'password'}
										placeholder="Enter your account password"
										autocomplete="current-password"
										required
										class="form-input w-full rounded-xl border px-4 py-3 pr-11 text-sm font-semibold transition-all focus:outline-none"
									/>
									<button
										type="button"
										class="password-reveal-btn absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
										onclick={() => (showPassword = !showPassword)}
										aria-label={showPassword ? 'Hide password' : 'Show password'}
									>
										{#if showPassword}
											<svg class="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
												<path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
											</svg>
										{:else}
											<svg class="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
												<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
												<path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
											</svg>
										{/if}
									</button>
								</div>
								{#if mode === 'user'}
									<div class="mt-2 flex justify-end">
										<a href="/account" class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline transition-colors">
											Forgot password?
										</a>
									</div>
								{/if}
							</div>
						{/if}

						<!-- Submit CTA Button -->
						<div class="action-cta-wrapper mt-3 pt-1.5">
							<button
								type="submit"
								class="submit-button flex w-full items-center justify-center gap-2 rounded-xl py-3 px-6 font-bold text-sm tracking-wide text-white transition-colors duration-200 disabled:opacity-60"
								disabled={isSubmitting}
							>
								{#if isSubmitting}
									<svg class="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
										<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
										<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
									</svg>
									<span>Processing...</span>
								{:else if activeMode === 'signup'}
									<span>Submit Member Registration</span>
									<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
										<path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
									</svg>
								{:else}
									<span>Sign In</span>
								{/if}
							</button>
						</div>
					</form>
				</section>
			</div>
		{/if}
	</div>
</div>

<style>
	/* Background Canvas with Farm-Match styling */
	.auth-page-root {
		background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 50%, #e2e8f0 100%);
		transition: background 300ms ease;
	}

	:global(html[data-theme='dark'] .auth-page-root) {
		background: radial-gradient(ellipse 90% 60% at 50% -10%, rgba(30, 58, 138, 0.22), transparent 70%),
			linear-gradient(145deg, #070d18 0%, #0a1324 50%, #050a14 100%);
	}

	/* Floating Control Buttons (Back and Theme Toggle) - High Contrast & Clearly Visible */
	.theme-toggle-btn {
		background: #ffffff;
		border: 1.5px solid #cbd5e1;
		color: #0f172a;
		box-shadow: 0 4px 16px rgba(15, 23, 42, 0.12), 0 1px 3px rgba(15, 23, 42, 0.08);
	}
	.theme-toggle-btn:hover {
		background: #f8fafc;
		border-color: #94a3b8;
		color: #1d4ed8;
		box-shadow: 0 6px 20px rgba(15, 23, 42, 0.16);
	}
	:global(html[data-theme='dark'] .theme-toggle-btn) {
		background: #1e293b;
		border: 1.5px solid #475569;
		color: #f8fafc;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
	}
	:global(html[data-theme='dark'] .theme-toggle-btn:hover) {
		background: #334155;
		border-color: #64748b;
		color: #60a5fa;
	}

	/* Main Auth Shell (Glassmorphic Card) */
	.auth-shell {
		background: rgba(255, 255, 255, 0.88);
		border-color: rgba(255, 255, 255, 0.95);
		box-shadow: 0 25px 70px -15px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.05);
	}

	:global(html[data-theme='dark'] .auth-shell) {
		background: rgba(13, 23, 42, 0.85);
		border-color: rgba(255, 255, 255, 0.08);
		box-shadow: 0 30px 90px -20px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.04);
	}

	/* Left Showcase Brand Panel: Desktop only (completely hidden on mobile POV) */
	.image-panel {
		display: none;
	}

	@media (min-width: 1024px) {
		.image-panel {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			min-height: 560px;
			height: 100%;
			width: 100%;
			background: #081a42;
			color: #ffffff;
			position: relative;
			padding: 2rem 1.5rem;
		}
	}

	/* Custom Sleek Scrollbar for Form Panel */
	.auth-form-panel {
		scrollbar-width: thin;
		scrollbar-color: rgba(148, 163, 184, 0.45) transparent;
	}
	:global(html[data-theme='dark'] .auth-form-panel) {
		scrollbar-color: rgba(100, 116, 139, 0.5) transparent;
	}
	.auth-form-panel::-webkit-scrollbar {
		width: 6px;
	}
	.auth-form-panel::-webkit-scrollbar-track {
		background: transparent;
	}
	.auth-form-panel::-webkit-scrollbar-thumb {
		background-color: rgba(148, 163, 184, 0.45);
		border-radius: 9999px;
	}
	.auth-form-panel::-webkit-scrollbar-thumb:hover {
		background-color: rgba(100, 116, 139, 0.75);
	}
	:global(html[data-theme='dark'] .auth-form-panel::-webkit-scrollbar-thumb) {
		background-color: rgba(100, 116, 139, 0.5);
	}
	:global(html[data-theme='dark'] .auth-form-panel::-webkit-scrollbar-thumb:hover) {
		background-color: rgba(148, 163, 184, 0.75);
	}

	.emblem-halo {
		display: none;
	}

	.brand-graphic-wrapper {
		filter: none;
	}

	.brand-graphic {
		width: 9.5rem;
		height: 9.5rem;
		display: block;
		margin: 0 auto;
	}

	.brand-tagline {
		margin: 0;
		color: #ffffff;
		font-family: 'Manrope', sans-serif;
		font-size: 1.2rem;
		font-weight: 800;
		letter-spacing: 0.16em;
		text-transform: none;
		text-align: center;
		text-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
	}

	.form-heading-title {
		color: #071739;
	}
	:global(html[data-theme='dark'] .form-heading-title) {
		color: #ffffff;
	}

	/* Segmented Mode Tabs */
	.mode-tabs-pill {
		background: #f1f5f9;
		border-color: #e2e8f0;
	}
	:global(html[data-theme='dark'] .mode-tabs-pill) {
		background: rgba(15, 23, 42, 0.7);
		border-color: rgba(51, 65, 85, 0.6);
	}

	.mode-tab-button {
		color: #64748b;
	}
	.mode-tab-button.active {
		background: #ffffff;
		color: #0f172a;
		box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
	}
	:global(html[data-theme='dark'] .mode-tab-button) {
		color: #94a3b8;
	}
	:global(html[data-theme='dark'] .mode-tab-button.active) {
		background: #2563eb;
		color: #ffffff;
		box-shadow: none;
	}

	/* Role Selector Cards */
	.role-select-card {
		background: #f8fafc;
		border-color: #e2e8f0;
		color: #475569;
	}
	.role-select-card.selected {
		background: #eff6ff;
		border-color: #2563eb;
		color: #1d4ed8;
		box-shadow: none;
	}
	:global(html[data-theme='dark'] .role-select-card) {
		background: rgba(15, 23, 42, 0.6);
		border-color: rgba(51, 65, 85, 0.7);
		color: #94a3b8;
	}
	:global(html[data-theme='dark'] .role-select-card.selected) {
		background: rgba(37, 99, 235, 0.15);
		border-color: #3b82f6;
		color: #60a5fa;
		box-shadow: none;
	}

	/* Inputs & Selects */
	.form-input,
	.form-select {
		background: #ffffff;
		border-color: #cbd5e1;
		color: #0f172a;
	}
	.form-input:focus,
	.form-select:focus {
		border-color: #2563eb;
		outline: none;
		box-shadow: none;
	}
	:global(html[data-theme='dark'] .form-input),
	:global(html[data-theme='dark'] .form-select) {
		background: rgba(15, 23, 42, 0.75);
		border-color: rgba(71, 85, 105, 0.8);
		color: #f1f5f9;
	}
	:global(html[data-theme='dark'] .form-input:focus),
	:global(html[data-theme='dark'] .form-select:focus) {
		border-color: #3b82f6;
		outline: none;
		box-shadow: none;
	}

	/* Custom Dropdowns */
	.custom-dropdown-trigger {
		background: #ffffff;
		border-color: #cbd5e1;
		color: #0f172a;
	}
	.custom-dropdown-trigger:hover:not(:disabled) {
		border-color: #94a3b8;
	}
	.custom-dropdown-trigger:focus {
		border-color: #2563eb;
		outline: none;
	}
	:global(html[data-theme='dark'] .custom-dropdown-trigger) {
		background: rgba(15, 23, 42, 0.75);
		border-color: rgba(71, 85, 105, 0.8);
		color: #f1f5f9;
	}
	:global(html[data-theme='dark'] .custom-dropdown-trigger:hover:not(:disabled)) {
		border-color: #64748b;
	}
	:global(html[data-theme='dark'] .custom-dropdown-trigger:focus) {
		border-color: #3b82f6;
	}

	.custom-dropdown-menu {
		background: #ffffff;
		border-color: #e2e8f0;
		box-shadow: 0 14px 34px -4px rgba(15, 23, 42, 0.16), 0 4px 10px -2px rgba(15, 23, 42, 0.08);
		scrollbar-width: thin;
		scrollbar-color: rgba(148, 163, 184, 0.4) transparent;
	}
	:global(html[data-theme='dark'] .custom-dropdown-menu) {
		background: #0f172a;
		border-color: #334155;
		box-shadow: 0 18px 40px -4px rgba(0, 0, 0, 0.7);
		scrollbar-color: rgba(100, 116, 139, 0.5) transparent;
	}
	.custom-dropdown-menu::-webkit-scrollbar {
		width: 5px;
	}
	.custom-dropdown-menu::-webkit-scrollbar-thumb {
		background-color: rgba(148, 163, 184, 0.4);
		border-radius: 9999px;
	}

	/* Alerts */
	.alert-error {
		background: #fef2f2;
		border-color: #fecaca;
	}
	:global(html[data-theme='dark'] .alert-error) {
		background: rgba(127, 29, 29, 0.2);
		border-color: rgba(239, 68, 68, 0.35);
	}

	.alert-success {
		background: #f0fdf4;
		border-color: #bbf7d0;
	}
	:global(html[data-theme='dark'] .alert-success) {
		background: rgba(20, 83, 45, 0.2);
		border-color: rgba(34, 197, 94, 0.35);
	}

	/* Strength Meter Card */
	.strength-meter-card {
		background: #f8fafc;
		border-color: #e2e8f0;
	}
	:global(html[data-theme='dark'] .strength-meter-card) {
		background: rgba(15, 23, 42, 0.6);
		border-color: rgba(51, 65, 85, 0.6);
	}

	/* Primary Submit Button */
	.submit-button {
		background: #2563eb;
		box-shadow: none;
	}
	.submit-button:hover:not(:disabled) {
		background: #1d4ed8;
		box-shadow: none;
		transform: none;
	}

	/* Shimmer skeleton */
	.skeleton-wrapper {
		background: rgba(255, 255, 255, 0.5);
	}
	.skeleton-avatar,
	.skeleton-line {
		background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}
	:global(html[data-theme='dark'] .skeleton-wrapper) {
		background: rgba(15, 23, 42, 0.5);
	}
	:global(html[data-theme='dark'] .skeleton-avatar),
	:global(html[data-theme='dark'] .skeleton-line) {
		background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}
</style>
