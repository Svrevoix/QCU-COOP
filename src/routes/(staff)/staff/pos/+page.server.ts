import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { inventoryRequest } from '$lib/server/inventory';

type Sale = { id: number; receipt_number: string | null; total_amount: number | string; created_at: string; cashier_id: string; customer_id: string | null; qr_order_id: string | null };
type LegacySale = Omit<Sale, 'qr_order_id'>;
type CustomerProfile = { id: string; first_name: string | null; last_name: string | null };

async function getRows<T>(table: string, query: Record<string, string>): Promise<T[]> {
	const response = await inventoryRequest(`${table}?${new URLSearchParams(query)}`);
	if (!response.ok) throw error(502, `Unable to load ${table} (Supabase HTTP ${response.status}).`);
	return await response.json() as T[];
}

async function getRecentSales(cashierId: string, since: string) {
	const baseQuery = {
		select: 'id,receipt_number,total_amount,created_at,cashier_id,customer_id',
		cashier_id: `eq.${cashierId}`,
		created_at: `gte.${since}`,
		order: 'created_at.desc',
		limit: '500'
	};
	const response = await inventoryRequest(`sales?${new URLSearchParams({
		...baseQuery,
		select: `${baseQuery.select},qr_order_id`
	})}`);
	if (response.ok) {
		return { sales: await response.json() as Sale[], pickupOrderLinkAvailable: true };
	}

	const body = await response.text();
	let detail: { code?: string; message?: string };
	try {
		detail = JSON.parse(body) as { code?: string; message?: string };
	} catch {
		throw error(502, `Unable to load sales (Supabase HTTP ${response.status}).`);
	}
	if (detail.code !== 'PGRST204' && detail.code !== '42703') {
		throw error(502, `Unable to load sales (Supabase HTTP ${response.status}).`);
	}

	const legacyResponse = await inventoryRequest(`sales?${new URLSearchParams(baseQuery)}`);
	if (!legacyResponse.ok) throw error(502, `Unable to load sales (Supabase HTTP ${legacyResponse.status}).`);
	const legacySales = await legacyResponse.json() as LegacySale[];
	return {
		sales: legacySales.map((sale) => ({ ...sale, qr_order_id: null })),
		pickupOrderLinkAvailable: false
	};
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'cashier') throw error(403, 'Cashier access required.');
	const now = new Date();
	const start = new Date(now); start.setHours(0, 0, 0, 0);
	const previousStart = new Date(start); previousStart.setDate(previousStart.getDate() - 1);
	const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
	const [salesResult, unresolvedAlerts, openSessions, registers] = await Promise.all([
		getRecentSales(locals.user.profileId, previousStart.toISOString()),
		getRows<{ id: number }>('stock_alerts', { select: 'id', resolved: 'eq.false', limit: '1000' }).catch(() => []),
		getRows<{ id: number }>('cashier_sessions', { select: 'id', cashier_id: `eq.${locals.user.profileId}`, shift_end: 'is.null', limit: '100' }).catch(() => []),
		getRows<{ id: number; status: string }>('registers', { select: 'id,status', limit: '100' }).catch(() => [])
	]);
	const { sales, pickupOrderLinkAvailable } = salesResult;
	const customerIds = [...new Set(sales.slice(0, 100).map((sale) => sale.customer_id).filter((id): id is string => Boolean(id)))];
	const customerProfiles = customerIds.length
		? await getRows<CustomerProfile>('profiles', {
			select: 'id,first_name,last_name',
			id: `in.(${customerIds.join(',')})`,
			limit: String(customerIds.length)
		})
		: [];
	const customerNames = new Map(customerProfiles.map((profile) => [
		profile.id,
		[profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Member'
	]));
	const todaySales = sales.filter((sale) => new Date(sale.created_at) >= start);
	const yesterdaySales = sales.filter((sale) => new Date(sale.created_at) >= previousStart && new Date(sale.created_at) < start);
	const sum = (items: Sale[]) => items.reduce((total, sale) => total + Number(sale.total_amount || 0), 0);
	const cashierName = [locals.user.firstName, locals.user.lastName].filter(Boolean).join(' ') || 'Cashier';
	return {
		cashierName,
		openRegisters: openSessions.length,
		registerCount: registers.length,
		salesToday: sum(todaySales),
		yesterdaySales: sum(yesterdaySales),
		transactionsToday: todaySales.length,
		recentHour: todaySales.filter((sale) => new Date(sale.created_at) >= hourAgo).length,
		exceptions: unresolvedAlerts.length,
		pickupOrderLinkAvailable,
		transactions: sales.slice(0, 100).map((sale) => ({
			id: sale.receipt_number || `SALE-${sale.id}`,
			time: new Date(sale.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Manila' }),
			date: sale.created_at,
			cashier: cashierName,
			customer: sale.customer_id ? customerNames.get(sale.customer_id) || 'Member' : 'Walk-in',
			type: sale.qr_order_id ? 'Pickup order' : 'Sale',
			amount: Number(sale.total_amount || 0).toFixed(2),
			payment: 'Cash',
			state: 'Completed'
		}))
	};
};
