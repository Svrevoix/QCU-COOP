<script lang="ts">
	import { tick } from 'svelte';

	type Group = { label: string; reports: string[] };
	type Selection = { group: string; report: string };

	let {
		groups,
		selection,
		variant = 'sidebar'
	} = $props<{
		groups: Group[];
		selection: Selection;
		variant?: 'sidebar' | 'light';
	}>();
	let catalogElement: HTMLElement;
	let expandedGroups = $state(new Set(['Core planned reports']));
	let reportCount = $derived(
		groups.reduce((total: number, group: Group) => total + group.reports.length, 0)
	);

	async function toggleGroup(group: Group, index: number) {
		if (selection.group !== group.label) {
			selection.group = group.label;
			selection.report = group.reports[0] ?? '';
		}

		const nextExpandedGroups = new Set(expandedGroups);
		const isExpanded = nextExpandedGroups.has(group.label);
		if (isExpanded) nextExpandedGroups.delete(group.label);
		else nextExpandedGroups.add(group.label);
		expandedGroups = nextExpandedGroups;

		if (!isExpanded) {
			await tick();
			const nav = catalogElement.closest('nav');
			const reportList = catalogElement.querySelector<HTMLElement>(`#report-list-${index}`);
			if (!nav || !reportList) return;

			const navBounds = nav.getBoundingClientRect();
			const listBounds = reportList.getBoundingClientRect();
			let scrollBy = 0;

			if (listBounds.height >= nav.clientHeight || listBounds.top < navBounds.top) {
				scrollBy = listBounds.top - navBounds.top;
			} else if (listBounds.bottom > navBounds.bottom) {
				scrollBy = listBounds.bottom - navBounds.bottom;
			}

			if (scrollBy) nav.scrollBy({ top: scrollBy, behavior: 'smooth' });
		}
	}
</script>

<aside
	bind:this={catalogElement}
	class="report-catalog"
	class:light={variant === 'light'}
	aria-label="Report catalog"
>
	<div class="catalog-heading"><span>Report catalog</span><b>{reportCount}</b></div>
	{#each groups as group, index}
		<section>
			<button
				class:active={selection.group === group.label}
				class="group-button"
				type="button"
				aria-expanded={expandedGroups.has(group.label)}
				aria-controls="report-list-{index}"
				onclick={() => toggleGroup(group, index)}
			>
				<span class="group-name"
					><svg class:open={expandedGroups.has(group.label)} viewBox="0 0 24 24" aria-hidden="true"
						><path d="m9 18 6-6-6-6" /></svg
					>{group.label}</span
				>
				<span class="group-count">{group.reports.length}</span>
			</button>
			{#if expandedGroups.has(group.label)}
				<div class="report-list" id="report-list-{index}">
					{#each group.reports as report}
						<button
							class:chosen={selection.report === report}
							type="button"
							title={report}
							onclick={() => (selection.report = report)}
						>
							{report}
						</button>
					{/each}
				</div>
			{/if}
		</section>
	{/each}
</aside>

<style>
	.report-catalog {
		min-width: 0;
		margin: 0.3rem 0 0.2rem 1.1rem;
		border-left: 1px solid #233858;
		padding-left: 0.6rem;
	}
	.catalog-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.4rem;
		padding: 0.5rem 0.45rem;
		color: #dbe7fb;
		font-size: 0.62rem;
		font-weight: 900;
	}
	.catalog-heading b,
	.group-count {
		flex: 0 0 auto;
		border-radius: 9999px;
		background: #172b4d;
		color: #9aacca;
		padding: 0.15rem 0.35rem;
		font-size: 0.52rem;
	}
	.report-catalog section {
		margin-top: 0.25rem;
	}
	.group-button {
		display: flex;
		width: 100%;
		min-width: 0;
		align-items: center;
		justify-content: space-between;
		gap: 0.35rem;
		border: 0;
		border-radius: 0.4rem;
		background: transparent;
		color: #9aacca;
		padding: 0.5rem 0.45rem;
		font: inherit;
		font-size: 0.59rem;
		font-weight: 800;
		line-height: 1.35;
		text-align: left;
		cursor: pointer;
	}
	.group-name {
		display: flex;
		min-width: 0;
		align-items: center;
		gap: 0.35rem;
	}
	.group-name svg {
		width: 0.8rem;
		height: 0.8rem;
		flex: 0 0 auto;
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 2;
		transition: transform 150ms ease;
	}
	.group-name svg.open {
		transform: rotate(90deg);
	}
	.group-button:hover,
	.group-button.active {
		background: #12274b;
		color: #fff;
	}
	.group-button.active .group-count {
		background: #2563eb;
		color: #fff;
	}
	.report-list {
		display: grid;
		gap: 0.1rem;
		padding: 0.15rem 0 0.3rem 0.35rem;
	}
	.report-list button {
		min-width: 0;
		border: 0;
		border-left: 2px solid transparent;
		background: transparent;
		color: #8da1c3;
		padding: 0.42rem 0.45rem;
		font: inherit;
		font-size: 0.58rem;
		line-height: 1.35;
		text-align: left;
		overflow-wrap: anywhere;
		cursor: pointer;
	}
	.report-list button:hover {
		color: white;
	}
	.report-list button.chosen {
		border-color: #3b82f6;
		color: #fff;
	}
	.report-catalog.light {
		margin: 0;
		border: 1px solid #e4eaf2;
		border-radius: 0.75rem;
		background: white;
		padding: 0.75rem;
		box-shadow: 0 5px 16px rgba(32, 55, 88, 0.04);
	}
	.report-catalog.light .catalog-heading {
		color: #1d2d49;
		font-size: 0.7rem;
		padding: 0.25rem 0.35rem 0.65rem;
	}
	.report-catalog.light .catalog-heading b,
	.report-catalog.light .group-count {
		background: #edf4ff;
		color: #2563eb;
	}
	.report-catalog.light section {
		margin-top: 0.35rem;
		border-top: 1px solid #edf1f5;
		padding-top: 0.3rem;
	}
	.report-catalog.light .group-button {
		color: #273750;
		font-size: 0.57rem;
	}
	.report-catalog.light .group-button:hover,
	.report-catalog.light .group-button.active {
		background: #f5f8ff;
		color: #1d4ed8;
	}
	.report-catalog.light .group-button.active .group-count {
		background: #2563eb;
		color: white;
	}
	.report-catalog.light .report-list {
		gap: 0.08rem;
		padding-left: 0.1rem;
	}
	.report-catalog.light .report-list button {
		border: 1px solid transparent;
		border-radius: 0.38rem;
		color: #71809a;
		font-size: 0.56rem;
		padding: 0.43rem 0.48rem;
	}
	.report-catalog.light .report-list button:hover {
		color: #1d4ed8;
	}
	.report-catalog.light .report-list button.chosen {
		border-color: #3b82f6;
		background: #f2f7ff;
		color: #1d4ed8;
		font-weight: 800;
	}
	@media (max-width: 760px) {
		.report-catalog.light {
			display: block !important;
		}
	}
</style>
