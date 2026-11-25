import { reportDescriptions } from './report-presets';

export type ReportSourceRow = Record<string, string | number | boolean | null>;
export type BuiltReport = {
	description: string;
	columns: string[];
	rows: string[][];
	metricLabel: string;
	metricValue: string;
	rowCount: string;
	highlightColumn: number;
	numericLastColumn: boolean;
};
type Source = Record<string, ReportSourceRow[]>;

const num = (value: unknown) => Number(value ?? 0) || 0;
const text = (value: unknown) => value == null || value === '' ? '—' : String(value);
const money = (value: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value || 0);
const shortDate = (value: unknown) => {
	if (!value) return '—';
	const date = new Date(String(value));
	return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat('en', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
};
const dateTime = (value: unknown) => {
	if (!value) return '—';
	const date = new Date(String(value));
	return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};
const periodMatches = (value: unknown, period: string) => {
	if (!value) return false;
	const date = new Date(String(value));
	if (Number.isNaN(date.getTime())) return false;
	if (period === 'All time') return true;
	const now = new Date();
	const start = new Date(now.getFullYear(), now.getMonth(), 1);
	if (period === 'Today') start.setTime(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime());
	else if (period === 'Last month') start.setMonth(start.getMonth() - 1);
	else if (period === 'Quarter to date') start.setMonth(Math.floor(now.getMonth() / 3) * 3, 1);
	else if (period === 'Year to date') start.setMonth(0, 1);
	const end = period === 'Last month' ? new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999) : now;
	return date >= start && date <= end;
};

