<script lang="ts">
	import { tick } from 'svelte';

	type Group = { label: string; reports: string[] };
	type Selection = { group: string; report: string };

	let { groups, selection } = $props<{ groups: Group[]; selection: Selection }>();
	let catalogElement: HTMLElement;
	let expandedGroups = $state(new Set(['Core planned reports']));
	let reportCount = $derived(groups.reduce((total: number, group: Group) => total + group.reports.length, 0));

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

<aside bind:this={catalogElement} class="report-catalog" aria-label="Report catalog">
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
				<span class="group-name"><svg class:open={expandedGroups.has(group.label)} viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>{group.label}</span>
				<span class="group-count">{group.reports.length}</span>
			</button>
			{#if expandedGroups.has(group.label)}
				<div class="report-list" id="report-list-{index}">
					{#each group.reports as report}
						<button
							class:chosen={selection.report === report}
							type="button"
							title={report}
							onclick={() => selection.report = report}
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
	.report-catalog { min-width: 0; margin: .3rem 0 .2rem 1.1rem; border-left: 1px solid #233858; padding-left: .6rem; }
	.catalog-heading { display: flex; align-items: center; justify-content: space-between; gap: .4rem; padding: .5rem .45rem; color: #dbe7fb; font-size: .62rem; font-weight: 900; }
	.catalog-heading b, .group-count { flex: 0 0 auto; border-radius: 9999px; background: #172b4d; color: #9aacca; padding: .15rem .35rem; font-size: .52rem; }
	.report-catalog section { margin-top: .25rem; }
	.group-button { display: flex; width: 100%; min-width: 0; align-items: center; justify-content: space-between; gap: .35rem; border: 0; border-radius: .4rem; background: transparent; color: #9aacca; padding: .5rem .45rem; font: inherit; font-size: .59rem; font-weight: 800; line-height: 1.35; text-align: left; cursor: pointer; }
	.group-name { display: flex; min-width: 0; align-items: center; gap: .35rem; }
	.group-name svg { width: .8rem; height: .8rem; flex: 0 0 auto; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2; transition: transform 150ms ease; }
	.group-name svg.open { transform: rotate(90deg); }
	.group-button:hover, .group-button.active { background: #12274b; color: #fff; }
	.group-button.active .group-count { background: #2563eb; color: #fff; }
	.report-list { display: grid; gap: .1rem; padding: .15rem 0 .3rem .35rem; }
	.report-list button { min-width: 0; border: 0; border-left: 2px solid transparent; background: transparent; color: #8da1c3; padding: .42rem .45rem; font: inherit; font-size: .58rem; line-height: 1.35; text-align: left; overflow-wrap: anywhere; cursor: pointer; }
	.report-list button:hover { color: white; }
	.report-list button.chosen { border-color: #3b82f6; color: #fff; }
</style>
