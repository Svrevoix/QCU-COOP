import { error, type PageServerLoad } from '@sveltejs/kit';
import { inventoryRequest } from '$lib/server/inventory';

type Row = Record<string, string | number | boolean | null>;

async function readRows(table: string, select: string, params: Record<string, string> = {}) {
	const rows: Row[] = [];
	try {
		for (let offset = 0; offset < 50_000; offset += 1000) {
			const query = new URLSearchParams({ select, limit: '1000', offset: String(offset), ...params });
			const response = await inventoryRequest(`${table}?${query}`);
			if (!response.ok) {
				console.error(`Dashboard could not load ${table}: HTTP ${response.status}`);
				return { rows: [] as Row[], failed: table };
			}
			const batch = await response.json() as Row[];
			rows.push(...batch);
			if (batch.length < 1000) break;
		}
		return { rows, failed: '' };
	} catch (cause) {
		console.error(`Dashboard could not load ${table}.`, cause);
		return { rows: [] as Row[], failed: table };
	}
}

async function saleItemsFor(saleIds: number[]) {
	const rows: Row[] = [];
	let failed = false;
	for (let index = 0; index < saleIds.length; index += 100) {
		const ids = saleIds.slice(index, index + 100);
		const result = await readRows('sale_items', 'id,sale_id,product_id,quantity,unit_price,subtotal', {
			sale_id: `in.(${ids.join(',')})`, order: 'id.desc'
		});
		rows.push(...result.rows);
		failed ||= Boolean(result.failed);
	}
	return { rows, failed };
}

