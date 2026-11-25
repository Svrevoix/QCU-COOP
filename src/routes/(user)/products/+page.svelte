<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { addToCart } from '$lib/cart';
	import { handleImageError } from '$lib/imageFallback';
	import type { Product } from '$lib/products';
	let { data } = $props();
	import { productMatchesTag, productSubcategories } from '$lib/productFilters';

	const categoryLabels: Record<string, string> = {
		all: 'All products',
		stationeries: 'School & office supplies',
		supplies: 'School & office supplies',
		uniforms: 'Uniforms',
		merchandise: 'QCU merchandise & accessories',
		lanyards: 'QCU merchandise & accessories',
		food: 'Food, snacks & dining items',
		care: 'Personal care, hygiene & medical',
		bags: 'Miscellaneous bags & accessories',
		textbooks: 'Academic textbooks',
		books: 'Academic textbooks',
		operations: 'Financial & co-op operations'
	};

	const categoryAliases: Record<string, string> = {
		stationeries: 'supplies',
		lanyards: 'merchandise',
		books: 'textbooks'
	};

	let selectedCategory = $derived(page.url.searchParams.get('category') ?? 'all');
	let searchQuery = $derived(page.url.searchParams.get('query')?.trim().toLowerCase() ?? '');
	let categoryTitle = $derived(categoryLabels[selectedCategory] ?? 'Product selection');
	let catalogCategory = $derived(categoryAliases[selectedCategory] ?? selectedCategory);
	let showFilters = $state(false);

	let activeSubcategory = $state('');
	let activeProductTag = $state('');

	let products = $derived(
		catalogCategory === 'all'
			? data.products
			: data.products.filter((item: Product) => item.category === catalogCategory)
	);
	let activeMapping = $derived(
		productSubcategories.find((mapping) => mapping.name === activeSubcategory) ??
			productSubcategories.find((mapping) => mapping.category === catalogCategory) ??
			productSubcategories[0]
	);
	let availableSubcategories = $derived(
		catalogCategory === 'all'
			? productSubcategories
			: productSubcategories.filter((mapping) => mapping.category === catalogCategory)
	);
	let visibleProducts = $derived(
		products.filter((product) => {
			const matchesTag = !activeProductTag || productMatchesTag(product.name, activeProductTag);
			const matchesSearch =
				!searchQuery || `${product.name} ${product.sku}`.toLowerCase().includes(searchQuery);
			return matchesTag && matchesSearch;
		})
	);

	let selectedProduct = $state<Product | null>(null);
	let quantity = $state(1);
	let selectedSize = $state('One size');
	let activeImageIndex = $state(0);
	let touchStartX = $state<number | null>(null);
	let showBuyNowCheckout = $state(false);
	let buyNowReference = $state('');
	let isAdding = $state(false);
	let addToCartResetTimer: ReturnType<typeof setTimeout> | undefined;
	const placeholderImage = 'images/attires/placeholder-shirt.png';

	function portal(node: HTMLElement) {
		document.body.appendChild(node);

		return {
			destroy() {
				node.remove();
			}
		};
	}

	function getProductSizes(name: string) {
		const sizes =
			name
				.match(/\(([^)]+)\)$/)?.[1]
				?.split(',')
				.map((size) => size.trim()) ?? [];
		const sizeLabels: Record<string, string> = {
			XS: 'XS',
			S: 'SMALL',
			M: 'MEDIUM',
			L: 'LARGE',
			XL: 'XL',
			'2XL': '2XL',
			'3XL': '3XL',
			'4XL': '4XL',
			'5XL': '5XL'
		};

		return sizes.map((size) => sizeLabels[size] ?? size);
	}

	let availableSizes = $derived(
		selectedProduct
			? selectedProduct.size && selectedProduct.size !== 'One size'
				? [selectedProduct.size]
				: getProductSizes(selectedProduct.name)
			: []
	);
	let selectedImages = $derived(
		selectedProduct?.images?.length
			? selectedProduct.images
			: selectedProduct?.image
				? [selectedProduct.image]
				: [placeholderImage]
	);
	const imageVariantLabelsByProduct: Record<string, string[]> = {
		'Ballpen (Sign Pen)': ['Blue', 'Red'],
		'Filler Notebook': ['Notebook 1', 'Notebook 2'],
		'Badge Pin (25MM)': ['Pin 1', 'Pin 2', 'Pin 3'],
		'Coin Purse': ['Cinnamoroll', 'Hello Kitty'],
		'Regular Keychain': ['Medium 1', 'Medium 2', 'Medium 3'],
		'Big Keychain': ['Large 1', 'Large 2'],
		'Flower Hair Clip': [
			'Blue-Green',
			'Pink-Green',
			'Pink',
			'Red',
			'Violet',
			'White-Pink',
			'White',
			'Yellow-Green',
			'Yellow'
		],
		'Hair Clip (Large)': ['Blue', 'Pink', 'Violet', 'Yellow'],
		Facemask: ['Black (50 pcs)', 'White (10 pcs)']
	};
	let imageVariantLabels = $derived(
		selectedProduct ? (imageVariantLabelsByProduct[selectedProduct.name] ?? []) : []
	);
	let hasImageVariants = $derived(imageVariantLabels.length > 1);
	let variantLabel = $derived(selectedProduct?.category === 'uniforms' ? 'Size' : 'Type');

	function openProduct(product: Product) {
		selectedProduct = product;
		quantity = 1;
		activeImageIndex = 0;
		selectedSize =
			imageVariantLabelsByProduct[product.name]?.[0] ??
			getProductSizes(product.name)[0] ??
			'One size';
		isAdding = false;
		if (addToCartResetTimer) {
			clearTimeout(addToCartResetTimer);
			addToCartResetTimer = undefined;
		}
	}

	function selectImage(index: number) {
		activeImageIndex = Math.max(0, Math.min(selectedImages.length - 1, index));
		if (hasImageVariants) selectedSize = imageVariantLabels[activeImageIndex];
	}

	function moveImage(direction: number) {
		selectImage((activeImageIndex + direction + selectedImages.length) % selectedImages.length);
	}

	function handleImageTouchStart(event: TouchEvent) {
		touchStartX = event.changedTouches[0]?.clientX ?? null;
	}

	function handleImageTouchEnd(event: TouchEvent) {
		if (touchStartX === null) return;
		const distance = (event.changedTouches[0]?.clientX ?? touchStartX) - touchStartX;
		if (Math.abs(distance) > 40 && selectedImages.length > 1) moveImage(distance < 0 ? 1 : -1);
		touchStartX = null;
	}

	function closeProduct() {
		selectedProduct = null;
		isAdding = false;
		if (addToCartResetTimer) {
			clearTimeout(addToCartResetTimer);
			addToCartResetTimer = undefined;
		}
	}

	function changeQuantity(amount: number) {
		quantity = Math.max(1, Math.min(stockRemaining, quantity + amount));
	}

	let stockRemaining = $derived(selectedProduct?.stock ?? 0);
	let selectedVariant = $derived(selectedProduct?.variants?.[availableSizes.indexOf(selectedSize)]);
	let selectedProductPrice = $derived(selectedVariant?.price ?? selectedProduct?.price);
	let buyNowTotal = $derived((selectedProductPrice ?? 0) * quantity);
	let buyNowPayload = $derived(
		`QCU-COOP|${buyNowReference}|SKU:${selectedVariant?.sku ?? selectedProduct?.sku ?? ''}|TOTAL:${buyNowTotal.toFixed(2)}|ITEMS:${quantity}`
	);
	let buyNowQrCodeUrl = $derived(
		`https://api.qrserver.com/v1/create-qr-code/?size=200x200&format=svg&data=${encodeURIComponent(buyNowPayload)}`
	);

	function addSelectedProductToCart() {
		if (!selectedProduct || selectedProductPrice === undefined || isAdding || stockRemaining <= 0) return;

		addToCart({
			productId: selectedProduct.id,
			name: selectedProduct.name,
			image: selectedProduct.image,
			variant: selectedSize,
			sku: selectedVariant?.sku ?? selectedProduct.sku,
			unitPrice: selectedProductPrice,
			quantity,
			category: selectedProduct.category
		});

		isAdding = true;
		if (addToCartResetTimer) clearTimeout(addToCartResetTimer);
		addToCartResetTimer = setTimeout(() => {
			isAdding = false;
			addToCartResetTimer = undefined;
		}, 2000);
	}

	function openBuyNowCheckout() {
		if (!selectedProduct || selectedProductPrice === undefined || stockRemaining <= 0) return;
		addSelectedProductToCart();
		void goto('/cart');
	}

	function closeBuyNowCheckout() {
		window.location.href = '/';
	}
