<script lang="ts">
	import { page } from '$app/state';
	import { productCatalog } from '$lib/products';
	const profiles = { warehouse: ['Warehouse Profile', ['Warehouse code', 'Warehouse name', 'Manager', 'Location']], item: ['Item Profile', ['Item name', 'SKU', 'Category', 'Unit price']], supplier: ['Supplier Profile', ['Supplier name', 'Contact person', 'Email', 'Phone']], customer: ['Customer Profile', ['Customer name', 'Customer ID', 'Email', 'Contact number']], 'payment-types': ['Payment Types Profile', ['Payment type name', 'Code', 'Settlement account', 'Status']] } as const;
	let profile = $derived(profiles[page.params.profile as keyof typeof profiles] ?? profiles.item);
	let isItemProfile = $derived(page.params.profile === 'item');
	let searchQuery = $state('');
	let selectedCategory = $state('all');
	const categoryLabels: Record<string, string> = {
		supplies: 'School & office supplies',
		uniforms: 'Uniforms',
		merchandise: 'QCU merchandise & accessories',
		food: 'Food, snacks & dining items',
		care: 'Personal care, hygiene & medical',
		bags: 'Miscellaneous bags & accessories',
		textbooks: 'Academic textbooks',
		operations: 'Financial & co-op operations'
	};
	const categories = [...new Set(productCatalog.map((product) => product.category))];
	let filteredProducts = $derived(productCatalog.filter((product) => {
		const matchesSearch = `${product.name} ${product.sku} ${product.variants?.map((variant) => variant.sku).join(' ') ?? ''}`
			.toLowerCase()
			.includes(searchQuery.trim().toLowerCase());
		return matchesSearch && (selectedCategory === 'all' || product.category === selectedCategory);
	}));
	let saved = $state(false);
</script>
<svelte:head><title>{profile[0]} | QCU Coop Admin</title></svelte:head>
<div class="admin-page">
	<a href="/staff/admin/inventory">Back to inventory</a>
	<p class="admin-eyebrow">Maintenance profile</p>
	<h1 class="admin-title">{profile[0]}</h1>
	{#if isItemProfile}
		<p class="admin-subtitle">Items currently listed in the storefront catalog.</p>
		<section class="catalog-panel" aria-label="Storefront item catalog">
			<div class="catalog-toolbar">
				<label class="search-field">
					<span>Search items</span>
					<input bind:value={searchQuery} placeholder="Name or SKU" />
				</label>
				<label class="category-field">
					<span>Category</span>
					<select bind:value={selectedCategory}>
						<option value="all">All categories</option>
						{#each categories as category}
							<option value={category}>{categoryLabels[category]}</option>
						{/each}
					</select>
				</label>
				<p class="result-count">{filteredProducts.length} items</p>
			</div>
			<div class="table-wrap">
				<table>
					<thead><tr><th>Item</th><th>SKU and price</th><th>Category</th></tr></thead>
					<tbody>
						{#each filteredProducts as product (product.id)}
							<tr>
								<td><strong>{product.name}</strong></td>
								<td>
									{#if product.variants?.length}
										<div class="variant-list">
											{#each product.variants as variant}
											<span>{variant.sku} <b>₱{variant.price.toFixed(2)}</b></span>
											{/each}
										</div>
									{:else}
										<span>{product.sku}</span>
										{#if product.price !== undefined}<b>₱{product.price.toFixed(2)}</b>{:else}<span class="unlisted">Price not listed</span>{/if}
									{/if}
								</td>
								<td>{categoryLabels[product.category]}</td>
							</tr>
						{:else}
							<tr><td class="empty-state" colspan="3">No items match this search.</td></tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{:else}
		<p class="admin-subtitle">Create, update, and review this master record.</p>
		{#if saved}<p role="status">Profile saved to the maintenance queue.</p>{/if}
		<form onsubmit={(event) => { event.preventDefault(); saved = true; }}>
			<h2>Profile details</h2>
			<div>{#each profile[1] as field}<label>{field}<input required placeholder={`Enter ${field.toLowerCase()}`} /></label>{/each}</div>
			<label>Notes<textarea rows="4" placeholder="Add internal notes"></textarea></label>
			<a href="/staff/admin/inventory">Cancel</a><button type="submit">Save profile</button>
		</form>
	{/if}
</div>
<style>
	.catalog-panel { margin-top: 1.5rem; overflow: hidden; border: 1px solid #e1e8f1; border-radius: .75rem; background: white; }
	.catalog-toolbar { display: flex; align-items: end; gap: 1rem; padding: 1rem; }
	.search-field, .category-field { display: grid; gap: .35rem; color: #71809a; font-size: .65rem; font-weight: 700; }
	.search-field { width: min(100%, 22rem); }
	.category-field { width: min(100%, 16rem); }
	.search-field input, .category-field select { min-width: 0; border: 1px solid #dfe6ef; border-radius: .45rem; background: white; color: #29405f; padding: .65rem .75rem; font: inherit; font-size: .7rem; }
	.result-count { margin: 0 0 .65rem auto; color: #71809a; font-size: .65rem; }
	.table-wrap { overflow-x: auto; }
	table { width: 100%; border-collapse: collapse; min-width: 36rem; }
	th { background: #f8fafc; color: #8997a9; font-size: .58rem; text-align: left; text-transform: uppercase; }
	th, td { border-top: 1px solid #edf1f5; padding: .8rem 1rem; }
	td { color: #687991; font-size: .68rem; }
	td strong { color: #233a5d; }
	td b { color: #29405f; font-size: .65rem; }
	.variant-list { display: grid; gap: .2rem; }
	.variant-list span { display: flex; justify-content: space-between; gap: 1rem; }
	.unlisted, .empty-state { color: #8997a9; }
	.empty-state { padding: 2rem; text-align: center; }
	@media (max-width: 600px) { .catalog-toolbar { align-items: stretch; flex-direction: column; gap: .75rem; } .search-field, .category-field { width: 100%; } .result-count { margin: 0; } }
</style>