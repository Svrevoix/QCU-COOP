import { error, type PageServerLoad } from '@sveltejs/kit';
import { inventoryRequest } from '$lib/server/inventory';

export type ReportDbRow = Record<string, string | number | boolean | null>;

async function readTable(table: string, select: string, order?: string) {
	try {
		const rows: ReportDbRow[] = [];
		const pageSize = 1000;
		for (let offset = 0; offset < 50000; offset += pageSize) {
			const params = new URLSearchParams({ select, limit: String(pageSize), offset: String(offset) });
			if (order) params.set('order', order);
			const response = await inventoryRequest(`${table}?${params}`);
			if (!response.ok) {
				console.error(`Reports could not read ${table}: Supabase HTTP ${response.status}`);
				return { rows: [] as ReportDbRow[], failed: table };
			}
			const page = await response.json() as ReportDbRow[];
			rows.push(...page);
			if (page.length < pageSize) break;
		}
		return { rows, failed: '' };
	} catch (cause) {
		console.error(`Reports could not read ${table}.`, cause);
		return { rows: [] as ReportDbRow[], failed: table };
	}
}

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user?.role !== 'admin') throw error(403, 'Administrator access required.');
	const specs = [
		['sales', 'id,receipt_number,qr_order_id,cashier_id,customer_id,total_amount,cash_received,change_amount,created_at', 'created_at.desc'],
		['sale_items', 'id,sale_id,product_id,quantity,unit_price,subtotal', 'id.desc'],
		['products', 'id,sku,product_name,category_id,supplier_id,cost_price,selling_price,stock,reorder_level,status,created_at,updated_at', 'product_name.asc'],
		['inventory', 'id,product_id,warehouse_id,quantity', 'id.desc'],
		['warehouses', 'id,warehouse_name,location', 'warehouse_name.asc'],
		['inventory_transactions', 'id,product_id,warehouse_id,transaction_type,quantity,remarks,created_by,created_at', 'created_at.desc'],
		['cashier_sessions', 'id,cashier_id,register_id,shift_start,shift_end,total_transactions,total_sales', 'shift_start.desc'],
		['profiles', 'id,first_name,last_name,role', 'last_name.asc'],
		['categories', 'id,category_name', 'category_name.asc'],
		['suppliers', 'id,supplier_name', 'supplier_name.asc'],
		['purchase_orders', 'id,po_number,supplier_id,total_amount,status,created_by,created_at', 'created_at.desc'],
		['purchase_order_items', 'id,purchase_order_id,product_id,quantity,unit_cost,subtotal', 'id.desc'],
		['audit_logs', 'id,user_id,action,module,record_id,created_at', 'created_at.desc']
	] as const;
	const results = await Promise.all(specs.map(([table, columns, order]) => readTable(table, columns, order)));
	const source: Record<string, ReportDbRow[]> = {};
	const failedTables: string[] = [];
	for (let index = 0; index < specs.length; index += 1) {
		source[specs[index][0]] = results[index].rows;
		if (results[index].failed) failedTables.push(results[index].failed);
	}
	return { reportSource: source, failedTables };
};
