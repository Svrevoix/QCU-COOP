import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { inventoryRequest, uploadProductImage } from '$lib/server/inventory';

type Product = {
	id: number; sku: string; product_name: string; description: string | null; category_id: number | null;
	supplier_id: number | null; cost_price: number; selling_price: number; stock: number; reorder_level: number;
	image_url: string | null; featured: boolean; status: string; taxable: boolean; item_type: string | null; size: string | null;
};
type Supplier = { id: number; supplier_name: string; contact_person: string | null; phone: string | null; email: string | null; address: string | null };
type Category = { id: number; category_name: string };

export const load: PageServerLoad = async ({ locals, params }) => {
	if (locals.user?.role !== 'admin') throw error(403, 'Administrator access required.');
	if (params.profile === 'supplier') {
		const response = await inventoryRequest(`suppliers?${new URLSearchParams({ select: 'id,supplier_name,contact_person,phone,email,address', order: 'supplier_name.asc' })}`);
		if (!response.ok) throw error(502, `Could not load suppliers (Supabase HTTP ${response.status}).`);
		return { products: [], suppliers: await response.json() as Supplier[], warehouses: [] };
	}
	if (params.profile !== 'item') return { products: [], suppliers: [], warehouses: [] };
	const [productsResponse, suppliersResponse, warehousesResponse, categoriesResponse] = await Promise.all([
		inventoryRequest(`products?${new URLSearchParams({ select: 'id,sku,product_name,description,category_id,supplier_id,cost_price,selling_price,stock,reorder_level,image_url,featured,status,taxable,item_type,size', order: 'product_name.asc' })}`),
		inventoryRequest(`suppliers?${new URLSearchParams({ select: 'id,supplier_name', order: 'supplier_name.asc' })}`),
		inventoryRequest(`warehouses?${new URLSearchParams({ select: 'id,warehouse_name', order: 'warehouse_name.asc' })}`),
		inventoryRequest(`categories?${new URLSearchParams({ select: 'id,category_name', order: 'category_name.asc' })}`)
	]);
	if (!productsResponse.ok) throw error(502, `Could not load products (Supabase HTTP ${productsResponse.status}). Check the updated products columns.`);
	if (!suppliersResponse.ok) throw error(502, `Could not load suppliers (Supabase HTTP ${suppliersResponse.status}).`);
	if (!warehousesResponse.ok) throw error(502, `Could not load warehouses (Supabase HTTP ${warehousesResponse.status}).`);
	if (!categoriesResponse.ok) throw error(502, `Could not load categories (Supabase HTTP ${categoriesResponse.status}).`);
	return {
		products: await productsResponse.json() as Product[],
		suppliers: await suppliersResponse.json() as Array<{ id: number; supplier_name: string }>,
		warehouses: await warehousesResponse.json() as Array<{ id: number; warehouse_name: string }>,
		categories: await categoriesResponse.json() as Category[]
	};
};

