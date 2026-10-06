<script lang="ts">
	import { goto } from '$app/navigation';

	let showLogoutConfirmation = $state(false);

	function closeLogoutConfirmation() {
		showLogoutConfirmation = false;
	}

	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return { destroy: () => node.remove() };
	}

	async function confirmLogout() {
		showLogoutConfirmation = false;
		await fetch('/logout', { method: 'POST' });
		await goto('/staff/login', { invalidateAll: true });
	}

	$effect(() => {
		if (!showLogoutConfirmation) return;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => document.body.style.overflow = previousOverflow;
	});
</script>


<svelte:window onkeydown={(event) => {
	if (event.key === 'Escape' && showLogoutConfirmation) closeLogoutConfirmation();
}} />

<button class="staff-logout" type="button" aria-label="Sign out" title="Sign out" onclick={() => showLogoutConfirmation = true}>
	<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></svg>
	<span>Sign out</span>
</button>

{#if showLogoutConfirmation}
	<div use:portal class="logout-backdrop" role="presentation" onclick={(event) => event.target === event.currentTarget && closeLogoutConfirmation()}>
		<div class="logout-confirmation-modal" role="alertdialog" aria-modal="true" aria-labelledby="logout-confirmation-title" aria-describedby="logout-confirmation-description">
			<div class="logout-confirmation-icon" aria-hidden="true">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.3 4.8 2.9 18a2 2 0 0 0 1.74 3h14.72a2 2 0 0 0 1.74-3L13.7 4.8a2 2 0 0 0-3.4 0Z" /></svg>
			</div>
			<h2 id="logout-confirmation-title" class="logout-confirmation-title">Are you sure you want to log out?</h2>
			<p id="logout-confirmation-description" class="logout-confirmation-description">You will need to sign in again to access your account.</p>
			<div class="logout-confirmation-actions">
				<button type="button" onclick={closeLogoutConfirmation} class="logout-confirmation-cancel">Cancel</button>
				<button type="button" onclick={confirmLogout} class="logout-confirmation-submit">Log out</button>
			</div>
		</div>
	</div>
{/if}

<style>
	button { display: flex; width: 100%; align-items: center; gap: .55rem; margin-top: 1rem; border: 1px solid #344968; border-radius: .5rem; background: transparent; color: #dbe7fb; padding: .65rem .75rem; text-align: left; font: inherit; font-size: .68rem; font-weight: 800; cursor: pointer; }
	button svg { width: 1rem; height: 1rem; flex: 0 0 auto; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; }
	button:hover { background: #12274b; color: white; }
	.logout-backdrop { position: fixed; z-index: 100; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(5, 12, 30, .7); padding: 1rem; backdrop-filter: blur(8px); }
	.logout-confirmation-modal { width: 100%; max-width: 28rem; border: 1px solid rgba(255, 255, 255, .1); border-radius: 1rem; background: white; padding: 1.5rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, .4); text-align: center; }
	.logout-confirmation-icon { display: flex; width: 3rem; height: 3rem; align-items: center; justify-content: center; margin: 0 auto; border-radius: 50%; background: #fee2e2; color: #dc2626; box-shadow: 0 0 0 8px #fef2f2; }
	.logout-confirmation-icon svg { width: 1.5rem; height: 1.5rem; }
	.logout-confirmation-title { margin: 1.25rem 0 0; color: #07152d; font-size: 1.25rem; font-weight: 900; }
	.logout-confirmation-description { margin: .5rem 0 0; color: #71717a; font-size: .875rem; line-height: 1.5rem; }
	.logout-confirmation-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; margin-top: 1.75rem; }
	.logout-confirmation-actions button { justify-content: center; margin: 0; border: 0; border-radius: .75rem; padding: .75rem 1rem; font-size: .875rem; transition: background 150ms ease; }
	.logout-confirmation-actions .logout-confirmation-cancel { background: #e4e4e7; color: #3f3f46; }
	.logout-confirmation-actions .logout-confirmation-cancel:hover { background: #d4d4d8; color: #27272a; }
	.logout-confirmation-actions .logout-confirmation-submit { background: #dc2626; color: white; }
	.logout-confirmation-actions .logout-confirmation-submit:hover { background: #b91c1c; color: white; }
	:global(html[data-theme='dark']) .logout-confirmation-modal { border-color: #334866; background: #172640; }
	:global(html[data-theme='dark']) .logout-confirmation-icon { background: #3b1f24; color: #fecaca; box-shadow: 0 0 0 8px #261b2a; }
	:global(html[data-theme='dark']) .logout-confirmation-title { color: #edf4ff; }
	:global(html[data-theme='dark']) .logout-confirmation-description { color: #b8c8dd; }
	:global(html[data-theme='dark']) .logout-confirmation-actions .logout-confirmation-cancel { background: #2b3b56; color: #edf4ff; }
	:global(html[data-theme='dark']) .logout-confirmation-actions .logout-confirmation-cancel:hover { background: #374b6b; }
	@media (min-width: 640px) { .logout-confirmation-modal { padding: 2rem; } }
</style>