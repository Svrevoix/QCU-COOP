<script lang="ts">
	import { tick } from 'svelte';
	import StaffLogout from '$lib/components/StaffLogout.svelte';
	import {
		productCatalog,
		type Product as CatalogProduct,
		type ProductCategory
	} from '$lib/products';

	type Product = {
		key: string;
		sku: string;
		name: string;
		category: ProductCategory;
		price: number | undefined;
		size: string;
		stock: number;
	};
	type CartLine = { product: Product; quantity: number };
	type Member = { name: string; id: string };

	const categories: { id: 'all' | ProductCategory; label: string }[] = [
		{ id: 'all', label: 'All' },
		{ id: 'supplies', label: 'School & Office Supplies' },
		{ id: 'uniforms', label: 'Uniforms' },
		{ id: 'merchandise', label: 'QCU Merchandise & Accessories' },
		{ id: 'food', label: 'Food, Snacks & Dining Items' },
		{ id: 'care', label: 'Personal Care, Hygiene & Medical' },
		{ id: 'bags', label: 'Miscellaneous Bags & Accessories' },
		{ id: 'textbooks', label: 'Academic Textbooks' },
		{ id: 'operations', label: 'Financial & Co-op Operations' }
	];
	const categoryLabels = Object.fromEntries(
		categories.filter((category) => category.id !== 'all').map(({ id, label }) => [id, label])
	) as Record<ProductCategory, string>;
	const products: Product[] = productCatalog.flatMap((catalogProduct, productIndex) => {
		const variants = catalogProduct.variants ?? [
			{ sku: catalogProduct.sku, price: catalogProduct.price }
		];
		const sizeOptions = getVariantOptions(catalogProduct, variants.length);

		return variants.map((variant, variantIndex) => ({
			key: `${catalogProduct.id}:${variant.sku}`,
			sku: variant.sku,
			name: catalogProduct.name,
			category: catalogProduct.category,
			price: variant.price ?? catalogProduct.price,
			size: sizeOptions[variantIndex] ?? 'One size',
			stock: 8 + ((productIndex * 31 + variantIndex * 17) % 120)
		}));
	});
	const members: Member[] = [
		{ name: 'Emma Wilson', id: '23-2111' },
		{ name: 'Maria Santos', id: '24-1084' },
		{ name: 'John Dela Cruz', id: '22-0732' }
	];

	let activeCategory = $state<'all' | ProductCategory>('all');
	let search = $state('');
	let cart = $state<CartLine[]>([
		{ product: products[0], quantity: 1 },
		{ product: products[1], quantity: 1 },
		{ product: products[2], quantity: 1 }
	]);
	let customer = $state<Member | null>(members[0]);
	let customerDialog = $state<HTMLDialogElement>();
	let paymentDialog = $state<HTMLDialogElement>();
	let searchInput = $state<HTMLInputElement>();
	let paymentMethod = $state('Cash');
	let cashReceived = $state('');
	let notificationOpen = $state(false);
	let toast = $state('');
	let heldOrders = $state<CartLine[][]>([]);
	let lastHeldOrder = $state<CartLine[] | null>(null);
	let sidebarCollapsed = $state(false);
	let mobileSidebarOpen = $state(false);

	const filteredProducts = $derived(
		products.filter((product) => {
			const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
			const matchesSearch = `${product.name} ${product.sku} ${categoryLabels[product.category]}`
				.toLowerCase()
				.includes(search.trim().toLowerCase());
			return matchesCategory && matchesSearch;
		})
	);
	const itemCount = $derived(cart.reduce((total, line) => total + line.quantity, 0));
	const subtotal = $derived(
		cart.reduce((total, line) => total + (line.product.price ?? 0) * line.quantity, 0)
	);
	const discount = $derived(customer ? subtotal * 0.05 : 0);
	const total = $derived(subtotal - discount);
	const includedVat = $derived(total > 0 ? (total * 12) / 112 : 0);
	const cashChange = $derived(Math.max(0, Number(cashReceived || 0) - total));
	const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(
		new Date()
	);

	function formatCurrency(amount: number) {
		return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}

	function getVariantOptions(product: CatalogProduct, variantCount: number) {
		const options = product.name.match(/\(([^)]+)\)$/)?.[1].split(',').map((option) => option.trim());
		return variantCount > 1 && options?.length === variantCount ? options : ['One size'];
	}

	function quantityFor(product: Product) {
		return cart.find((line) => line.product.key === product.key)?.quantity ?? 0;
	}

	function addToOrder(product: Product) {
		if (product.stock < 1 || product.price === undefined) return;
		const line = cart.find((item) => item.product.key === product.key);
		if (line) {
			if (line.quantity >= product.stock) return;
			cart = cart.map((item) =>
				item.product.key === product.key ? { ...item, quantity: item.quantity + 1 } : item
			);
		} else {
			cart = [...cart, { product, quantity: 1 }];
		}
	}

	function updateQuantity(key: string, change: number) {
		cart = cart
			.map((line) =>
				line.product.key === key
					? { ...line, quantity: Math.min(line.product.stock, line.quantity + change) }
					: line
			)
			.filter((line) => line.quantity > 0);
	}

	function removeFromOrder(key: string) {
		cart = cart.filter((line) => line.product.key !== key);
	}

	function holdOrder() {
		if (cart.length === 0) return;
		lastHeldOrder = cart.map((line) => ({ ...line }));
		heldOrders = [...heldOrders, lastHeldOrder];
		cart = [];
		toast = `Order held locally · ${heldOrders.length} held`;
	}

	function restoreHeldOrder() {
		if (!lastHeldOrder) return;
		cart = lastHeldOrder;
		heldOrders = heldOrders.slice(0, -1);
		lastHeldOrder = heldOrders.at(-1) ?? null;
		toast = 'Held order restored.';
	}

	function completePayment(event: SubmitEvent) {
		event.preventDefault();
		if (cart.length === 0) return;
		if (paymentMethod === 'Cash' && Number(cashReceived) < total) return;

		paymentDialog?.close();
		cart = [];
		customer = null;
		cashReceived = '';
		toast = 'Payment completed in demo mode. No transaction was sent to a backend.';
	}

	async function focusSearch() {
		await tick();
		searchInput?.focus();
	}
