<script lang="ts">
	import { handleImageError } from '$lib/imageFallback';

	const aisles = [
		{ number: '01', name: 'School & Office Supplies', category: 'supplies', count: '51 items' },
		{ number: '02', name: 'School Uniforms & Apparel', category: 'uniforms', count: '14 items' },
		{ number: '03', name: 'QCU Merchandise & Accessories', category: 'merchandise', count: '31 items' },
		{ number: '04', name: 'Food, Snacks & Dining Items', category: 'food', count: '34 items' },
		{ number: '05', name: 'Personal Care, Hygiene & Medical', category: 'care', count: '14 items' },
		{ number: '06', name: 'Miscellaneous Bags & Accessories', category: 'bags', count: '11 items' },
		{ number: '07', name: 'Academic Textbooks', category: 'textbooks', count: '3 items' },
		{ number: '08', name: 'Financial & Co-op Operations', category: 'operations', count: '11 items' }
	];
</script>

<svelte:head>
	<title>Shop | QCU Coop Shop</title>
	<meta name="description" content="Browse QCU Coop Shop." />
</svelte:head>

<section class="aisle-page mx-auto max-w-5xl px-4 pb-8 sm:pb-10">
	<div class="mb-6 border-t border-zinc-300 pt-4">
		<p class="text-xs font-bold uppercase tracking-[0.24em] text-sky-500">02</p>
		<div class="mt-2 flex flex-wrap items-end justify-between gap-4">
			<h1 class="text-3xl font-black tracking-tight text-[#07152d] sm:text-4xl">Shop</h1>
		</div>
	</div>

	<div class="aisle-grid grid gap-4 md:grid-cols-3">
		{#each aisles as aisle}
			<a href={`/products?category=${aisle.category}`} class="aisle-card group min-h-[440px] overflow-hidden rounded-2xl border border-[#233f91] bg-[#233f91] text-white shadow-lg shadow-blue-950/20 transition hover:-translate-y-1 hover:shadow-xl">
				<div class="aisle-image h-64 overflow-hidden bg-[#233f91]">
					<img src="images/attires/nstp_shirt-green.jpg" alt="Temporary {aisle.name} preview" onerror={(event) => handleImageError(event, aisle.name)} class="h-full w-full object-contain p-8 transition duration-500 group-hover:scale-105" />
				</div>
				<div class="p-4">
					<div class="flex items-start justify-between gap-4">
						<div>
							<p class="text-xs font-bold text-white/80">{aisle.number}</p>
							<h2 class="mt-1 text-lg font-black text-white">{aisle.name}</h2>
						</div>
						<span class="text-xl text-white transition-transform group-hover:translate-x-1">→</span>
					</div>
					<p class="mt-3 text-[10px] font-bold uppercase tracking-wider text-white/70">{aisle.count}</p>
				</div>
			</a>
		{/each}
	</div>
</section>

<style>
	.aisle-page {
		animation: pageFadeIn 900ms ease-out both;
	}

	.aisle-grid {
		animation: contentSlideIn 900ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
	}

	.aisle-card {
		animation: cardReveal 700ms ease-out both;
	}

	.aisle-card:nth-child(2) {
		animation-delay: 100ms;
	}

	.aisle-card:nth-child(3) {
		animation-delay: 200ms;
	}

	@keyframes pageFadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes contentSlideIn {
		from { opacity: 0; transform: translateY(18px); }
		to { opacity: 1; transform: translateY(0); }
	}

	@keyframes cardReveal {
		from { opacity: 0; transform: translateY(14px) scale(0.98); }
		to { opacity: 1; transform: translateY(0) scale(1); }
	}

	@media (prefers-reduced-motion: reduce) {
		.aisle-page,
		.aisle-grid,
		.aisle-card {
			animation: none;
		}
	}
</style>