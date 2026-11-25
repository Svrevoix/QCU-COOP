<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { appearance, appearanceOptions, type AppearancePreset } from '$lib/stores/theme';

	let isOpen = $state(false);
	let selector = $state<HTMLDivElement>();
	let activeAppearance = $derived(
		appearanceOptions.find((option) => option.value === $appearance) ?? appearanceOptions[0]
	);

	function selectAppearance(value: AppearancePreset) {
		appearance.set(value);
		isOpen = false;
	}

	function handleWindowClick(event: MouseEvent) {
		if (isOpen && selector && !selector.contains(event.target as Node)) {
			isOpen = false;
		}
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') isOpen = false;
	}
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleWindowKeydown} />

<div class="appearance-selector" bind:this={selector}>
	<button
		type="button"
		class="appearance-trigger"
		aria-haspopup="listbox"
		aria-expanded={isOpen}
		onkeydown={handleWindowKeydown}
		onclick={() => (isOpen = !isOpen)}
	>
		<span class="appearance-swatch" style={`background-image: ${activeAppearance.gradient}`} aria-hidden="true"></span>
		<span class="appearance-current">{activeAppearance.label}</span>
		<svg class:open={isOpen} class="appearance-chevron" viewBox="0 0 20 20" fill="none" aria-hidden="true">
			<path d="m5 7.5 5 5 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	</button>

	{#if isOpen}
		<div
			class="appearance-menu"
			role="listbox"
			aria-label="Choose appearance"
			in:fly={{ y: -5, duration: 140 }}
			out:fade={{ duration: 100 }}
		>
			{#each appearanceOptions as option (option.value)}
				<button
					type="button"
					role="option"
					aria-selected={$appearance === option.value}
					class="appearance-option"
					class:selected={$appearance === option.value}
					onkeydown={handleWindowKeydown}
					onclick={() => selectAppearance(option.value)}
				>
					<span class="appearance-swatch" style={`background-image: ${option.gradient}`} aria-hidden="true"></span>
					<span>{option.label}</span>
					{#if $appearance === option.value}
						<svg class="appearance-check" viewBox="0 0 20 20" fill="none" aria-hidden="true">
							<path d="m4 10 4 4 8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.appearance-selector {
		position: relative;
		display: inline-flex;
		min-width: 0;
		flex: 0 0 auto;
	}

	.appearance-trigger {
		display: inline-flex;
		min-width: 0;
		height: 2.5rem;
		align-items: center;
		gap: 0.55rem;
		border: 1px solid var(--card-border);
		border-radius: 9999px;
		background: var(--card-surface);
		padding: 0 0.75rem;
		color: var(--text-primary);
		font: inherit;
		font-size: 0.68rem;
		font-weight: 750;
		box-shadow: 0 4px 14px rgb(2 8 23 / 10%);
		backdrop-filter: blur(14px);
		cursor: pointer;
		transition: border-color 150ms ease, background-color 150ms ease;
	}

	.appearance-trigger:hover,
	.appearance-trigger:focus-visible {
		border-color: var(--accent-border);
		outline: none;
	}

	.appearance-swatch {
		width: 1.15rem;
		height: 1.15rem;
		flex: 0 0 auto;
		border: 1px solid var(--card-border);
		border-radius: 50%;
	}

	.appearance-current {
		overflow: hidden;
		max-width: 8.6rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.appearance-chevron {
		width: 0.9rem;
		height: 0.9rem;
		flex: 0 0 auto;
		color: var(--text-muted);
		transition: transform 150ms ease;
	}

	.appearance-chevron.open {
		transform: rotate(180deg);
	}

	.appearance-menu {
		position: absolute;
		top: calc(100% + 0.5rem);
		right: 0;
		z-index: 80;
		display: grid;
		min-width: 215px;
		gap: 0.2rem;
		border: 1px solid var(--card-border);
		border-radius: 1rem;
		background: var(--card-surface);
		padding: 0.375rem;
		color: var(--text-primary);
		box-shadow: 0 20px 45px rgb(2 8 23 / 25%);
		backdrop-filter: blur(18px);
	}

	.appearance-option {
		display: flex;
		min-width: 215px;
		min-height: 2.6rem;
		align-items: center;
		gap: 0.65rem;
		border: 1px solid transparent;
		border-radius: 0.7rem;
		background: transparent;
		padding: 0.5rem 0.6rem;
		color: inherit;
		font: inherit;
		font-size: 0.75rem;
		font-weight: 650;
		text-align: left;
		white-space: nowrap;
		cursor: pointer;
		transition: border-color 140ms ease, background-color 140ms ease;
	}

	.appearance-option:hover,
	.appearance-option:focus-visible,
	.appearance-option.selected {
		border-color: var(--card-border);
		background: var(--accent-soft);
		outline: none;
	}

	.appearance-check {
		width: 1rem;
		height: 1rem;
		margin-left: auto;
		color: var(--text-primary);
	}

	@media (max-width: 640px) {
		.appearance-trigger {
			height: 2.25rem;
			gap: 0.35rem;
			padding: 0 0.5rem;
			font-size: 0.6rem;
		}

		.appearance-current {
			max-width: 6.1rem;
		}
	}
</style>
