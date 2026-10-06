<script lang="ts">
	import { onMount } from 'svelte';

	const AVATAR_STORAGE_KEY = 'qcu-admin-avatar-image';
	let fileInput = $state<HTMLInputElement>();
	let avatar = $state<string | null>(null);
	let avatarError = $state('');
	let isDarkMode = $state(false);

	function handleImageSelect(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		avatarError = '';
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result !== 'string') {
				avatarError = 'The selected image could not be loaded.';
				return;
			}

			avatar = reader.result;
			localStorage.setItem(AVATAR_STORAGE_KEY, reader.result);
		};
		reader.onerror = () => {
			avatarError = 'The selected image could not be loaded.';
		};
		reader.readAsDataURL(file);
	}

	function toggleTheme() {
		isDarkMode = !isDarkMode;
		const theme = isDarkMode ? 'dark' : 'light';
		document.documentElement.dataset.theme = theme;
		localStorage.setItem('qcu-theme', theme);
	}

	onMount(() => {
		avatar = localStorage.getItem(AVATAR_STORAGE_KEY);
		isDarkMode = localStorage.getItem('qcu-theme') === 'dark';
	});
</script>

<svelte:head>
	<title>Settings | QCU Coop Admin</title>
</svelte:head>

<main class="admin-page settings-page">
	<header class="admin-title-row">
		<div>
			<p class="admin-eyebrow">Workspace preferences</p>
			<h1 class="admin-title">Settings</h1>
			<p class="admin-subtitle">Manage your admin profile and workspace appearance.</p>
		</div>
	</header>

	<section class="settings-card" aria-labelledby="admin-profile-title">
		<h2 id="admin-profile-title">Admin profile</h2>
		<div class="avatar-picker">
			<button type="button" class="avatar-preview" onclick={() => fileInput?.click()} aria-label="Change profile picture">
				{#if avatar}
					<img src={avatar} alt="Admin profile" />
				{:else}
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
						<circle cx="12" cy="8" r="3.5" />
						<path stroke-linecap="round" d="M5 20c1.2-3.6 4.2-5.5 7-5.5s5.8 1.9 7 5.5" />
					</svg>
				{/if}
				<span class="avatar-edit-badge" aria-hidden="true">+</span>
			</button>
			<input bind:this={fileInput} type="file" accept="image/*" class="sr-only-input" onchange={handleImageSelect} />
			<p class="account-name">Administrator account</p>
			<p class="account-role">Admin workspace access</p>
			{#if avatarError}<p class="avatar-error" role="alert">{avatarError}</p>{/if}
		</div>

		<div class="settings-section">
			<h3>Settings</h3>
			<div class="settings-row">
				<div>
					<strong>Dark mode</strong>
					<p>Use a darker appearance throughout the admin workspace.</p>
				</div>
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
	.settings-card { width: 100%; max-width: 38rem; border: 1px solid #e4eaf2; border-radius: .75rem; background: white; padding: 1.5rem; box-shadow: 0 8px 24px rgba(32, 55, 88, .04); }
	.settings-card h2 { margin: 0; color: #172b4d; font-size: .9rem; font-weight: 900; }
	.avatar-picker { display: flex; flex-direction: column; align-items: center; gap: .35rem; padding: 1.75rem 0; }
	.avatar-preview { position: relative; display: grid; width: 6rem; height: 6rem; place-items: center; overflow: hidden; border: 2px solid #e5e9f0; border-radius: 50%; background: #f5f7fa; color: #64748b; padding: 0; cursor: pointer; }
	.avatar-preview > svg { width: 2.75rem; height: 2.75rem; }
	.avatar-preview img { width: 100%; height: 100%; object-fit: cover; }
	.avatar-edit-badge { position: absolute; right: 0; bottom: 0; display: grid; width: 1.5rem; height: 1.5rem; place-items: center; border: 2px solid white; border-radius: 50%; background: #2563eb; color: white; font-size: 1rem; font-weight: 700; }
	.sr-only-input { position: absolute; width: 1px; height: 1px; overflow: hidden; opacity: 0; }
	.account-name { margin: .6rem 0 0; color: #111827; font-size: .95rem; font-weight: 800; }
	.account-role { margin: .15rem 0 0; color: #6b7280; font-size: .72rem; font-weight: 600; }
	.avatar-error { margin: .5rem 0 0; color: #b42318; font-size: .75rem; }
	.settings-section { border-top: 1px solid #eef1f6; padding-top: 1.25rem; }
	.settings-section h3 { margin: 0 0 .85rem; color: #111827; font-size: .85rem; font-weight: 800; }
	.settings-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; color: #1f2937; font-size: .85rem; font-weight: 700; }
	.settings-row p { margin: .25rem 0 0; color: #718096; font-size: .72rem; font-weight: 500; }
	.theme-switch { position: relative; width: 2.4rem; height: 1.3rem; flex: 0 0 auto; border: 1px solid #d3dae6; border-radius: 9999px; background: #e2e8f0; padding: 0; cursor: pointer; transition: background 160ms ease, border-color 160ms ease; }
	.theme-switch[aria-pressed='true'] { border-color: #2563eb; background: #2563eb; }
	.switch-thumb { position: absolute; top: 1px; left: 1px; width: 1.1rem; height: 1.1rem; border-radius: 50%; background: white; box-shadow: 0 1px 2px rgba(0, 0, 0, .25); transition: transform 160ms ease; }
	.theme-switch[aria-pressed='true'] .switch-thumb { transform: translateX(1.1rem); }
	:global(html[data-theme='dark'] .settings-card) { border-color: #334866; background: #172640; }
	:global(html[data-theme='dark'] .settings-card h2), :global(html[data-theme='dark'] .account-name), :global(html[data-theme='dark'] .settings-section h3), :global(html[data-theme='dark'] .settings-row) { color: #edf4ff; }
	:global(html[data-theme='dark'] .account-role), :global(html[data-theme='dark'] .settings-row p) { color: #b8c8dd; }
	:global(html[data-theme='dark'] .settings-section) { border-color: #334866; }
	:global(html[data-theme='dark'] .avatar-preview) { border-color: #415878; background: #101d35; color: #b8c8dd; }
	:global(html[data-theme='dark'] .theme-switch) { border-color: #415878; background: #223957; }
	:global(html[data-theme='dark'] .theme-switch[aria-pressed='true']) { border-color: #2563eb; background: #2563eb; }
</style>
