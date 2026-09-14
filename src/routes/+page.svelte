<script lang="ts">
	import { onMount } from 'svelte';
	import { productCatalog } from '$lib/products';

	let currentTab = $state('all');
	let cartCount = $state(0);
	let activeFeaturedIndex = $state(0);
	let pointerStartX = $state<number | null>(null);

	const categoryMeta = {
		all: { title: 'All Items', desc: 'Browse our complete catalog of official university gear and essentials.' },
		lanyards: { title: 'Lanyards', desc: 'ID essentials in campus colors. Woven and breakaway styles, member-priced.' },
		uniforms: { title: 'Uniforms', desc: 'PE sets, department polos, and lab gowns in standard campus sizing.' },
		supplies: { title: 'School supplies', desc: 'Notebooks, exam materials, and drafting kits — the everyday restock list.' }
	};

	const featuredProductIds = ['sup-1', 'unf-1', 'mer-1'];
	const featuredProducts = productCatalog.filter(p => featuredProductIds.includes(p.id));

	let visibleFeaturedCards = $derived.by(() => {
		const total = featuredProducts.length;
		return [
			{ position: 'left', item: featuredProducts[(activeFeaturedIndex - 1 + total) % total] },
			{ position: 'center', item: featuredProducts[activeFeaturedIndex] },
			{ position: 'right', item: featuredProducts[(activeFeaturedIndex + 1) % total] }
		];
	});

	let filteredProducts = $derived(
		currentTab === 'all' 
			? productCatalog 
			: productCatalog.filter(p => p.category === currentTab)
	);

	function addToCart() {
		cartCount += 1;
	}

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
		const interval = setInterval(() => {
			activeFeaturedIndex = (activeFeaturedIndex + 1) % featuredProducts.length;
		}, 2600);

		return () => clearInterval(interval);
	});
</script>

