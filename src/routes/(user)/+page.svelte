<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { fade, fly } from 'svelte/transition';
	import type { Product } from '$lib/products';
	let { data } = $props();

	let currentTab = $state('all');
	let mounted = $state(false);
	let activeFeaturedIndex = $state(0);
	let pointerStartX = $state<number | null>(null);
	let unavailableFeaturedImages = $state<Record<string, boolean>>({});

	const categoryMeta = {
		all: { title: 'All Items', desc: 'Browse our complete catalog of official university gear and essentials.' },
		lanyards: { title: 'Lanyards', desc: 'ID essentials in campus colors. Woven and breakaway styles, member-priced.' },
		uniforms: { title: 'Uniforms', desc: 'PE sets, department polos, and lab gowns in standard campus sizing.' },
		supplies: { title: 'School supplies', desc: 'Notebooks, exam materials, and drafting kits — the everyday restock list.' }
	};

	// Keep the rotating hero on products with catalog artwork so it never opens
	// on a missing-image fallback (the QCU Jacket currently has no image asset).
	let featuredProducts = $derived.by(() => {
		const productsWithImages = data.products.filter((product: Product) => product.image);
		const featured = productsWithImages.filter((product: Product) => product.featured);
		return (featured.length ? featured : productsWithImages).slice(0, 3);
	});
	const productSizeList = /\s+\((?:XS|S|M|L|XL|2XL|3XL)(?:,\s*(?:XS|S|M|L|XL|2XL|3XL))*\)$/i;

	function getFeaturedProductName(name: string) {
		return name.replace(productSizeList, '');
	}

	let visibleFeaturedCards = $derived.by(() => {
		const total = featuredProducts.length;
		return featuredProducts.map((item, index) => ({
			item,
			position:
				index === activeFeaturedIndex
					? 'center'
					: index === (activeFeaturedIndex + 1) % total
						? 'right'
						: 'left'
		}));
	});

	let filteredProducts = $derived(
		currentTab === 'all'
			? data.products
			: data.products.filter((p: Product) => p.category === currentTab)
	);

	function showPreviousFeatured() {
		activeFeaturedIndex = (activeFeaturedIndex - 1 + featuredProducts.length) % featuredProducts.length;
	}

	function showNextFeatured() {
		activeFeaturedIndex = (activeFeaturedIndex + 1) % featuredProducts.length;
	}

	function handleCarouselPointerDown(event: PointerEvent) {
		pointerStartX = event.clientX;
	}

	function handleCarouselPointerUp(event: PointerEvent) {
		if (pointerStartX === null) return;

		const distance = event.clientX - pointerStartX;
		if (Math.abs(distance) > 40) {
			if (distance < 0) showNextFeatured();
			else showPreviousFeatured();
		}

		pointerStartX = null;
	}

	onMount(() => {
		mounted = true;
		if (!featuredProducts.length) return;
		const interval = setInterval(() => {
			activeFeaturedIndex = (activeFeaturedIndex + 1) % featuredProducts.length;
		}, 2600);

		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>QCU Coop Store</title>
	<meta name="description" content="Shop QCU uniforms, school supplies, and cooperative merchandise." />
</svelte:head>

<section class="hero-section relative isolate flex flex-1 flex-col overflow-hidden px-0 py-12 font-sans text-[#0C2340] dark:text-slate-100 md:py-14">
	{#key mounted}
	<div class="hero-inner relative z-10 my-auto mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-6 sm:px-10 lg:grid-cols-12">
		
		<div class="space-y-6 lg:col-span-4">
			<div in:fade={{ duration: 450, delay: 0 }}>
				<span in:fly={{ y: 14, duration: 550, delay: 0, easing: cubicOut }} class="hero-eyebrow inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-3 py-1.5 text-xs font-semibold tracking-widest text-amber-900 uppercase dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300">
					Member Shop • A.Y. 2026–2027
				</span>
			</div>
			<div in:fade={{ duration: 500, delay: 90 }}>
				<h1 in:fly={{ y: 18, duration: 600, delay: 90, easing: cubicOut }} class="max-w-2xl text-4xl leading-tight font-black tracking-tight text-[#0C2340] md:text-5xl dark:text-white xl:text-6xl">
					Everything for the semester, plus
					<span class="hero-gradient-text bg-gradient-to-r from-blue-800 via-blue-600 to-sky-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-sky-300 dark:to-amber-300">your share back.</span>
				</h1>
			</div>
			<div in:fade={{ duration: 500, delay: 180 }}>
				<p in:fly={{ y: 14, duration: 550, delay: 180, easing: cubicOut }} class="max-w-lg text-sm leading-relaxed text-[#3B5578] dark:text-slate-400 md:text-base">
					Lanyards, uniforms, and school supplies at member pricing. Every peso you spend here counts toward your patronage refund.
				</p>
			</div>
			<div in:fade={{ duration: 500, delay: 260 }}>
				<div in:fly={{ y: 14, duration: 550, delay: 260, easing: cubicOut }} class="flex flex-wrap gap-4 pt-2">
					<a href={page.data.user ? '/shop' : '/login'} class="button-primary inline-flex items-center px-6 py-3 text-sm">
						{page.data.user ? 'Shop now' : 'Login'}
					</a>
					{#if page.data.user}
						<a href="/account" class="button-secondary profile-cta inline-flex items-center px-6 py-3 text-sm">My profile</a>
					{:else}
						<a href="/shop" class="button-secondary inline-flex items-center px-6 py-3 text-sm">Visit Shop</a>
					{/if}
				</div>
			</div>
		</div>

		<div in:fade={{ duration: 650, delay: 200 }} class="featured-carousel-shell mt-2 flex w-full flex-col items-center justify-center px-6 py-10 select-none lg:col-span-8 lg:mt-0">
			<div
				in:fly={{ y: 18, duration: 700, delay: 200, easing: cubicOut }}
				role="group"
				aria-label="Featured products carousel"
				class="featured-carousel relative w-full max-w-[620px] min-w-0"
				onpointerdown={handleCarouselPointerDown}
				onpointerup={handleCarouselPointerUp}
				onpointercancel={() => pointerStartX = null}
			>
				{#each visibleFeaturedCards as { position, item } (item.id)}
					<div
						class="featured-card {position === 'center' ? 'featured-center border border-sky-200/90 bg-white text-[#0C2340] opacity-100 shadow-[0_24px_48px_-12px_rgba(14,116,214,0.22)] dark:border-sky-400/20 dark:bg-[#162038] dark:text-slate-100 dark:shadow-[0_24px_48px_-12px_rgba(2,6,23,0.75)]' : position === 'left' ? 'featured-left border border-sky-200/70 bg-[#DCE9F8] text-[#0C2340] opacity-45 scale-90 dark:border-sky-400/15 dark:bg-[#11192E] dark:text-slate-100' : 'featured-right border border-sky-200/70 bg-[#DCE9F8] text-[#0C2340] opacity-45 scale-90 dark:border-sky-400/15 dark:bg-[#11192E] dark:text-slate-100'} group z-10 flex flex-col rounded-2xl p-4"
					>
						<div class="featured-card-header mb-3 flex items-center justify-between gap-3">
							<span class="featured-badge rounded-full bg-blue-600 px-2.5 py-1 text-[9px] font-black tracking-wider text-white uppercase shadow-sm">
								Featured Item
							</span>
							<span class="featured-sku font-mono text-[10px] text-[#3B5578] dark:text-slate-400">{item.sku}</span>
						</div>
						<div class="featured-image-container mb-4 flex h-44 w-full items-center justify-center rounded-xl bg-sky-100/70 p-4 dark:bg-slate-800/70">
							<div class="featured-image-wrap transition-transform duration-300 ease-out group-hover:scale-105">
								{#if item.image && !unavailableFeaturedImages[item.id]}
									<img
										src={item.image}
										alt={item.name}
										onerror={() => (unavailableFeaturedImages[item.id] = true)}
										class="featured-image object-contain drop-shadow-sm"
									/>
								{:else}
									<div class="featured-image-fallback" role="img" aria-label={`Image unavailable for ${item.name}`}>
										<svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
											<rect x="6.75" y="8.75" width="34.5" height="30.5" rx="6.25" />
											<circle cx="18" cy="19" r="3.25" />
											<path d="m9 33 8.5-8.5 5.25 5.25 5.75-6.5L39 34" />
										</svg>
									</div>
								{/if}
							</div>
						</div>
						<div class="featured-copy">
							{#if item.stock !== undefined && item.stock <= 0}
								<span class="availability-badge availability-out">Out of stock</span>
							{:else if item.lowStock}
								<span class="availability-badge availability-low">Low stock · {item.stock} left</span>
							{/if}
							<h3 class="featured-name line-clamp-1 leading-snug font-black text-[#0C2340] transition-colors duration-300 group-hover:text-blue-700 dark:text-white">
								{getFeaturedProductName(item.name)}
							</h3>
							<p class="featured-desc mt-1 text-xs font-medium text-[#3B5578] dark:text-slate-400">{item.description?.trim() || 'Shop this product at QCU Coop.'}</p>
							<div class="featured-meta mt-4 mb-2 flex justify-between items-baseline">
								<span class="featured-price text-xl font-black text-[#0C2340] dark:text-sky-300">{item.price !== undefined ? `₱${item.price.toFixed(2)}` : 'Price to be set'}</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
			<div class="featured-controls mt-4">
				{#if page.data.user}
					<a href="/shop" class="block rounded-full bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-lg transition hover:bg-blue-500">
						See all
					</a>
				{/if}
			</div>
		</div>

	</div>
	{/key}
</section>

<footer class="landing-footer font-sans">
	<div class="w-full max-w-7xl mx-auto px-6 py-8 text-[#3B5578] dark:text-slate-400 sm:px-10">
		<div class="flex flex-col md:flex-row justify-between gap-8 pb-6 text-xs text-[#3B5578] dark:text-slate-400">
			<div class="space-y-2 max-w-sm">
				<h3 class="footer-title font-black tracking-wider text-[#0C2340] dark:text-white">QCU COOP STORE</h3>
				<p class="footer-copy leading-relaxed text-[#3B5578] dark:text-slate-400">Run by and for QCU members. Pickup at the Coop Office, Bautista Building Basement Lvl., Weekdays/Saturdays 8am–5pm.</p>
			</div>
			<div class="md:text-right space-y-1 max-w-md font-medium leading-relaxed">
				<p class="footer-copy text-[#3B5578] dark:text-slate-400">Dividends and patronage refunds are declared subject to performance and policy. Member pricing applies at checkout.</p>
				<p class="footer-meta pt-4 font-mono text-[10px] text-[#3B5578] dark:text-slate-400">QCU-COOP • Reg. No. 2022-8014 • Rendered 2026</p>
			</div>
		</div>
	</div>
</footer>

<style>
	.hero-section {
		background-color: transparent;
		background-image: radial-gradient(circle at 72% 48%, rgba(56, 189, 248, 0.28), transparent 65%), radial-gradient(circle at 12% 18%, rgba(245, 158, 11, 0.08), transparent 36%);
	}

	.hero-section::before {
		position: absolute;
		z-index: 0;
		inset: 0;
		background-image: radial-gradient(#0c2340 1px, transparent 1px);
		background-size: 24px 24px;
		opacity: 0.06;
		pointer-events: none;
		content: '';
		mask-image: radial-gradient(ellipse at center, black 40%, transparent 80%);
		-webkit-mask-image: radial-gradient(ellipse at center, black 40%, transparent 80%);
	}

	.landing-footer { background-color: transparent; }

	.featured-carousel {
		position: relative;
		height: clamp(400px, 34vw, 440px);
		perspective: 2200px;
		transform-style: preserve-3d;
		cursor: grab;
		touch-action: pan-y;
		user-select: none;
	}

	.featured-carousel:active {
		cursor: grabbing;
	}

	.featured-card {
		position: absolute;
		left: 50%;
		top: 0;
		width: min(100%, clamp(260px, 28vw, 360px));
		height: 100%;
		padding: 1rem;
		transform-style: preserve-3d;
		backface-visibility: hidden;
		transition:
			transform 900ms cubic-bezier(0.22, 1, 0.36, 1),
			scale 900ms cubic-bezier(0.22, 1, 0.36, 1),
			opacity 900ms ease,
			filter 900ms ease,
			box-shadow 900ms ease;
		-webkit-transition:
			transform 900ms cubic-bezier(0.22, 1, 0.36, 1),
			scale 900ms cubic-bezier(0.22, 1, 0.36, 1),
			opacity 900ms ease,
			filter 900ms ease,
			box-shadow 900ms ease;
		will-change: transform, opacity, filter;
		transform: translate3d(0, 0, 0) rotateY(0deg);
		filter: saturate(1);
	}

	.featured-image-container {
		box-sizing: border-box;
	}

	.featured-badge {
		font-size: clamp(0.5rem, 0.9vw, 0.7rem);
	}

	.featured-card-header {
		flex: 0 0 auto;
	}

	.featured-image-wrap {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	.featured-image {
		width: 100%;
		height: 100%;
	}

	.featured-image-fallback {
		display: grid;
		width: 7rem;
		height: 7rem;
		place-items: center;
		border: 1px solid rgba(14, 116, 214, 0.16);
		border-radius: 1.5rem;
		background: rgba(255, 255, 255, 0.55);
		color: #2563eb;
	}

	.featured-image-fallback svg {
		width: 2.75rem;
		height: 2.75rem;
		stroke: currentColor;
		stroke-width: 1.75;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.featured-copy {
		flex: 0 0 auto;
	}

	.availability-badge {
		display: inline-flex;
		align-items: center;
		width: fit-content;
		margin-bottom: 0.4rem;
		gap: 0.35rem;
		font-size: 0.58rem;
		font-weight: 850;
		line-height: 1.2;
		letter-spacing: 0.035em;
		text-transform: uppercase;
	}

	.availability-badge::before {
		width: 0.4rem;
		height: 0.4rem;
		border-radius: 50%;
		content: '';
	}

	.featured-left .availability-badge,
	.featured-right .availability-badge {
		display: none;
	}

	.availability-low {
		color: #ffe0a3;
	}

	.availability-low::before {
		background: #fbbf24;
	}

	.availability-out {
		color: #fecaca;
	}

	.availability-out::before {
		background: #f87171;
	}

	.featured-name {
		font-size: clamp(0.8rem, 1.1vw, 1.1rem);
	}

	.featured-desc {
		font-size: clamp(0.62rem, 0.85vw, 0.75rem);
	}

	.featured-meta {
		gap: 0.5rem;
	}

	.featured-price {
		font-size: clamp(0.9rem, 1.2vw, 1.25rem);
	}

	.featured-sku {
		font-size: clamp(0.55rem, 0.8vw, 0.7rem);
	}

	.featured-left {
		transform: translate3d(calc(-100% - 6rem), 0, -110px) rotateY(16deg);
		z-index: 10;
	}

	.featured-center {
		transform: translate3d(-50%, 0, 90px) rotateY(0deg);
		filter: saturate(1) brightness(1);
		z-index: 20;
	}

	.featured-right {
		transform: translate3d(6rem, 0, -110px) rotateY(-16deg);
		z-index: 10;
	}

	.featured-controls {
		position: relative;
		z-index: 10;
		white-space: nowrap;
	}

	@media (min-width: 1024px) and (max-height: 800px) {
		.hero-inner {
			gap: 2rem;
		}

		.hero-section h1 {
			font-size: clamp(2.5rem, 5vh, 3.25rem);
			line-height: 1.1;
		}

		.featured-carousel {
			height: clamp(340px, 42vh, 380px);
		}

		.featured-card {
			padding: 0.75rem;
		}

		.featured-carousel-shell {
			padding-top: 2rem;
			padding-bottom: 2rem;
		}

		.featured-card-header {
			margin-bottom: 0.5rem;
		}

		.featured-image-container {
			margin-bottom: 0.75rem;
		}

		.featured-meta {
			margin-top: 0.5rem;
			margin-bottom: 0;
		}
	}

	@media (max-width: 1024px) {
		.featured-carousel {
			height: 360px;
		}

		.featured-card {
			width: min(100%, clamp(220px, 30vw, 320px));
		}
	}

	@media (max-width: 768px) {
		.featured-carousel {
			height: 340px;
		}

		.featured-card {
			width: min(100%, 280px);
		}

		.featured-left,
		.featured-right {
			opacity: 0;
			pointer-events: none;
		}
	}
</style>
