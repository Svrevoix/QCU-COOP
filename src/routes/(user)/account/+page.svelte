<script lang="ts">
	import { onMount } from 'svelte';
	import { avatarImage } from '$lib/profile';

	// Placeholder student identity until real auth/profile data is wired up.
	const studentId = '23-2111';
	const studentName = 'Student Account';

	let fileInput = $state<HTMLInputElement>();
	let isDarkMode = $state(false);

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

	onMount(() => {
		isDarkMode = localStorage.getItem('qcu-theme') === 'dark';
	});
</script>

<main class="account-page">
	<section class="account-card">
		<h1>Account</h1>

		<!-- Centered, changeable profile picture -->
		<div class="avatar-picker">
			<button type="button" class="avatar-preview" onclick={openImagePicker} aria-label="Change profile picture">
				{#if $avatarImage}
					<img src={$avatarImage} alt="Your profile" />
				{:else}
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path stroke-linecap="round" d="M5 20c1.2-3.6 4.2-5.5 7-5.5s5.8 1.9 7 5.5"/></svg>
				{/if}
				<span class="avatar-edit-badge" aria-hidden="true">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/></svg>
				</span>
			</button>
			<input
				bind:this={fileInput}
				type="file"
				accept="image/*"
				class="sr-only-input"
				onchange={handleImageSelect}
			/>
			<p class="account-name">{studentName}</p>
			<p class="account-id">Student ID: {studentId}</p>
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
		</div>
	</section>
</main>

<style>
	.account-page { min-height: calc(100vh - 4rem); display: grid; place-items: start center; padding: 2.5rem 1rem; }
	.account-card { width: 100%; max-width: 26rem; background: #ffffff; border: 1px solid #e5e9f0; border-radius: 1rem; box-shadow: 0 14px 32px rgba(15, 23, 42, 0.08); padding: 2rem; }
	.account-card h1 { margin: 0 0 1.5rem; font-size: 1.15rem; font-weight: 800; color: #111827; text-align: center; }

	.avatar-picker { display: flex; flex-direction: column; align-items: center; gap: 0.35rem; }
	.avatar-preview { position: relative; display: grid; place-items: center; width: 6rem; height: 6rem; padding: 0; border: 2px solid #e5e9f0; border-radius: 9999px; background: #f5f7fa; color: #64748b; cursor: pointer; overflow: hidden; transition: border-color 150ms ease; }
	.avatar-preview:hover { border-color: #93b4e8; }
	.avatar-preview svg { width: 2.75rem; height: 2.75rem; }
	.avatar-preview img { width: 100%; height: 100%; object-fit: cover; border-radius: 9999px; }
	.avatar-edit-badge { position: absolute; bottom: -0.1rem; right: -0.1rem; display: grid; place-items: center; width: 1.6rem; height: 1.6rem; border-radius: 9999px; background: #2563eb; color: #fff; border: 2px solid #ffffff; }
	.avatar-edit-badge svg { width: 0.8rem; height: 0.8rem; }
	.sr-only-input { position: absolute; width: 1px; height: 1px; overflow: hidden; opacity: 0; }
	.account-name { margin: 0.6rem 0 0; font-size: 0.95rem; font-weight: 800; color: #111827; }
	.account-id { margin: 0.15rem 0 0; font-size: 0.72rem; font-weight: 600; color: #6b7280; }

	.settings-section { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #eef1f6; }
	.settings-section h2 { margin: 0 0 0.85rem; font-size: 0.85rem; font-weight: 800; color: #111827; }
	.settings-row { display: flex; align-items: center; justify-content: space-between; font-size: 0.85rem; font-weight: 700; color: #1f2937; }

	.theme-switch { position: relative; width: 2.4rem; height: 1.3rem; flex-shrink: 0; border: 1px solid #d3dae6; border-radius: 9999px; background: #e2e8f0; padding: 0; cursor: pointer; transition: background 160ms ease, border-color 160ms ease; }
	.theme-switch[aria-pressed='true'] { background: #2563eb; border-color: #2563eb; }
	.switch-thumb { position: absolute; top: 1px; left: 1px; width: 1.1rem; height: 1.1rem; border-radius: 9999px; background: #ffffff; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25); transition: transform 160ms ease; }
	.theme-switch[aria-pressed='true'] .switch-thumb { transform: translateX(1.1rem); }

	:global(html[data-theme='dark'] .account-card) { background: #172640; border-color: #334866; box-shadow: 0 14px 32px rgba(0, 0, 0, 0.4); }
	:global(html[data-theme='dark'] .account-card h1), :global(html[data-theme='dark'] .account-name), :global(html[data-theme='dark'] .settings-section h2), :global(html[data-theme='dark'] .settings-row) { color: #edf4ff; }
	:global(html[data-theme='dark'] .account-id) { color: #b8c8dd; }
	:global(html[data-theme='dark'] .avatar-preview) { background: #101d35; border-color: #415878; color: #b8c8dd; }
	:global(html[data-theme='dark'] .settings-section) { border-color: #334866; }
	:global(html[data-theme='dark'] .theme-switch) { background: #223957; border-color: #415878; }
	:global(html[data-theme='dark'] .theme-switch[aria-pressed='true']) { background: #2563eb; border-color: #2563eb; }
</style>
