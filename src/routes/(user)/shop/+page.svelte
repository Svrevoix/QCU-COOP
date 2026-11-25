<script module lang="ts">
	let shopReloadScrollResetHandled = false;
</script>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { addToCart } from '$lib/cart';
	import { onMount } from 'svelte';
	import type { Product, ProductCategory } from '$lib/products';
	let { data } = $props();
	import { productThumbnailClasses } from '$lib/productPresentation';

	const categories: {
		id: ProductCategory;
		label: string;
		icon: string;
	}[] = [
		{ id: 'supplies', label: 'School & Office', icon: 'pencil-ruler' },
		{ id: 'uniforms', label: 'Uniforms', icon: 'shirt' },
		{ id: 'merchandise', label: 'QCU Merchandise', icon: 'sparkles' },
		{ id: 'food', label: 'Food & Snacks', icon: 'cup-soda' },
		{ id: 'care', label: 'Personal Care', icon: 'heart-pulse' },
		{ id: 'bags', label: 'Bags & Accessories', icon: 'backpack' },
		{ id: 'textbooks', label: 'Textbooks', icon: 'book-open' },
		{ id: 'operations', label: 'Co-op Services', icon: 'hand-coins' }
	];
	const categoryDescriptions: Record<ProductCategory, string> = {
		supplies: 'Everyday essentials for class, projects, and your workspace.',
		uniforms: 'Official QCU and organization apparel for campus life.',
		merchandise: 'Show your QCU spirit with practical campus favorites.',
		food: 'Snacks and quick picks for a busy day on campus.',
		care: 'Personal care and health essentials for your day.',
		bags: 'Useful accessories and small everyday carry items.',
		textbooks: 'Academic references selected for QCU students.',
		operations: 'Co-op services, fees, and campus operations.'
	};
	const featuredMetadataByName: Record<string, string> = {
		'Ballpen (Black)': 'Black ink · smooth everyday writing',
		'CBAA T-Shirt (XS, S, M, L, XL, 2XL, 3XL)': 'Official CBAA uniform · sizes XS–3XL',
		'QCU Jacket': 'QCU-branded campus outerwear',
		'Coke Kasalo': 'Share-size cola for campus breaks',
		Alcohol: 'Ethyl or isopropyl options',
		'Eco Bag (Large)': 'Large reusable campus carry bag',
		'CFAS: Conceptual Framework and Accounting Standards': 'Accounting standards reference',
		'Regular Loan 1': 'Co-op loan service'
	};
	const apparelSizes = new Set(['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL']);
	const categoryLabel = (category: ProductCategory) =>
		categories.find((item) => item.id === category)?.label ?? 'QCU Coop';
	const featuredMetadata = (product: Product) =>
		featuredMetadataByName[product.name] ?? 'Campus essential';
	const cleanFeaturedTitle = (name: string) => {
		const options = name
			.match(/\(([^()]*)\)$/)?.[1]
			?.split(',')
			.map((option) => option.trim());
		return options?.length && options.every((option) => apparelSizes.has(option))
			? name.slice(0, name.lastIndexOf('(')).trim()
			: name;
	};
	const activeCategory = $derived(
		categories.some((category) => category.id === page.url.searchParams.get('category'))
			? (page.url.searchParams.get('category') ?? 'all')
			: 'all'
	);
	const selectedCategory = $derived(
		categories.find((category) => category.id === activeCategory) ?? null
	);
	let featuredTrack = $state<HTMLDivElement>();
	let featuredInteractionPaused = $state(false);
	let featuredInteractionTimer: ReturnType<typeof setTimeout> | undefined;
	let featuredAddedProductId = $state<string | null>(null);
	let featuredAddResetTimer: ReturnType<typeof setTimeout> | undefined;
	let randomizedProducts = $state<Product[]>([]);
	let discoveredProducts = $derived.by(() => {
		const categoryProducts =
			activeCategory === 'all'
				? randomizedProducts
				: randomizedProducts.filter((product) => product.category === activeCategory);
		return [
			...categoryProducts.filter((product) => Boolean(product.image)),
			...categoryProducts.filter((product) => !product.image)
		];
	});
	let visibleProducts = $derived(discoveredProducts.slice(0, 10));
	let featuredProducts = $derived.by(() => {
		const available = data.products.filter((product: Product) => product.featured);
		return (available.length ? available : data.products).slice(0, 8) as Product[];
	});

	const productPrice = (product: Product) => product.price ?? product.variants?.[0]?.price;
	const formatPrice = (product: Product) => {
		const price = productPrice(product);
		return price === undefined ? 'Price to be set' : `₱${price.toFixed(2)}`;
	};
	const productHref = (product: Product) =>
		`/products?category=${product.category}&query=${encodeURIComponent(product.name)}`;
	const productPreviewHref = (product: Product) => `${productHref(product)}&preview=1`;

	function pauseFeatured() {
		featuredInteractionPaused = true;
		if (featuredInteractionTimer) clearTimeout(featuredInteractionTimer);
	}

	function addFeaturedProduct(product: Product) {
		const price = productPrice(product);
		if (price === undefined) return;
		if (!page.data.user?.profileId) {
			void goto(`/login?next=${encodeURIComponent(productHref(product))}`);
			return;
		}

		const namedOptions = product.name.match(/\(([^)]+)\)$/)?.[1];
		const variant =
			product.name === 'Alcohol' ? 'Ethyl' : namedOptions?.split(',')[0]?.trim() || 'One size';
		const selectedVariant = product.variants?.[0];
		addToCart({
			productId: product.id,
			name: product.name,
			image: product.image,
			variant,
			sku: selectedVariant?.sku ?? product.sku,
			unitPrice: selectedVariant?.price ?? price,
			category: product.category
		});

		featuredAddedProductId = product.id;
		if (featuredAddResetTimer) clearTimeout(featuredAddResetTimer);
		featuredAddResetTimer = setTimeout(() => {
			featuredAddedProductId = null;
			featuredAddResetTimer = undefined;
		}, 1600);
	}

	function resumeFeaturedSoon() {
		if (featuredInteractionTimer) clearTimeout(featuredInteractionTimer);
		featuredInteractionTimer = setTimeout(() => {
			featuredInteractionPaused = false;
			featuredInteractionTimer = undefined;
		}, 900);
	}

	function shuffleProducts(products: Product[]) {
		const shuffled = [...products];
		for (let index = shuffled.length - 1; index > 0; index -= 1) {
			const target = Math.floor(Math.random() * (index + 1));
			[shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
		}
		return shuffled;
	}

	function handleProductImageError(event: Event) {
		const image = event.currentTarget;
		if (image instanceof HTMLImageElement) {
			image.hidden = true;
			image.parentElement?.classList.add('missing-image');
		}
	}

	onMount(() => {
		const navigationEntry = performance.getEntriesByType('navigation')[0] as
			PerformanceNavigationTiming | undefined;
		const navigationPath = navigationEntry
			? new URL(navigationEntry.name, window.location.href).pathname
			: '';
		const isReload =
			navigationEntry?.type === 'reload' &&
			navigationPath === page.url.pathname &&
			!shopReloadScrollResetHandled;
		const previousScrollRestoration = history.scrollRestoration;
		let scrollResetFrame: number | undefined;
		if (isReload) {
			shopReloadScrollResetHandled = true;
			history.scrollRestoration = 'manual';
			window.scrollTo(0, 0);
			scrollResetFrame = window.requestAnimationFrame(() => {
				window.scrollTo(0, 0);
				scrollResetFrame = undefined;
			});
		}
		const restoreScrollSettings = () => {
			if (scrollResetFrame !== undefined) window.cancelAnimationFrame(scrollResetFrame);
			if (isReload) history.scrollRestoration = previousScrollRestoration;
		};

		randomizedProducts = shuffleProducts(data.products);
		const sections = document.querySelectorAll<HTMLElement>('.shop-reveal');
		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const resetReveals = () => {
			sections.forEach((section) => {
				section.classList.remove('is-revealed');
				section.classList.add('reveal-pending');
				void section.offsetWidth;
			});
			if (reducedMotion) {
				sections.forEach((section) => section.classList.add('is-revealed'));
			}
		};
		resetReveals();
		if (!('IntersectionObserver' in window) || reducedMotion) {
			sections.forEach((section) => section.classList.add('is-revealed'));
			return restoreScrollSettings;
		}
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					entry.target.classList.toggle('is-revealed', entry.isIntersecting);
				}
			},
			{ threshold: 0.12, rootMargin: '0px 0px -36px 0px' }
		);
		const replayReveals = () => {
			resetReveals();
			observer.disconnect();
			sections.forEach((section) => observer.observe(section));
		};
		sections.forEach((section) => observer.observe(section));
		window.addEventListener('pageshow', replayReveals);
		let animationFrame = 0;
		let previousFrameTime = 0;
		const slideFeatured = (timestamp: number) => {
			const track = featuredTrack;
			const elapsed = previousFrameTime ? Math.min(timestamp - previousFrameTime, 32) : 0;
			previousFrameTime = timestamp;
			if (
				track &&
				!reducedMotion &&
				!featuredInteractionPaused &&
				!(window.matchMedia('(hover: hover)').matches && track.matches(':hover')) &&
				!track.matches(':focus-within') &&
				document.visibilityState === 'visible'
			) {
				const loopStart = track.children[featuredProducts.length] as HTMLElement | undefined;
				const loopWidth = loopStart
					? loopStart.getBoundingClientRect().left -
						track.getBoundingClientRect().left +
						track.scrollLeft
					: 0;
				if (loopWidth > 0) {
					track.scrollLeft += elapsed * 0.03;
					if (track.scrollLeft >= loopWidth) track.scrollLeft %= loopWidth;
				}
			}
			animationFrame = window.requestAnimationFrame(slideFeatured);
		};
		animationFrame = window.requestAnimationFrame(slideFeatured);
		return () => {
			observer.disconnect();
			window.removeEventListener('pageshow', replayReveals);
			window.cancelAnimationFrame(animationFrame);
			if (featuredInteractionTimer) clearTimeout(featuredInteractionTimer);
			if (featuredAddResetTimer) clearTimeout(featuredAddResetTimer);
			restoreScrollSettings();
		};
	});
