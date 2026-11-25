import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { inventoryRequest } from '$lib/server/inventory';

type Sale = { id: number; customer_id: string | null; total_amount: number | string; created_at: string };
type SaleItem = { sale_id: number; product_id: number; quantity: number; subtotal: number | string };
type Product = { id: number; category_id: number | null };
type Category = { id: number; category_name: string };

async function rows<T>(table: string, query: Record<string, string>): Promise<T[]> {
	const response = await inventoryRequest(`${table}?${new URLSearchParams(query)}`);
	if (!response.ok) throw error(502, `Unable to load ${table} (Supabase HTTP ${response.status}).`);
	return await response.json() as T[];
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'cashier') throw error(403, 'Cashier access required.');
	const since = new Date(); since.setFullYear(since.getFullYear() - 1);
	const sales = await rows<Sale>('sales', { select: 'id,customer_id,total_amount,created_at', cashier_id: `eq.${locals.user.profileId}`, created_at: `gte.${since.toISOString()}`, order: 'created_at.asc', limit: '10000' });
	const ids = sales.map((sale) => sale.id);
	let items: SaleItem[] = [];
	if (ids.length) {
		for (let i = 0; i < ids.length; i += 100) {
			items.push(...await rows<SaleItem>('sale_items', { select: 'sale_id,product_id,quantity,subtotal', sale_id: `in.(${ids.slice(i, i + 100).join(',')})`, limit: '5000' }));
		}
	}
	const productIds = [...new Set(items.map((item) => item.product_id))];
	const products = productIds.length ? await rows<Product>('products', { select: 'id,category_id', id: `in.(${productIds.join(',')})`, limit: '5000' }) : [];
	const categories = await rows<Category>('categories', { select: 'id,category_name', limit: '1000' });
	const productCategory = new Map(products.map((product) => [product.id, product.category_id]));
	const categoryNames = new Map(categories.map((category) => [category.id, category.category_name]));
	const now = new Date();
	const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0);
	const weekStart = new Date(dayStart); weekStart.setDate(weekStart.getDate() - 6);
	const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
	const windowSales = sales.filter((sale) => new Date(sale.created_at) >= weekStart);
	const revenue = windowSales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0);
	const todaySales = sales.filter((sale) => new Date(sale.created_at) >= dayStart);
	const customerCount = new Set(todaySales.map((sale) => sale.customer_id).filter(Boolean)).size;
	const daily: { label: string; amount: number }[] = [];
	for (let offset = 6; offset >= 0; offset--) {
		const date = new Date(dayStart); date.setDate(date.getDate() - offset);
		const next = new Date(date); next.setDate(next.getDate() + 1);
		daily.push({ label: date.toLocaleDateString('en', { weekday: 'short' }), amount: sales.filter((sale) => new Date(sale.created_at) >= date && new Date(sale.created_at) < next).reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0) });
	}
	const weekly: { label: string; amount: number }[] = [];
	for (let offset = 7; offset >= 0; offset--) {
		const start = new Date(dayStart); start.setDate(start.getDate() - offset * 7);
		const end = new Date(start); end.setDate(end.getDate() + 7);
		weekly.push({ label: start.toLocaleDateString('en', { month: 'short', day: 'numeric' }), amount: sales.filter((sale) => new Date(sale.created_at) >= start && new Date(sale.created_at) < end).reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0) });
	}
	const monthly: { label: string; amount: number }[] = [];
	for (let offset = 11; offset >= 0; offset--) {
		const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
		const end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 1);
		monthly.push({ label: start.toLocaleDateString('en', { month: 'short' }), amount: sales.filter((sale) => new Date(sale.created_at) >= start && new Date(sale.created_at) < end).reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0) });
	}
	const categoryTotals = new Map<string, number>();
	const saleById = new Map(sales.map((sale) => [sale.id, sale]));
	for (const item of items) {
		const sale = saleById.get(item.sale_id);
		if (!sale || new Date(sale.created_at) < weekStart) continue;
		const categoryId = productCategory.get(item.product_id);
		const label = categoryId ? categoryNames.get(categoryId) || 'Other' : 'Uncategorized';
		categoryTotals.set(label, (categoryTotals.get(label) || 0) + Number(item.subtotal || 0));
	}
	const categoryTotal = [...categoryTotals.values()].reduce((a, b) => a + b, 0);
	const categoryBreakdown = [...categoryTotals].map(([name, amount]) => ({ name, amount, share: categoryTotal ? Math.round(amount / categoryTotal * 100) : 0 })).sort((a, b) => b.amount - a.amount).slice(0, 5);
	const periodRevenue = (from: Date, to: Date) => sales.filter((sale) => new Date(sale.created_at) >= from && new Date(sale.created_at) < to).reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0);
	const prevWeekStart = new Date(weekStart); prevWeekStart.setDate(prevWeekStart.getDate() - 7);
	const prevWeekRevenue = periodRevenue(prevWeekStart, weekStart);
	return {
		metrics: { revenue, transactions: windowSales.length, customers: customerCount, average: windowSales.length ? revenue / windowSales.length : 0, weeklyChange: prevWeekRevenue ? ((revenue - prevWeekRevenue) / prevWeekRevenue) * 100 : null, daily, weekly, monthly },
		categoryBreakdown,
		periodRange: { start: weekStart.toISOString(), end: now.toISOString() },
		monthRevenue: periodRevenue(monthStart, now)
	};
};
