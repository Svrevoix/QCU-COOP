<script lang="ts">
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	type Product = { id: number; sku: string; product_name: string; category_id: number | null; cost_price: number; selling_price: number; stock: number; reorder_level: number; refill_level: number; refill_quantity: number; status: string };
	type Balance = { product_id: number; warehouse_id: number; quantity: number; location_type: string };
	type StockAlert = { id: number; product_id: number; warehouse_stock: number; store_stock: number; alert_type: string; resolved: boolean; created_at: string };
	type Category = { id: number; category_name: string };

	let query = $state('');
	let statusFilter = $state('All statuses');
	let selectedProductId = $state('');
	let transferProductId = $state('');
	let transferQuantity = $state('1');
	let restockSearchTerm = $state('');
	let restockPickerOpen = $state(false);
	let activeRestockProductIndex = $state(0);
	let restockSearchInput = $state<HTMLInputElement>();
	let restockQuantityInput = $state<HTMLInputElement>();
	let products = $derived(page.data.products as Product[]);
	const normalizeProductSearch = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
	let matchingRestockProducts = $derived.by(() => {
		const search = normalizeProductSearch(restockSearchTerm);
		if (!search) return products;
		return products.filter((product) =>
			normalizeProductSearch(`${product.product_name} ${product.sku}`).includes(search)
		);
	});
	let balances = $derived(page.data.balances as Balance[]);
	let stockAlerts = $derived(page.data.stockAlerts as StockAlert[]);
	let categories = $derived(page.data.categories as Category[]);
	let inventoryItems = $derived(products.map((product) => {
		const rows = balances.filter((balance) => balance.product_id === product.id);
		const storeRows = rows.filter((balance) => balance.location_type === 'store');
		const warehouseRows = rows.filter((balance) => balance.location_type === 'warehouse');
		const storeStock = storeRows.length ? storeRows.reduce((sum, row) => sum + Number(row.quantity), 0) : Number(product.stock ?? 0);
		const warehouseStock = warehouseRows.reduce((sum, row) => sum + Number(row.quantity), 0);
		const refillLevel = Number(product.refill_level ?? 0);
		const refillQuantity = Number(product.refill_quantity ?? 0);
		const status = storeStock <= 0 ? 'Out of stock' : storeStock <= Number(product.reorder_level ?? 0) ? 'Low stock' : 'In stock';
		const categoryName = categories.find((category) => category.id === product.category_id)?.category_name ?? 'Uncategorized';
		return { ...product, storeStock, warehouseStock, refillLevel, refillQuantity, categoryName, status };
	}));
	let inventoryValue = $derived(inventoryItems.reduce((sum, item) => sum + (item.storeStock + item.warehouseStock) * Number(item.cost_price ?? 0), 0));
	let reorderCount = $derived(inventoryItems.filter((item) => item.status !== 'In stock').length);
	let categoryCount = $derived(new Set(products.map((item) => item.category_id).filter((id) => id !== null)).size);
	const workflows = [
		{
			label: 'Purchase Item',
			href: '/staff/admin/inventory/purchases/receiving',
			detail: 'Receiving report'
		},
		{
			label: 'Purchase Return',
			href: '/staff/admin/inventory/purchases/return',
			detail: 'Return goods to supplier'
		},
		{
			label: 'Inventory Setup',
			href: '/staff/admin/inventory/adjustments/beginning-inventory',
			detail: 'Beginning inventory'
		},
		{
			label: 'Physical Count',
			href: '/staff/admin/inventory/adjustments/actual-count',
			detail: 'Actual count sheet'
		},
		{
			label: 'Inventory Adjustment',
			href: '/staff/admin/inventory/adjustments/adjusted-item',
			detail: 'Adjusted item'
		},
		{
			label: 'Transfer Slip',
			href: '/staff/admin/inventory/adjustments/transfer-item',
			detail: 'Transfer item'
		}
	];
	const filteredItems = $derived(
		inventoryItems.filter((item) => {
			const matchesQuery = `${item.sku} ${item.product_name} ${item.categoryName}`
				.toLowerCase()
				.includes(query.trim().toLowerCase());
			const matchesStatus = statusFilter === 'All statuses' || item.status === statusFilter;
			return matchesQuery && matchesStatus;
		})
	);
	const money = (amount: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
	const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(
		new Date()
	);

	async function selectRestockProduct(product: Product) {
		selectedProductId = String(product.id);
		restockSearchTerm = `${product.product_name} · ${product.sku}`;
		restockPickerOpen = false;
		restockSearchInput?.setCustomValidity('');
		await tick();
		document.getElementById('restock-title')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
		restockQuantityInput?.focus({ preventScroll: true });
	}

	function prepareStoreTransfer(item: { id: number; product_name: string; refillQuantity: number; warehouseStock: number }) {
		transferProductId = String(item.id);
		transferQuantity = String(Math.max(1, Math.min(item.refillQuantity || 1, item.warehouseStock || 1)));
		document.getElementById('store-transfer-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}

	function handleRestockSearchKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			restockPickerOpen = false;
		} else if (event.key === 'ArrowDown' && matchingRestockProducts.length) {
			event.preventDefault();
			restockPickerOpen = true;
			activeRestockProductIndex = Math.min(
				Math.max(activeRestockProductIndex + 1, 0),
				matchingRestockProducts.length - 1
			);
		} else if (event.key === 'ArrowUp' && matchingRestockProducts.length) {
			event.preventDefault();
			restockPickerOpen = true;
			activeRestockProductIndex =
				activeRestockProductIndex <= 0
					? matchingRestockProducts.length - 1
					: activeRestockProductIndex - 1;
		} else if (
			event.key === 'Enter' &&
			restockPickerOpen &&
			matchingRestockProducts[
				activeRestockProductIndex >= 0 ? activeRestockProductIndex : 0
			]
		) {
			event.preventDefault();
			selectRestockProduct(
				matchingRestockProducts[activeRestockProductIndex >= 0 ? activeRestockProductIndex : 0]
			);
		}
	}

	function handleRestockSubmit(event: SubmitEvent) {
		if (selectedProductId) return;
		event.preventDefault();
		restockSearchInput?.setCustomValidity('Select a product from the matching list.');
		restockSearchInput?.reportValidity();
	}
</script>

<svelte:head>
	<title>Inventory | QCU Coop Admin</title>
	<meta
		name="description"
		content="Manage inventory records, stock levels, and supplier profiles."
	/>
</svelte:head>

<main class="admin-page inventory-page">
	<header class="inventory-topbar">
		<div>
			<h1>Inventory</h1>
			<p>Directory / Inventory Control</p>
		</div>
		<div class="topbar-actions">
			<span class="date-chip">
				<svg viewBox="0 0 24 24" aria-hidden="true"
					><rect x="3.5" y="5" width="17" height="15" rx="2" /><path
						d="M7.5 3v4M16.5 3v4M3.5 9h17"
					/></svg
				>
				{monthLabel}
			</span>
			<button class="icon-button" type="button" aria-label="Notifications">
				<svg viewBox="0 0 24 24" aria-hidden="true"
					><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg
				>
			</button>
			<button class="avatar" type="button" aria-label="Administrator account">QC</button>
		</div>
	</header>

	<div class="page-heading">
		<div>
			<h2>Inventory management</h2>
			<p>Track store stock, warehouse replenishment, and product availability.</p>
		</div>
		<a class="add-button" href="/staff/admin/inventory/profiles/item"
			><span aria-hidden="true">+</span> Add item</a
		>
	</div>

	<section class="inventory-stats" aria-label="Inventory summary">
		<article><span>Total items</span><strong>{products.length.toLocaleString()}</strong><small>Across {categoryCount} categories</small></article>
		<article><span>Inventory value</span><strong>{money(inventoryValue)}</strong><small>At current cost</small></article>
		<article><span>Reorder queue</span><strong>{reorderCount}</strong><small class="warn">Low or out of stock</small></article>
		<article><span>Suppliers</span><strong>{page.data.supplierCount}</strong><small>Supplier records</small></article>
	</section>
	{#if stockAlerts.length}
		<section class="stock-alerts" aria-labelledby="stock-alerts-title">
			<div class="section-heading"><h2 id="stock-alerts-title">Stock alerts</h2><p>Warehouse stock is needed to refill these items.</p></div>
			<div class="stock-alert-list">
				{#each stockAlerts as alert (alert.id)}
					{@const item = products.find((product) => product.id === alert.product_id)}
					<article><strong>{item?.product_name ?? `Item #${alert.product_id}`}</strong><span>Store: {alert.store_stock} · Warehouse: {alert.warehouse_stock}</span><b>{alert.alert_type.replaceAll('_', ' ')}</b></article>
				{/each}
			</div>
		</section>
	{/if}

	<section class="restock-panel" aria-labelledby="restock-title">
		<div class="section-heading"><h2 id="restock-title">Restock warehouse</h2><p>Receive stock into warehouse inventory. Store stock is tracked separately.</p></div>
		{#if page.form?.restockError}<p class="restock-message error" role="alert">{page.form.restockError}</p>{/if}
		{#if page.form?.restockSuccess}<p class="restock-message success" role="status">{page.form.restockSuccess}</p>{/if}
		<form method="POST" action="?/restock" class="restock-form" onsubmit={handleRestockSubmit}>
			<label class="restock-item-label" for="restock-item-search">Item
				<div class="restock-item-picker">
					<input
						bind:this={restockSearchInput}
						id="restock-item-search"
						type="text"
						placeholder="Search item..."
						autocomplete="off"
						role="combobox"
						aria-autocomplete="list"
						aria-expanded={restockPickerOpen}
						aria-controls="restock-product-options"
						aria-activedescendant={restockPickerOpen && matchingRestockProducts[activeRestockProductIndex]
							? `restock-product-${matchingRestockProducts[activeRestockProductIndex].id}`
							: undefined}
						value={restockSearchTerm}
						onfocus={() => {
							restockPickerOpen = true;
							activeRestockProductIndex = -1;
						}}
						onblur={() => (restockPickerOpen = false)}
						oninput={(event) => {
							restockSearchTerm = event.currentTarget.value;
							selectedProductId = '';
							restockPickerOpen = true;
							activeRestockProductIndex = -1;
							event.currentTarget.setCustomValidity('');
						}}
						onkeydown={handleRestockSearchKeydown}
					/>
					<input type="hidden" name="productId" value={selectedProductId} />
					{#if restockPickerOpen}
						<div class="restock-product-options" id="restock-product-options" role="listbox" aria-label="Matching products">
							{#each matchingRestockProducts as product, index (product.id)}
								<button
									id="restock-product-{product.id}"
									class="restock-product-option"
									class:active={index === activeRestockProductIndex}
									type="button"
									role="option"
									aria-selected={String(product.id) === selectedProductId}
									onmousedown={(event) => event.preventDefault()}
									onmouseenter={() => (activeRestockProductIndex = index)}
									onclick={() => selectRestockProduct(product)}
								>
									<strong>{product.product_name}</strong><span>{product.sku}</span>
								</button>
							{:else}
								<p class="restock-no-matches">No matching products.</p>
							{/each}
						</div>
					{/if}
				</div>
			</label>
			<label>Quantity received<input bind:this={restockQuantityInput} name="quantity" type="number" min="1" step="1" required /></label>
			<label>Note<input name="remarks" maxlength="500" placeholder="Optional reference or note" /></label>
			<button class="add-button" type="submit" disabled={!products.length}>Receive stock</button>
		</form>
	</section>
	{#if transferProductId}
		{@const transferItem = inventoryItems.find((item) => String(item.id) === transferProductId)}
		<section class="restock-panel" id="store-transfer-panel" aria-labelledby="store-transfer-title">
			<div class="section-heading"><h2 id="store-transfer-title">Transfer stock to store</h2><p>{transferItem?.product_name ?? 'Selected item'} · {transferItem?.warehouseStock ?? 0} available in warehouse. The cashier can sell only store stock.</p></div>
			{#if page.form?.transferError}<p class="restock-message error" role="alert">{page.form.transferError}</p>{/if}
			{#if page.form?.transferSuccess}<p class="restock-message success" role="status">{page.form.transferSuccess}</p>{/if}
			<form method="POST" action="?/transferToStore" class="restock-form transfer-form" use:enhance>
				<input type="hidden" name="productId" value={transferProductId} />
				<label>Quantity to move<input name="quantity" type="number" min="1" max={transferItem?.warehouseStock ?? 0} step="1" bind:value={transferQuantity} required /></label>
				<label>Note<input name="remarks" maxlength="500" placeholder="Optional transfer note" /></label>
				<button class="add-button" type="submit" disabled={!transferItem || transferItem.warehouseStock < 1}>Transfer to store</button>
				<button class="row-restock" type="button" onclick={() => (transferProductId = '')}>Cancel</button>
			</form>
		</section>
	{/if}
	<section class="directory-panel" aria-label="Inventory items">
		<div class="directory-heading">
			<div><h2>Inventory items</h2><p>Store availability, reserve stock, and refill settings for each product.</p></div>
			<span class="directory-count">{filteredItems.length} of {inventoryItems.length} items</span>
		</div>
		<div class="toolbar">
			<label class="search">
				<svg viewBox="0 0 24 24" aria-hidden="true"
					><circle cx="10.8" cy="10.8" r="6.3" /><path d="m16 16 4 4" /></svg
				>
				<input bind:value={query} placeholder="Search by item, SKU, or category" aria-label="Search inventory" />
			</label>
			<select bind:value={statusFilter} aria-label="Filter by status">
				<option>All statuses</option>
				<option>In stock</option>
				<option>Low stock</option>
				<option>Out of stock</option>
			</select>
		</div>
		<div class="table-wrap">
			<table>
				<thead><tr><th>Item</th><th>Category</th><th>Store</th><th>Warehouse</th><th>Auto refill</th><th>Reorder at</th><th>Price</th><th>Status</th><th></th></tr></thead>
				<tbody>
					{#each filteredItems as item (item.id)}
						<tr>
							<td class="item-cell"><strong>{item.product_name}</strong><small>{item.sku}</small></td>
							<td>{item.categoryName}</td>
							<td class="number" class:low-number={item.status === 'Low stock'} class:zero-number={item.status === 'Out of stock'}>{item.storeStock}<small>in store</small></td>
							<td class="number">{item.warehouseStock}<small>in warehouse</small></td>
							<td class="refill-rule">At {item.refillLevel}, add {item.refillQuantity}</td>
							<td>{item.reorder_level}</td>
							<td class="price">{money(Number(item.selling_price))}</td>
							<td><span class="status" class:low={item.status === 'Low stock'} class:out={item.status === 'Out of stock'}><i></i>{item.status}</span></td>
							<td class="row-actions"><button class="row-restock" type="button" onclick={() => selectRestockProduct(item)}>Receive</button><button class="row-restock" type="button" onclick={() => prepareStoreTransfer(item)} disabled={item.warehouseStock < 1}>To store</button></td>
						</tr>
					{:else}
						<tr><td class="no-results" colspan="9">No items match your search and status filters.</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
		<div class="directory-footer"><span>Store and warehouse quantities update independently.</span><a href="/staff/admin/inventory/profiles/item">Manage product settings</a></div>
	</section>

	<details class="workflow-disclosure">
		<summary>Inventory workflows <span>Stock movement and adjustment forms</span></summary>
		<div class="workflow-links">
			{#each workflows as workflow}
				<a href={workflow.href}><strong>{workflow.label}</strong><span>{workflow.detail}</span></a>
			{/each}
		</div>
	</details>
</main>

<style>
	.inventory-page {
		padding-top: 0;
	}
	.inventory-topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 3.9rem;
		margin: 0 calc(clamp(1rem, 3vw, 3rem) * -1) 1rem;
		border-bottom: 1px solid #e5e9ef;
		background: #fff;
		padding: 0.55rem clamp(1rem, 3vw, 3rem);
	}
	.inventory-topbar h1 {
		margin: 0;
		color: #172b4d;
		font-size: 0.88rem;
		font-weight: 900;
	}
	.inventory-topbar p {
		margin: 0.1rem 0 0;
		color: #7f8a9b;
		font-size: 0.62rem;
	}
	.topbar-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.date-chip {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		border: 1px solid #e2e6ec;
		border-radius: 0.45rem;
		background: #f8f9fb;
		color: #778397;
		padding: 0.42rem 0.62rem;
		font-size: 0.6rem;
	}
	.date-chip svg,
	.icon-button svg {
		width: 0.85rem;
		height: 0.85rem;
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 1.8;
	}
	.icon-button,
	.avatar {
		display: grid;
		width: 2rem;
		height: 2rem;
		place-items: center;
		border: 1px solid #e3e8ef;
		border-radius: 50%;
		background: #fff;
		color: #6d7c91;
		cursor: pointer;
	}
	.avatar {
		border: 0;
		background: #2563eb;
		color: white;
		font-size: 0.58rem;
		font-weight: 900;
	}
	.page-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin: 1.15rem 0 0.8rem;
	}
	.page-heading h2 {
		margin: 0;
		color: #1a2c49;
		font-size: 1.1rem;
		font-weight: 900;
		letter-spacing: -0.025em;
	}
	.page-heading p {
		margin: 0.25rem 0 0;
		color: #8290a2;
		font-size: 0.65rem;
	}
	.add-button {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		border-radius: 0.5rem;
		background: #347af5;
		color: white;
		padding: 0.6rem 0.82rem;
		font-size: 0.64rem;
		font-weight: 800;
		text-decoration: none;
		white-space: nowrap;
	}
	.add-button:hover {
		background: #1d5fdb;
	}
	.add-button > span {
		font-size: 0.95rem;
		line-height: 0.8;
	}
	.inventory-stats {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.85rem;
		margin-bottom: 1rem;
	}
	.inventory-stats article {
		min-width: 0;
		border: 1px solid #e8edf3;
		border-radius: 0.7rem;
		background: white;
		box-shadow: 0 5px 16px rgba(32, 55, 88, 0.05);
		padding: 1rem 1.1rem;
	}
	.inventory-stats article > span,
	.inventory-stats small {
		display: block;
		color: #8491a2;
		font-size: 0.55rem;
	}
	.inventory-stats article > span {
		font-weight: 800;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}
	.inventory-stats strong {
		display: block;
		margin: 0.23rem 0 0.12rem;
		color: #1b2d4b;
		font-size: 1.12rem;
		font-weight: 900;
	}
	.inventory-stats .warn {
		color: #e77b0b;
	}
	.stock-alerts {
		margin-bottom: 1rem;
		border: 1px solid #f2c2a8;
		border-radius: .8rem;
		background: #fff8f4;
		padding: 1rem 1.15rem;
	}
	.stock-alerts h2 { margin: 0; color: #8d3e19; font-size: .9rem; }
	.stock-alerts p { margin: .25rem 0 .75rem; color: #8c6a5a; font-size: .7rem; }
	.stock-alert-list { display: grid; gap: .45rem; }
	.stock-alert-list article { display: flex; flex-wrap: wrap; align-items: center; gap: .65rem 1rem; border: 1px solid #f2d6c8; border-radius: .55rem; background: white; padding: .65rem .8rem; font-size: .7rem; }
	.stock-alert-list strong { color: #263752; }
	.stock-alert-list span { color: #66768d; }
	.stock-alert-list b { margin-left: auto; color: #a8421d; font-size: .62rem; text-transform: capitalize; }
	.directory-panel,
	.restock-panel {
		margin-bottom: 1rem;
		border: 1px solid #e4eaf2;
		border-radius: 0.8rem;
		background: white;
		box-shadow: 0 8px 24px rgba(32, 55, 88, 0.04);
	}
	.restock-panel { padding: 1.05rem 1.15rem; }
	.restock-form { display: grid; grid-template-columns: 1.5fr .8fr 1.4fr auto; align-items: end; gap: .6rem; }
	.transfer-form { grid-template-columns: minmax(12rem, .8fr) minmax(14rem, 1fr) auto auto; }
	.row-actions { display: flex; flex-wrap: wrap; gap: .35rem; }
	.restock-form label { display: grid; gap: .4rem; color: #66768d; font-size: .7rem; font-weight: 700; }
	.restock-form input:not([type='hidden']) { box-sizing: border-box; width: 100%; min-width: 0; height: 2.7rem; border: 1px solid #e1e6ed; border-radius: .45rem; background: #fafbfc; color: #34445d; padding: .55rem .7rem; font: inherit; font-size: .72rem; }
	.restock-item-picker { position: relative; }
	.restock-product-options { position: absolute; z-index: 20; top: calc(100% + .25rem); right: 0; left: 0; max-height: 15rem; overflow-y: auto; overscroll-behavior: contain; border: 1px solid #dce3ed; border-radius: .5rem; background: white; box-shadow: 0 12px 28px rgba(23, 43, 77, .18); }
	.restock-product-option { display: flex; width: 100%; min-height: 2.35rem; align-items: center; justify-content: space-between; gap: .75rem; border: 0; border-bottom: 1px solid #edf1f5; background: transparent; padding: .55rem .65rem; color: #34445d; font: inherit; font-size: .62rem; text-align: left; cursor: pointer; }
	.restock-product-option:last-child { border-bottom: 0; }
	.restock-product-option:hover, .restock-product-option.active { background: #eff6ff; }
	.restock-product-option strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.restock-product-option span { flex: 0 0 auto; color: #71809a; }
	.restock-no-matches { margin: 0; padding: .7rem; color: #71809a; font-size: .62rem; font-weight: 500; }
	.restock-form input[type='hidden'] { display: none; }
	.restock-form .add-button { border: 0; cursor: pointer; }
	.restock-form .add-button:disabled { opacity: .5; cursor: not-allowed; }
	.restock-message { margin: .5rem 0; border-radius: .45rem; padding: .5rem .65rem; font-size: .62rem; }
	.restock-message.error { background: #fff1f2; color: #b91c1c; }
	.restock-message.success { background: #f0fbf4; color: #187342; }
	.row-restock { color: #347af5; font-size: .57rem; font-weight: 800; text-decoration: none; }
	.row-restock:hover { text-decoration: underline; }
	.section-heading {
		margin-bottom: 0.65rem;
	}
	.section-heading h2 {
		margin: 0;
		color: #263752;
		font-size: 0.72rem;
		font-weight: 900;
	}
	.section-heading p {
		margin: 0.2rem 0 0;
		color: #8b99ab;
		font-size: 0.58rem;
	}
	.maintenance-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
	}
	.maintenance-grid a {
		display: flex;
		min-width: 0;
		align-items: flex-start;
		gap: 0.5rem;
		border-right: 1px solid #e9edf3;
		padding: 0.5rem 0.65rem;
		text-decoration: none;
	}
	.maintenance-grid a:last-child {
		border-right: 0;
	}
	.maintenance-grid a:hover {
		background: #f8faff;
	}
	.profile-icon {
		display: grid;
		width: 1.45rem;
		height: 1.45rem;
		flex: 0 0 auto;
		place-items: center;
		border-radius: 0.4rem;
		background: #eff6ff;
		color: #4a8bff;
	}
	.profile-icon svg {
		width: 0.8rem;
		height: 0.8rem;
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 1.7;
	}
	.profile-copy {
		display: grid;
		min-width: 0;
		gap: 0.25rem;
	}
	.profile-copy > strong {
		color: #263752;
		font-size: 0.7rem;
	}
	.profile-copy > span {
		min-height: 1.45rem;
		color: #8793a4;
		font-size: 0.53rem;
		line-height: 1.35;
	}
	.profile-copy b {
		color: #347af5;
		font-size: 0.52rem;
	}
	.directory-panel {
		padding: 1rem 1.1rem;
	}
	.directory-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: .35rem;
	}
	.directory-heading h2 { margin: 0; color: #233a5d; font-size: 1rem; }
	.directory-heading p { margin: .25rem 0 0; color: #8491a2; font-size: .7rem; }
	.directory-count { flex: 0 0 auto; border-radius: 2rem; background: #edf4ff; color: #347af5; padding: .45rem .7rem; font-size: .68rem; font-weight: 800; }
	.directory-footer a { color: #347af5; font-weight: 800; text-decoration: none; }
	.refill-rule { color: #445a78; font-weight: 700; white-space: nowrap; }
	.item-cell { min-width: 10rem; }
	td.number small { color: #8c99aa; font-size: .58rem; font-weight: 500; }
	.status { font-size: .62rem; }
	.row-restock { display: inline-flex; border: 1px solid #cbd8e9; border-radius: .4rem; background: transparent; padding: .4rem .55rem; color: #347af5; font: inherit; font-size: .65rem; font-weight: 800; cursor: pointer; }
	.row-restock:hover { border-color: #347af5; background: #eff6ff; }
	.table-wrap { border: 1px solid #e7edf4; border-radius: .55rem; }
	table {
		min-width: 900px;
	}
	.toolbar {
		display: flex;
		gap: 0.5rem;
		padding: 0.65rem 0;
	}
	.search {
		display: flex;
		min-width: 0;
		flex: 1;
		align-items: center;
		gap: 0.45rem;
		border: 1px solid #e1e6ed;
		border-radius: 0.45rem;
		background: #fafbfc;
		padding: 0.45rem 0.6rem;
	}
	.search svg {
		width: 0.78rem;
		height: 0.78rem;
		flex: 0 0 auto;
		fill: none;
		stroke: #96a1b0;
		stroke-linecap: round;
		stroke-width: 1.8;
	}
	.search input {
		width: 100%;
		border: 0;
		outline: 0;
		background: transparent;
		color: #34445d;
		font: inherit;
		font-size: 0.59rem;
	}
	.search input::placeholder {
		color: #929dad;
	}
	.toolbar select {
		min-width: 6.6rem;
		border: 1px solid #e1e6ed;
		border-radius: 0.45rem;
		background: #fafbfc;
		color: #7f8b9d;
		padding: 0.45rem 0.55rem;
		font: inherit;
		font-size: 0.68rem;
	}
	.table-wrap {
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
	}
	th {
		background: #f3f5f8;
		color: #7e8998;
		font-size: 0.62rem;
		text-align: left;
		text-transform: uppercase;
	}
	th:first-child {
		border-radius: 0.35rem 0 0 0.35rem;
	}
	th:last-child {
		border-radius: 0 0.35rem 0.35rem 0;
	}
	th,
	td {
		border-bottom: 1px solid #e9edf2;
		padding: 0.7rem 0.45rem;
	}
		td {
		color: #7c8798;
		font-size: 0.72rem;
	}
	td strong,
	td small {
		display: block;
	}
	td strong {
		color: #2b3b54;
		font-size: 0.7rem;
	}
	td small {
		margin-top: 0.12rem;
		color: #9ba5b3;
		font-size: 0.61rem;
	}
	.number,
	.price {
		color: #293a56;
		font-weight: 800;
	}
	.low-number {
		color: #e77b0b;
	}
	.zero-number {
		color: #e44848;
	}
	.status {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		border-radius: 1rem;
		background: #e9f8f0;
		color: #168251;
		padding: 0.22rem 0.42rem;
		font-size: 0.5rem;
		font-weight: 800;
		white-space: nowrap;
	}
	.status i {
		width: 0.28rem;
		height: 0.28rem;
		border-radius: 50%;
		background: #15ad68;
	}
	.status.low {
		background: #fff4e2;
		color: #d98516;
	}
	.status.low i {
		background: #f1a52a;
	}
	.status.out {
		background: #ffeded;
		color: #df5050;
	}
	.status.out i {
		background: #e65b5b;
	}
	td.no-results {
		padding: 2rem 0.5rem;
		color: #8291a4;
		text-align: center;
	}
	.directory-footer {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		padding-top: 0.65rem;
		color: #8894a5;
		font-size: 0.65rem;
	}
	.directory-footer span {
		color: #9ba5b3;
	}
	.empty-directory {
		padding: 3rem 1rem;
		text-align: center;
	}
	.empty-directory h2 {
		margin: 0;
		color: #263752;
		font-size: 0.85rem;
	}
	.empty-directory p {
		color: #8291a4;
		font-size: 0.62rem;
	}
	.workflow-disclosure {
		margin: 0 0 0.8rem;
		border: 1px solid #e4eaf2;
		border-radius: 0.7rem;
		background: white;
	}
	.workflow-disclosure summary {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		padding: 0.75rem 0.9rem;
		color: #263752;
		font-size: 0.62rem;
		font-weight: 800;
		cursor: pointer;
	}
	.workflow-disclosure summary span {
		color: #8b99ab;
		font-size: 0.55rem;
		font-weight: 500;
	}
	.workflow-links {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
		padding: 0 0.8rem 0.8rem;
	}
	.workflow-links a {
		display: grid;
		gap: 0.25rem;
		border: 1px solid #e7edf4;
		border-radius: 0.5rem;
		padding: 0.6rem;
		text-decoration: none;
	}
	.workflow-links strong {
		color: #29405f;
		font-size: 0.6rem;
	}
	.workflow-links a span {
		color: #8391a4;
		font-size: 0.54rem;
	}
	:global(html[data-theme='dark'] .inventory-page .inventory-topbar),
	:global(html[data-theme='dark'] .inventory-page .inventory-stats article),
	:global(html[data-theme='dark'] .inventory-page .stock-alerts),
	:global(html[data-theme='dark'] .inventory-page .operations-panel),
	:global(html[data-theme='dark'] .inventory-page .directory-panel),
	:global(html[data-theme='dark'] .inventory-page .restock-panel),
	:global(html[data-theme='dark'] .inventory-page .workflow-disclosure) {
		border-color: #334866;
		background: #172640;
	}
	:global(html[data-theme='dark'] .inventory-page .stock-alerts) { border-color: #7b4a36; background: #2b2430; }
	:global(html[data-theme='dark'] .inventory-page .stock-alerts h2),
	:global(html[data-theme='dark'] .inventory-page .stock-alert-list b) { color: #ffd0b8; }
	:global(html[data-theme='dark'] .inventory-page .stock-alerts p),
	:global(html[data-theme='dark'] .inventory-page .stock-alert-list span) { color: #d4b5a5; }
	:global(html[data-theme='dark'] .inventory-page .stock-alert-list article) { border-color: #664638; background: #172640; }
	:global(html[data-theme='dark'] .inventory-page .stock-alert-list strong) { color: #edf4ff; }
	:global(html[data-theme='dark'] .inventory-page h1),
	:global(html[data-theme='dark'] .inventory-page h2),
	:global(html[data-theme='dark'] .inventory-page h3),
	:global(html[data-theme='dark'] .inventory-page .inventory-stats strong),
	:global(html[data-theme='dark'] .inventory-page .maintenance-grid strong),
	:global(html[data-theme='dark'] .inventory-page td strong),
	:global(html[data-theme='dark'] .inventory-page .number),
	:global(html[data-theme='dark'] .inventory-page .price) {
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .inventory-page .maintenance-grid a),
	:global(html[data-theme='dark'] .inventory-page .row-restock),
	:global(html[data-theme='dark'] .inventory-page .workflow-links a) {
		border-color: #415878;
		background: #101d35;
	}
	:global(html[data-theme='dark'] .inventory-page .directory-heading p),
	:global(html[data-theme='dark'] .inventory-page .directory-footer span),
	:global(html[data-theme='dark'] .inventory-page td.number small) { color: #9fb0c7; }
	:global(html[data-theme='dark'] .inventory-page .refill-rule) { color: #c9d6e8; }
	:global(html[data-theme='dark'] .inventory-page .directory-count) { background: #203a60; color: #8eb7ff; }
	:global(html[data-theme='dark'] .inventory-page .search),
	:global(html[data-theme='dark'] .inventory-page .toolbar select),
	:global(html[data-theme='dark'] .inventory-page .restock-form input),
	:global(html[data-theme='dark'] .inventory-page .restock-product-options) {
		border-color: #415878;
		background: #172640;
	}
	:global(html[data-theme='dark'] .inventory-page .restock-form input:not([type='hidden'])) {
		color: #edf4ff;
		caret-color: #8eb7ff;
	}
	:global(html[data-theme='dark'] .inventory-page .restock-form input::placeholder) { color: #91a3bd; opacity: 1; }
	:global(html[data-theme='dark'] .inventory-page .restock-form input:focus-visible) {
		border-color: #76a7ff;
		outline: 2px solid rgb(65 120 216 / 35%);
		outline-offset: 1px;
	}
	:global(html[data-theme='dark'] .inventory-page .restock-form label) { color: #c9d6e8; }
	:global(html[data-theme='dark'] .inventory-page .section-heading p) { color: #a9bad0; }
	:global(html[data-theme='dark'] .inventory-page .restock-product-option) {
		border-color: #334866;
		color: #edf4ff;
	}
	:global(html[data-theme='dark'] .inventory-page .restock-product-option:hover),
	:global(html[data-theme='dark'] .inventory-page .restock-product-option.active) {
		background: #203a60;
	}
	:global(html[data-theme='dark'] .inventory-page .restock-product-option span),
	:global(html[data-theme='dark'] .inventory-page .restock-no-matches) {
		color: #b8c8dd;
	}
	:global(html[data-theme='dark'] .inventory-page th) {
		background: #101d35;
		color: #b8c8dd;
	}
	:global(html[data-theme='dark'] .inventory-page td) {
		border-color: #334866;
	}
	@media (max-width: 900px) {
		.maintenance-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
		.maintenance-grid a:nth-child(3) {
			border-right: 0;
		}
		.maintenance-grid a:nth-child(n + 4) {
			border-top: 1px solid #e9edf3;
		}
	}
	@media (max-width: 640px) {
		.inventory-topbar {
			min-height: 3.5rem;
		}
		.page-heading {
			align-items: flex-start;
		}
		.page-heading h2 {
			font-size: 0.98rem;
		}
		.page-heading p {
			max-width: 27rem;
			line-height: 1.45;
		}
		.inventory-stats {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.maintenance-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.maintenance-grid a:nth-child(odd) {
			border-right: 1px solid #e9edf3;
		}
		.maintenance-grid a:nth-child(even) {
			border-right: 0;
		}
		.maintenance-grid a:nth-child(3) {
			border-top: 1px solid #e9edf3;
		}
		.workflow-links {
			grid-template-columns: repeat(2, 1fr);
		}
		.restock-form { grid-template-columns: repeat(2, minmax(0, 1fr)); }
		.transfer-form { grid-template-columns: repeat(2, minmax(0, 1fr)); }
	}
	@media (max-width: 420px) {
		.date-chip {
			font-size: 0;
		}
		.date-chip svg {
			width: 0.95rem;
			height: 0.95rem;
		}
		.page-heading {
			flex-direction: column;
		}
		.toolbar {
			flex-wrap: wrap;
		}
		.search {
			flex-basis: 100%;
		}
		.workflow-links {
			grid-template-columns: 1fr;
		}
		.restock-form { grid-template-columns: 1fr; }
		.transfer-form { grid-template-columns: 1fr; }
	}
</style>
