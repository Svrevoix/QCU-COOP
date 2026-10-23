<script lang="ts">
	type InventoryItem = {
		sku: string;
		name: string;
		category: string;
		stock: number;
		reorder: number;
		price: string;
		status: 'In stock' | 'Low stock' | 'Out of stock';
	};

	let activeTab = $state('Items');
	let query = $state('');
	let statusFilter = $state('All statuses');
	const tabs = ['Items', 'Suppliers', 'Customers', 'Warehouses'];
	const items: InventoryItem[] = [
		{
			sku: 'SKU-00142',
			name: 'Bond Paper A4 500s',
			category: 'Office supplies',
			stock: 240,
			reorder: 100,
			price: '185.00',
			status: 'In stock'
		},
		{
			sku: 'SKU-00198',
			name: 'Ballpen Blue Box/12',
			category: 'Office supplies',
			stock: 38,
			reorder: 50,
			price: '72.00',
			status: 'Low stock'
		},
		{
			sku: 'SKU-00311',
			name: 'Stapler Heavy Duty',
			category: 'Equipment',
			stock: 15,
			reorder: 10,
			price: '420.00',
			status: 'In stock'
		},
		{
			sku: 'SKU-00427',
			name: 'Whiteboard Marker Set',
			category: 'Classroom',
			stock: 0,
			reorder: 20,
			price: '95.00',
			status: 'Out of stock'
		}
	];
	const maintenance = [
		{
			label: 'Warehouse Profile',
			href: '/staff/admin/inventory/profiles/warehouse',
			detail: 'Locations, capacity, and managers',
			icon: 'warehouse'
		},
		{
			label: 'Item Profile',
			href: '/staff/admin/inventory/profiles/item',
			detail: 'SKU, pricing, and reorder rules',
			icon: 'item'
		},
		{
			label: 'Supplier Profile',
			href: '/staff/admin/inventory/profiles/supplier',
			detail: 'Vendor contacts and terms',
			icon: 'supplier'
		},
		{
			label: 'Customer Profile',
			href: '/staff/admin/inventory/profiles/customer',
			detail: 'Customer records and classifications',
			icon: 'customer'
		},
		{
			label: 'Payment Types Profile',
			href: '/staff/admin/inventory/profiles/payment-types',
			detail: 'Accepted tender types',
			icon: 'payment'
		}
	];
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
		items.filter((item) => {
			const matchesQuery = `${item.sku} ${item.name} ${item.category}`
				.toLowerCase()
				.includes(query.trim().toLowerCase());
			const matchesStatus = statusFilter === 'All statuses' || item.status === statusFilter;
			return matchesQuery && matchesStatus;
		})
	);
	const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(
		new Date()
	);
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
			<p>Manage master records, stock levels, and the people and places behind every item.</p>
		</div>
		<a class="add-button" href="/staff/admin/inventory/profiles/item"
			><span aria-hidden="true">+</span> Add item</a
		>
	</div>

	<section class="inventory-stats" aria-label="Inventory summary">
		<article>
			<span>Total items</span><strong>1,248</strong><small>Across 8 categories</small>
		</article>
		<article>
			<span>Inventory value</span><strong>2.84M</strong><small>At current cost</small>
		</article>
		<article>
			<span>Reorder queue</span><strong>18</strong><small class="warn">Requires action</small>
		</article>
		<article>
			<span>Active suppliers</span><strong>32</strong><small>Last updated today</small>
		</article>
	</section>

	<section class="operations-panel" aria-labelledby="profiles-title">
		<div class="section-heading">
			<h2 id="profiles-title">Maintenance profiles</h2>
			<p>Open a CRUD profile to create, update, or review master records.</p>
		</div>
		<div class="maintenance-grid">
			{#each maintenance as card}
				<a href={card.href}>
					<span class="profile-icon" aria-hidden="true">
						{#if card.icon === 'warehouse'}
							<svg viewBox="0 0 24 24"
								><ellipse cx="12" cy="5" rx="8" ry="2.5" /><path
									d="M4 5v14c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V5M4 12c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5"
								/></svg
							>
						{:else if card.icon === 'item'}
							<svg viewBox="0 0 24 24"
								><rect x="5" y="3" width="14" height="18" rx="2" /><path
									d="M9 7h6M9 11h6M9 15h3"
								/></svg
							>
						{:else if card.icon === 'payment'}
							<svg viewBox="0 0 24 24"
								><path d="M4 10h16M5 10v9m4-9v9m6-9v9m4-9v9M3 21h18M12 3l9 5H3l9-5Z" /></svg
							>
						{:else}
							<svg viewBox="0 0 24 24"
								><circle cx="12" cy="8" r="3" /><path d="M5 20c.9-3.3 3.3-5 7-5s6.1 1.7 7 5" /></svg
							>
						{/if}
					</span>
					<span class="profile-copy">
						<strong>{card.label}</strong>
						<span>{card.detail}</span>
						<b>Open profile <span aria-hidden="true">→</span></b>
					</span>
				</a>
			{/each}
		</div>
	</section>

	<section class="directory-panel" aria-label="Inventory directories">
		<div class="tabs" role="tablist" aria-label="Inventory directory">
			{#each tabs as tab}
				<button
					class:active={activeTab === tab}
					type="button"
					role="tab"
					aria-selected={activeTab === tab}
					onclick={() => (activeTab = tab)}>{tab}</button
				>
			{/each}
		</div>
		<div class="toolbar">
			<label class="search">
				<svg viewBox="0 0 24 24" aria-hidden="true"
					><circle cx="10.8" cy="10.8" r="6.3" /><path d="m16 16 4 4" /></svg
				>
				<input
					bind:value={query}
					placeholder={`Search ${activeTab.toLowerCase()}...`}
					aria-label={`Search ${activeTab.toLowerCase()}`}
				/>
			</label>
			<select bind:value={statusFilter} aria-label="Filter by status">
				<option>All statuses</option>
				<option>In stock</option>
				<option>Low stock</option>
				<option>Out of stock</option>
			</select>
		</div>
		{#if activeTab === 'Items'}
			<div class="table-wrap">
				<table>
					<thead>
						<tr
							><th>Item / SKU</th><th>Category</th><th>On hand</th><th>Reorder point</th><th
								>Unit price</th
							><th>Status</th></tr
						>
					</thead>
					<tbody>
						{#each filteredItems as item (item.sku)}
							<tr>
								<td><strong>{item.name}</strong><small>{item.sku}</small></td>
								<td>{item.category}</td>
								<td
									class="number"
									class:low-number={item.status === 'Low stock'}
									class:zero-number={item.status === 'Out of stock'}>{item.stock}</td
								>
								<td class="number">{item.reorder}</td>
								<td class="price">₱{item.price}</td>
								<td
									><span
										class="status"
										class:low={item.status === 'Low stock'}
										class:out={item.status === 'Out of stock'}><i></i>{item.status}</span
									></td
								>
							</tr>
						{:else}
							<tr
								><td class="no-results" colspan="6"
									>No items match your search and status filters.</td
								></tr
							>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="empty-directory" role="tabpanel">
				<h2>{activeTab} directory</h2>
				<p>Use the maintenance profiles above to manage {activeTab.toLowerCase()} records.</p>
			</div>
		{/if}
		{#if activeTab === 'Items'}
			<div class="directory-footer">
				Showing {filteredItems.length} of {items.length} sample inventory items
				<span>Demo data</span>
			</div>
		{/if}
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
		gap: 0.7rem;
		margin-bottom: 0.8rem;
	}
	.inventory-stats article {
		min-width: 0;
		border: 1px solid #e8edf3;
		border-radius: 0.7rem;
		background: white;
		box-shadow: 0 5px 16px rgba(32, 55, 88, 0.05);
		padding: 0.8rem 0.9rem;
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
	.operations-panel,
	.directory-panel {
		margin-bottom: 0.8rem;
		border: 1px solid #e4eaf2;
		border-radius: 0.8rem;
		background: white;
		box-shadow: 0 8px 24px rgba(32, 55, 88, 0.04);
	}
	.operations-panel {
		padding: 0.85rem 0.95rem;
	}
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
		grid-template-columns: repeat(5, minmax(0, 1fr));
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
		font-size: 0.59rem;
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
		min-height: 19rem;
		padding: 0 0.8rem 0.8rem;
	}
	.tabs {
		display: flex;
		gap: 0.15rem;
		overflow-x: auto;
		border-bottom: 1px solid #e8edf4;
		padding: 0 0.15rem;
	}
	.tabs button {
		border: 0;
		border-bottom: 2px solid transparent;
		background: transparent;
		color: #8490a1;
		padding: 0.8rem 0.55rem 0.6rem;
		font: inherit;
		font-size: 0.61rem;
		font-weight: 700;
		cursor: pointer;
		white-space: nowrap;
	}
	.tabs button.active {
		border-color: #347af5;
		color: #347af5;
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
		font-size: 0.57rem;
	}
	.table-wrap {
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		min-width: 620px;
	}
	th {
		background: #f3f5f8;
		color: #7e8998;
		font-size: 0.51rem;
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
		font-size: 0.57rem;
	}
	td strong,
	td small {
		display: block;
	}
	td strong {
		color: #2b3b54;
		font-size: 0.58rem;
	}
	td small {
		margin-top: 0.12rem;
		color: #9ba5b3;
		font-size: 0.5rem;
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
		font-size: 0.52rem;
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
	:global(html[data-theme='dark'] .inventory-page .operations-panel),
	:global(html[data-theme='dark'] .inventory-page .directory-panel),
	:global(html[data-theme='dark'] .inventory-page .workflow-disclosure) {
		border-color: #334866;
		background: #172640;
	}
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
	:global(html[data-theme='dark'] .inventory-page .workflow-links a) {
		border-color: #415878;
		background: #101d35;
	}
	:global(html[data-theme='dark'] .inventory-page .search),
	:global(html[data-theme='dark'] .inventory-page .toolbar select) {
		border-color: #415878;
		background: #101d35;
		color: #edf4ff;
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
	}
</style>
