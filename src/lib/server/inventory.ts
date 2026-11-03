import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';

function config() {
	const url = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
	const key = env.SUPABASE_SECRET_KEY;
	if (!url || !key) throw error(503, 'Configure Supabase URL and SUPABASE_SECRET_KEY.');
	return { url, headers: { apikey: key, ...(key.startsWith('sb_secret_') ? {} : { Authorization: `Bearer ${key}` }) } };
}

export function inventoryUrl(path: string) {
	return `${config().url}/rest/v1/${path}`;
}

export function inventoryHeaders(extra: Record<string, string> = {}) {
	return { ...config().headers, ...extra };
}

export async function inventoryRequest(path: string, init?: RequestInit) {
	return fetch(inventoryUrl(path), { ...init, headers: { ...inventoryHeaders(), ...init?.headers } });
}

export async function uploadProductImage(file: File, sku: string) {
	const { url } = config();
	const bucket = env.SUPABASE_PRODUCT_IMAGES_BUCKET?.trim() || 'product-images';
	const extension = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' } as Record<string, string>)[file.type];
	if (!extension) return { error: 'Upload a JPG, PNG, WebP, or AVIF image.' } as const;
	const safeSku = sku.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '') || 'item';
	const objectPath = `products/${safeSku}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
	const encodedPath = objectPath.split('/').map(encodeURIComponent).join('/');
	const response = await fetch(`${url}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`, {
		method: 'POST', headers: inventoryHeaders({ 'Content-Type': file.type, 'x-upsert': 'false' }), body: file
	});
	if (!response.ok) return { error: `Image upload failed (Supabase Storage HTTP ${response.status}). Check the ${bucket} bucket and its upload permissions.` } as const;
	return { url: `${url}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodedPath}` } as const;
}
