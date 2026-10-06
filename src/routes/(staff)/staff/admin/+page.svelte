<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	let loading = $state(true);
	let localTime = $state('');
	let timeOfDay = $state('morning');

	onMount(() => {
		function updateClock() {
			const now = new Date();
			const hour = now.getHours();

			timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
			localTime = now.toLocaleTimeString(undefined, {
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit'
			});
		}

		updateClock();
		const interval = setInterval(updateClock, 1000);
		loading = false;
		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>Dashboard | QCU Coop Store</title>
</svelte:head>

<div class="admin-page">
	{#if loading}
		<div class="dashboard-skeleton" aria-label="Loading dashboard" aria-busy="true">
			<div class="skeleton-header"></div>
			<div class="skeleton-stats">
				{#each [1, 2, 3, 4] as item (item)}<div class="skeleton-card"></div>{/each}
			</div>
			<div class="skeleton-links">
				<div class="skeleton-card"></div>
				<div class="skeleton-card"></div>
			</div>
		</div>
	{:else}
		<div>
	<div class="admin-title-row" in:fade={{ duration: 250 }}>
		<div class="admin-title-copy">
			<p class="admin-eyebrow">Operations overview</p>
			<h1 class="admin-title">Good {timeOfDay}, Administrator</h1>
			<p class="admin-subtitle">Here is what is happening across the cooperative store today.</p>
		</div>
		<div class="live-clock" aria-label="Local system time">
			<span class="live-clock-label">Local time</span>
			<time>{localTime || '--:--:-- --'}</time>
			<span class="live-indicator"><i></i> Live</span>
		</div>
	</div>
	<div class="dashboard-stats" in:fade={{ duration: 250, delay: 40 }}>
		<article><span>Gross sales</span><strong>₱284,620</strong></article>
		<article><span>Units moved</span><strong>1,846</strong></article>
		<article><span>Low stock items</span><strong>18</strong></article>
		<article><span>Non-selling items</span><strong>24</strong></article>
	</div>
	<nav class="dashboard-links" aria-label="Admin workspace" in:fade={{ duration: 250, delay: 80 }}>
		<a href="/staff/admin/inventory"><strong>Inventory Management</strong><span>Review stock, purchasing, and item records</span></a>
		<a href="/staff/admin/reports"><strong>Reports Engine</strong><span>Review sales and cooperative performance</span></a>
	</nav>
		</div>
	{/if}
</div>

<style>
	.admin-page { padding: 3rem clamp(1rem, 3vw, 3rem) 3rem; }
	.dashboard-skeleton { min-height: 19rem; }
	.skeleton-header, .skeleton-card { border-radius: .7rem; background: linear-gradient(90deg, #e8edf4 25%, #f3f6fa 50%, #e8edf4 75%); background-size: 200% 100%; animation: skeleton-shimmer 1.2s ease-in-out infinite; }
	.skeleton-header { width: min(100%, 38rem); height: 7rem; margin-bottom: 2rem; }
	.skeleton-stats, .skeleton-links { display: grid; gap: .85rem; }
	.skeleton-stats { grid-template-columns: repeat(4, minmax(0, 1fr)); }
	.skeleton-links { grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: .85rem; }
	.skeleton-card { min-height: 5rem; }
	@keyframes skeleton-shimmer { to { background-position: -200% 0; } }
	.admin-title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 1.25rem; margin-bottom: 2rem; }
	.admin-title-copy { flex: 1; min-width: 0; }
	.live-clock { display: grid; flex: 0 0 auto; justify-items: end; gap: .2rem; border: 1px solid #e1e8f2; border-radius: .7rem; background: rgba(255, 255, 255, .8); padding: .7rem .9rem; }
	.live-clock-label { color: #8291a4; font-size: .58rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
	.live-clock time { color: #13284b; font-size: 1rem; font-variant-numeric: tabular-nums; font-weight: 900; }
	.live-indicator { display: flex; align-items: center; gap: .35rem; color: #168251; font-size: .58rem; font-weight: 800; }
	.live-indicator i { width: .4rem; height: .4rem; border-radius: 50%; background: #20b978; }
	.admin-eyebrow { margin: 0 0 .55rem; color: #2563eb; font-size: .68rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
	.admin-title { margin: 0; color: #091b35; font-size: clamp(2.4rem, 4vw, 4.25rem); letter-spacing: -.06em; line-height: .96; font-weight: 900; }
	.admin-subtitle { margin: .55rem 0 0; color: #7a8ca2; font-size: 1rem; }
	.dashboard-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .85rem; }
	.dashboard-stats article, .dashboard-links a { border: 1px solid #e4eaf2; border-radius: .7rem; background: white; padding: 1rem; }
	.dashboard-stats span, .dashboard-links span { display: block; color: #8190a6; font-size: .68rem; }
	.dashboard-stats strong { display: block; margin-top: .75rem; color: #13284b; font-size: 1.25rem; }
	.dashboard-links { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .85rem; margin-top: .85rem; }
	.dashboard-links a { text-decoration: none; }
	.dashboard-links strong { display: block; margin-bottom: .4rem; color: #1d4ed8; font-size: .82rem; }
	@media (prefers-reduced-motion: reduce) { .skeleton-header, .skeleton-card { animation: none; } }
	@media (max-width: 700px) { .admin-title-row { flex-direction: column; }.dashboard-stats, .skeleton-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
	@media (max-width: 460px) { .admin-title { font-size: 2.5rem; } .dashboard-links, .skeleton-links { grid-template-columns: 1fr; } }
</style>