</script>

<svelte:head>
	<title>Register | QCU Coop Cashier</title>
	<meta name="description" content="Cashier point-of-sale register with a local demo order." />
</svelte:head>

<main
	class="register-shell"
	class:collapsed={sidebarCollapsed}
	class:mobile-open={mobileSidebarOpen}
>
	<aside class="register-sidebar" id="register-sidebar" aria-label="Cashier workspace sidebar">
		<div class="sidebar-top">
			<a class="cashier-brand" href="/staff/pos/register">
				<span class="brand-mark">Q</span>
				<span class="brand-copy"><strong>QCU COOP</strong><small>Cashier workspace</small></span>
			</a>
			<button
				class="sidebar-toggle"
				type="button"
				aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
				aria-expanded={!sidebarCollapsed}
				aria-controls="register-sidebar"
				title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
				onclick={() => (sidebarCollapsed = !sidebarCollapsed)}
			>
				<svg viewBox="0 0 24 24" aria-hidden="true">
					<path d={sidebarCollapsed ? 'm9 18 6-6-6-6' : 'm15 18-6-6 6-6'} />
				</svg>
			</button>
		</div>
		<div class="sidebar-label">Workspace</div>
		<nav aria-label="Cashier navigation">
			<a
				class="active"
				href="/staff/pos/register"
				aria-current="page"
				title={sidebarCollapsed ? 'Register' : undefined}
				onclick={() => (mobileSidebarOpen = false)}
			>
				<span class="nav-icon" aria-hidden="true"
					><svg viewBox="0 0 24 24"
						><path d="M3 5h18v14H3zM7 9h4m-4 4h2m4-4h4m-4 4h4" /><path d="M7 16h10" /></svg
					></span
				>
				<span class="nav-label">Register</span>
			</a>
			<a
				href="/staff/pos"
				title={sidebarCollapsed ? 'POS Transaction Logs' : undefined}
				onclick={() => (mobileSidebarOpen = false)}
			>
				<span class="nav-icon" aria-hidden="true"
					><svg viewBox="0 0 24 24"
						><path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z" /><path d="M8 8h8M8 12h8M8 16h4" /></svg
					></span
				>
				<span class="nav-label">POS Transaction Logs</span>
			</a>
			<a
				href="/staff/pos/sales"
				title={sidebarCollapsed ? 'Sales' : undefined}
				onclick={() => (mobileSidebarOpen = false)}
			>
				<span class="nav-icon" aria-hidden="true"
					><svg viewBox="0 0 24 24"><path d="M4 19V5M4 19h17" /><path d="m7 15 4-5 3 2 5-7" /></svg
					></span
				>
				<span class="nav-label">Sales</span>
			</a>
			<a
				href="/staff/pos/account"
				title={sidebarCollapsed ? 'Account' : undefined}
				onclick={() => (mobileSidebarOpen = false)}
			>
				<span class="nav-icon" aria-hidden="true"
					><svg viewBox="0 0 24 24"
						><circle cx="12" cy="8" r="3.5" /><path
							d="M5 20c1.2-3.6 4.2-5.5 7-5.5s5.8 1.9 7 5.5"
						/></svg
					></span
				>
				<span class="nav-label">Account</span>
			</a>
		</nav>
		<div class="sidebar-footer">
			<span class="online-dot"></span><span class="sidebar-footer-copy"
				><strong>Register online</strong><small>Register 01 · Open</small></span
			>
		</div>
		<StaffLogout />
	</aside>
	{#if mobileSidebarOpen}
		<button
			class="sidebar-backdrop"
			type="button"
			aria-label="Close navigation"
			onclick={() => (mobileSidebarOpen = false)}
		></button>
	{/if}
	<section class="register-main">
		<header class="register-topbar">
			<div class="topbar-title">
				<button
					class="mobile-menu-button"
					type="button"
					aria-label={mobileSidebarOpen ? 'Close navigation' : 'Open navigation'}
					aria-expanded={mobileSidebarOpen}
					aria-controls="register-sidebar"
					onclick={() => (mobileSidebarOpen = !mobileSidebarOpen)}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true"
						><path
							d={mobileSidebarOpen ? 'm6 6 12 12M18 6 6 18' : 'M4 7h16M4 12h16M4 17h16'}
						/></svg
					>
				</button>
				<h1>Register</h1>
				<p><a href="/staff/pos">Cashier Workspace</a> / Point of Sale</p>
			</div>
			<div class="topbar-actions">
				<span class="register-state"><strong>Register 01</strong><span><i></i> Open</span></span>
				<span class="topbar-divider"></span>
				<button class="header-icon" type="button" aria-label="Register status">◦</button>
				<div class="notification-wrap">
					<button
						class="header-icon"
						type="button"
						aria-label="Notifications"
						aria-expanded={notificationOpen}
						onclick={() => (notificationOpen = !notificationOpen)}
					>
						<svg viewBox="0 0 24 24" aria-hidden="true"
							><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg
						>
					</button>
					{#if notificationOpen}<div class="notification-popover" role="status">
							No new register alerts.
						</div>{/if}
				</div>
				<span class="cashier-avatar">MS</span>
				<strong class="cashier-name">Maria Santos</strong>
			</div>
		</header>

		<div class="register-workspace">
			<section class="products-area" aria-labelledby="products-title">
				<header class="products-heading">
					<h2 id="products-title">Register Products</h2>
					<p>Tap items below to add to the current order</p>
				</header>
				<label class="product-search">
					<svg viewBox="0 0 24 24" aria-hidden="true"
						><circle cx="10.8" cy="10.8" r="6.3" /><path d="m16 16 4 4" /></svg
					>
					<input
						bind:this={searchInput}
						bind:value={search}
						placeholder="Search name or SKU..."
						aria-label="Search products by name or SKU"
					/>
					<button type="button" onclick={focusSearch}
						><svg viewBox="0 0 24 24" aria-hidden="true"
							><path d="M4 9V5h4m8 0h4v4M4 15v4h4m8 0h4v-4M8 12h8m-4-4v8" /></svg
						>Scan</button
					>
				</label>

				<nav class="category-tabs" aria-label="Product categories">
					{#each categories as category (category.id)}
						<button
							class:active={activeCategory === category.id}
							type="button"
							aria-pressed={activeCategory === category.id}
							onclick={() => (activeCategory = category.id)}>{category.label}</button
						>
					{/each}
				</nav>

				<div class="product-count">
					<strong
						>{activeCategory === 'all' ? 'All products' : categoryLabels[activeCategory]} · {filteredProducts.length}
						items</strong
					>
					<span>Sample stock shown by selected size</span>
				</div>

				<div class="product-grid">
					{#each filteredProducts as product (product.key)}
						<article class="product-card">
							<div class="product-image">
								<span class="stock-badge" class:low-stock={product.stock < 20}
									>{product.stock} left</span
								>
								<div class="image-placeholder" aria-hidden="true">
									<svg viewBox="0 0 24 24"
										><rect x="4" y="4" width="16" height="16" rx="2" /><circle
											cx="9"
											cy="9"
											r="1.5"
										/><path d="m5 17 5-5 3 3 2-2 4 4" /></svg
									>
								</div>
								<span class="product-variant">{product.size}<small>{product.sku}</small></span>
							</div>
							<h3>{product.name}</h3>
							<p class="product-category">{categoryLabels[product.category]}</p>
							<strong class="product-price"
								>{product.price === undefined ? 'Price to be set' : formatCurrency(product.price)}</strong
							>
							<button
								class="add-to-order"
								type="button"
								disabled={product.stock === 0 || product.price === undefined || quantityFor(product) >= product.stock}
								onclick={() => addToOrder(product)}
							>
								<span
									>{product.stock === 0
										? 'Out of stock'
										: product.price === undefined
											? 'Price to be set'
										: quantityFor(product) > 0
											? 'Add to order'
											: 'Add to order'}</span
								>
								{#if quantityFor(product)}<small>{quantityFor(product)} in order</small>{/if}
								<b aria-hidden="true">+</b>
							</button>
						</article>
					{:else}
						<p class="empty-products">No products match your search or category.</p>
					{/each}
				</div>
				<p class="product-footer">
					Showing {filteredProducts.length} of {products.length} items / size variants
				</p>
			</section>

			<aside class="order-panel" aria-labelledby="order-title">
				<div class="order-heading">
					<h2 id="order-title">Current Order</h2>
					<button
						class="clear-order"
						type="button"
						disabled={cart.length === 0}
						onclick={() => (cart = [])}
					>
						<svg viewBox="0 0 24 24" aria-hidden="true"
							><path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3" /></svg
						>
						Clear All
					</button>
				</div>

				<div class="customer-section">
					<label for="customer-name">Customer / Member Name</label>
					<div class="customer-control">
						<button
							id="customer-name"
							type="button"
							class="customer-button"
							onclick={() => customerDialog?.showModal()}
						>
							{#if customer}{customer.name} ({customer.id}){:else}Walk-in customer{/if}
						</button>
						<button
							class="member-button"
							type="button"
							aria-label="Choose customer or member"
							onclick={() => customerDialog?.showModal()}>⌄</button
						>
					</div>
					<p class="discount-note">
						{#if customer}Patronage Discount (5%) applied{:else}No member discount applied{/if}
					</p>
				</div>

				<div class="cart-heading">
					<strong>Cart Items</strong><span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
				</div>
				<div class="cart-list">
					{#each cart as line (line.product.key)}
						<article class="cart-item">
							<div class="cart-item-top">
								<div>
									<h3>{line.product.name}</h3>
									<p>{formatCurrency(line.product.price ?? 0)} ea · {line.product.size}</p>
								</div>
								<strong>{formatCurrency((line.product.price ?? 0) * line.quantity)}</strong>
							</div>
							<div class="cart-item-bottom">
								<div class="quantity-control">
									<button
										type="button"
										aria-label={`Remove one ${line.product.name}`}
										onclick={() => updateQuantity(line.product.key, -1)}>−</button
									>
									<strong>{line.quantity}</strong>
									<button
										type="button"
										aria-label={`Add one ${line.product.name}`}
										disabled={line.quantity >= line.product.stock}
										onclick={() => updateQuantity(line.product.key, 1)}>+</button
									>
								</div>
								<button
									class="remove-item"
									type="button"
									onclick={() => removeFromOrder(line.product.key)}>Remove</button
								>
							</div>
						</article>
					{:else}
						<div class="empty-cart">
							<strong>Your order is empty</strong><span>Select products to start a sale.</span>
						</div>
					{/each}
				</div>

				{#if heldOrders.length > 0}
					<button
						class="restore-order"
						type="button"
						disabled={cart.length > 0}
						onclick={restoreHeldOrder}
					>
						{#if cart.length > 0}Clear current order to restore held order{:else}Restore held order
							({heldOrders.length}){/if}
					</button>
				{/if}

				<div class="totals">
					<div><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
					<div>
						<span>Patronage Discount (5%)</span><strong class="discount-value"
							>−{formatCurrency(discount)}</strong
						>
					</div>
					<div><span>VAT (12% Included)</span><strong>{formatCurrency(includedVat)}</strong></div>
					<div class="grand-total">
						<span>Total to Pay</span><strong>{formatCurrency(total)}</strong>
					</div>
				</div>
				<div class="order-actions">
					<button class="hold-button" type="button" disabled={cart.length === 0} onclick={holdOrder}
						>Hold Order</button
					>
					<button
						class="charge-button"
						type="button"
						disabled={cart.length === 0}
						onclick={() => paymentDialog?.showModal()}
						>Charge {formatCurrency(total)} <span aria-hidden="true">›</span></button
					>
				</div>
			</aside>
		</div>

		{#if toast}
			<div class="toast" role="status">
				{toast}<button type="button" aria-label="Dismiss message" onclick={() => (toast = '')}
					>×</button
				>
			</div>
		{/if}

		<footer class="register-footer">
			<span>© {new Date().getFullYear()} QCU Coop Store · Cashier Portal</span>
			<span>Member pricing and patronage benefits are subject to cooperative policy.</span>
			<span><a href="/about">Privacy</a><a href="/about">Support</a></span>
		</footer>
	</section>
</main>

<dialog bind:this={customerDialog} class="register-dialog">
	<div class="dialog-heading">
		<div>
			<span>Current sale</span>
			<h2>Select customer</h2>
		</div>
		<button type="button" aria-label="Close" onclick={() => customerDialog?.close()}>×</button>
	</div>
	<p>
		Choose a cooperative member to apply the 5% patronage discount, or continue as a walk-in
		customer.
	</p>
	<div class="member-list">
		<button
			type="button"
			onclick={() => {
				customer = null;
				customerDialog?.close();
			}}><strong>Walk-in customer</strong><span>No member discount</span></button
		>
		{#each members as member (member.id)}
			<button
				type="button"
				onclick={() => {
					customer = member;
					customerDialog?.close();
				}}><strong>{member.name}</strong><span>Member ID · {member.id}</span></button
			>
		{/each}
	</div>
</dialog>

<dialog bind:this={paymentDialog} class="register-dialog payment-dialog">
	<form onsubmit={completePayment}>
		<div class="dialog-heading">
			<div>
				<span>Checkout</span>
				<h2>Charge {formatCurrency(total)}</h2>
			</div>
			<button type="button" aria-label="Close" onclick={() => paymentDialog?.close()}>×</button>
		</div>
		<p>Demo checkout only. No payment will be processed or stored.</p>
		<label class="payment-label"
			>Payment method
			<select bind:value={paymentMethod}
				><option>Cash</option><option>GCash</option><option>Card</option></select
			>
		</label>
		{#if paymentMethod === 'Cash'}
			<label class="payment-label"
				>Cash received
				<input
					type="number"
					min={total}
					step="0.01"
					required
					bind:value={cashReceived}
					placeholder="Enter amount received"
				/>
			</label>
			<div class="change-due">
				<span>Change due</span><strong>{formatCurrency(cashChange)}</strong>
			</div>
		{/if}
		<div class="dialog-actions">
			<button class="hold-button" type="button" onclick={() => paymentDialog?.close()}
				>Cancel</button
			>
			<button class="charge-button" type="submit">Complete demo sale</button>
		</div>
	</form>
</dialog>

<style>
	.register-shell {
		--ink: #172033;
		--muted: #70809a;
		display: flex;
		min-height: 100vh;
		background: #f7f9fb;
		color: var(--ink);
		font-family: 'Montserrat', sans-serif;
	}
	.register-sidebar {
		position: sticky;
		z-index: 20;
		top: 0;
		display: flex;
		width: 15rem;
		height: 100vh;
		flex: 0 0 15rem;
		flex-direction: column;
		background: #07152d;
		color: #dbe7fb;
		padding: 1.15rem 0.8rem 0.8rem;
		transition:
			width 180ms ease,
			flex-basis 180ms ease,
			padding 180ms ease;
	}
	.sidebar-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.4rem;
		margin-bottom: 1.7rem;
		padding: 0.15rem 0.25rem;
	}
	.cashier-brand {
		display: flex;
		min-width: 0;
		align-items: center;
		gap: 0.6rem;
		color: white;
		text-decoration: none;
	}
	.brand-mark {
		display: grid;
		width: 2rem;
		height: 2rem;
		flex: 0 0 auto;
		place-items: center;
		border-radius: 0.55rem;
		background: #2d6cff;
		font-size: 1rem;
		font-weight: 900;
	}
	.brand-copy {
		overflow: hidden;
		max-width: 10rem;
		opacity: 1;
		transition:
			max-width 180ms ease,
			opacity 140ms ease;
	}
	.brand-copy strong,
	.brand-copy small {
		display: block;
		white-space: nowrap;
	}
	.brand-copy strong {
		font-size: 0.68rem;
		letter-spacing: 0.1em;
	}
	.brand-copy small {
		margin-top: 0.15rem;
		color: #8da1c3;
		font-size: 0.55rem;
	}
	.sidebar-toggle {
		display: grid;
		width: 1.7rem;
		height: 1.7rem;
		flex: 0 0 auto;
		place-items: center;
		border: 1px solid #283b5a;
		border-radius: 0.4rem;
		background: #122440;
		color: #b8c8dd;
		cursor: pointer;
	}
	.sidebar-toggle:hover {
		background: #1a3153;
		color: white;
	}
	.sidebar-toggle svg {
		width: 0.85rem;
		height: 0.85rem;
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 2;
	}
	.sidebar-label {
		margin: 0;
		padding: 0 0.65rem 0.5rem;
		color: #6e82a5;
		font-size: 0.52rem;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}
	.register-sidebar nav {
		display: grid;
		flex: 1;
		align-content: start;
		gap: 0.3rem;
	}
	.register-sidebar nav a {
		display: flex;
		min-width: 0;
		align-items: center;
		gap: 0.65rem;
		border-radius: 0.55rem;
		color: #9aacca;
		padding: 0.65rem;
		font-size: 0.61rem;
		font-weight: 700;
		line-height: 1.25;
		text-decoration: none;
		transition:
			background 150ms ease,
			color 150ms ease;
	}
	.register-sidebar nav a:hover {
		background: #12274b;
		color: white;
	}
	.register-sidebar nav a.active {
		background: #2563eb;
		color: white;
		box-shadow: 0 7px 14px #2563eb35;
	}
	.nav-icon {
		display: grid;
		width: 1rem;
		height: 1rem;
		flex: 0 0 auto;
		place-items: center;
	}
	.nav-icon svg {
		width: 100%;
		height: 100%;
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 1.8;
	}
	.nav-label {
		overflow: hidden;
		max-width: 12rem;
		white-space: nowrap;
		transition:
			max-width 180ms ease,
			opacity 140ms ease;
	}
	.sidebar-footer {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		margin-top: auto;
		border-top: 1px solid #1c3153;
		padding: 0.8rem 0.55rem;
	}
	.online-dot {
		width: 0.42rem;
		height: 0.42rem;
		flex: 0 0 auto;
		border-radius: 50%;
		background: #42d392;
		box-shadow: 0 0 0 0.16rem #42d3921f;
	}
	.sidebar-footer-copy {
		overflow: hidden;
	}
	.sidebar-footer-copy strong,
	.sidebar-footer-copy small {
		display: block;
		white-space: nowrap;
	}
	.sidebar-footer-copy strong {
		color: #dbe7fb;
		font-size: 0.56rem;
	}
	.sidebar-footer-copy small {
		margin-top: 0.12rem;
		color: #8296b6;
		font-size: 0.5rem;
	}
	.register-sidebar :global(.staff-logout) {
		margin-top: 0.25rem;
	}
	.register-main {
		display: flex;
		min-width: 0;
		flex: 1;
		flex-direction: column;
	}
	.register-shell.collapsed .register-sidebar {
		width: 4.4rem;
		flex-basis: 4.4rem;
		padding-right: 0.55rem;
		padding-left: 0.55rem;
	}
	.register-shell.collapsed .sidebar-top {
		flex-direction: column;
		gap: 0.6rem;
		padding: 0.15rem 0;
	}
	.register-shell.collapsed .brand-copy,
	.register-shell.collapsed .nav-label,
	.register-shell.collapsed .sidebar-footer-copy {
		max-width: 0;
		opacity: 0;
		visibility: hidden;
	}
	.register-shell.collapsed .sidebar-label {
		max-height: 0;
		overflow: hidden;
		padding: 0;
		opacity: 0;
	}
	.register-shell.collapsed .cashier-brand {
		justify-content: center;
	}
	.register-shell.collapsed .register-sidebar nav a {
		justify-content: center;
		padding: 0.65rem 0;
	}
	.register-shell.collapsed .sidebar-footer {
		justify-content: center;
		padding-right: 0;
		padding-left: 0;
	}
	.register-shell.collapsed .register-sidebar :global(.staff-logout) {
		justify-content: center;
		padding-right: 0;
		padding-left: 0;
		text-align: center;
	}
	.register-shell.collapsed .register-sidebar :global(.staff-logout span) {
		display: none;
	}
	.sidebar-backdrop,
	.mobile-menu-button {
		display: none;
	}
	.register-topbar {
		display: flex;
		min-height: 3.1rem;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		border-bottom: 1px solid #e5e9ef;
		background: white;
		padding: 0.4rem 1.1rem;
	}
	.topbar-title h1 {
		margin: 0;
		color: #172033;
		font-size: 0.82rem;
		font-weight: 900;
	}
	.topbar-title {
		display: flex;
		min-width: 0;
		align-items: center;
		gap: 0.55rem;
	}
	.mobile-menu-button {
		width: 1.8rem;
		height: 1.8rem;
		place-items: center;
		border: 1px solid #e2e7ee;
		border-radius: 0.4rem;
		background: white;
		color: #54657d;
		cursor: pointer;
	}
	.mobile-menu-button svg {
		width: 0.9rem;
		height: 0.9rem;
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-width: 2;
	}
	.topbar-title p {
		margin: 0.1rem 0 0;
		color: #7c899c;
		font-size: 0.54rem;
	}
	.topbar-title p a {
		color: inherit;
		text-decoration: none;
	}
	.topbar-title p a:hover {
		color: #2563eb;
	}
	.topbar-actions {
		display: flex;
		align-items: center;
		gap: 0.55rem;
	}
	.register-state {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		color: #172033;
		font-size: 0.55rem;
	}
	.register-state > span {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		border-radius: 1rem;
		background: #e5f8ef;
		color: #0b9251;
		padding: 0.24rem 0.48rem;
		font-weight: 800;
	}
	.register-state i {
		width: 0.3rem;
		height: 0.3rem;
		border-radius: 50%;
		background: #10a861;
	}
	.topbar-divider {
		height: 1.15rem;
		border-left: 1px solid #e6ebf1;
		margin: 0 0.25rem;
	}
	.header-icon {
		display: grid;
		width: 1.65rem;
		height: 1.65rem;
		place-items: center;
		border: 0;
		border-radius: 0.4rem;
		background: transparent;
		color: #75839a;
		cursor: pointer;
	}
	.header-icon svg {
		width: 0.82rem;
		height: 0.82rem;
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 1.7;
	}
	.cashier-avatar {
		display: grid;
		width: 1.85rem;
		height: 1.85rem;
		place-items: center;
		border-radius: 50%;
		background: #1250df;
		color: white;
		font-size: 0.57rem;
		font-weight: 900;
	}
	.cashier-name {
		color: #172033;
		font-size: 0.58rem;
	}
	.notification-wrap {
		position: relative;
	}
	.notification-popover {
		position: absolute;
		z-index: 5;
		top: calc(100% + 0.4rem);
		right: 0;
		width: 11rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: white;
		box-shadow: 0 12px 24px #182b471c;
		padding: 0.7rem;
		color: #65738a;
		font-size: 0.56rem;
	}
	.register-workspace {
		display: grid;
		flex: 1;
		grid-template-columns: minmax(0, 1fr) minmax(18rem, 29.5%);
		min-height: 0;
	}
	.products-area {
		display: flex;
		min-width: 0;
		flex-direction: column;
		padding: 0.85rem 0.7rem 0.5rem;
	}
	.products-heading h2,
	.order-heading h2 {
		margin: 0;
		color: #172033;
		font-size: 0.88rem;
		font-weight: 900;
	}
	.products-heading p {
		margin: 0.18rem 0 0.65rem;
		color: #7d8ba0;
		font-size: 0.58rem;
	}
	.product-search {
		display: flex;
		min-height: 2.05rem;
		align-items: center;
		gap: 0.45rem;
		border: 1px solid #e0e7f0;
		border-radius: 0.5rem;
		background: white;
		padding: 0 0.6rem;
	}
	.product-search > svg {
		width: 0.82rem;
		height: 0.82rem;
		flex: 0 0 auto;
		fill: none;
		stroke: #71819a;
		stroke-linecap: round;
		stroke-width: 1.8;
	}
	.product-search input {
		width: 100%;
		min-width: 0;
		border: 0;
		outline: 0;
		background: transparent;
		color: #24334b;
		font: inherit;
		font-size: 0.59rem;
	}
	.product-search input::placeholder {
		color: #8997ab;
	}
	.product-search button {
		display: inline-flex;
		flex: 0 0 auto;
		align-items: center;
		gap: 0.25rem;
		border: 0;
		background: transparent;
		color: #2563eb;
		font: inherit;
		font-size: 0.54rem;
		font-weight: 800;
		cursor: pointer;
	}
	.product-search button svg {
		width: 0.75rem;
		height: 0.75rem;
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 1.8;
	}
	.category-tabs {
		display: flex;
		gap: 0.35rem;
		overflow-x: auto;
		padding: 0.55rem 0 0.35rem;
	}
	.category-tabs button {
		border: 1px solid #dfe6ef;
		border-radius: 0.42rem;
		background: white;
		color: #29364b;
		padding: 0.45rem 0.62rem;
		font: inherit;
		font-size: 0.52rem;
		font-weight: 800;
		white-space: nowrap;
		cursor: pointer;
	}
	.category-tabs button.active {
		border-color: #347af5;
		background: #347af5;
		color: white;
	}
	.product-count {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin: 0.15rem 0 0.45rem;
		color: #7a8aa2;
		font-size: 0.52rem;
	}
	.product-count strong {
		color: #70809a;
		font-weight: 800;
	}
	.product-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		align-content: start;
		gap: 0.55rem;
	}
	.product-card {
		min-width: 0;
		overflow: hidden;
		border: 1px solid #dce5ef;
		border-radius: 0.58rem;
		background: white;
		padding: 0.45rem;
	}
	.product-image {
		position: relative;
		display: flex;
		height: 3.55rem;
		align-items: flex-end;
		justify-content: space-between;
		overflow: hidden;
		border: 1px solid #e2e7ed;
		border-radius: 0.45rem 0.45rem 0 0;
		background: #f1f3f5;
	}
	.image-placeholder {
		display: grid;
		width: 3.7rem;
		height: 3rem;
		place-items: center;
		border: 1px solid #e2e7ed;
		border-bottom: 0;
		border-radius: 0.42rem 0.42rem 0 0;
		background: #f6f7f8;
		color: #9aa6b6;
	}
	.image-placeholder svg {
		width: 1.1rem;
		height: 1.1rem;
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 1.5;
	}
	.stock-badge {
		position: absolute;
		z-index: 1;
		top: 0.28rem;
		right: 0.28rem;
		border-radius: 0.32rem;
		background: #e3fbef;
		color: #0a9b53;
		padding: 0.18rem 0.35rem;
		font-size: 0.48rem;
		font-weight: 800;
	}
	.stock-badge.low-stock {
		background: #fff0ee;
		color: #e74b43;
	}
	.product-variant {
		display: grid;
		gap: 0.12rem;
		padding: 0 0.25rem 0.25rem 0;
		color: #7889a2;
		font-size: 0.49rem;
		text-align: right;
	}
	.product-variant small {
		font-size: 0.46rem;
	}
	.product-card h3 {
		overflow: hidden;
		margin: 0.35rem 0 0.12rem;
		color: #1b2639;
		font-size: 0.58rem;
		font-weight: 900;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.product-category {
		overflow: hidden;
		margin: 0 0 0.2rem;
		color: #7a8799;
		font-size: 0.43rem;
		font-weight: 700;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.product-price {
		display: block;
		margin-bottom: 0.35rem;
		color: #2563eb;
		font-size: 0.65rem;
		font-weight: 900;
	}
	.add-to-order {
		display: flex;
		width: 100%;
		min-height: 1.45rem;
		align-items: center;
		gap: 0.25rem;
		border: 0;
		border-radius: 0.38rem;
		background: #eef5ff;
		color: #2563eb;
		padding: 0.3rem 0.4rem;
		font: inherit;
		font-size: 0.49rem;
		font-weight: 800;
		text-align: left;
		cursor: pointer;
	}
	.add-to-order:hover:not(:disabled) {
		background: #dceaff;
	}
	.add-to-order:disabled {
		background: #f2f4f7;
		color: #9aa4b2;
		cursor: not-allowed;
	}
	.add-to-order small {
		overflow: hidden;
		margin-left: auto;
		color: #71809a;
		font-size: 0.44rem;
		font-weight: 500;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.add-to-order b {
		margin-left: auto;
		font-size: 0.85rem;
		line-height: 0.7;
	}
	.empty-products {
		grid-column: 1 / -1;
		padding: 2rem;
		color: #74839a;
		font-size: 0.62rem;
		text-align: center;
	}
	.product-footer {
		margin: auto 0 0;
		padding-top: 0.5rem;
		color: #8694a7;
		font-size: 0.5rem;
	}
	.order-panel {
		display: flex;
		min-height: 0;
		flex-direction: column;
		border-left: 1px solid #e4eaf1;
		background: white;
		padding: 0.85rem 0.7rem 0.7rem;
	}
	.order-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.4rem;
		margin-bottom: 0.7rem;
	}
	.clear-order {
		display: inline-flex;
		align-items: center;
		gap: 0.22rem;
		border: 0;
		border-radius: 0.35rem;
		background: #fff5f5;
		color: #e23d42;
		padding: 0.3rem 0.38rem;
		font: inherit;
		font-size: 0.49rem;
		font-weight: 800;
		cursor: pointer;
	}
	.clear-order:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.clear-order svg {
		width: 0.7rem;
		height: 0.7rem;
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 1.8;
	}
	.customer-section > label,
	.cart-heading {
		display: block;
		margin-bottom: 0.3rem;
		color: #6e7f98;
		font-size: 0.53rem;
		font-weight: 800;
	}
	.customer-control {
		display: flex;
		gap: 0.35rem;
	}
	.customer-button {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		border: 0;
		border-radius: 0.42rem;
		background: #f1f3f6;
		color: #1f293b;
		padding: 0.52rem 0.6rem;
		font: inherit;
		font-size: 0.57rem;
		font-weight: 800;
		text-align: left;
		text-overflow: ellipsis;
		white-space: nowrap;
		cursor: pointer;
	}
	.member-button {
		width: 1.9rem;
		border: 0;
		border-radius: 0.42rem;
		background: #347af5;
		color: white;
		font-size: 0.8rem;
		cursor: pointer;
	}
	.discount-note {
		margin: 0.3rem 0 0.7rem;
		color: #099455;
		font-size: 0.49rem;
	}
	.cart-heading {
		display: flex;
		justify-content: space-between;
	}
	.cart-heading span {
		color: #8491a4;
		font-weight: 500;
	}
	.cart-list {
		display: grid;
		max-height: min(39vh, 20rem);
		gap: 0.42rem;
		overflow-y: auto;
	}
	.cart-item {
		border: 1px solid #e1e7ef;
		border-radius: 0.48rem;
		padding: 0.5rem;
	}
	.cart-item-top,
	.cart-item-bottom {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.4rem;
	}
	.cart-item-top h3 {
		margin: 0;
		color: #172033;
		font-size: 0.57rem;
		font-weight: 900;
	}
	.cart-item-top p {
		margin: 0.15rem 0 0;
		color: #8290a2;
		font-size: 0.48rem;
	}
	.cart-item-top > strong {
		color: #111a2b;
		font-size: 0.62rem;
		white-space: nowrap;
	}
	.cart-item-bottom {
		align-items: center;
		margin-top: 0.35rem;
	}
	.quantity-control {
		display: inline-flex;
		height: 1.35rem;
		align-items: center;
		border: 1px solid #e0e7ef;
		border-radius: 0.35rem;
	}
	.quantity-control button {
		width: 1.3rem;
		height: 100%;
		border: 0;
		background: white;
		color: #2563eb;
		font-size: 0.75rem;
		font-weight: 700;
		cursor: pointer;
	}
	.quantity-control button:disabled {
		color: #b4becc;
		cursor: not-allowed;
	}
	.quantity-control strong {
		min-width: 1rem;
		color: #1d293b;
		font-size: 0.55rem;
		text-align: center;
	}
	.remove-item {
		border: 0;
		background: transparent;
		color: #71809a;
		font: inherit;
		font-size: 0.48rem;
		cursor: pointer;
	}
	.empty-cart {
		display: grid;
		gap: 0.25rem;
		place-items: center;
		border: 1px dashed #dce4ee;
		border-radius: 0.5rem;
		padding: 1.1rem 0.5rem;
		color: #7f8ca0;
		text-align: center;
	}
	.empty-cart strong {
		color: #314159;
		font-size: 0.58rem;
	}
	.empty-cart span {
		font-size: 0.5rem;
	}
	.restore-order {
		border: 0;
		background: #eef5ff;
		color: #2563eb;
		padding: 0.4rem;
		font: inherit;
		font-size: 0.5rem;
		font-weight: 800;
		cursor: pointer;
	}
	.restore-order:disabled {
		color: #8490a1;
		cursor: not-allowed;
	}
	.totals {
		display: grid;
		gap: 0.42rem;
		margin-top: auto;
		border-top: 1px solid #e6ebf1;
		padding: 0.6rem 0 0.45rem;
	}
	.totals > div {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		color: #73839c;
		font-size: 0.51rem;
	}
	.totals > div strong {
		color: #1c283b;
		font-size: 0.53rem;
	}
	.totals .discount-value {
		color: #e44848;
	}
	.totals > .grand-total {
		align-items: center;
		margin-top: 0.15rem;
		color: #121d31;
		font-size: 0.68rem;
		font-weight: 900;
	}
	.totals > .grand-total strong {
		color: #2863ed;
		font-size: 1.05rem;
		font-weight: 900;
		white-space: nowrap;
	}
	.order-actions {
		display: grid;
		gap: 0.38rem;
	}
	.hold-button,
	.charge-button {
		min-height: 2.05rem;
		border: 1px solid #dfe6ef;
		border-radius: 0.45rem;
		background: white;
		color: #566985;
		font: inherit;
		font-size: 0.53rem;
		font-weight: 700;
		cursor: pointer;
	}
	.hold-button:disabled,
	.charge-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.charge-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		border-color: #347af5;
		background: #347af5;
		color: white;
		font-size: 0.61rem;
		font-weight: 900;
	}
	.charge-button:not(:disabled):hover {
		background: #1d5fdb;
	}
	.charge-button span {
		font-size: 1rem;
		line-height: 0.7;
	}
	.register-footer {
		display: flex;
		min-height: 2.35rem;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		border-top: 1px solid #e5e9ef;
		background: white;
		padding: 0.45rem 1.1rem;
		color: #8490a1;
		font-size: 0.47rem;
	}
	.register-footer > span:last-child {
		display: flex;
		gap: 0.8rem;
	}
	.register-footer a {
		color: #1356dd;
		text-decoration: none;
	}
	.toast {
		position: fixed;
		z-index: 10;
		right: 1rem;
		bottom: 3rem;
		display: flex;
		max-width: min(30rem, calc(100vw - 2rem));
		align-items: center;
		gap: 0.7rem;
		border: 1px solid #bcebd2;
		border-radius: 0.5rem;
		background: #effcf5;
		box-shadow: 0 8px 24px #172b4d1a;
		color: #168251;
		padding: 0.65rem 0.8rem;
		font-size: 0.57rem;
	}
	.toast button {
		border: 0;
		background: transparent;
		color: inherit;
		font-size: 1rem;
		cursor: pointer;
	}
	.register-dialog {
		width: min(24rem, calc(100% - 2rem));
		max-width: none;
		border: 1px solid #e1e7ef;
		border-radius: 0.75rem;
		background: white;
		box-shadow: 0 24px 75px #07152d40;
		padding: 1rem;
		color: #172033;
	}
	.register-dialog::backdrop {
		background: #07152d70;
		backdrop-filter: blur(2px);
	}
	.dialog-heading {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.8rem;
	}
	.dialog-heading > div > span {
		color: #2563eb;
		font-size: 0.49rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.dialog-heading h2 {
		margin: 0.15rem 0 0;
		color: #1b2a41;
		font-size: 0.88rem;
	}
	.dialog-heading button {
		width: 1.6rem;
		height: 1.6rem;
		border: 0;
		border-radius: 50%;
		background: #f0f3f7;
		color: #5c6c82;
		font-size: 1rem;
		cursor: pointer;
	}
	.register-dialog > p,
	.register-dialog form > p {
		color: #77859a;
		font-size: 0.54rem;
		line-height: 1.5;
	}
	.member-list {
		display: grid;
		gap: 0.35rem;
		margin-top: 0.7rem;
	}
	.member-list button {
		display: grid;
		gap: 0.15rem;
		border: 1px solid #e3e9f1;
		border-radius: 0.45rem;
		background: white;
		padding: 0.55rem;
		text-align: left;
		cursor: pointer;
	}
	.member-list button:hover {
		border-color: #8bb2fb;
		background: #f7faff;
	}
	.member-list strong {
		color: #1e2d45;
		font-size: 0.58rem;
	}
	.member-list span {
		color: #8490a2;
		font-size: 0.5rem;
	}
	.payment-label {
		display: block;
		margin-top: 0.65rem;
		color: #5f7087;
		font-size: 0.54rem;
		font-weight: 800;
	}
	.payment-label input,
	.payment-label select {
		display: block;
		box-sizing: border-box;
		width: 100%;
		height: 2rem;
		margin-top: 0.28rem;
		border: 1px solid #dfe6ef;
		border-radius: 0.4rem;
		background: white;
		color: #25364f;
		padding: 0.4rem 0.5rem;
		font: inherit;
		font-size: 0.57rem;
	}
	.change-due {
		display: flex;
		justify-content: space-between;
		margin-top: 0.7rem;
		color: #687991;
		font-size: 0.56rem;
	}
	.change-due strong {
		color: #13844c;
	}
	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.4rem;
		margin-top: 0.9rem;
	}
	.dialog-actions button {
		padding: 0 0.65rem;
	}
	:global(html[data-theme='dark'] .register-shell) {
		background: #101d35;
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .register-topbar),
	:global(html[data-theme='dark'] .order-panel),
	:global(html[data-theme='dark'] .register-footer),
	:global(html[data-theme='dark'] .product-card),
	:global(html[data-theme='dark'] .register-dialog),
	:global(html[data-theme='dark'] .notification-popover) {
		border-color: #334866;
		background: #172640;
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .topbar-title h1),
	:global(html[data-theme='dark'] .cashier-name),
	:global(html[data-theme='dark'] .products-heading h2),
	:global(html[data-theme='dark'] .order-heading h2),
	:global(html[data-theme='dark'] .product-card h3),
	:global(html[data-theme='dark'] .cart-item-top h3),
	:global(html[data-theme='dark'] .cart-item-top > strong),
	:global(html[data-theme='dark'] .totals > div strong),
	:global(html[data-theme='dark'] .grand-total) {
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .product-search),
	:global(html[data-theme='dark'] .category-tabs button),
	:global(html[data-theme='dark'] .cart-item),
	:global(html[data-theme='dark'] .quantity-control),
	:global(html[data-theme='dark'] .quantity-control button),
	:global(html[data-theme='dark'] .customer-button),
	:global(html[data-theme='dark'] .hold-button) {
		border-color: #415878;
		background: #101d35;
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .product-search input),
	:global(html[data-theme='dark'] .quantity-control strong),
	:global(html[data-theme='dark'] .dialog-heading h2),
	:global(html[data-theme='dark'] .member-list strong) {
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .register-dialog .member-list button) {
		border-color: #415878;
		background: #101d35;
	}
	:global(html[data-theme='dark'] .sidebar-toggle) {
		border-color: #415878;
		background: #122440;
		color: #dbe7fb;
	}
	@media (max-width: 760px) {
		.register-shell {
			display: block;
		}
		.register-sidebar {
			position: fixed;
			z-index: 40;
			inset: 0 auto 0 0;
			width: min(17rem, 88vw);
			height: 100dvh;
			padding: 1rem;
			transform: translateX(-100%);
			visibility: hidden;
			transition:
				transform 180ms ease,
				visibility 180ms ease;
			box-shadow: 12px 0 32px #0004;
		}
		.register-shell.mobile-open .register-sidebar {
			transform: translateX(0);
			visibility: visible;
		}
		.register-shell.collapsed .register-sidebar {
			width: min(17rem, 88vw);
			flex-basis: auto;
		}
		.register-shell.collapsed .brand-copy,
		.register-shell.collapsed .nav-label,
		.register-shell.collapsed .sidebar-footer-copy {
			max-width: 12rem;
			opacity: 1;
			visibility: visible;
		}
		.register-shell.collapsed .sidebar-label {
			max-height: 1.5rem;
			padding: 0 0.65rem 0.5rem;
			opacity: 1;
		}
		.register-shell.collapsed .sidebar-top {
			flex-direction: row;
			gap: 0.4rem;
			margin-bottom: 1.7rem;
			padding: 0.15rem 0.25rem;
		}
		.register-shell.collapsed .cashier-brand {
			justify-content: flex-start;
		}
		.register-shell.collapsed .register-sidebar nav a {
			justify-content: flex-start;
			padding: 0.65rem;
		}
		.register-shell.collapsed .sidebar-footer {
			justify-content: flex-start;
			padding: 0.8rem 0.55rem;
		}
		.register-shell.collapsed .register-sidebar :global(.staff-logout) {
			justify-content: flex-start;
			padding-right: 0.75rem;
			padding-left: 0.75rem;
			text-align: left;
		}
		.register-shell.collapsed .register-sidebar :global(.staff-logout span) {
			display: inline;
		}
		.sidebar-toggle {
			display: none;
		}
		.sidebar-backdrop {
			position: fixed;
			z-index: 30;
			inset: 0;
			display: block;
			border: 0;
			background: #07152d80;
		}
		.mobile-menu-button {
			display: grid;
		}
	}
	@media (max-width: 760px) {
		.register-workspace {
			grid-template-columns: minmax(0, 1fr) minmax(16rem, 40%);
		}
		.product-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.product-count > span {
			display: none;
		}
	}
	@media (max-width: 560px) {
		.register-topbar {
			align-items: flex-start;
			flex-direction: column;
			gap: 0.4rem;
			padding: 0.55rem 0.7rem;
		}
		.topbar-actions {
			width: 100%;
			justify-content: flex-end;
		}
		.register-workspace {
			grid-template-columns: 1fr;
		}
		.products-area {
			min-height: 25rem;
		}
		.order-panel {
			min-height: 25rem;
			border-top: 1px solid #e4eaf1;
			border-left: 0;
		}
		.cart-list {
			max-height: 15rem;
		}
		.totals {
			margin-top: 1rem;
		}
		.register-footer {
			align-items: flex-start;
			flex-direction: column;
			gap: 0.3rem;
			padding: 0.6rem 0.7rem;
		}
	}
	@media (max-width: 360px) {
		.product-grid {
			grid-template-columns: 1fr;
		}
		.product-image {
			height: 4rem;
		}
	}
</style>
