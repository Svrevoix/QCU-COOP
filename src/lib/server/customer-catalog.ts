import { error } from '@sveltejs/kit';
import { inventoryRequest } from '$lib/server/inventory';
import type { Product, ProductCategory } from '$lib/products';

type ProductRow = { id: number; sku: string; product_name: string; description: string | null; category_id: number | null; selling_price: number | string | null; stock: number | null; reorder_level: number | null; image_url: string | null; featured: boolean | null; status: string | null; size: string | null };
type InventoryRow = { product_id: number; quantity: number; location_type: string };
type CategoryRow = { id: number; category_name: string };

function categoryFor(name: string): ProductCategory {
	const value = name.toLowerCase();
	if (/uniform|apparel|clothing|shirt/.test(value)) return 'uniforms';
	if (/merch|accessor|lanyard|souvenir/.test(value)) return 'merchandise';
	if (/food|snack|drink|beverage/.test(value)) return 'food';
	if (/care|hygiene|medical|health/.test(value)) return 'care';
	if (/bag|backpack/.test(value)) return 'bags';
	if (/textbook|book/.test(value)) return 'textbooks';
	if (/service|operation|fee/.test(value)) return 'operations';
	return 'supplies';
}

export async function loadCustomerCatalog() {
	const [productResponse, inventoryResponse, categoryResponse] = await Promise.all([
		inventoryRequest(`products?${new URLSearchParams({ select: 'id,sku,product_name,description,category_id,selling_price,stock,reorder_level,image_url,featured,status,size', status: 'eq.active', order: 'featured.desc,product_name.asc', limit: '2000' })}`),
		inventoryRequest('inventory?select=product_id,quantity,location_type&location_type=eq.store&limit=10000'),
		inventoryRequest('categories?select=id,category_name&order=category_name.asc&limit=1000')
	]);
	for (const [name, response] of [['products', productResponse], ['inventory', inventoryResponse], ['categories', categoryResponse]] as const) {
		if (!response.ok) throw error(502, `Could not load the shop ${name} (Supabase HTTP ${response.status}).`);
	}
	const [products, stockRows, categoryRows] = await Promise.all([
		productResponse.json() as Promise<ProductRow[]>,
		inventoryResponse.json() as Promise<InventoryRow[]>,
		categoryResponse.json() as Promise<CategoryRow[]>
	]);
	const stockMap = new Map<number, number>();
	for (const row of stockRows) stockMap.set(row.product_id, (stockMap.get(row.product_id) ?? 0) + Number(row.quantity || 0));
	const hasStoreRow = new Set(stockRows.map((row) => row.product_id));
	const categoryMap = new Map(categoryRows.map((row) => [row.id, row.category_name]));
	const mapped: (Product & { description: string; categoryName: string })[] = products.map((row) => {
		const stock = hasStoreRow.has(row.id) ? stockMap.get(row.id) ?? 0 : Number(row.stock ?? 0);
		const categoryName = row.category_id ? categoryMap.get(row.category_id) ?? 'School & Office' : 'School & Office';
		const category = categoryFor(categoryName);
		const price = row.selling_price === null ? undefined : Number(row.selling_price);
		return { id: String(row.id), sku: row.sku, name: row.product_name, image: row.image_url || undefined, price, category, stock, size: row.size ?? undefined, lowStock: stock > 0 && stock <= Number(row.reorder_level ?? 0), featured: Boolean(row.featured), description: row.description ?? '', categoryName };
	}).filter((product) => Number.isFinite(product.price ?? 0));
	return { products: mapped, categories: categoryRows.map((row) => ({ id: row.id, name: row.category_name, slug: categoryFor(row.category_name) })) };
}