export function buildReport(report: string, source: Source, period: string, warehouse: string): BuiltReport {
	const sales = source.sales ?? [];
	const saleItems = source.sale_items ?? [];
	const products = source.products ?? [];
	const inventory = source.inventory ?? [];
	const warehouses = source.warehouses ?? [];
	const transactions = source.inventory_transactions ?? [];
	const sessions = source.cashier_sessions ?? [];
	const profiles = source.profiles ?? [];
	const categories = source.categories ?? [];
	const suppliers = source.suppliers ?? [];
	const purchaseOrders = source.purchase_orders ?? [];
	const purchaseItems = source.purchase_order_items ?? [];
	const auditLogs = source.audit_logs ?? [];
	const productById = new Map(products.map((row) => [String(row.id), row] as const));
	const saleById = new Map(sales.map((row) => [String(row.id), row] as const));
	const profileById = new Map(profiles.map((row) => [String(row.id), row] as const));
	const warehouseById = new Map(warehouses.map((row) => [String(row.id), row] as const));
	const categoryById = new Map(categories.map((row) => [String(row.id), row] as const));
	const supplierById = new Map(suppliers.map((row) => [String(row.id), row] as const));
	const orderById = new Map(purchaseOrders.map((row) => [String(row.id), row] as const));
	const fullName = (id: unknown) => {
		const profile = profileById.get(String(id));
		return profile ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || text(id) : text(id);
	};
	const matchingSales = sales.filter((row) => periodMatches(row.created_at, period));
	const matchingSaleIds = new Set(matchingSales.map((row) => String(row.id)));
	const matchingItems = saleItems.filter((row) => matchingSaleIds.has(String(row.sale_id)));
	const matchingInventory = inventory.filter((row) => warehouse === 'All warehouses' || String(warehouseById.get(String(row.warehouse_id))?.warehouse_name ?? '') === warehouse);
	const matchingTransactions = transactions.filter((row) => periodMatches(row.created_at, period) && (warehouse === 'All warehouses' || String(warehouseById.get(String(row.warehouse_id))?.warehouse_name ?? '') === warehouse));
	const activeProducts = products.filter((row) => String(row.status ?? '').toLowerCase() !== 'inactive');
	let columns: string[] = [];
	let rows: string[][] = [];
	let metricLabel = 'Records';
	let metricValue = '0';
	let unit = 'records';

	const itemSales = (items: ReportSourceRow[]) => {
		const grouped = new Map<string, { quantity: number; subtotal: number; lastSale: string; product: ReportSourceRow }>();
		for (const item of items) {
			const product = productById.get(String(item.product_id));
			if (!product) continue;
			const id = String(item.product_id);
			const sale = saleById.get(String(item.sale_id));
			const entry = grouped.get(id) ?? { quantity: 0, subtotal: 0, lastSale: '', product };
			entry.quantity += num(item.quantity);
			entry.subtotal += num(item.subtotal) || num(item.unit_price) * num(item.quantity);
			if (String(sale?.created_at ?? '') > entry.lastSale) entry.lastSale = String(sale?.created_at ?? '');
			grouped.set(id, entry);
		}
		return grouped;
	};

	switch (report) {
		case 'Daily Cashier Cash-Out': {
			columns = ['Cashier', 'Transactions', 'Payment method', 'Cash collected', 'Variance']; unit = 'cashiers'; metricLabel = 'Cash collected';
			const grouped = new Map<string, { count: number; collected: number }>();
			const matchingSessions = sessions.filter((session) => periodMatches(session.shift_start, period));
			if (matchingSessions.length) {
				for (const session of matchingSessions) {
					const id = String(session.cashier_id ?? 'Unassigned');
					const current = grouped.get(id) ?? { count: 0, collected: 0 };
					current.count += num(session.total_transactions);
					current.collected += num(session.total_sales);
					grouped.set(id, current);
				}
			} else {
				for (const sale of matchingSales) {
					const id = String(sale.cashier_id ?? 'Unassigned');
					const current = grouped.get(id) ?? { count: 0, collected: 0 };
					current.count += 1;
					current.collected += Math.max(0, num(sale.cash_received) - num(sale.change_amount)) || num(sale.total_amount);
					grouped.set(id, current);
				}
			}
			rows = [...grouped.entries()].map(([id, value]) => [fullName(id), String(value.count), 'Cash', money(value.collected), money(0)]);
			metricValue = money([...grouped.values()].reduce((sum, value) => sum + value.collected, 0));
			break;
		}
		case 'Weekly Summary':
		case 'Monthly Summary':
		case 'Monthly Sales Analysis':
		case 'Annual Sales Analysis': {
			const grouping = report === 'Weekly Summary' ? 'week' : report === 'Annual Sales Analysis' ? 'year' : 'month';
			columns = grouping === 'week' ? ['Week of', 'Transactions', 'Gross sales', 'Cash collected'] : grouping === 'year' ? ['Year', 'Transactions', 'Gross sales', 'Cash collected'] : ['Month', 'Transactions', 'Gross sales', 'Cash collected'];
			unit = grouping === 'week' ? 'weeks' : grouping === 'year' ? 'years' : 'months'; metricLabel = 'Cash collected';
			const grouped = new Map<string, { count: number; gross: number; cash: number }>();
			for (const sale of matchingSales) {
				const date = new Date(String(sale.created_at));
				let key: string;
				if (grouping === 'year') key = String(date.getFullYear());
				else if (grouping === 'week') { const monday = new Date(date); monday.setDate(date.getDate() - ((date.getDay() + 6) % 7)); key = shortDate(monday.toISOString()); }
				else key = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(date);
				const value = grouped.get(key) ?? { count: 0, gross: 0, cash: 0 };
				value.count += 1; value.gross += num(sale.total_amount); value.cash += Math.max(0, num(sale.cash_received) - num(sale.change_amount)) || num(sale.total_amount); grouped.set(key, value);
			}
			rows = [...grouped.entries()].map(([key, value]) => [key, String(value.count), money(value.gross), money(value.cash)]);
			metricValue = money([...grouped.values()].reduce((sum, value) => sum + value.cash, 0));
			break;
		}
		case 'Detailed Sales Report': {
			columns = ['Date', 'Receipt', 'Cashier', 'Payment method', 'Amount']; unit = 'sales'; metricLabel = 'Cash sales';
			rows = matchingSales.map((sale) => [shortDate(sale.created_at), text(sale.receipt_number), fullName(sale.cashier_id), 'Cash', money(num(sale.total_amount))]);
			metricValue = money(matchingSales.reduce((sum, sale) => sum + num(sale.total_amount), 0)); break;
		}
		case 'Detailed Sales by Item': {
			columns = ['Date', 'SKU', 'Product', 'Qty', 'Unit price', 'Subtotal']; unit = 'sale lines'; metricLabel = 'Units sold';
			rows = matchingItems.map((item) => { const product = productById.get(String(item.product_id)); const sale = saleById.get(String(item.sale_id)); return [shortDate(sale?.created_at), text(product?.sku), text(product?.product_name), String(num(item.quantity)), money(num(item.unit_price)), money(num(item.subtotal) || num(item.quantity) * num(item.unit_price))]; });
			metricValue = String(matchingItems.reduce((sum, item) => sum + num(item.quantity), 0)); break;
		}
		case 'Summarized Sales': {
			columns = ['Category', 'Transactions', 'Units sold', 'Cash sales', 'Share']; unit = 'categories'; metricLabel = 'Cash sales';
			const totals = new Map<string, { sales: Set<string>; quantity: number; amount: number }>();
			for (const item of matchingItems) { const product = productById.get(String(item.product_id)); const category = text(categoryById.get(String(product?.category_id))?.category_name); const value = totals.get(category) ?? { sales: new Set<string>(), quantity: 0, amount: 0 }; value.sales.add(String(item.sale_id)); value.quantity += num(item.quantity); value.amount += num(item.subtotal) || num(item.unit_price) * num(item.quantity); totals.set(category, value); }
			const gross = [...totals.values()].reduce((sum, value) => sum + value.amount, 0);
			rows = [...totals.entries()].map(([category, value]) => [category, String(value.sales.size), String(value.quantity), money(value.amount), gross ? `${(value.amount / gross * 100).toFixed(1)}%` : '0%']); metricValue = money(gross); break;
		}
		case 'Daily Product Analysis':
		case 'Best-Selling Products':
		case 'Slow-Moving Products': {
			const sold = itemSales(matchingItems);
			const sorted = [...sold.values()].sort((a, b) => b.quantity - a.quantity);
			if (report === 'Best-Selling Products') { columns = ['Rank', 'Product', 'SKU', 'Units sold', 'Revenue']; unit = 'products'; metricLabel = 'Top units sold'; metricValue = sorted.length ? `${sorted[0].quantity} units` : '0'; rows = sorted.map((value, index) => [String(index + 1), text(value.product.product_name), text(value.product.sku), String(value.quantity), money(value.subtotal)]); }
			else if (report === 'Slow-Moving Products') { columns = ['SKU', 'Product', 'Last sold', 'Days idle', 'Units (30d)', 'On hand']; unit = 'products'; metricLabel = 'Slow-moving items'; const now = Date.now(); const allSold = itemSales(saleItems); const thirtyDaysAgo = new Date(now - 30 * 86400000); const recentSaleIds = new Set(sales.filter((sale) => new Date(String(sale.created_at)) >= thirtyDaysAgo).map((sale) => String(sale.id))); const recentSold = itemSales(saleItems.filter((item) => recentSaleIds.has(String(item.sale_id)))); rows = activeProducts.map((product) => { const value = allSold.get(String(product.id)); const last = value?.lastSale ? new Date(value.lastSale) : null; const recentQty = recentSold.get(String(product.id))?.quantity ?? 0; return { row: [text(product.sku), text(product.product_name), last ? shortDate(last.toISOString()) : 'Never', last ? String(Math.floor((now - last.getTime()) / 86400000)) : '—', String(recentQty), String(num(product.stock))], idle: last ? now - last.getTime() : Number.MAX_SAFE_INTEGER }; }).sort((a, b) => b.idle - a.idle).map((entry) => entry.row); metricValue = String(rows.filter((row) => num(row[4]) === 0).length); }
			else { columns = ['Product', 'SKU', 'Units sold', 'Cash sales', 'Stock on hand']; unit = 'products'; metricLabel = 'Units sold'; rows = sorted.map((value) => [text(value.product.product_name), text(value.product.sku), String(value.quantity), money(value.subtotal), String(num(value.product.stock))]); metricValue = String(sorted.reduce((sum, value) => sum + value.quantity, 0)); }
			break;
		}
		case 'Inventory Balance Report':
		case 'Inventory Cost by Item': {
			unit = 'inventory items';
			if (report === 'Inventory Balance Report') { columns = ['SKU', 'Product', 'Warehouse', 'On hand', 'Available']; rows = matchingInventory.map((entry) => { const product = productById.get(String(entry.product_id)); const warehouseRow = warehouseById.get(String(entry.warehouse_id)); return [text(product?.sku), text(product?.product_name), text(warehouseRow?.warehouse_name), String(num(entry.quantity)), String(num(entry.quantity))]; }); metricLabel = 'Units on hand'; metricValue = String(matchingInventory.reduce((sum, entry) => sum + num(entry.quantity), 0)); }
			else { columns = ['SKU', 'Product', 'Quantity', 'Unit cost', 'Total cost']; rows = activeProducts.map((product) => { const quantity = num(product.stock); return [text(product.sku), text(product.product_name), String(quantity), money(num(product.cost_price)), money(quantity * num(product.cost_price))]; }); metricLabel = 'Inventory value'; metricValue = money(rows.reduce((sum, row) => sum + Number(row[4].replace(/[^\d.]/g, '')), 0)); }
			break;
		}
		case 'Inventory Movement Report': {
			columns = ['Date', 'Reference', 'SKU', 'Movement', 'Quantity']; unit = 'movements'; metricLabel = 'Movement quantity';
			rows = matchingTransactions.map((entry) => [shortDate(entry.created_at), text(entry.id), text(productById.get(String(entry.product_id))?.sku), text(entry.transaction_type), String(num(entry.quantity))]); metricValue = String(matchingTransactions.reduce((sum, entry) => sum + num(entry.quantity), 0)); break;
		}
		case 'Stock Level Report':
		case 'Product Alert Report': {
			const candidates = activeProducts.filter((product) => report === 'Product Alert Report' ? num(product.stock) <= num(product.reorder_level) : true);
			columns = report === 'Stock Level Report' ? ['SKU', 'Product', 'On hand', 'Reorder level', 'Status'] : ['Alert', 'SKU', 'Product', 'On hand', 'Reorder level']; unit = 'products'; metricLabel = report === 'Stock Level Report' ? 'Items below reorder' : 'Open alerts';
			rows = candidates.map((product) => { const stock = num(product.stock); const reorder = num(product.reorder_level); const status = stock <= 0 ? 'Out of stock' : stock <= reorder ? 'Reorder' : 'In stock'; return report === 'Stock Level Report' ? [text(product.sku), text(product.product_name), String(stock), String(reorder), status] : [status, text(product.sku), text(product.product_name), String(stock), String(reorder)]; }); metricValue = String(candidates.filter((product) => num(product.stock) <= num(product.reorder_level)).length); break;
		}
		case 'Detailed Receiving by Item': {
			columns = ['Received', 'PO number', 'Supplier', 'Product', 'Qty', 'Unit cost']; unit = 'received items'; metricLabel = 'Units received';
			rows = purchaseItems.filter((item) => { const order = orderById.get(String(item.purchase_order_id)); return order && periodMatches(order.created_at, period); }).map((item) => { const order = orderById.get(String(item.purchase_order_id)); const supplier = supplierById.get(String(order?.supplier_id)); const product = productById.get(String(item.product_id)); return [shortDate(order?.created_at), text(order?.po_number), text(supplier?.supplier_name), text(product?.product_name), String(num(item.quantity)), money(num(item.unit_cost))]; }); metricValue = String(rows.reduce((sum, row) => sum + num(row[4]), 0)); break;
		}
		case 'Audit Trail Logs': {
			columns = ['Timestamp', 'User', 'Action', 'Module', 'Reference', 'Result']; unit = 'events'; metricLabel = 'Logged actions';
			const filtered = auditLogs.filter((entry) => periodMatches(entry.created_at, period)); rows = filtered.map((entry) => [dateTime(entry.created_at), fullName(entry.user_id), text(entry.action), text(entry.module), text(entry.record_id), 'Recorded']); metricValue = String(filtered.length); break;
		}
		case 'Variance Report': {
			columns = ['SKU', 'Product', 'Product stock', 'Warehouse stock', 'Variance']; unit = 'items'; metricLabel = 'Items with variance';
			const byProduct = new Map<string, number>(); for (const entry of inventory) byProduct.set(String(entry.product_id), (byProduct.get(String(entry.product_id)) ?? 0) + num(entry.quantity));
			rows = activeProducts.map((product) => { const warehouseQty = byProduct.get(String(product.id)) ?? 0; const productQty = num(product.stock); return [text(product.sku), text(product.product_name), String(productQty), String(warehouseQty), String(productQty - warehouseQty)]; }).filter((row) => num(row[4]) !== 0); metricValue = String(rows.length); break;
		}
		case 'Paid Out Logs': {
			columns = ['Timestamp', 'User', 'Action', 'Module', 'Reference']; unit = 'audit events'; metricLabel = 'Cash paid-out events';
			rows = auditLogs.filter((entry) => periodMatches(entry.created_at, period) && /paid.?out|cash.?out/i.test(`${entry.action ?? ''} ${entry.module ?? ''}`)).map((entry) => [dateTime(entry.created_at), fullName(entry.user_id), text(entry.action), text(entry.module), text(entry.record_id)]); metricValue = String(rows.length); break;
		}
		case 'Historical Posted Transactions': {
			columns = ['Posted at', 'Receipt', 'Cashier', 'Status', 'Amount']; unit = 'transactions'; metricLabel = 'Posted transactions';
			rows = matchingSales.map((sale) => [dateTime(sale.created_at), text(sale.receipt_number), fullName(sale.cashier_id), 'Posted', money(num(sale.total_amount))]); metricValue = String(matchingSales.length); break;
		}
		case 'Dynamic Price Lists': {
			columns = ['SKU', 'Product', 'Price tier', 'Current price', 'Updated at', 'Status']; unit = 'products'; metricLabel = 'Active price rules';
			rows = activeProducts.map((product) => [text(product.sku), text(product.product_name), 'Standard', money(num(product.selling_price)), shortDate(product.updated_at), text(product.status)]); metricValue = String(rows.length); break;
		}
		default: {
			columns = ['Date', 'Reference', 'Details']; rows = []; metricValue = '0'; break;
		}
	}

	const lastColumn = columns[columns.length - 1] ?? '';
	const singular: Record<string, string> = { cashiers: 'cashier', weeks: 'week', years: 'year', months: 'month', categories: 'category', products: 'product', 'sale lines': 'sale line', 'inventory items': 'inventory item', movements: 'movement', 'received items': 'received item', events: 'event', items: 'item', 'audit events': 'audit event', transactions: 'transaction', records: 'record' };
	const countUnit = rows.length === 1 ? singular[unit] ?? unit : unit;
	return {
		description: reportDescriptions[report] ?? 'Database report for the selected period.',
		columns,
		rows,
		metricLabel,
		metricValue,
		rowCount: `${rows.length} ${countUnit}`,
		highlightColumn: columns.findIndex((column) => /sku|reference|receipt|transaction|voucher|po number/i.test(column)),
		numericLastColumn: /amount|sales|revenue|total|cost|balance|variance|quantity|units|available|share|change|price/i.test(lastColumn)
	};
}
