<script lang="ts">
	import { page } from '$app/state';
	type Product = { id: number; sku: string; product_name: string; description: string | null; category_id: number | null; supplier_id: number | null; cost_price: number; selling_price: number; stock: number; reorder_level: number; image_url: string | null; featured: boolean; status: string; taxable: boolean; item_type: string | null; size: string | null };
	type Supplier = { id: number; supplier_name: string; contact_person: string | null; phone: string | null; email: string | null; address: string | null };
	type Category = { id: number; category_name: string };
	const profiles = { warehouse: ['Warehouse Profile', ['Warehouse name', 'Location']], item: ['Item Profile', []], supplier: ['Supplier Profile', ['Supplier name', 'Contact person', 'Email', 'Phone']], customer: ['Customer Profile', ['Customer name', 'Customer ID', 'Email', 'Contact number']], 'payment-types': ['Payment Types Profile', ['Payment type name', 'Code', 'Settlement account', 'Status']] } as const;
	let profile = $derived(profiles[page.params.profile as keyof typeof profiles] ?? profiles.item);
	let isItemProfile = $derived(page.params.profile === 'item');
	let searchQuery = $state('');
	let editingId = $state('');
	let sku = $state('');
	let productName = $state('');
	let description = $state('');
	let categoryId = $state('');
	let supplierId = $state('');
	let costPrice = $state('0');
	let sellingPrice = $state('0');
	let stock = $state('0');
	let reorderLevel = $state('0');
	let imageUrl = $state('');
	let size = $state('');
	let imagePreview = $state('');
	let imageInput = $state<HTMLInputElement>();
	let supplierEditingId = $state('');
	let supplierName = $state('');
	let supplierContact = $state('');
	let supplierPhone = $state('');
	let supplierEmail = $state('');
	let supplierAddress = $state('');
	let featured = $state(false);
	let taxable = $state(false);
	let status = $state('active');
	let products = $derived(page.data.products as Product[]);
	let suppliers = $derived(page.data.suppliers as Array<{ id: number; supplier_name: string }>);
	let categories = $derived(page.data.categories as Category[]);
	let supplierRecords = $derived(page.data.suppliers as Supplier[]);
	let filteredProducts = $derived(products.filter((product) => `${product.product_name} ${product.sku} ${product.category_id ?? ''}`.toLowerCase().includes(searchQuery.trim().toLowerCase())));

	function editItem(product: Product) {
		editingId = String(product.id); sku = product.sku; productName = product.product_name; description = product.description ?? '';
		categoryId = product.category_id === null ? '' : String(product.category_id); supplierId = product.supplier_id === null ? '' : String(product.supplier_id);
		costPrice = String(product.cost_price); sellingPrice = String(product.selling_price); stock = String(product.stock); reorderLevel = String(product.reorder_level);
		imageUrl = product.image_url ?? ''; imagePreview = ''; size = product.size ?? ''; featured = product.featured; taxable = product.taxable; status = product.status;
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function resetForm() {
		editingId = ''; sku = ''; productName = ''; description = ''; categoryId = ''; supplierId = '';
		costPrice = '0'; sellingPrice = '0'; stock = '0'; reorderLevel = '0'; imageUrl = ''; size = ''; imagePreview = '';
		featured = false; taxable = false; status = 'active';
		if (imageInput) imageInput.value = '';
	}

	function previewImage(event: Event) {
		const file = (event.currentTarget as HTMLInputElement).files?.[0];
		imagePreview = file ? URL.createObjectURL(file) : '';
	}

	function editSupplier(supplier: Supplier) {
		supplierEditingId = String(supplier.id); supplierName = supplier.supplier_name; supplierContact = supplier.contact_person ?? '';
		supplierPhone = supplier.phone ?? ''; supplierEmail = supplier.email ?? ''; supplierAddress = supplier.address ?? '';
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function resetSupplierForm() {
		supplierEditingId = ''; supplierName = ''; supplierContact = ''; supplierPhone = ''; supplierEmail = ''; supplierAddress = '';
	}
</script>

<svelte:head><title>{profile[0]} | QCU Coop Admin</title></svelte:head>
<main class="admin-page item-profile-page">
	<a class="back-link" href="/staff/admin/inventory">← Back to inventory</a>
	<p class="admin-eyebrow">Inventory maintenance</p>
	<h1 class="admin-title">{profile[0]}</h1>
	{#if isItemProfile}
		<p class="admin-subtitle">Create and maintain product records, pricing, tax settings, and reorder levels.</p>
		{#if page.form?.itemError}<p class="notice error" role="alert">{page.form.itemError}</p>{/if}
		{#if page.form?.itemSuccess}<p class="notice success" role="status">{page.form.itemSuccess}</p>{/if}
		<section class="item-form-panel">
			<div class="section-title"><h2>{editingId ? 'Edit item' : 'Add item'}</h2><p>Fields follow the products table.</p></div>
			<form method="POST" action="?/saveItem" enctype="multipart/form-data">
				<input type="hidden" name="id" value={editingId} />
				<div class="form-grid">
					<label>SKU <input name="sku" bind:value={sku} required maxlength="80" /></label>
					<label>Item name <input name="product_name" bind:value={productName} required maxlength="160" /></label>
					<label class="wide">Description <textarea name="description" bind:value={description} rows="2"></textarea></label>
					<label>Category <select name="category_id" bind:value={categoryId}><option value="">No category</option>{#each categories as category (category.id)}<option value={category.id}>{category.category_name}</option>{/each}</select></label>
					<label>Supplier <select name="supplier_id" bind:value={supplierId}><option value="">No supplier</option>{#each suppliers as supplier}<option value={supplier.id}>{supplier.supplier_name}</option>{/each}</select></label>
					<label>Cost price (₱) <input name="cost_price" type="number" min="0" step="0.01" bind:value={costPrice} required /></label>
					<label>Selling price (₱) <input name="selling_price" type="number" min="0" step="0.01" bind:value={sellingPrice} required /></label>
					<label>Current stock <input name="stock" type="number" min="0" step="1" bind:value={stock} readonly aria-readonly="true" /><small>Read-only here; use Restock to receive stock into a warehouse.</small></label>
					<label>Reorder level <input name="reorder_level" type="number" min="0" step="1" bind:value={reorderLevel} required /></label>
					<label>Size <input name="size" bind:value={size} placeholder="e.g. Small, Medium, Large" /></label>
					<label class="image-upload-label">Product image <input bind:this={imageInput} name="image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" onchange={previewImage} /><small>JPG, PNG, WebP, or AVIF. Max 5 MB.</small></label>
					{#if imagePreview || imageUrl}<div class="image-preview"><img src={imagePreview || imageUrl} alt="Product preview" /><span>{imagePreview ? 'New image preview' : 'Current product image'}</span></div>{/if}
					<label>Status <select name="status" bind:value={status}><option value="active">Active</option><option value="inactive">Inactive</option><option value="discontinued">Discontinued</option></select></label>
				</div>
				<div class="check-row"><label><input type="checkbox" name="featured" bind:checked={featured} /> Featured item</label><label><input type="checkbox" name="taxable" bind:checked={taxable} /> Taxable</label></div>
				<div class="form-actions">{#if editingId}<button class="secondary" type="button" onclick={resetForm}>Cancel edit</button>{/if}<button class="primary" type="submit">{editingId ? 'Save changes' : 'Create item'}</button></div>
			</form>
		</section>
		<section class="catalog-panel" aria-label="Product records">
			<div class="catalog-toolbar"><label class="search-field">Search items<input bind:value={searchQuery} placeholder="Name, SKU, or category ID" /></label><p class="result-count">{filteredProducts.length} of {products.length} items</p></div>
			<div class="table-wrap"><table>
				<thead><tr><th>Item / SKU</th><th>Category / Supplier</th><th>Cost</th><th>Price</th><th>Stock / Reorder</th><th>Type / Flags</th><th>Status</th><th></th></tr></thead>
				<tbody>{#each filteredProducts as product (product.id)}
					<tr><td>{#if product.image_url}<img class="item-thumbnail" src={product.image_url} alt="" />{/if}<strong>{product.product_name}</strong><small>{product.sku}</small>{#if product.description}<small>{product.description}</small>{/if}</td>
						<td>Category {product.category_id ?? '—'}<small>Supplier {product.supplier_id ?? '—'}</small></td>
						<td>₱{Number(product.cost_price).toFixed(2)}</td><td><b>₱{Number(product.selling_price).toFixed(2)}</b></td>
						<td>{product.stock}<small>Reorder at {product.reorder_level}</small></td>
						<td><small>Size: {product.size || '—'}</small><small>{product.taxable ? 'Taxable' : 'Non-taxable'}{product.featured ? ' · Featured' : ''}</small></td>
						<td><span class="status" class:inactive={product.status !== 'active'}>{product.status}</span></td>
						<td><button class="edit-button" type="button" onclick={() => editItem(product)}>Edit</button></td></tr>
				{:else}<tr><td class="empty-state" colspan="8">No items match this search.</td></tr>{/each}</tbody>
			</table></div>
		</section>
	{:else if page.params.profile === 'supplier'}
		<p class="admin-subtitle">Add supplier contacts and update their details.</p>
		{#if page.form?.supplierError}<p class="notice error" role="alert">{page.form.supplierError}</p>{/if}
		{#if page.form?.supplierSuccess}<p class="notice success" role="status">{page.form.supplierSuccess}</p>{/if}
		<section class="item-form-panel">
			<div class="section-title"><h2>{supplierEditingId ? 'Edit supplier' : 'Add supplier'}</h2><p>Supplier contact information used by purchasing and inventory.</p></div>
			<form method="POST" action="?/saveSupplier">
				<input type="hidden" name="id" value={supplierEditingId} />
				<div class="form-grid supplier-form-grid">
					<label>Supplier name <input name="supplier_name" bind:value={supplierName} required /></label>
					<label>Contact person <input name="contact_person" bind:value={supplierContact} /></label>
					<label>Phone <input name="phone" bind:value={supplierPhone} /></label>
					<label>Email <input name="email" type="email" bind:value={supplierEmail} /></label>
					<label class="wide">Address <textarea name="address" rows="2" bind:value={supplierAddress}></textarea></label>
				</div>
				<div class="form-actions">{#if supplierEditingId}<button class="secondary" type="button" onclick={resetSupplierForm}>Cancel edit</button>{/if}<button class="primary" type="submit">{supplierEditingId ? 'Save changes' : 'Add supplier'}</button></div>
			</form>
		</section>
		<section class="catalog-panel" aria-label="Supplier records">
			<div class="catalog-toolbar"><p class="result-count">{supplierRecords.length} suppliers</p></div>
			<div class="table-wrap"><table class="supplier-table"><thead><tr><th>Supplier</th><th>Contact person</th><th>Email</th><th>Phone</th><th>Address</th><th></th></tr></thead><tbody>
				{#each supplierRecords as supplier (supplier.id)}<tr><td><strong>{supplier.supplier_name}</strong></td><td>{supplier.contact_person || '—'}</td><td>{supplier.email || '—'}</td><td>{supplier.phone || '—'}</td><td>{supplier.address || '—'}</td><td><button class="edit-button" type="button" onclick={() => editSupplier(supplier)}>Edit</button></td></tr>
				{:else}<tr><td class="empty-state" colspan="6">No suppliers yet. Add a supplier above.</td></tr>{/each}
			</tbody></table></div>
		</section>
	{:else}
		<p class="admin-subtitle">Create, update, and review this master record.</p>
		<form class="simple-profile" onsubmit={(event) => event.preventDefault()}>
			<h2>Profile details</h2>
			<div>{#each profile[1] as field}<label>{field}<input required placeholder={`Enter ${field.toLowerCase()}`} /></label>{/each}</div>
			<label>Notes<textarea rows="4" placeholder="Add internal notes"></textarea></label>
			<div class="simple-actions"><a href="/staff/admin/inventory">Cancel</a><button type="submit">Save profile</button></div>
		</form>
	{/if}
</main>

<style>
	.item-profile-page{padding-top:1rem}.back-link{color:#347af5;font-size:.7rem;font-weight:700;text-decoration:none}.item-profile-page .admin-eyebrow{margin:.8rem 0 .25rem}.item-profile-page .admin-title{margin:0}.item-form-panel,.catalog-panel,.simple-profile{margin-top:1rem;border:1px solid #e1e8f1;border-radius:.75rem;background:#fff;padding:1rem}.section-title h2{margin:0;color:#233a5d;font-size:.9rem}.section-title p{margin:.2rem 0 .8rem;color:#8391a4;font-size:.65rem}.form-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.7rem}.form-grid label,.search-field{display:grid;gap:.3rem;color:#586b84;font-size:.65rem;font-weight:700}.form-grid .wide{grid-column:1/-1}.form-grid input,.form-grid textarea,.form-grid select,.search-field input{box-sizing:border-box;width:100%;min-width:0;border:1px solid #dce3ed;border-radius:.45rem;background:#fff;padding:.55rem .65rem;color:#263752;font:inherit;font-weight:500}.form-grid small{color:#8391a4;font-size:.58rem;font-weight:500}.image-upload-label input{padding:.4rem!important}.image-preview{display:flex;align-items:center;gap:.65rem;grid-column:span 2;color:#8391a4;font-size:.6rem}.image-preview img{width:4.25rem;height:4.25rem;object-fit:contain;border:1px solid #dce3ed;border-radius:.45rem;background:#fff;padding:.2rem}.item-thumbnail{float:left;width:2.5rem;height:2.5rem;object-fit:contain;margin:0 .6rem .3rem 0;border:1px solid #dce3ed;border-radius:.35rem;background:#fff}.check-row{display:flex;gap:1.2rem;margin-top:.8rem}.check-row label{display:flex;align-items:center;gap:.4rem;color:#586b84;font-size:.65rem}.check-row input{accent-color:#347af5}.form-actions{display:flex;justify-content:flex-end;gap:.5rem;margin-top:1rem}.primary,.secondary,.edit-button{border:0;border-radius:.45rem;padding:.6rem .85rem;font:inherit;font-size:.65rem;font-weight:800;cursor:pointer}.primary{background:#347af5;color:white}.secondary,.edit-button{border:1px solid #dce3ed;background:#fff;color:#38506f}.notice{padding:.7rem .85rem;border-radius:.5rem;font-size:.7rem;font-weight:700}.notice.error{background:#fff1f2;color:#b91c1c}.notice.success{background:#f0fbf4;color:#187342}.catalog-toolbar{display:flex;align-items:end;gap:1rem;padding-bottom:.8rem}.search-field{width:min(100%,25rem)}.result-count{margin:0 0 .6rem auto;color:#71809a;font-size:.65rem}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse;min-width:65rem}th{background:#f8fafc;color:#8997a9;font-size:.57rem;text-align:left;text-transform:uppercase}th,td{border-top:1px solid #edf1f5;padding:.7rem .65rem}td{color:#687991;font-size:.65rem}td strong,td small{display:block}td strong{color:#233a5d}td small{margin-top:.15rem;color:#8997a9;font-size:.58rem}.status{border-radius:1rem;background:#e9f8f0;color:#168251;padding:.2rem .45rem;font-size:.58rem;font-weight:800;text-transform:capitalize}.status.inactive{background:#f1f3f6;color:#687991}.empty-state{padding:2rem;text-align:center}.simple-profile{display:grid;gap:.8rem;padding:1.25rem}.simple-profile h2{margin:0;color:#233a5d;font-size:.9rem}.simple-profile>div:not(.simple-actions){display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem}.simple-profile label{display:grid;gap:.35rem;color:#586b84;font-size:.7rem;font-weight:700}.simple-profile input,.simple-profile textarea{box-sizing:border-box;width:100%;border:1px solid #dce3ed;border-radius:.45rem;background:#fff;color:#263752;padding:.7rem;font:inherit;font-size:.72rem;font-weight:500}.simple-profile>label{margin:0}.simple-actions{display:flex;align-items:center;justify-content:flex-end;gap:.6rem}.simple-profile a{color:#52647d;font-size:.68rem;font-weight:700;text-decoration:none}.simple-profile button{border:0;border-radius:.45rem;background:#347af5;color:#fff;padding:.68rem 1rem;font:inherit;font-size:.68rem;font-weight:800;cursor:pointer}.simple-profile button:hover{background:#1d5fdb}@media(max-width:760px){.form-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:520px){.form-grid{grid-template-columns:1fr}.form-grid .wide{grid-column:auto}.image-preview{grid-column:auto}.catalog-toolbar{align-items:stretch;flex-direction:column}.result-count{margin:0}.simple-profile>div:not(.simple-actions){grid-template-columns:1fr}}
	:global(html[data-theme='dark'] .item-form-panel),:global(html[data-theme='dark'] .catalog-panel){background:#172640;border-color:#334866}
	:global(html[data-theme='dark'] .item-profile-page h1),:global(html[data-theme='dark'] .item-profile-page h2),:global(html[data-theme='dark'] td strong){color:#edf4ff}
	:global(html[data-theme='dark'] .form-grid label),:global(html[data-theme='dark'] .check-row label),:global(html[data-theme='dark'] td){color:#c9d6e8}
	:global(html[data-theme='dark'] .form-grid input),:global(html[data-theme='dark'] .form-grid textarea),:global(html[data-theme='dark'] .form-grid select),:global(html[data-theme='dark'] .search-field input){background:#101d35;border-color:#415878;color:#edf4ff}
	:global(html[data-theme='dark'] th){background:#101d35;color:#b8c8dd}:global(html[data-theme='dark'] td){border-color:#334866}
	:global(html[data-theme='dark'] .simple-profile){background:#172640;border-color:#334866}
	:global(html[data-theme='dark'] .simple-profile h2),:global(html[data-theme='dark'] .simple-profile label){color:#edf4ff}
	:global(html[data-theme='dark'] .simple-profile input),:global(html[data-theme='dark'] .simple-profile textarea){background:#101d35;border-color:#415878;color:#edf4ff}
	:global(html[data-theme='dark'] .simple-profile input::placeholder),:global(html[data-theme='dark'] .simple-profile textarea::placeholder){color:#8192ab}
	:global(html[data-theme='dark'] .simple-profile a){color:#b8c8dd}
</style>
