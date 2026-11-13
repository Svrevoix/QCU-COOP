<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { productCatalog, type Product, type ProductCategory } from '$lib/products';

	const categories: {
		id: ProductCategory;
		label: string;
		icon: string;
	}[] = [
		{ id: 'supplies', label: 'School & Office', icon: 'book' },
		{ id: 'uniforms', label: 'Uniforms', icon: 'shirt' },
		{ id: 'merchandise', label: 'QCU Merchandise', icon: 'bag' },
		{ id: 'food', label: 'Food & Snacks', icon: 'food' },
		{ id: 'care', label: 'Personal Care', icon: 'care' },
		{ id: 'bags', label: 'Bags & Accessories', icon: 'accessory' },
		{ id: 'textbooks', label: 'Textbooks', icon: 'textbook' },
		{ id: 'operations', label: 'Co-op Services', icon: 'services' }
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
	const categoryLabel = (category: ProductCategory) =>
		categories.find((item) => item.id === category)?.label ?? 'QCU Coop';
	const activeCategory = $derived(
		categories.some((category) => category.id === page.url.searchParams.get('category'))
			? (page.url.searchParams.get('category') ?? 'all')
			: 'all'
	);
	const selectedCategory = $derived(
		categories.find((category) => category.id === activeCategory) ?? null
	);
	let featuredTrack = $state<HTMLDivElement>();
	let randomizedProducts = $state<Product[]>(productCatalog.slice());
	let discoveredProducts = $derived(
		activeCategory === 'all'
			? randomizedProducts
			: randomizedProducts.filter((product) => product.category === activeCategory)
	);
	let visibleProducts = $derived(discoveredProducts.slice(0, 10));
	let featuredProducts = $derived(
		categories
			.map((category) => productCatalog.find((product) => product.category === category.id))
			.filter((product): product is Product => Boolean(product))
	);

	const productPrice = (product: Product) => product.price ?? product.variants?.[0]?.price;
	const formatPrice = (product: Product) => {
		const price = productPrice(product);
		return price === undefined ? 'Price to be set' : `₱${price.toFixed(2)}`;
	};
	const productHref = (product: Product) =>
		`/products?category=${product.category}&query=${encodeURIComponent(product.name)}`;

	function moveFeatured(direction: number) {
		const track = featuredTrack;
		if (!track) return;
		track.scrollBy({ left: direction * track.clientWidth * 0.78, behavior: 'smooth' });
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
		randomizedProducts = shuffleProducts(productCatalog);
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
			return;
		}
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) continue;
					entry.target.classList.add('is-revealed');
					observer.unobserve(entry.target);
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
		const slideFeatured = () => {
			const track = featuredTrack;
			if (
				track &&
				!reducedMotion &&
				!track.matches(':hover, :focus-within') &&
				document.visibilityState === 'visible'
			) {
				const loopStart = track.children[featuredProducts.length] as HTMLElement | undefined;
				const loopWidth = loopStart
					? loopStart.getBoundingClientRect().left -
						track.getBoundingClientRect().left +
						track.scrollLeft
					: 0;
				if (loopWidth > 0) {
					track.scrollLeft += 0.45;
					if (track.scrollLeft >= loopWidth) track.scrollLeft -= loopWidth;
				}
			}
			animationFrame = window.requestAnimationFrame(slideFeatured);
		};
		animationFrame = window.requestAnimationFrame(slideFeatured);
		return () => {
			observer.disconnect();
			window.removeEventListener('pageshow', replayReveals);
			window.cancelAnimationFrame(animationFrame);
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

<main class="shop-page mx-auto max-w-5xl px-6 pt-6 pb-20 sm:px-8 lg:px-10">
	<header class="shop-heading shop-reveal">
		{#if selectedCategory}
			<a href="/shop" class="shop-breadcrumb">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
				Back to shop
			</a>
		{/if}
		<p class="shop-eyebrow">{selectedCategory ? 'Browse category' : 'QCU COOP STORE'}</p>
		<h1>{selectedCategory ? selectedCategory.label : 'Shop at QCU COOP'}</h1>
		<p class="shop-subtitle">
			{selectedCategory
				? categoryDescriptions[selectedCategory.id]
				: 'Select your items and create an order request to present at the counter.'}
		</p>
	</header>

	{#if !selectedCategory}
		<section class="shop-section shop-reveal" aria-labelledby="featured-title">
			<div class="section-heading">
				<div>
					<p class="shop-eyebrow">Handpicked for campus</p>
					<h2 id="featured-title">Featured items</h2>
				</div>
				<span class="section-count">{featuredProducts.length} picks</span>
			</div>
			<div class="featured-mask">
				<div class="featured-track" bind:this={featuredTrack} aria-label="Featured products">
					{#each [...featuredProducts, ...featuredProducts] as product, index (`${product.id}-${index}`)}
						<a
							class="featured-card"
							href={productHref(product)}
							aria-hidden={index >= featuredProducts.length}
							tabindex={index >= featuredProducts.length ? -1 : undefined}
						>
							<div class="featured-topline">
								<span class="featured-badge">Featured item</span>
								<span class="featured-category">{categoryLabel(product.category)}</span>
							</div>
							<div class="featured-image" class:missing-image={!product.image}>
								{#if product.image}
									<img src={product.image} alt={product.name} onerror={handleProductImageError} />
									<span class="no-image-label">No image available</span>
								{:else}
									<span class="no-image-label">No image available</span>
								{/if}
							</div>
							<div class="featured-info">
								<h3>{product.name}</h3>
								<p>{categoryDescriptions[product.category]}</p>
								<strong>{formatPrice(product)}</strong>
							</div>
						</a>
					{/each}
				</div>
			</div>
			<div class="carousel-controls" aria-label="Featured item navigation">
				<button type="button" aria-label="Previous featured items" onclick={() => moveFeatured(-1)}>
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
				</button>
				<button type="button" aria-label="Next featured items" onclick={() => moveFeatured(1)}>
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
				</button>
			</div>
		</section>

		<section class="shop-section shop-reveal" aria-labelledby="categories-title">
			<div class="section-heading">
				<div>
					<p class="shop-eyebrow">Find what you need</p>
					<h2 id="categories-title">Shop by category</h2>
				</div>
				<a class="text-link" href="/products">View all products</a>
			</div>
			<nav class="category-row" aria-label="Shop product categories">
				{#each categories as category}
					<a class="category-link" href={`/shop?category=${category.id}`}>
						<span class="category-icon" aria-hidden="true">
							{#if category.icon === 'book'}
								<svg viewBox="0 0 24 24"
									><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z" /><path
										d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h8m-8 4h6"
									/></svg
								>
							{:else if category.icon === 'shirt'}
								<svg viewBox="0 0 24 24"
									><path d="m8 4 4 2 4-2 5 3-2 4-3-1v11H8V10l-3 1-2-4z" /><path
										d="M9 5a3 3 0 0 0 6 0"
									/></svg
								>
							{:else if category.icon === 'bag'}
								<svg viewBox="0 0 24 24"
									><path d="M5 8h14l1 13H4z" /><path d="M9 8V6a3 3 0 0 1 6 0v2m-5 5h4" /></svg
								>
							{:else if category.icon === 'food'}
								<svg viewBox="0 0 24 24"
									><path d="M4 11h16l-2 9H6zM3 11l2-4h14l2 4M8 4l2 3m6-3-2 3" /><path
										d="M9 15h.01M15 15h.01"
									/></svg
								>
							{:else if category.icon === 'care'}
								<svg viewBox="0 0 24 24"
									><path d="M9 3h6v4H9zM7 7h10v14H7z" /><path d="M12 10v8m-4-4h8" /></svg
								>
							{:else if category.icon === 'accessory'}
								<svg viewBox="0 0 24 24"
									><path d="M4 8h16l1 12H3zM8 8V6a4 4 0 0 1 8 0v2" /><path d="M8 13h8" /></svg
								>
							{:else if category.icon === 'textbook'}
								<svg viewBox="0 0 24 24"
									><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 1 4 17.5z" /><path
										d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 6h8m-8 4h7"
									/></svg
								>
							{:else}
								<svg viewBox="0 0 24 24"
									><circle cx="12" cy="12" r="9" /><path d="M8 10h8m-8 4h8m-5-7 2 10" /></svg
								>
							{/if}
						</span>
						<span class="category-label">{category.label}</span>
					</a>
				{/each}
			</nav>
		</section>
	{/if}

	<section class="shop-section shop-reveal" aria-labelledby="discover-title">
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
					<article class="shop-product-card">
						<div class="shop-product-image" class:missing-image={!product.image}>
							{#if product.image}
								<img
									src={product.image}
									alt={product.name}
									loading="lazy"
									onerror={handleProductImageError}
								/>
								<span class="no-image-label">No image available</span>
							{:else}
								<span class="no-image-label">No image available</span>
							{/if}
						</div>
						<div class="shop-product-info">
							<span class="product-category-label">{categoryLabel(product.category)}</span>
							<h3>{product.name}</h3>
							<div class="product-price-row">
								<strong>{formatPrice(product)}</strong>
								<span class="product-sku">{product.sku}</span>
							</div>
							<a class="select-product" href={productHref(product)}>Select product</a>
						</div>
					</article>
				{/each}
			</div>
			{#if visibleProducts.length < discoveredProducts.length}
				<div class="show-more-wrap">
					<a
						class="show-more"
						href={selectedCategory ? `/products?category=${selectedCategory.id}` : '/products'}
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
		--shop-muted: #657892;
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
		color: var(--shop-muted);
		font-size: 0.8rem;
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
	.shop-breadcrumb:hover,
	.text-link:hover {
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
	.text-link {
		color: #3156a6;
		font-size: 0.72rem;
		font-weight: 800;
		text-decoration: none;
	}
	.featured-mask {
		overflow: hidden;
		padding: 0.65rem 0 1.1rem;
		mask-image: linear-gradient(to right, transparent, #000 3.5%, #000 96.5%, transparent);
		-webkit-mask-image: linear-gradient(to right, transparent, #000 3.5%, #000 96.5%, transparent);
	}
	.featured-track {
		display: flex;
		gap: 1rem;
		overflow-x: auto;
		padding: 0.25rem 1.5rem 0.75rem;
		scroll-behavior: smooth;
		scroll-snap-type: x mandatory;
		scrollbar-width: none;
	}
	.featured-track::-webkit-scrollbar {
		display: none;
	}
	.featured-card {
		display: flex;
		flex: 0 0 86%;
		flex-direction: column;
		min-width: 0;
		overflow: hidden;
		border: 1px solid var(--shop-line);
		border-radius: 1.15rem;
		background: var(--shop-card);
		color: inherit;
		box-shadow: 0 8px 24px rgba(27, 47, 81, 0.07);
		scroll-snap-align: start;
		text-decoration: none;
		transition:
			transform 180ms ease,
			box-shadow 180ms ease;
	}
	.featured-card:hover {
		z-index: 1;
		transform: translateY(-2px) scale(1.035);
		box-shadow: 0 14px 30px rgba(27, 47, 81, 0.12);
	}
	.featured-topline {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 1rem 1rem 0;
	}
	.featured-badge {
		border-radius: 999px;
		background: #2563eb;
		color: #fff;
		padding: 0.32rem 0.6rem;
		font-size: 0.58rem;
		font-weight: 850;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}
	.featured-category {
		color: var(--shop-muted);
		font-size: 0.6rem;
		font-weight: 700;
		text-align: right;
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
		height: 11rem;
		margin: 0.8rem 1rem 0;
		border: 1px solid var(--shop-line);
		border-radius: 0.75rem;
	}
	.featured-image img,
	.shop-product-image img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		padding: 0.8rem;
	}
	.no-image-label {
		display: none;
		color: #8494aa;
		font-size: 0.65rem;
		font-weight: 850;
		letter-spacing: 0.1em;
		text-align: center;
		text-transform: uppercase;
	}
	.featured-image.missing-image,
	.shop-product-image.missing-image {
		background: #25458f;
	}
	.featured-image.missing-image .no-image-label,
	.shop-product-image.missing-image .no-image-label {
		display: block;
		color: #b8c8ed;
	}
	.featured-info {
		display: grid;
		gap: 0.35rem;
		padding: 0.85rem 1rem 1rem;
	}
	.featured-info h3 {
		margin: 0;
		font-size: 0.92rem;
		font-weight: 850;
	}
	.featured-info p {
		display: -webkit-box;
		overflow: hidden;
		margin: 0;
		color: var(--shop-muted);
		font-size: 0.67rem;
		line-height: 1.45;
		-webkit-box-orient: vertical;
		line-clamp: 2;
		-webkit-line-clamp: 2;
	}
	.featured-info strong {
		margin-top: 0.2rem;
		color: #2563eb;
		font-size: 1.1rem;
		font-weight: 900;
	}
	.carousel-controls {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 0.25rem;
	}
	.carousel-controls button {
		display: grid;
		width: 2.4rem;
		height: 2.4rem;
		place-items: center;
		border: 1px solid var(--shop-line);
		border-radius: 0.75rem;
		background: var(--shop-card);
		color: #3156a6;
		cursor: pointer;
		transition:
			background 160ms ease,
			color 160ms ease,
			transform 160ms ease;
	}
	.carousel-controls button:hover {
		transform: translateY(-1px);
		background: #3156a6;
		color: white;
	}
	.carousel-controls svg {
		width: 1.1rem;
		height: 1.1rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
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
		border: 1px solid var(--shop-line);
		border-radius: 1.05rem;
		background: var(--shop-card);
		color: #3156a6;
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
		border-color: #9db8f5;
		background: #eaf1ff;
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
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.8rem;
	}
	.shop-product-card {
		display: flex;
		min-width: 0;
		flex-direction: column;
		overflow: hidden;
		border: 1px solid #233f91;
		border-radius: 1rem;
		background: #233f91;
		color: #fff;
		box-shadow: 0 8px 18px rgba(21, 43, 105, 0.17);
		transition:
			transform 180ms ease,
			box-shadow 180ms ease;
	}
	.shop-product-card:hover {
		transform: translateY(-3px);
		box-shadow: 0 14px 26px rgba(21, 43, 105, 0.23);
	}
	.shop-product-image {
		height: 8.5rem;
		background: #233f91;
	}
	.shop-product-image img {
		padding: 1rem;
	}
	.shop-product-info {
		display: flex;
		flex: 1;
		flex-direction: column;
		padding: 0.85rem;
	}
	.product-category-label {
		color: #d3defe;
		font-size: 0.56rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.shop-product-info h3 {
		min-height: 2.5rem;
		margin: 0.35rem 0 0.65rem;
		color: #fff;
		font-size: 0.8rem;
		font-weight: 850;
		line-height: 1.35;
	}
	.product-price-row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.3rem;
		margin-top: auto;
	}
	.product-price-row strong {
		color: #fff;
		font-size: 0.98rem;
		font-weight: 900;
	}
	.product-sku {
		color: #d0d9f1;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 0.56rem;
	}
	.select-product {
		display: block;
		margin-top: 0.8rem;
		border-radius: 999px;
		background: #fff;
		padding: 0.55rem 0.7rem;
		color: #233f91;
		font-size: 0.68rem;
		font-weight: 850;
		text-align: center;
		text-decoration: none;
		transition:
			background 150ms ease,
			transform 150ms ease;
	}
	.select-product:hover {
		transform: translateY(-1px);
		background: #eaf1ff;
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
		border: 1px solid #3156a6;
		border-radius: 999px;
		background: transparent;
		padding: 0.65rem 1.1rem;
		color: #3156a6;
		font: inherit;
		font-size: 0.75rem;
		font-weight: 850;
		text-decoration: none;
		transition:
			background 150ms ease,
			color 150ms ease;
	}
	.show-more:hover {
		background: #3156a6;
		color: #fff;
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
	:global(html[data-theme='dark'] .shop-page .text-link),
	:global(html[data-theme='dark'] .shop-page .shop-breadcrumb) {
		color: #a9c8ff;
	}
	:global(html[data-theme='dark'] .shop-page .featured-card) {
		box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);
	}
	:global(html[data-theme='dark'] .shop-page .featured-info strong) {
		color: #8eb5ff;
	}
	:global(html[data-theme='dark'] .shop-page .carousel-controls button) {
		border-color: #415878;
		background: #172640;
		color: #b9d1ff;
	}
	:global(html[data-theme='dark'] .shop-page .carousel-controls button:hover) {
		background: #3156a6;
		color: #fff;
	}
	:global(html[data-theme='dark'] .shop-page .category-icon) {
		border-color: #334866;
		background: #172640;
		color: #a9c8ff;
	}
	:global(html[data-theme='dark'] .shop-page .category-link:hover .category-icon),
	:global(html[data-theme='dark'] .shop-page .category-link:focus-visible .category-icon) {
		border-color: #5274b7;
		background: #203a60;
		color: #d2e1ff;
	}
	:global(html[data-theme='dark'] .shop-page .shop-product-card) {
		border-color: #3b61b5;
		background: #233f91;
	}
	:global(html[data-theme='dark'] .shop-page .show-more) {
		border-color: #6f96e8;
		color: #b9d1ff;
	}
	:global(html[data-theme='dark'] .shop-page .show-more:hover) {
		background: #3156a6;
		color: #fff;
	}
	@media (min-width: 600px) {
		.featured-card {
			flex-basis: calc(50% - 0.5rem);
		}
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
		.shop-product-image {
			height: 10rem;
		}
		.shop-product-info {
			padding: 1rem;
		}
		.shop-product-info h3 {
			font-size: 0.87rem;
		}
	}
	@media (min-width: 900px) {
		.featured-card {
			flex-basis: calc(33.333% - 0.68rem);
		}
		.product-grid {
			grid-template-columns: repeat(4, minmax(0, 1fr));
			gap: 1.1rem;
		}
		.shop-product-image {
			height: 11rem;
		}
	}
	@media (min-width: 1200px) {
		.featured-card {
			flex-basis: calc(25% - 0.75rem);
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
		.shop-product-image {
			height: 7rem;
		}
		.product-sku {
			font-size: 0.5rem;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		:global(.shop-page .shop-reveal.reveal-pending) {
			opacity: 1;
			transform: none;
			transition: none;
		}
		.featured-card,
		.category-icon,
		.shop-product-card,
		.select-product {
			transition: none;
		}
	}
</style>
