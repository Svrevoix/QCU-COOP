import { env } from '$env/dynamic/private';
import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

type UtilityService = { id: number; service_name: string; provider: string | null; description: string | null };
type UtilityAccount = {
	id: number; account_number: string | null; account_name: string; service_address: string | null;
	billing_contact: string | null; contact_number: string | null; cost_center: string | null; status: string;
	service_id: number;
};
type UtilityBill = {
	id: number; utility_account_id: number; billing_month: number; billing_year: number; amount_due: number;
	amount_paid: number; due_date: string | null; payment_date: string | null; official_receipt_no: string | null;
	status: string; remarks: string | null; created_at: string;
};

function apiConfig() {
	const url = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
	const key = env.SUPABASE_SECRET_KEY;
	if (!url || !key) throw error(503, 'Configure the Supabase URL and SUPABASE_SECRET_KEY in .env.');
	return { url, headers: { apikey: key, ...(key.startsWith('sb_secret_') ? {} : { Authorization: `Bearer ${key}` }) } };
}

async function request(path: string) {
	const { url, headers } = apiConfig();
	return fetch(`${url}/rest/v1/${path}`, { headers });
}

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user?.role !== 'admin') throw error(403, 'Administrator access required.');
	const [accountsRes, servicesRes, billsRes] = await Promise.all([
		request('utility_accounts?' + new URLSearchParams({ select: 'id,account_number,account_name,service_address,billing_contact,contact_number,cost_center,status,service_id', order: 'created_at.asc' })),
		request('utility_services?' + new URLSearchParams({ select: 'id,service_name,provider,description', order: 'service_name.asc' })),
		request('utility_bills?' + new URLSearchParams({ select: 'id,utility_account_id,billing_month,billing_year,amount_due,amount_paid,due_date,payment_date,official_receipt_no,status,remarks,created_at', order: 'created_at.desc' }))
	]);
	if (!accountsRes.ok) throw error(502, `Could not load utility accounts (Supabase HTTP ${accountsRes.status}).`);
	if (!servicesRes.ok) throw error(502, `Could not load utility services (Supabase HTTP ${servicesRes.status}).`);
	if (!billsRes.ok) throw error(502, `Could not load utility bills (Supabase HTTP ${billsRes.status}).`);
	const [accounts, services, bills] = await Promise.all([
		accountsRes.json() as Promise<UtilityAccount[]>, servicesRes.json() as Promise<UtilityService[]>, billsRes.json() as Promise<UtilityBill[]>
	]);
	return { accounts, services, bills };
};

export const actions: Actions = {
	addService: async ({ request: formRequest, locals }) => {
		if (locals.user?.role !== 'admin') throw error(403, 'Administrator access required.');
		const form = await formRequest.formData();
		const serviceId = Number(form.get('serviceId'));
		const accountNumber = String(form.get('accountNumber') ?? '').trim();
		const accountName = String(form.get('accountName') ?? '').trim();
		if (!Number.isInteger(serviceId) || serviceId < 1 || !accountNumber || !accountName) return fail(400, { success: false, message: 'Select a service and enter the account number and name.' });
		const payload = {
			service_id: serviceId, account_number: accountNumber, account_name: accountName,
			service_address: String(form.get('serviceAddress') ?? '').trim() || null,
			billing_contact: String(form.get('billingContact') ?? '').trim() || null,
			contact_number: String(form.get('contactNumber') ?? '').trim() || null,
			cost_center: String(form.get('costCenter') ?? '').trim() || null, status: 'active'
		};
		const { url, headers } = apiConfig();
		const response = await fetch(`${url}/rest/v1/utility_accounts`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(payload) });
		if (!response.ok) return fail(502, { success: false, message: `Could not add utility account (Supabase HTTP ${response.status}).` });
		return { success: true };
	},
	addBill: async ({ request: formRequest, locals }) => {
		if (locals.user?.role !== 'admin') throw error(403, 'Administrator access required.');
		const form = await formRequest.formData();
		const accountId = Number(form.get('accountId'));
		const billingMonth = Number(form.get('billingMonth'));
		const billingYear = Number(form.get('billingYear'));
		const amountDue = Number(form.get('amountDue'));
		const amountPaid = Number(form.get('amountPaid') || 0);
		const dueDate = String(form.get('dueDate') ?? '').trim();
		const paymentDate = String(form.get('paymentDate') ?? '').trim();
		if (!Number.isInteger(accountId) || accountId < 1 || !Number.isInteger(billingMonth) || billingMonth < 1 || billingMonth > 12 || !Number.isInteger(billingYear) || billingYear < 2000 || billingYear > 9999 || !Number.isFinite(amountDue) || amountDue <= 0 || !Number.isFinite(amountPaid) || amountPaid < 0 || amountPaid > amountDue) {
			return fail(400, { success: false, message: 'Choose an account and valid billing period and amounts. Paid amount cannot exceed the amount due.' });
		}
		const status = amountPaid >= amountDue ? 'paid' : amountPaid > 0 ? 'partial' : 'pending';
		const payload = {
			utility_account_id: accountId,
			billing_month: billingMonth,
			billing_year: billingYear,
			amount_due: amountDue,
			amount_paid: amountPaid,
			due_date: dueDate || null,
			payment_date: paymentDate || null,
			official_receipt_no: String(form.get('receiptNumber') ?? '').trim() || null,
			status,
			remarks: String(form.get('remarks') ?? '').trim() || null
		};
		const { url, headers } = apiConfig();
		const response = await fetch(`${url}/rest/v1/utility_bills`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(payload) });
		if (!response.ok) return fail(502, { success: false, message: `Could not add utility bill (Supabase HTTP ${response.status}).` });
		return { success: true, billAdded: true };
	},
	markBillPaid: async ({ request: formRequest, locals }) => {
		if (locals.user?.role !== 'admin') throw error(403, 'Administrator access required.');
		const form = await formRequest.formData();
		const billId = Number(form.get('billId'));
		if (!Number.isInteger(billId) || billId < 1) return fail(400, { success: false, message: 'Choose a valid bill to mark as paid.' });
		const lookup = await request('utility_bills?' + new URLSearchParams({ select: 'id,amount_due,status', id: `eq.${billId}`, limit: '1' }));
		if (!lookup.ok) return fail(502, { success: false, message: `Could not load the bill (Supabase HTTP ${lookup.status}).` });
		const [bill] = await lookup.json() as Array<{ id: number; amount_due: number; status: string }>;
		if (!bill) return fail(404, { success: false, message: 'This bill no longer exists. Refresh the page and try again.' });
		if (bill.status.toLowerCase() === 'cancelled') return fail(400, { success: false, message: 'Cancelled bills cannot be marked as paid.' });
		if (bill.status.toLowerCase() === 'paid') return { success: true, statusUpdated: true };
		const { url, headers } = apiConfig();
		const today = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map((part) => [part.type, part.value]));
		const response = await fetch(`${url}/rest/v1/utility_bills?id=eq.${billId}`, {
			method: 'PATCH',
			headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
			body: JSON.stringify({ amount_paid: Number(bill.amount_due), payment_date: `${today.year}-${today.month}-${today.day}`, status: 'paid' })
		});
		if (!response.ok) return fail(502, { success: false, message: `Could not mark the bill as paid (Supabase HTTP ${response.status}).` });
		return { success: true, statusUpdated: true };
	}
};