const number = (value: unknown) => Number(value ?? 0) || 0;
const dateKey = (value: unknown) => String(value ?? '').slice(0, 10);

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user?.role !== 'admin') throw error(403, 'Administrator access required.');
	const now = new Date();
	const currentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
	const startRange = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));
	const last30Days = new Date(now);
	last30Days.setUTCDate(last30Days.getUTCDate() - 30);

	const specs = await Promise.all([
		readRows('sales', 'id,receipt_number,total_amount,created_at', { created_at: `gte.${startRange.toISOString()}`, order: 'created_at.desc' }),
		readRows('products', 'id,sku,product_name,category_id,stock,reorder_level,status', { order: 'product_name.asc' }),
		readRows('inventory', 'product_id,quantity,location_type', {}),
		readRows('categories', 'id,category_name', {}),
		readRows('utility_accounts', 'id,status', {}),
		readRows('utility_bills', 'id,amount_due,amount_paid,due_date,payment_date,status', {}),
		readRows('audit_logs', 'id,action,module,record_id,created_at', { order: 'created_at.desc', limit: '10' })
	]);
	const [sales, products, inventory, categories, accounts, bills, audits] = specs.map((result) => result.rows);
	const salesById = new Map(sales.map((sale) => [number(sale.id), sale]));
	const itemsSince = new Date(Math.min(last30Days.getTime(), currentMonth.getTime()));
	const salesForItems = sales.filter((sale) => new Date(String(sale.created_at ?? '')) >= itemsSince);
	const saleItemResult = await saleItemsFor(salesForItems.map((sale) => number(sale.id)));
	const saleItems = saleItemResult.rows;
	const categoryNames = new Map(categories.map((row) => [number(row.id), String(row.category_name ?? 'Uncategorized')]));
	const productById = new Map(products.map((product) => [number(product.id), product]));
	const soldRecently = new Set(saleItems.map((item) => number(item.product_id)));
	const inventoryByProduct = new Map<number, { store: number; warehouse: number }>();
	for (const row of inventory) {
		const key = number(row.product_id);
		const totals = inventoryByProduct.get(key) ?? { store: 0, warehouse: 0 };
		if (row.location_type === 'store') totals.store += number(row.quantity);
		if (row.location_type === 'warehouse') totals.warehouse += number(row.quantity);
		inventoryByProduct.set(key, totals);
	}
	const stockItems = products.map((product) => {
		const totals = inventoryByProduct.get(number(product.id));
		const stock = totals?.store ?? number(product.stock);
		return { ...product, stock, category: categoryNames.get(number(product.category_id)) ?? 'Uncategorized' };
	});
	const activeProducts = stockItems.filter((product) => String(product.status ?? 'active').toLowerCase() === 'active');
	const lowStockItems = activeProducts
		.filter((product) => product.stock <= number(product.reorder_level))
		.sort((a, b) => a.stock - b.stock)
		.slice(0, 5)
		.map((product) => ({ name: String(product.product_name ?? ''), sku: String(product.sku ?? ''), category: product.category, remaining: product.stock }));
	const nonSellingCount = activeProducts.filter((product) => !soldRecently.has(number(product.id))).length;
	const currentSales = sales.filter((sale) => new Date(String(sale.created_at ?? '')) >= currentMonth);
	const previousMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
	const previousMonthEnd = currentMonth;
	const previousSales = sales.filter((sale) => {
		const date = new Date(String(sale.created_at ?? ''));
		return date >= previousMonthStart && date < previousMonthEnd;
	});
	const grossSales = currentSales.reduce((sum, sale) => sum + number(sale.total_amount), 0);
	const previousGross = previousSales.reduce((sum, sale) => sum + number(sale.total_amount), 0);
	const salesChange = previousGross ? ((grossSales - previousGross) / previousGross) * 100 : null;
	const currentMonthIds = new Set(currentSales.map((sale) => number(sale.id)));
	const unitsMoved = saleItems.filter((item) => currentMonthIds.has(number(item.sale_id))).reduce((sum, item) => sum + number(item.quantity), 0);
	const recentTransactions = saleItems
		.filter((item) => salesById.has(number(item.sale_id)))
		.sort((a, b) => new Date(String(salesById.get(number(b.sale_id))?.created_at)).getTime() - new Date(String(salesById.get(number(a.sale_id))?.created_at)).getTime())
		.slice(0, 5)
		.map((item) => {
			const sale = salesById.get(number(item.sale_id))!;
			const product = productById.get(number(item.product_id));
			return { item: String(product?.product_name ?? 'Deleted item'), reference: String(sale.receipt_number ?? `Sale #${sale.id}`), category: categoryNames.get(number(product?.category_id)) ?? 'Uncategorized', quantity: number(item.quantity), amount: number(item.subtotal), date: dateKey(sale.created_at) };
		});
	const trend = Array.from({ length: 7 }, (_, index) => {
		const day = new Date(now);
		day.setUTCHours(0, 0, 0, 0);
		day.setUTCDate(day.getUTCDate() - (6 - index));
		const key = dateKey(day.toISOString());
		const amount = sales.filter((sale) => dateKey(sale.created_at) === key).reduce((sum, sale) => sum + number(sale.total_amount), 0);
		return { label: new Intl.DateTimeFormat('en', { weekday: 'short', timeZone: 'UTC' }).format(day), amount };
	});
	const maxTrend = Math.max(...trend.map((day) => day.amount), 1);
	const salesTrend = trend.map((day) => ({ ...day, height: Math.max(day.amount ? 8 : 2, (day.amount / maxTrend) * 100) }));
	const currentWeekStart = new Date(now);
	currentWeekStart.setUTCHours(0, 0, 0, 0);
	currentWeekStart.setUTCDate(currentWeekStart.getUTCDate() - 6);
	const previousWeekStart = new Date(currentWeekStart);
	previousWeekStart.setUTCDate(previousWeekStart.getUTCDate() - 7);
	const currentWeekSales = salesTrend.reduce((sum, day) => sum + day.amount, 0);
	const previousWeekSales = sales.filter((sale) => {
		const date = new Date(String(sale.created_at ?? ''));
		return date >= previousWeekStart && date < currentWeekStart;
	}).reduce((sum, sale) => sum + number(sale.total_amount), 0);
	const weekChange = previousWeekSales ? ((currentWeekSales - previousWeekSales) / previousWeekSales) * 100 : null;
	const activeAccounts = accounts.filter((account) => String(account.status).toLowerCase() === 'active').length;
	const outstandingBalance = bills.reduce((sum, bill) => sum + Math.max(number(bill.amount_due) - number(bill.amount_paid), 0), 0);
	const ytdUtilitySpend = bills.filter((bill) => String(bill.payment_date ?? '').slice(0, 4) === String(now.getUTCFullYear())).reduce((sum, bill) => sum + number(bill.amount_paid), 0);
	const nextBill = bills.filter((bill) => number(bill.amount_due) > number(bill.amount_paid) && bill.due_date && new Date(String(bill.due_date)) >= new Date(dateKey(now.toISOString()))).sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)))[0];
	const activity = audits.slice(0, 5).filter((row) => row.created_at).map((row) => ({ title: String(row.action ?? 'System activity'), meta: `${String(row.module ?? 'System')} · ${new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(String(row.created_at)))}`, status: 'Logged', tone: 'blue' }));
	const failedTables = specs.filter((result) => result.failed).map((result) => result.failed);
	if (saleItemResult.failed) failedTables.push('sale_items');
	return {
		userName: [locals.user.firstName, locals.user.lastName].filter(Boolean).join(' ') || 'Administrator',
		dashboard: {
			grossSales, salesChange, unitsMoved, lowStockItems, lowStockCount: activeProducts.filter((product) => product.stock <= number(product.reorder_level)).length,
			nonSellingCount, recentTransactions, salesTrend, currentWeekSales, weekChange,
			activeAccounts, utilityAccountCount: accounts.length, outstandingBalance, nextBillDate: nextBill?.due_date ? new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit', timeZone: 'UTC' }).format(new Date(`${nextBill.due_date}T00:00:00Z`)) : null,
			ytdUtilitySpend, activity, failedTables, generatedAt: now.toISOString(), currentMonthLabel: new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(currentMonth)
		}
	};
};