export const actions: Actions = {
	saveItem: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') throw error(403, 'Administrator access required.');
		const form = await request.formData();
		const id = String(form.get('id') ?? '').trim();
		const sku = String(form.get('sku') ?? '').trim();
		const productName = String(form.get('product_name') ?? '').trim();
		const description = String(form.get('description') ?? '').trim() || null;
		const categoryRaw = String(form.get('category_id') ?? '').trim();
		const supplierRaw = String(form.get('supplier_id') ?? '').trim();
		const costPrice = Number(form.get('cost_price'));
		const sellingPrice = Number(form.get('selling_price'));
		const stock = Number(form.get('stock'));
		const reorderLevel = Number(form.get('reorder_level'));
		const status = String(form.get('status') ?? 'active').trim();
		const itemType = String(form.get('item_type') ?? '').trim() || null;
		const size = String(form.get('size') ?? '').trim() || null;
		const imageFile = form.get('image');
		const featured = form.get('featured') === 'on';
		const taxable = form.get('taxable') === 'on';
		const categoryId = categoryRaw ? Number(categoryRaw) : null;
		const supplierId = supplierRaw ? Number(supplierRaw) : null;
		if (!sku || !productName || !['active', 'inactive', 'discontinued'].includes(status)) return fail(400, { itemError: 'SKU, item name, and a valid status are required.' });
		if (![costPrice, sellingPrice, stock, reorderLevel].every(Number.isFinite) || costPrice < 0 || sellingPrice < 0 || !Number.isInteger(stock) || stock < 0 || !Number.isInteger(reorderLevel) || reorderLevel < 0) return fail(400, { itemError: 'Enter valid non-negative prices and whole-number stock/reorder quantities.' });
		if ((categoryId !== null && (!Number.isInteger(categoryId) || categoryId < 1)) || (supplierId !== null && (!Number.isInteger(supplierId) || supplierId < 1))) return fail(400, { itemError: 'Category and supplier IDs must be positive whole numbers.' });
		let stockQuantity = 0;
		let imageUrl: string | null = null;
		if (id) {
			const existingResponse = await inventoryRequest(`products?${new URLSearchParams({ select: 'stock,image_url', id: `eq.${id}`, limit: '1' })}`);
			if (!existingResponse.ok) return fail(502, { itemError: `Could not load the current stock quantity (HTTP ${existingResponse.status}).` });
			const current = await existingResponse.json() as Array<{ stock: number; image_url: string | null }>;
			if (!current.length) return fail(404, { itemError: 'The product no longer exists.' });
			stockQuantity = Number(current[0].stock ?? 0);
			imageUrl = current[0].image_url;
		}
		if (imageFile instanceof File && imageFile.size > 0) {
			if (imageFile.size > 5 * 1024 * 1024) return fail(400, { itemError: 'Product images must be 5 MB or smaller.' });
			const upload = await uploadProductImage(imageFile, sku);
			if ('error' in upload) return fail(502, { itemError: upload.error });
			imageUrl = upload.url;
		}
		const payload = { sku, product_name: productName, description, category_id: categoryId, supplier_id: supplierId, cost_price: costPrice, selling_price: sellingPrice, stock: stockQuantity, reorder_level: reorderLevel, image_url: imageUrl, featured, status, taxable, item_type: itemType, size };
		const path = id ? `products?id=eq.${encodeURIComponent(id)}` : 'products';
		const response = await inventoryRequest(path, { method: id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(payload) });
		if (!response.ok) return fail(502, { itemError: `Could not save item (Supabase HTTP ${response.status}). Check SKU uniqueness and the products table columns.` });
		return { itemSuccess: id ? 'Item updated.' : 'Item created.' };
	},
	saveSupplier: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') throw error(403, 'Administrator access required.');
		const form = await request.formData();
		const id = String(form.get('id') ?? '').trim();
		const supplierName = String(form.get('supplier_name') ?? '').trim();
		const contactPerson = String(form.get('contact_person') ?? '').trim() || null;
		const phone = String(form.get('phone') ?? '').trim() || null;
		const email = String(form.get('email') ?? '').trim() || null;
		const address = String(form.get('address') ?? '').trim() || null;
		if (!supplierName) return fail(400, { supplierError: 'Supplier name is required.' });
		if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(400, { supplierError: 'Enter a valid supplier email address.' });
		const response = await inventoryRequest(id ? `suppliers?id=eq.${encodeURIComponent(id)}` : 'suppliers', {
			method: id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
			body: JSON.stringify({ supplier_name: supplierName, contact_person: contactPerson, phone, email, address })
		});
		if (!response.ok) return fail(502, { supplierError: `Could not save supplier (Supabase HTTP ${response.status}). Check the suppliers table columns.` });
		return { supplierSuccess: id ? 'Supplier details updated.' : 'Supplier added.' };
	}
};