<section class="hero-section bg-blue-900 text-white pt-12 pb-24 md:pt-16 md:pb-20 px-4 font-sans relative overflow-hidden">
	<div class="hero-inner max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
		
		<div class="lg:col-span-3 space-y-6">
			<span class="text-xs font-bold tracking-widest text-blue-300 uppercase">Member Shop • A.Y. 2026–2027</span>
			<h1 class="text-3xl md:text-5xl font-black tracking-tight leading-tight max-w-xl">
				Everything for the semester, plus your share back.
			</h1>
			<p class="text-blue-100 text-sm md:text-base max-w-lg leading-relaxed">
				Lanyards, uniforms, and school supplies at member pricing. Every peso you spend here counts toward your patronage refund.
			</p>
			<div class="flex flex-wrap gap-4 pt-2">
				<button class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg text-sm transition">
					Login
				</button>
				<button class="text-white hover:text-blue-200 font-semibold px-4 py-3 text-sm transition underline underline-offset-4">
					What to put?
				</button>
			</div>
		</div>

		<div class="lg:col-span-2 w-full mt-2 lg:mt-0 relative select-none flex items-start justify-center">
			<div
				role="group"
				aria-label="Featured products carousel"
				class="featured-carousel relative w-full max-w-[460px] min-w-0"
				onpointerdown={handleCarouselPointerDown}
				onpointerup={handleCarouselPointerUp}
				onpointercancel={() => pointerStartX = null}
			>
				{#each visibleFeaturedCards as { position, item }}
					<div class="featured-card {position === 'center' ? 'featured-center' : position === 'left' ? 'featured-left' : 'featured-right'} group rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-blue-950/40 text-[#0a2d5d]">
						<div class="featured-art flex items-center justify-center relative overflow-hidden rounded-2xl">
							<span class="featured-badge absolute top-4 left-4 bg-blue-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider z-10 shadow-sm">
								Featured Item
							</span>
							<div class="featured-image-wrap transition-transform duration-300 ease-out group-hover:scale-110 text-blue-900">
								{#if item.category === 'merchandise'}
									<img src="/images/test1.png" alt={item.name} class="featured-image h-28 w-auto object-contain drop-shadow-sm" />
								{:else if item.category === 'uniforms'}
									<svg class="w-14 h-14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" d="M16 4h4v16h-4V4zm-10 0h4v16H6V4z" />
									</svg>
								{:else}
									<svg class="w-14 h-14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" d="M12 2L9 9h6l-3-7zm0 7v8m-3 3h6" />
									</svg>
								{/if}
							</div>
						</div>

						<div class="featured-copy p-5 bg-transparent text-[#0a2d5d]">
							<h3 class="featured-name font-black text-[#0a2d5d] leading-snug line-clamp-1 transition-colors duration-300 group-hover:text-blue-700">
								{item.name}
							</h3>
							<p class="featured-desc text-xs text-[#0a2d5d]/75 font-medium mt-1">Official merchandise line built for QCU students.</p>
							<div class="featured-meta flex justify-between items-baseline mt-4 mb-2">
								<span class="featured-price text-xl font-black text-[#0a2d5d]">{item.price !== undefined ? `₱${item.price.toFixed(2)}` : 'Price to be set'}</span>
								<span class="featured-sku text-[10px] font-mono text-[#0a2d5d]/70">{item.sku}</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
			<div class="featured-controls absolute left-1/2 top-full z-10 mt-5 -translate-x-1/2">
				<a href="/shop" class="block rounded-full bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-lg transition hover:bg-blue-700">
					See all
				</a>
			</div>
		</div>

	</div>
</section>

<footer class="bg-zinc-100 border-t border-zinc-200 font-sans">
	<div class="max-w-6xl mx-auto px-4 py-8">
		<div class="flex flex-col md:flex-row justify-between gap-8 text-xs text-zinc-500 pb-6">
			<div class="space-y-2 max-w-sm">
				<h3 class="font-black text-zinc-900 tracking-wider">QCU COOP SHOP</h3>
				<p class="leading-relaxed">Run by and for QCU members. Pickup at the Coop Office, Rm. 3B, weekdays 8am–5pm.</p>
			</div>
			<div class="md:text-right space-y-1 max-w-md font-medium leading-relaxed">
				<p>Dividends and patronage refunds are declared subject to performance and policy. Member pricing applies at checkout.</p>
				<p class="text-[10px] text-zinc-400 font-mono pt-4">QCU-COOP • Reg. No. 2022-8014 • Rendered 2026</p>
			</div>
		</div>
	</div>
</footer>

<style>
	.hero-section {
		animation: heroFadeIn 900ms ease-out both;
	}

	.hero-inner {
		animation: heroSlideIn 900ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
	}

	.featured-carousel {
		position: relative;
		width: min(100%, 100%);
		height: clamp(220px, 32vw, 360px);
		margin-left: 0;
		perspective: 2200px;
		transform-style: preserve-3d;
		animation: cardStackFadeIn 1.2s ease-out both;
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
		width: min(100%, clamp(160px, 38vw, 260px));
		height: 100%;
		background: rgba(255, 255, 255, 0.92);
		border: 1px solid rgba(255, 255, 255, 0.7);
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
		box-shadow: 0 18px 40px rgba(7, 18, 46, 0.18);
		transform-style: preserve-3d;
		backface-visibility: hidden;
		transition:
			transform 900ms cubic-bezier(0.22, 1, 0.36, 1),
			opacity 900ms ease,
			filter 900ms ease,
			box-shadow 900ms ease;
		-webkit-transition:
			transform 900ms cubic-bezier(0.22, 1, 0.36, 1),
			opacity 900ms ease,
			filter 900ms ease,
			box-shadow 900ms ease;
		will-change: transform, opacity, filter;
		transform: translate3d(0, 0, 0) rotateY(0deg) scale(1);
		opacity: 1;
		filter: saturate(1);
	}

	.featured-art {
		flex: 1 1 auto;
		min-height: clamp(120px, 18vw, 200px);
		padding: clamp(0.9rem, 1.7vw, 1.5rem);
	}

	.featured-badge {
		font-size: clamp(0.5rem, 0.9vw, 0.7rem);
	}

	.featured-image-wrap {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	.featured-image {
		height: clamp(72px, 7vw, 112px);
		width: auto;
	}

	.featured-copy {
		flex: 0 0 auto;
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
		font-size: clamp(1rem, 1.7vw, 1.7rem);
	}

	.featured-sku {
		font-size: clamp(0.55rem, 0.8vw, 0.7rem);
	}

	.featured-left {
		transform: translate3d(-120%, 0, -110px) rotateY(22deg) scale(0.82);
		opacity: 0.42;
		filter: saturate(0.4) brightness(1.08);
		z-index: 1;
	}

	.featured-center {
		transform: translate3d(-50%, 0, 90px) rotateY(0deg) scale(1.03);
		opacity: 1;
		filter: saturate(1) brightness(1);
		z-index: 3;
	}

	.featured-right {
		transform: translate3d(20%, 0, -110px) rotateY(-22deg) scale(0.82);
		opacity: 0.42;
		filter: saturate(0.4) brightness(1.08);
		z-index: 2;
	}

	.featured-controls {
		white-space: nowrap;
	}

	@keyframes heroFadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes heroSlideIn {
		from {
			opacity: 0;
			transform: translateY(18px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes cardStackFadeIn {
		from {
			opacity: 0;
			transform: translateY(12px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@media (max-width: 1024px) {
		.featured-carousel {
			height: 280px;
		}

		.featured-card {
			width: min(100%, clamp(150px, 28vw, 220px));
		}
	}

	@media (max-width: 768px) {
		.featured-carousel {
			height: 260px;
		}

		.featured-card {
			width: min(100%, clamp(135px, 32vw, 190px));
		}

		.featured-controls {
			margin-top: 1rem;
			transform: translateX(-50%) scale(0.9);
			transform-origin: top center;
		}
	}
</style>