</script>

<svelte:window
	onkeydown={(event) => {
		if (event.key !== 'Escape') return;
		if (showBuyNowCheckout) closeBuyNowCheckout();
		else if (selectedProduct) closeProduct();
		else showFilters = false;
	}}
/>

<svelte:head>
	<title>{categoryTitle} | QCU Coop Shop</title>
	<meta name="description" content="Choose products from the QCU Coop Shop catalog." />
</svelte:head>

<section class="product-page mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-9 lg:px-8">
	<header class="selection-header">
		<div class="selection-heading">
			<p class="selection-eyebrow">
				QCU Coop Store <span aria-hidden="true">/</span> Product selection
			</p>
			<h1>{categoryTitle}</h1>
			<p class="selection-subtitle">
				Choose an item to see its details, available options, and stock.
			</p>
		</div>
		<div class="selection-actions">
			<div class="relative">
				<button
					type="button"
					onclick={() => (showFilters = !showFilters)}
					class="filter-trigger"
					aria-label="Filter products"
					aria-expanded={showFilters}
				>
					<svg
						class="h-5 w-5"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M7 12h10m-7 6h4" />
					</svg>
					<span>Filters</span>
				</button>
			</div>
			<a href="/shop" class="back-to-shop">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					aria-hidden="true"
					><path stroke-linecap="round" stroke-linejoin="round" d="m15 18-6-6 6-6" /></svg
				>
				Back to shop
			</a>
		</div>
	</header>

	<div class="catalog-summary" aria-live="polite">
		<p>
			<strong>{visibleProducts.length}</strong>
			{visibleProducts.length === 1 ? 'product' : 'products'} found
		</p>
		{#if searchQuery}
			<span class="search-term">Search: “{page.url.searchParams.get('query')?.trim()}”</span>
		{/if}
		{#if activeProductTag}
			<button type="button" class="clear-filter" onclick={() => (activeProductTag = '')}>
				{activeProductTag} <span aria-hidden="true">×</span>
			</button>
		{/if}
	</div>

	{#if showFilters}
		<div
			class="filter-modal fixed inset-0 z-[90] flex items-start justify-end bg-[#07152d]/35 p-4 backdrop-blur-sm"
			role="presentation"
			onclick={(event) => event.target === event.currentTarget && (showFilters = false)}
		>
			<div
				class="filter-panel flex h-[min(70vh,560px)] w-full max-w-md flex-col rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl"
				role="dialog"
				aria-modal="true"
				aria-labelledby="filter-panel-title"
			>
				<div class="flex flex-wrap items-start justify-between gap-3">
					<div>
						<p class="text-[10px] font-bold tracking-[0.18em] text-sky-600 uppercase">
							{categoryTitle}
						</p>
						<h2 id="filter-panel-title" class="mt-1 text-xl font-black text-[#07152d]">
							Filter products
						</h2>
					</div>
					<button
						type="button"
						onclick={() => (showFilters = false)}
						class="flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white text-xl font-bold text-[#07152d] shadow-md transition hover:bg-sky-50"
						aria-label="Close filters">×</button
					>
				</div>
				<div class="mt-5 min-h-0 overflow-y-auto pr-1">
					{#each availableSubcategories as mapping}
						<div class="border-b border-zinc-100 py-4 first:pt-0 last:border-b-0">
							<div class="flex items-center justify-between gap-3">
								<p class="text-xs font-black text-[#07152d]">{mapping.name}</p>
								{#if activeMapping.name === mapping.name}<span
										class="text-[10px] font-bold tracking-wider text-sky-600 uppercase">Active</span
									>{/if}
							</div>
							<div class="mt-3 flex flex-wrap gap-2">
								{#each mapping.tags as tag}
									<button
										type="button"
										onclick={() => {
											activeSubcategory = mapping.name;
											activeProductTag = activeProductTag === tag ? '' : tag;
										}}
										class="rounded-full border px-3 py-1.5 text-xs font-bold transition {activeProductTag ===
											tag && activeMapping.name === mapping.name
											? 'border-[#233f91] bg-[#233f91] text-white'
											: 'border-zinc-200 bg-zinc-50 text-[#07152d] hover:border-[#233f91] hover:text-[#233f91]'}"
										aria-pressed={activeProductTag === tag && activeMapping.name === mapping.name}
									>
										{tag}
									</button>
								{/each}
							</div>
						</div>
					{/each}
				</div>
				<div class="mt-4 flex items-center justify-between gap-3 border-t border-zinc-100 pt-4">
					<p class="text-[10px] font-bold tracking-[0.18em] text-zinc-400 uppercase">
						Product tags
					</p>
					{#if activeProductTag}
						<button
							type="button"
							onclick={() => (activeProductTag = '')}
							class="text-[10px] font-bold text-[#233f91] underline underline-offset-2"
							>Clear tag</button
						>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	{#if visibleProducts.length}
		<div class="product-grid grid gap-4" class:single-result={visibleProducts.length === 1}>
			{#each visibleProducts as product}
				<article class="product-card">
					<div class="product-card-image">
						<img
							src={product.image || placeholderImage}
							alt={product.name}
							onerror={(event) => handleImageError(event, product.name)}
						/>
					</div>
					<div class="product-card-info">
						<div class="product-card-badges">
							{#if product.stock !== undefined && product.stock <= 0}
								<span class="out-of-stock-badge">Out of stock</span>
							{:else if product.lowStock}
								<span class="low-stock-badge">Low stock</span>
							{/if}
						</div>
						<h2>{product.name}</h2>
						<div class="product-card-price">
							<span
								>{product.price !== undefined
									? `₱${product.price.toFixed(2)}`
									: 'Price to be set'}</span
							>
							<span class="product-sku">{product.sku}</span>
						</div>
						<button type="button" onclick={() => openProduct(product)} class="select-product-button"
							>View product</button
						>
					</div>
				</article>
			{/each}
		</div>
	{:else}
		<div class="empty-catalog">
			<p class="empty-catalog-title">No products found</p>
			<p>Try another search or clear the selected filters.</p>
			{#if activeProductTag}
				<button type="button" class="clear-filter" onclick={() => (activeProductTag = '')}
					>Clear filters</button
				>
			{:else}
				<a href="/products?category={catalogCategory}">Clear search</a>
			{/if}
		</div>
	{/if}
</section>

{#if selectedProduct && !showBuyNowCheckout}
	<div
		use:portal
		class="product-modal fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md"
		role="presentation"
		onclick={(event) => event.target === event.currentTarget && closeProduct()}
	>
		<div
			class="modal-panel relative grid max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl sm:grid-cols-2"
			role="dialog"
			aria-modal="true"
			aria-labelledby="product-modal-title"
		>
			<button
				type="button"
				onclick={closeProduct}
				class="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-xl text-[#07152d] shadow-sm transition hover:bg-zinc-100"
				aria-label="Close product details">×</button
			>

			<div
				class="product-modal-image relative flex aspect-[4/3] min-h-72 items-center justify-center overflow-hidden rounded-2xl bg-white p-8 text-center sm:aspect-auto sm:min-h-full"
				role="region"
				aria-label="Product image carousel"
				ontouchstart={handleImageTouchStart}
				ontouchend={handleImageTouchEnd}
			>
				<img
					src={selectedImages[activeImageIndex]}
					alt={`${selectedProduct.name} view ${activeImageIndex + 1}`}
					onerror={(event) => handleImageError(event, selectedProduct?.name ?? 'product')}
					class="h-full w-full object-contain"
				/>
				{#if selectedImages.length > 1}
					<button
						type="button"
						onclick={() => moveImage(-1)}
						class="carousel-arrow left-3"
						aria-label="Previous product image">‹</button
					>
					<button
						type="button"
						onclick={() => moveImage(1)}
						class="carousel-arrow right-3"
						aria-label="Next product image">›</button
					>
					<div class="carousel-dots" aria-label="Product image navigation">
						{#each selectedImages as _, index}
							<button
								type="button"
								onclick={() => selectImage(index)}
								class:active={activeImageIndex === index}
								aria-label={`Show image ${index + 1}`}
							></button>
						{/each}
					</div>
				{/if}
			</div>

			<div class="flex flex-col p-6 sm:p-8">
				<span class="text-[10px] font-bold tracking-[0.2em] text-sky-600 uppercase"
					>Product details</span
				>
				<h2 id="product-modal-title" class="mt-2 text-2xl leading-tight font-black text-[#07152d]">
					{selectedProduct.name}
				</h2>
				<p class="mt-2 text-2xl font-black text-[#233f91]">
					{selectedProductPrice !== undefined
						? `₱${selectedProductPrice.toFixed(2)}`
						: 'Price to be set'}
				</p>
				<p class="mt-2 font-mono text-xs text-zinc-400">SKU: {selectedProduct.sku}</p>

				<div class="mt-6 rounded-xl bg-sky-50 px-4 py-3">
					<p class="text-xs font-bold tracking-wider text-[#233f91] uppercase">Availability</p>
					<p class="mt-1 text-lg font-black text-[#233f91]">
						{#if stockRemaining <= 0}
							Out of stock
						{:else if selectedProduct.lowStock}
							Low stock · {stockRemaining} left
						{:else}
							{stockRemaining} available
						{/if}
					</p>
				</div>

				{#if availableSizes.length || hasImageVariants}
					<div class="mt-5">
						<p class="mb-2 text-xs font-bold text-[#07152d]">{variantLabel}</p>
						<div class="flex flex-wrap gap-2">
							{#each hasImageVariants ? imageVariantLabels : availableSizes as size, index}
								<button
									type="button"
									onclick={() => (hasImageVariants ? selectImage(index) : (selectedSize = size))}
									class="rounded-full border px-4 py-2 text-xs font-bold transition {selectedSize ===
									size
										? 'border-[#233f91] bg-[#233f91] text-white'
										: 'border-zinc-200 bg-white text-[#07152d] hover:border-[#233f91] hover:text-[#233f91]'}"
									aria-pressed={selectedSize === size}
								>
									{size}
								</button>
							{/each}
						</div>
					</div>
				{/if}

				<div
					class="mt-5 flex items-center justify-between rounded-xl border border-zinc-200 px-3 py-2"
				>
					<span class="text-xs font-bold text-[#07152d]">Quantity</span>
					<div class="flex items-center gap-3">
						<button
							type="button"
							onclick={() => changeQuantity(-1)}
							class="h-8 w-8 rounded-full bg-zinc-100 text-lg text-[#07152d] transition hover:bg-zinc-200"
							aria-label="Decrease quantity">−</button
						>
						<span class="min-w-5 text-center text-sm font-black text-[#07152d]">{quantity}</span>
						<button
							type="button"
							onclick={() => changeQuantity(1)}
							disabled={quantity >= stockRemaining}
							class="h-8 w-8 rounded-full bg-[#233f91] text-lg text-white transition hover:bg-[#1d347a]"
							aria-label="Increase quantity">+</button
						>
					</div>
				</div>

				<div class="mt-6 grid grid-cols-2 gap-3">
					<button
						type="button"
						onclick={addSelectedProductToCart}
						disabled={isAdding || stockRemaining <= 0}
						class="relative flex h-12 w-full items-center justify-center overflow-hidden rounded-full px-4 text-sm font-bold text-white transition-colors duration-300 {isAdding
							? 'bg-emerald-500 hover:bg-emerald-500'
							: 'bg-[#233f91] hover:bg-[#1d347a]'} disabled:cursor-not-allowed disabled:opacity-50"
						aria-live="polite"
					>
						<span
							class="absolute inset-0 flex items-center justify-center transition-all duration-300 {isAdding
								? '-translate-y-6 opacity-0'
								: 'translate-y-0 opacity-100'}">
							{stockRemaining <= 0 ? 'Out of stock' : 'Add to cart'}
						</span
						>
						<span
							class="absolute inset-0 flex items-center justify-center gap-2 transition-all duration-300 {isAdding
								? 'translate-y-0 opacity-100'
								: 'translate-y-6 opacity-0'}"
						>
							<svg
								class="h-4 w-4"
								fill="none"
								stroke="currentColor"
								stroke-width="2.5"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path stroke-linecap="round" stroke-linejoin="round" d="m5 12 4 4L19 6" />
							</svg>
							Added!
						</span>
					</button>
					<button
						type="button"
						onclick={openBuyNowCheckout}
						disabled={stockRemaining <= 0}
						class="w-full rounded-full bg-[#233f91] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#1d347a] disabled:cursor-not-allowed disabled:opacity-50"
						>Buy now</button
					>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if showBuyNowCheckout && selectedProduct}
	<div
		use:portal
		class="buy-now-overlay"
		role="presentation"
		onclick={(event) => event.target === event.currentTarget && closeBuyNowCheckout()}
	>
		<div class="buy-now-modal" role="dialog" aria-modal="true" aria-labelledby="buy-now-title">
			<p class="buy-now-eyebrow">Direct checkout</p>
			<h2 id="buy-now-title">Scan to pay</h2>
			<div class="buy-now-item">
				<div>
					<strong>{selectedProduct.name}</strong><span
						>{selectedSize} · {quantity} pc{quantity === 1 ? '' : 's'}</span
					>
				</div>
				<b>₱{buyNowTotal.toFixed(2)}</b>
			</div>
			<img class="buy-now-qr" src={buyNowQrCodeUrl} alt={`QR code for order ${buyNowReference}`} />
			<p class="buy-now-reference">{buyNowReference}</p>
			<p class="buy-now-note">
				Present this code to the QCU COOP cashier to complete your purchase.
			</p>
			<button type="button" class="buy-now-done" onclick={closeBuyNowCheckout}>Done</button>
		</div>
	</div>
{/if}

<style>
	.buy-now-overlay {
		position: fixed;
		inset: 0;
		z-index: 110;
		display: grid;
		place-items: center;
		padding: 1rem;
		background: rgba(7, 21, 45, 0.68);
		backdrop-filter: blur(4px);
	}
	.buy-now-modal {
		position: relative;
		width: min(100%, 22rem);
		border-radius: 1rem;
		background: white;
		padding: 1.6rem;
		box-shadow: 0 24px 70px rgba(7, 21, 45, 0.35);
		text-align: center;
	}
	.buy-now-eyebrow {
		margin: 0;
		color: #1670b8;
		font-size: 0.65rem;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}
	.buy-now-modal h2 {
		margin: 0.45rem 0 1.15rem;
		color: #07152d;
		font-size: 1.35rem;
		font-weight: 900;
	}
	.buy-now-item {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: 0.8rem;
		padding: 0.85rem 0;
		border-top: 1px solid #dce5ef;
		border-bottom: 1px solid #dce5ef;
		text-align: left;
	}
	.buy-now-item strong,
	.buy-now-item span {
		display: block;
	}
	.buy-now-item strong {
		color: #07152d;
		font-size: 0.78rem;
	}
	.buy-now-item span {
		margin-top: 0.2rem;
		color: #38506f;
		font-size: 0.68rem;
	}
	.buy-now-item b {
		color: #07152d;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 0.8rem;
		white-space: nowrap;
	}
	.buy-now-qr {
		display: block;
		width: 12.5rem;
		aspect-ratio: 1;
		margin: 1.15rem auto 0.7rem;
		border: 0.6rem solid #f1f5f9;
		image-rendering: pixelated;
	}
	.buy-now-reference {
		margin: 0;
		color: #607897;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.08em;
	}
	.buy-now-note {
		margin: 1rem 0 0;
		color: #6d85a6;
		font-size: 0.72rem;
		line-height: 1.45;
	}
	.buy-now-done {
		width: 100%;
		margin-top: 1rem;
		border: 0;
		border-radius: 0.65rem;
		background: #155bd8;
		padding: 0.8rem 1rem;
		color: white;
		font: inherit;
		font-size: 0.85rem;
		font-weight: 800;
		cursor: pointer;
	}
	.buy-now-done:hover {
		background: #0d4fc7;
	}
	.filter-panel {
		margin-top: 4.5rem;
		margin-right: max(0rem, calc((100vw - 64rem) / 2));
	}

	.product-page {
		--selection-ink: #10233f;
		--selection-muted: #657892;
		--selection-line: #dce5ef;
		--selection-surface: #fff;
		--selection-image: #fff;
		color: var(--selection-ink);
		animation: pageFadeIn 900ms ease-out both;
	}

	.selection-header {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
		border: 1px solid var(--selection-line);
		border-radius: 1.25rem;
		background: linear-gradient(135deg, var(--selection-surface), #edf4ff);
		padding: clamp(1.25rem, 3vw, 2rem);
		box-shadow: 0 10px 28px rgba(27, 47, 81, 0.06);
	}

	.selection-eyebrow {
		margin: 0;
		color: #3974dc;
		font-size: 0.68rem;
		font-weight: 850;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	.selection-eyebrow span {
		padding: 0 0.3rem;
		color: #9aabc1;
	}

	.selection-heading h1 {
		margin: 0.45rem 0 0;
		color: var(--selection-ink);
		font-size: clamp(1.65rem, 4vw, 2.4rem);
		font-weight: 900;
		letter-spacing: -0.035em;
		line-height: 1.1;
	}

	.selection-subtitle {
		margin: 0.6rem 0 0;
		color: var(--selection-muted);
		font-size: 0.86rem;
		line-height: 1.5;
	}

	.selection-actions {
		display: flex;
		flex: 0 0 auto;
		align-items: center;
		gap: 1rem;
	}

	.filter-trigger {
		display: inline-flex;
		min-height: 2.75rem;
		align-items: center;
		gap: 0.5rem;
		border: 1px solid #c9d8ee;
		border-radius: 0.8rem;
		background: var(--selection-surface);
		padding: 0.55rem 0.85rem;
		color: #234b97;
		font: inherit;
		font-size: 0.78rem;
		font-weight: 800;
		cursor: pointer;
		transition:
			background 150ms ease,
			border-color 150ms ease;
	}

	.filter-trigger:hover {
		border-color: #2563eb;
		background: #eff6ff;
	}

	.back-to-shop {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		color: var(--selection-muted);
		font-size: 0.78rem;
		font-weight: 750;
		text-decoration: none;
		white-space: nowrap;
	}

	.back-to-shop:hover {
		color: #2563eb;
	}

	.back-to-shop svg {
		width: 1rem;
		height: 1rem;
	}

	.catalog-summary {
		display: flex;
		min-height: 2rem;
		align-items: center;
		gap: 0.7rem;
		margin-bottom: 0.6rem;
		color: var(--selection-muted);
		font-size: 0.78rem;
	}

	.catalog-summary p {
		margin: 0;
	}

	.catalog-summary strong {
		color: var(--selection-ink);
	}

	.search-term,
	.clear-filter {
		border: 1px solid var(--selection-line);
		border-radius: 999px;
		background: var(--selection-surface);
		padding: 0.3rem 0.65rem;
		color: var(--selection-muted);
		font: inherit;
		font-size: 0.7rem;
	}

	.clear-filter {
		color: #234b97;
		font-weight: 750;
		cursor: pointer;
	}

	.product-modal {
		position: fixed;
		inset: 0;
		width: 100vw;
		height: 100dvh;
		overflow-y: auto;
	}

	.carousel-arrow {
		position: absolute;
		top: 50%;
		display: grid;
		height: 2.25rem;
		width: 2.25rem;
		place-items: center;
		border: 0;
		border-radius: 999px;
		background: rgba(7, 21, 45, 0.78);
		color: white;
		font-size: 1.8rem;
		line-height: 1;
		transform: translateY(-50%);
		cursor: pointer;
	}

	.carousel-arrow:hover {
		background: #233f91;
	}

	.carousel-dots {
		position: absolute;
		bottom: 1rem;
		left: 50%;
		display: flex;
		gap: 0.4rem;
		transform: translateX(-50%);
	}

	.carousel-dots button {
		height: 0.5rem;
		width: 0.5rem;
		border: 0;
		border-radius: 999px;
		background: rgba(7, 21, 45, 0.3);
		cursor: pointer;
	}

	.carousel-dots button.active {
		background: #233f91;
	}

	.modal-panel {
		max-height: calc(100dvh - 2rem);
	}

	.product-grid {
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 17rem));
		justify-content: start;
		grid-auto-rows: 1fr;
		gap: 1.1rem;
		animation: contentSlideIn 900ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
	}

	.product-grid.single-result {
		justify-content: center;
	}

	.product-card {
		display: flex;
		min-width: 0;
		flex-direction: column;
		overflow: hidden;
		border: 1px solid var(--selection-line);
		border-radius: 1.1rem;
		background: var(--selection-surface);
		color: var(--selection-ink);
		box-shadow: 0 8px 22px rgba(27, 47, 81, 0.08);
		animation: cardReveal 700ms ease-out both;
		transition:
			transform 180ms ease,
			box-shadow 180ms ease;
	}

	.product-card:hover {
		transform: translateY(-3px);
		box-shadow: 0 14px 28px rgba(27, 47, 81, 0.14);
	}

	.product-card-image {
		position: relative;
		display: grid;
		height: 12rem;
		place-items: center;
		overflow: hidden;
		margin: 0.65rem 0.65rem 0;
		border: 1px solid #dbe4f0;
		border-radius: 0.8rem;
		background: var(--selection-image);
	}

	.product-card-image img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		box-sizing: border-box;
		padding: 0.65rem;
		object-fit: contain;
		object-position: center;
		transform: translateY(-8%) scale(1.15);
	}

	.product-card-info {
		display: flex;
		flex: 1;
		flex-direction: column;
		padding: 1rem;
	}

	.product-card-badges {
		display: flex;
		min-height: 1.2rem;
		align-items: flex-start;
	}

	.low-stock-badge {
		border-radius: 999px;
		background: #fff4d6;
		padding: 0.22rem 0.55rem;
		color: #925b00;
		font-size: 0.62rem;
		font-weight: 800;
		text-transform: uppercase;
	}

	.out-of-stock-badge {
		border-radius: 999px;
		background: #fee2e2;
		padding: 0.22rem 0.55rem;
		color: #b91c1c;
		font-size: 0.62rem;
		font-weight: 800;
		text-transform: uppercase;
	}

	.product-card-info h2 {
		min-height: 2.6rem;
		margin: 0.2rem 0 0.85rem;
		color: var(--selection-ink);
		font-size: 0.95rem;
		font-weight: 850;
		line-height: 1.4;
	}

	.product-card-price {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem;
		margin-top: auto;
	}

	.product-card-price > span:first-child {
		color: #2563eb;
		font-size: 1.15rem;
		font-weight: 900;
	}

	.product-sku {
		color: var(--selection-muted);
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 0.62rem;
	}

	.select-product-button {
		width: 100%;
		min-height: 2.7rem;
		margin-top: 0.9rem;
		border: 0;
		border-radius: 0.75rem;
		background: #2563eb;
		padding: 0.6rem 0.8rem;
		color: #fff;
		font: inherit;
		font-size: 0.78rem;
		font-weight: 850;
		cursor: pointer;
		transition:
			background 150ms ease,
			transform 150ms ease;
	}

	.select-product-button:hover {
		transform: translateY(-1px);
		background: #1d4ed8;
	}

	.empty-catalog {
		display: grid;
		min-height: 15rem;
		place-content: center;
		justify-items: center;
		gap: 0.45rem;
		border: 1px dashed var(--selection-line);
		border-radius: 1.1rem;
		color: var(--selection-muted);
		text-align: center;
	}

	.empty-catalog p {
		margin: 0;
		font-size: 0.82rem;
	}

	.empty-catalog .empty-catalog-title {
		color: var(--selection-ink);
		font-size: 1.05rem;
		font-weight: 850;
	}

	.empty-catalog a {
		margin-top: 0.35rem;
		color: #2563eb;
		font-size: 0.78rem;
		font-weight: 800;
	}

	:global(html[data-theme='dark'] .product-page) {
		--selection-ink: #edf4ff;
		--selection-muted: #a9bad0;
		--selection-line: #334866;
		--selection-surface: #172640;
		--selection-image: #fff;
	}

	:global(html[data-theme='dark'] .selection-header) {
		background: linear-gradient(135deg, #172640, #1b3152);
	}

	:global(html[data-theme='dark'] .filter-trigger) {
		border-color: #415878;
		color: #b9d1ff;
	}

	:global(html[data-theme='dark'] .filter-trigger:hover) {
		border-color: #6f96e8;
		background: #203a60;
	}

	:global(html[data-theme='dark'] .product-card-image) {
		border-color: #dbe4f0;
		background: #fff;
	}

	:global(html[data-theme='dark'] .select-product-button) {
		background: #3b72e8;
	}

	:global(html[data-theme='dark'] .select-product-button:hover) {
		background: #4b82f3;
	}

	.product-card:nth-child(2) {
		animation-delay: 80ms;
	}

	.product-card:nth-child(3) {
		animation-delay: 160ms;
	}

	.product-card:nth-child(4) {
		animation-delay: 240ms;
	}

	@keyframes pageFadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes contentSlideIn {
		from {
			opacity: 0;
			transform: translateY(18px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes cardReveal {
		from {
			opacity: 0;
			transform: translateY(14px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.product-page,
		.product-grid,
		.product-card {
			animation: none;
		}
	}

	@media (max-width: 640px) {
		.selection-header {
			align-items: stretch;
			flex-direction: column;
			gap: 1.15rem;
		}

		.selection-actions {
			justify-content: space-between;
		}

		.product-grid {
			grid-template-columns: repeat(auto-fill, minmax(min(100%, 16rem), 1fr));
		}

		.product-grid.single-result {
			grid-template-columns: minmax(0, 20rem);
		}

		.filter-panel {
			margin-top: 4rem;
			margin-right: 0;
		}
	}
</style>