</script>

<svelte:head>
	<title>{selectedCategory ? `${selectedCategory.label} | Shop` : 'Shop'} | QCU Coop Shop</title>
	<meta
		name="description"
		content="Discover featured items, browse QCU Coop categories, and find campus essentials."
	/>
</svelte:head>

<main class="shop-page mx-auto max-w-7xl pt-6 pb-20">
	<header class="shop-heading shop-reveal mx-auto w-full max-w-5xl px-6 sm:px-8 lg:px-10">
		{#if selectedCategory}
			<a href="/shop" class="shop-breadcrumb">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
				Back to shop
			</a>
		{/if}
		<p class="shop-eyebrow">{selectedCategory ? 'Browse category' : 'QCU COOP STORE'}</p>
		<h1 class="text-[#0C2340] dark:text-white">{selectedCategory ? selectedCategory.label : 'Shop at QCU COOP'}</h1>
		<p class="shop-subtitle text-[#3B5578] dark:text-slate-400">
			{selectedCategory
				? categoryDescriptions[selectedCategory.id]
				: 'Select your items and create an order request to present at the counter.'}
		</p>
	</header>

	{#if !selectedCategory}
		<section class="shop-section featured-section shop-reveal" aria-labelledby="featured-title">
			<div class="featured-content mx-auto max-w-7xl">
				<div class="section-heading px-6 sm:px-8 lg:px-10">
					<div>
						<p class="shop-eyebrow">Handpicked for campus</p>
						<h2 id="featured-title" class="text-[#0C2340] dark:text-white">Featured items</h2>
					</div>
					<span class="section-count">{featuredProducts.length} picks</span>
				</div>
				<div class="featured-mask">
					<div
						class="featured-track mx-auto max-w-7xl px-6 sm:px-8 lg:px-10"
						bind:this={featuredTrack}
						role="region"
						aria-label="Featured products"
						onpointerdown={pauseFeatured}
						onpointerup={resumeFeaturedSoon}
						onpointercancel={resumeFeaturedSoon}
					>
						{#each [...featuredProducts, ...featuredProducts] as product, index (`${product.id}-${index}`)}
							<article
								class="featured-card group w-[235px] shrink-0 sm:w-[250px]"
								aria-hidden={index >= featuredProducts.length}
							>
								<div class="featured-topline">
									<span class="featured-category">{categoryLabel(product.category)}</span>
									<span class="featured-stock"><span aria-hidden="true"></span>In stock</span>
								</div>
								<a
									class="featured-main"
									href={productHref(product)}
									tabindex={index >= featuredProducts.length ? -1 : undefined}
								>
									<div
										class="featured-image aspect-square w-full"
										class:missing-image={!product.image}
									>
										{#if product.image}
											<img
												class={productThumbnailClasses(product.name)}
												src={product.image}
												alt={product.name}
												onerror={handleProductImageError}
											/>
										{/if}
										<div class="shop-featured-image-fallback" aria-hidden="true">
											<svg viewBox="0 0 24 24" fill="none">
												<rect x="3.5" y="4.5" width="17" height="15" rx="2" />
												<circle cx="9" cy="10" r="1.5" />
												<path d="m5 17 4-4 3 3 2-2 5 4" />
											</svg>
											<span>No photo</span>
										</div>
									</div>
									<div class="featured-info">
										<h3>{cleanFeaturedTitle(product.name)}</h3>
										<p>{featuredMetadata(product)}</p>
									</div>
								</a>
								<div class="featured-footer">
									<strong>{formatPrice(product)}</strong>
									{#if productPrice(product) === undefined}
										<button type="button" class="featured-add" disabled>Check at Coop</button>
									{:else if page.data.user}
										<button
											type="button"
											class="featured-add button-primary"
											tabindex={index >= featuredProducts.length ? -1 : undefined}
											aria-live="polite"
											aria-label={featuredAddedProductId === product.id
												? `${product.name} added to cart`
												: `Add ${product.name} to cart`}
											onclick={() => addFeaturedProduct(product)}
										>
											{featuredAddedProductId === product.id ? 'Added' : '+ Add'}
										</button>
									{:else}
										<a class="button-secondary login-to-shop" href="/login?redirect=%2Fshop" tabindex={index >= featuredProducts.length ? -1 : undefined}>Login to shop</a>
									{/if}
								</div>
							</article>
						{/each}
					</div>
				</div>
			</div>
		</section>

		<section
			class="shop-section shop-reveal mx-auto w-full max-w-5xl px-6 sm:px-8 lg:px-10"
			aria-labelledby="categories-title"
		>
			<div class="section-heading">
				<div>
					<p class="shop-eyebrow">Find what you need</p>
					<h2 id="categories-title">Shop by category</h2>
				</div>
				<a class="button-secondary shop-view-all" href={page.data.user ? '/products' : '/login?redirect=%2Fshop'}>View all products</a>
			</div>
			<nav class="category-row" aria-label="Shop product categories">
				{#each categories as category}
					<a class="category-link" href={`/shop?category=${category.id}`}>
						<span class="category-icon" aria-hidden="true">
							{#if category.icon === 'pencil-ruler'}
								<svg viewBox="0 0 24 24">
									<path d="m3 21 3-3L17 7a2.1 2.1 0 0 1 3 3L9 21a2.1 2.1 0 0 1-3-3Z" />
									<path d="m14.5 6.5 3 3M3 21h5" />
								</svg>
							{:else if category.icon === 'shirt'}
								<svg viewBox="0 0 24 24">
									<path d="m8 4 4 2 4-2 5 3-2 4-3-1v11H8V10l-3 1-2-4z" />
									<path d="M9 5a3 3 0 0 0 6 0" />
								</svg>
							{:else if category.icon === 'sparkles'}
								<svg viewBox="0 0 24 24">
									<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
									<path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
								</svg>
							{:else if category.icon === 'cup-soda'}
								<svg viewBox="0 0 24 24">
									<path d="M5 8h14l-1 13H6L5 8Z" />
									<path d="M7 8V5a2 2 0 0 1 2-2m3 5V3m3 5V5a2 2 0 0 0-2-2M8 13h8" />
								</svg>
							{:else if category.icon === 'heart-pulse'}
								<svg viewBox="0 0 24 24">
									<path
										d="M20.8 8.7c0 5-8.8 11.3-8.8 11.3S3.2 13.7 3.2 8.7a4.6 4.6 0 0 1 8.8-1.6 4.6 4.6 0 0 1 8.8 1.6Z"
									/>
									<path d="M4 12h4l2-3 3 6 2-3h5" />
								</svg>
							{:else if category.icon === 'backpack'}
								<svg viewBox="0 0 24 24">
									<path d="M5 9h14v12H5z" />
									<path d="M9 9V6a3 3 0 0 1 6 0v3M5 13h14M9 13v3h6v-3" />
								</svg>
							{:else if category.icon === 'book-open'}
								<svg viewBox="0 0 24 24">
									<path
										d="M12 7v14M3 18V5a2 2 0 0 1 2-2h2a5 5 0 0 1 5 5 5 5 0 0 1 5-5h2a2 2 0 0 1 2 2v13"
									/>
									<path d="M3 18a2 2 0 0 0 2 2h2a5 5 0 0 1 5 1 5 5 0 0 1 5-1h2a2 2 0 0 0 2-2" />
								</svg>
							{:else}
								<svg viewBox="0 0 24 24">
									<circle cx="17" cy="5" r="3" />
									<path d="M17 3.5v3M15.5 5h3M3 17h8l7-4a2 2 0 0 1 2 3l-6 4H7l-4-3Z" />
									<path d="M7 17v-2a2 2 0 0 1 2-2h4" />
								</svg>
							{/if}
						</span>
						<span class="category-label">{category.label}</span>
					</a>
				{/each}
			</nav>
		</section>
	{/if}

	<section
		class="shop-section shop-reveal mx-auto w-full max-w-5xl px-6 sm:px-8 lg:px-10"
		aria-labelledby="discover-title"
	>
		<div class="section-heading">
			<div>
				<p class="shop-eyebrow">
					{selectedCategory ? 'Explore this collection' : 'A little bit of everything'}
				</p>
				<h2 id="discover-title">
					{selectedCategory ? `${selectedCategory.label} products` : 'Discover more'}
				</h2>
				<p class="section-description">
					{selectedCategory
						? `${discoveredProducts.length} products in this category`
						: 'Fresh finds from across the QCU Coop catalog.'}
				</p>
			</div>
			{#if selectedCategory}
				<a class="shop-breadcrumb category-back" href="/shop">All categories</a>
			{/if}
		</div>

		{#if visibleProducts.length}
			<div class="product-grid">
				{#each visibleProducts as product (product.id)}
					<article class="shop-product-card group">
						<div class="shop-product-image" class:missing-image={!product.image}>
							{#if product.image}
								<img
									class={productThumbnailClasses(product.name)}
									src={product.image}
									alt={product.name}
									loading="lazy"
									onerror={handleProductImageError}
								/>
							{/if}
							<div class="shop-product-image-fallback" aria-hidden="true">
								<svg viewBox="0 0 24 24">
									<path
										d="M8.5 3H19a2 2 0 0 1 2 2v11.5M3 8V5a2 2 0 0 1 2-2h1.5M21 21H5a2 2 0 0 1-2-2v-3m0-2 5-5 4 4 1-1M2 2l20 20"
									/>
								</svg>
								<span>No image available</span>
							</div>
						</div>
						<div class="shop-product-info">
							<span class="product-category-label">{categoryLabel(product.category)}</span>
							{#if product.stock !== undefined && product.stock <= 0}
								<span class="stock-badge stock-out">Out of stock</span>
							{:else if product.lowStock}
								<span class="stock-badge stock-low">Low stock · {product.stock} left</span>
							{/if}
							<h3>{product.name}</h3>
							<div class="product-price-row">
								{#if productPrice(product) === undefined}
									<span class="product-price-tba">Price TBA</span>
								{:else}
									<strong>{formatPrice(product)}</strong>
								{/if}
							</div>
							{#if productPrice(product) === undefined}
								<span class="select-product select-product-disabled" aria-disabled="true"
									>Check at Coop</span
								>
							{:else if page.data.user}
								<a class="button-primary select-product" href={productPreviewHref(product)}>Select product</a>
							{:else}
								<a class="button-secondary select-product" href="/login?redirect=%2Fshop">Login to shop</a>
							{/if}
						</div>
					</article>
				{/each}
			</div>
			{#if visibleProducts.length < discoveredProducts.length}
				<div class="show-more-wrap">
					<a
						class="button-secondary show-more"
						href={page.data.user ? (selectedCategory ? `/products?category=${selectedCategory.id}` : '/products') : '/login?redirect=%2Fshop'}
					>
						See more <span aria-hidden="true">↓</span>
					</a>
				</div>
			{/if}
		{:else}
			<div class="empty-products">No products are currently listed in this category.</div>
		{/if}
	</section>
</main>

<style>
	.shop-page {
		--shop-ink: #10233f;
		--shop-muted: #3b5578;
		--shop-line: #e2e8f0;
		--shop-card: #fff;
		--shop-surface: #f3f6fb;
		color: var(--shop-ink);
	}
	.shop-heading {
		margin: 0 0 1.5rem;
		border-top: 1px solid var(--shop-line);
		padding-top: 1rem;
	}
	.shop-heading h1 {
		margin: 0.2rem 0 0.35rem;
		font-size: clamp(1.7rem, 3vw, 2.15rem);
		font-weight: 900;
		letter-spacing: -0.035em;
	}
	.shop-eyebrow {
		margin: 0;
		color: #3974dc;
		font-size: 0.65rem;
		font-weight: 850;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}
	.shop-subtitle {
		margin: 0;
		color: #3b5578;
		font-size: 0.8rem;
	}
	:global(html[data-theme='dark'] .shop-page .shop-subtitle) {
		color: #94a3b8;
	}
	.shop-breadcrumb {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		margin-bottom: 0.9rem;
		color: var(--shop-muted);
		font-size: 0.73rem;
		font-weight: 750;
		text-decoration: none;
	}
	.shop-breadcrumb:hover {
		color: #2563eb;
	}
	.shop-breadcrumb svg {
		width: 1rem;
		height: 1rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
	}
	.shop-section {
		margin-top: 2.5rem;
	}
	.section-heading {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
	}
	.section-heading h2 {
		margin: 0.2rem 0 0;
		font-size: 1.15rem;
		font-weight: 850;
		letter-spacing: -0.02em;
	}
	.section-count,
	.section-description {
		color: var(--shop-muted);
		font-size: 0.7rem;
	}
	.section-description {
		margin: 0.25rem 0 0;
	}
	.shop-view-all {
		display: inline-flex;
		padding: 0.45rem 0.8rem;
		font-size: 0.72rem;
		text-decoration: none;
		white-space: nowrap;
	}
	.featured-mask {
		overflow: hidden;
		padding: 0.65rem 0 1.1rem;
	}
	.featured-track {
		display: flex;
		gap: 1rem;
		overflow-x: auto;
		padding-block: 0.9rem 1.3rem;
		scrollbar-width: none;
		touch-action: pan-x;
		overscroll-behavior-x: contain;
	}
	.featured-track::-webkit-scrollbar {
		display: none;
	}
	.featured-card {
		display: flex;
		flex: 0 0 auto;
		gap: 0.625rem;
		flex-direction: column;
		min-width: 0;
		border: 1px solid rgba(186, 230, 253, 0.6);
		border-radius: 1rem;
		background: #f4f9ff;
		padding: 0.875rem;
		color: inherit;
		box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
		transform-origin: center center;
		transition: all 300ms ease;
	}
	.featured-card:hover,
	.featured-card:active,
	.featured-card:focus-within {
		z-index: 3;
		border-color: rgba(59, 130, 246, 0.4);
		transform: translate3d(0, -0.25rem, 0) scale(1.025);
		box-shadow:
			0 4px 6px -1px rgba(15, 23, 42, 0.1),
			0 2px 4px -2px rgba(15, 23, 42, 0.1);
	}
	.featured-topline {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		min-width: 0;
	}
	.featured-category {
		min-width: 0;
		overflow: hidden;
		border-radius: 999px;
		border: 1px solid rgba(125, 211, 252, 0.7);
		background: #e0f2fe;
		padding: 0.125rem 0.5rem;
		color: #1d4ed8;
		font-size: 0.6875rem;
		font-weight: 500;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.featured-stock {
		display: inline-flex;
		flex: 0 0 auto;
		align-items: center;
		gap: 0.4rem;
		color: var(--shop-muted);
		font-size: 0.6875rem;
		white-space: nowrap;
	}
	.featured-stock span {
		width: 0.4rem;
		height: 0.4rem;
		border-radius: 50%;
		background: #22c55e;
		box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.12);
	}
	.featured-image,
	.shop-product-image {
		position: relative;
		display: grid;
		place-items: center;
		overflow: hidden;
		background: var(--shop-surface);
	}
	.featured-image {
		width: 100%;
		height: auto;
		flex: 0 0 auto;
		aspect-ratio: 1 / 1;
		box-sizing: border-box;
		border: 1px solid #dbeafe;
		border-radius: 0.75rem;
		background: rgba(224, 242, 254, 0.8);
		padding: 0.5rem;
	}
	.featured-main {
		display: flex;
		min-height: 0;
		flex: 1;
		flex-direction: column;
		gap: 0.625rem;
		color: inherit;
		text-decoration: none;
	}
	.featured-image img {
		display: block;
		object-fit: contain;
		object-position: center;
		filter: drop-shadow(0 1px 2px rgba(15, 23, 42, 0.15));
	}
	.shop-featured-image-fallback {
		display: none;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		color: #64748b;
		font-size: 0.6875rem;
	}
	.shop-featured-image-fallback svg {
		width: 1.75rem;
		height: 1.75rem;
		stroke: currentColor;
		stroke-width: 1.5;
	}
	.featured-image.missing-image .shop-featured-image-fallback {
		display: flex;
	}
	.featured-info {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 0.375rem;
	}
	.stock-badge {
		display: inline-flex;
		width: fit-content;
		border-radius: 999px;
		padding: 0.24rem 0.55rem;
		font-size: 0.62rem;
		font-weight: 850;
		line-height: 1.2;
	}
	.stock-low {
		background: #fff4d6;
		color: #925b00;
	}
	.stock-out {
		background: #fee2e2;
		color: #b91c1c;
	}
	.featured-info h3 {
		display: -webkit-box;
		overflow: hidden;
		min-height: 3.5rem;
		margin: 0;
		color: var(--shop-ink);
		font-size: 0.875rem;
		font-weight: 700;
		line-height: 1.25;
		-webkit-box-orient: vertical;
		line-clamp: 3;
		-webkit-line-clamp: 3;
	}
	.featured-info p {
		display: -webkit-box;
		overflow: hidden;
		margin: 0;
		color: var(--shop-muted);
		font-size: 0.75rem;
		line-height: 1rem;
		min-height: 2rem;
		-webkit-box-orient: vertical;
		line-clamp: 2;
		-webkit-line-clamp: 2;
	}
	.featured-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-top: auto;
		border-top: 1px solid rgba(186, 230, 253, 0.5);
		padding-top: 0.625rem;
	}
	.featured-footer strong {
		color: var(--shop-ink);
		font-size: 0.875rem;
		font-weight: 700;
	}
	.featured-add {
		flex: 0 0 auto;
		border: 0;
		border-radius: 0.75rem;
		background: linear-gradient(to right, #2563eb, #3b82f6, #0ea5e9);
		padding: 0.25rem 0.625rem;
		color: #fff;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		transition: filter 150ms ease, box-shadow 150ms ease;
	}
	.featured-add:hover {
		filter: brightness(1.08);
		box-shadow: 0 6px 16px rgba(14, 165, 233, 0.25);
	}
	.featured-add:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}
	.category-row {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.8rem;
	}
	.category-link {
		display: grid;
		justify-items: center;
		gap: 0.5rem;
		min-width: 0;
		color: inherit;
		text-align: center;
		text-decoration: none;
	}
	.category-icon {
		display: grid;
		width: 3.65rem;
		height: 3.65rem;
		place-items: center;
		border: 1px solid rgba(186, 230, 253, 0.7);
		border-radius: 1.05rem;
		background: #f4f9ff;
		color: #2563eb;
		box-shadow: 0 4px 12px rgba(27, 47, 81, 0.045);
		transition:
			transform 180ms ease,
			border-color 180ms ease,
			background 180ms ease,
			color 180ms ease;
	}
	.category-icon svg {
		width: 1.55rem;
		height: 1.55rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.65;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.category-link:hover .category-icon,
	.category-link:focus-visible .category-icon {
		transform: scale(1.08);
		border-color: rgba(59, 130, 246, 0.4);
		background: #e6f0fa;
		color: #1d4ed8;
	}
	.category-label {
		max-width: 7rem;
		color: var(--shop-muted);
		font-size: 0.63rem;
		font-weight: 750;
		line-height: 1.35;
	}
	.product-grid {
		display: grid;
		align-items: stretch;
		grid-auto-rows: 1fr;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.8rem;
	}
	.shop-product-card {
		display: flex;
		justify-content: space-between;
		gap: 0.875rem;
		min-width: 0;
		height: 100%;
		flex-direction: column;
		overflow: hidden;
		border: 1px solid rgba(186, 230, 253, 0.7);
		border-radius: 1rem;
		background: #f4f9ff;
		padding: 1.25rem;
		color: #0c2340;
		box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
		transition: all 300ms ease;
	}
	.shop-product-card:hover {
		transform: translateY(-0.25rem);
		border-color: rgba(59, 130, 246, 0.4);
		box-shadow:
			0 4px 6px -1px rgba(15, 23, 42, 0.1),
			0 2px 4px -2px rgba(15, 23, 42, 0.1);
	}
	.shop-product-image {
		width: 100%;
		height: auto;
		flex: 0 0 auto;
		aspect-ratio: 1 / 1;
		box-sizing: border-box;
		overflow: hidden;
		border: 1px solid rgba(186, 230, 253, 0.45);
		border-radius: 0.75rem;
		background: rgba(224, 242, 254, 0.8);
		padding: 0.5rem;
	}
	.shop-product-image img {
		display: block;
		object-fit: contain;
		object-position: center;
		filter: drop-shadow(0 1px 2px rgba(15, 23, 42, 0.15));
	}
	.shop-product-image.missing-image {
		border: 1px dashed rgba(125, 211, 252, 0.6);
		background: rgba(224, 242, 254, 0.5);
	}
	.shop-product-image-fallback {
		display: none;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		color: #94a3b8;
		font-size: 0.75rem;
	}
	.shop-product-image-fallback svg {
		width: 1.75rem;
		height: 1.75rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.5;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.shop-product-image.missing-image .shop-product-image-fallback {
		display: flex;
	}
	.shop-product-info {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 0.625rem;
	}
	.product-category-label {
		display: inline-flex;
		width: fit-content;
		align-items: center;
		border-radius: 9999px;
		background: #e0f2fe;
		padding: 0.2rem 0.55rem;
		color: #1d4ed8;
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	.shop-product-info h3 {
		display: -webkit-box;
		overflow: hidden;
		min-height: 3.75rem;
		margin: 0;
		color: #0c2340;
		font-size: 0.875rem;
		font-weight: 700;
		line-height: 1.375;
		-webkit-box-orient: vertical;
		line-clamp: 3;
		-webkit-line-clamp: 3;
	}
	.product-price-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.3rem;
		margin-top: auto;
	}
	.product-price-row strong {
		color: #0c2340;
		font-size: 0.875rem;
		font-weight: 700;
	}
	.product-price-tba {
		border: 1px solid rgba(245, 158, 11, 0.3);
		border-radius: 999px;
		background: rgba(254, 243, 199, 0.8);
		padding: 0.2rem 0.55rem;
		color: #92400e;
		font-size: 0.6875rem;
		font-weight: 700;
	}
	.select-product {
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: center;
		margin-top: 0.25rem;
		padding: 0.625rem 0.75rem;
		font-size: 0.75rem;
		text-align: center;
		text-decoration: none;
	}
	.select-product-disabled {
		background: rgba(226, 232, 240, 0.7);
		color: #94a3b8;
		cursor: not-allowed;
	}
	.show-more-wrap {
		display: grid;
		justify-items: center;
		gap: 0.5rem;
		margin-top: 1.5rem;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
	}
	.show-more {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.65rem 1.1rem;
		font: inherit;
		font-size: 0.75rem;
		font-weight: 850;
		text-decoration: none;
	}
	.empty-products {
		border: 1px dashed var(--shop-line);
		border-radius: 1rem;
		padding: 2.5rem 1rem;
		color: var(--shop-muted);
		font-size: 0.8rem;
		text-align: center;
	}
	.shop-reveal {
		opacity: 1;
		transform: none;
	}
	:global(.shop-page .shop-reveal.reveal-pending) {
		opacity: 0;
		transform: translateY(18px);
		transition:
			opacity 600ms ease,
			transform 600ms cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	:global(.shop-page .shop-reveal.reveal-pending.is-revealed) {
		opacity: 1;
		transform: translateY(0);
	}
	:global(html[data-theme='dark'] .shop-page) {
		--shop-ink: #edf4ff;
		--shop-muted: #a9bad0;
		--shop-line: #334866;
		--shop-card: #172640;
		--shop-surface: #101d35;
	}
	:global(html[data-theme='dark'] .shop-page .shop-eyebrow) {
		color: #7cb5ff;
	}
	:global(html[data-theme='dark'] .shop-page .shop-breadcrumb) {
		color: #a9c8ff;
	}
	:global(html[data-theme='dark'] .shop-page .featured-card) {
		border-color: rgba(255, 255, 255, 0.1);
		background: #162038;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}
	:global(html[data-theme='dark'] .shop-page .featured-card:hover),
	:global(html[data-theme='dark'] .shop-page .featured-card:active),
	:global(html[data-theme='dark'] .shop-page .featured-card:focus-within) {
		border-color: rgba(56, 189, 248, 0.35);
		background: #162038;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
	}
	:global(html[data-theme='dark'] .shop-page .featured-image) {
		border-color: rgba(255, 255, 255, 0.1);
		background: rgba(30, 41, 59, 0.85);
	}
	:global(html[data-theme='dark'] .shop-page .featured-info h3),
	:global(html[data-theme='dark'] .shop-page .featured-footer strong) {
		color: #fff;
	}
	:global(html[data-theme='dark'] .shop-page .featured-category) {
		border-color: rgba(59, 130, 246, 0.25);
		background: rgba(23, 37, 84, 0.7);
		color: #7dd3fc;
	}
	:global(html[data-theme='dark'] .shop-page .featured-info p) {
		color: #94a3b8;
	}
	:global(html[data-theme='dark'] .shop-page .shop-featured-image-fallback) {
		color: #64748b;
	}
	:global(html[data-theme='dark'] .shop-page .featured-footer) {
		border-color: rgba(255, 255, 255, 0.1);
	}
	:global(html[data-theme='dark'] .shop-page .category-icon) {
		border-color: rgba(255, 255, 255, 0.1);
		background: #162038;
		color: #7dd3fc;
	}
	:global(html[data-theme='dark'] .shop-page .category-link:hover .category-icon),
	:global(html[data-theme='dark'] .shop-page .category-link:focus-visible .category-icon) {
		border-color: rgba(56, 189, 248, 0.35);
		background: #1e293b;
		color: #7dd3fc;
	}
	:global(html[data-theme='dark'] .shop-page .shop-product-card) {
		border-color: rgba(255, 255, 255, 0.1);
		background: #162038;
		color: #fff;
	}
	:global(html[data-theme='dark'] .shop-page .shop-product-image) {
		border-color: rgba(255, 255, 255, 0.1);
		background: rgba(30, 41, 59, 0.85);
	}
	:global(html[data-theme='dark'] .shop-page .shop-product-image.missing-image) {
		border-color: #334155;
		background: rgba(30, 41, 59, 0.5);
	}
	:global(html[data-theme='dark'] .shop-page .shop-product-image-fallback) {
		color: #64748b;
	}
	:global(html[data-theme='dark'] .shop-page .product-category-label) {
		background: rgba(23, 37, 84, 0.7);
		color: #7dd3fc;
	}
	:global(html[data-theme='dark'] .shop-page .shop-product-info h3),
	:global(html[data-theme='dark'] .shop-page .product-price-row strong) {
		color: #fff;
	}
	:global(html[data-theme='dark'] .shop-page .product-price-tba) {
		border-color: rgba(245, 158, 11, 0.3);
		background: rgba(245, 158, 11, 0.15);
		color: #fcd34d;
	}
	:global(html[data-theme='dark'] .shop-page .select-product-disabled) {
		background: #1e293b;
		color: #94a3b8;
	}
	:global(html[data-theme='dark'] .shop-page .featured-add:not(:disabled)) {
		background: linear-gradient(to right, #2563eb, #6366f1, #0ea5e9);
	}
	@media (min-width: 600px) {
		.category-row {
			grid-template-columns: repeat(8, minmax(0, 1fr));
		}
		.category-icon {
			width: 4rem;
			height: 4rem;
		}
		.product-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 1rem;
		}
	}
	@media (min-width: 900px) {
		.product-grid {
			grid-template-columns: repeat(4, minmax(0, 1fr));
			gap: 1.1rem;
		}
	}
	@media (max-width: 420px) {
		.shop-page {
			padding-right: 0.85rem;
			padding-left: 0.85rem;
		}
		.category-row {
			gap: 0.65rem 0.35rem;
		}
		.category-icon {
			width: 3.2rem;
			height: 3.2rem;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		:global(.shop-page .shop-reveal.reveal-pending) {
			opacity: 1;
			transform: none;
			transition: none;
		}
		.featured-card,
		.featured-add,
		.category-icon,
		.shop-product-card,
		.select-product {
			transition: none;
		}
	}
</style>
