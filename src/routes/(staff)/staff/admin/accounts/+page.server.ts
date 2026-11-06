import { env } from '$env/dynamic/private';
import { fail, error } from '@sveltejs/kit';
import { registerApplicant } from '$lib/server/registration';
import type { Actions, PageServerLoad } from './$types';

type Profile = {
	id: string;
	school_id: string | null;
	employee_no: string | null;
	first_name: string | null;
	last_name: string | null;
	email: string | null;
	role: string | null;
	registration_source: string | null;
	account_status: string | null;
	department: string | null;
	course: string | null;
	year_level: number | null;
	created_at: string | null;
};

function config() {
	const url = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
	const key = env.SUPABASE_SECRET_KEY;
	if (!url || !key) throw error(503, 'Configure the Supabase URL and SUPABASE_SECRET_KEY in .env.');
	return {
		url,
		headers: {
			apikey: key,
			...(key.startsWith('sb_secret_') ? {} : { Authorization: `Bearer ${key}` })
		}
	};
}

export const load: PageServerLoad = async ({ locals, depends }) => {
	if (locals.user?.role !== 'admin') throw error(403, 'Administrator access required.');
	depends('app:accounts');
	const { url, headers } = config();
	const query = new URLSearchParams({
		select:
			'id,school_id,employee_no,first_name,last_name,email,role,registration_source,account_status,department,course,year_level,created_at',
		order: 'created_at.desc'
	});
	const response = await fetch(`${url}/rest/v1/profiles?${query}`, { headers });
	if (!response.ok)
		throw error(502, `Could not load user profiles (Supabase HTTP ${response.status}).`);
	const accounts = (await response.json()) as Profile[];
	return {
		accounts,
		pendingCount: accounts.filter(
			(account) => account.account_status?.trim().toLowerCase() === 'pending'
		).length,
		currentAdminId: locals.user.profileId
	};
};

export const actions: Actions = {
	setStatus: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') throw error(403, 'Administrator access required.');
		const form = await request.formData();
		const id = String(form.get('id') ?? '').trim();
		const status = String(form.get('status') ?? '')
			.trim()
			.toLowerCase();
		if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
			return fail(400, { message: 'Invalid profile ID.' });
		if (!['approved', 'suspended', 'rejected', 'archived'].includes(status))
			return fail(400, { message: 'Invalid account status.' });
		if (id === locals.user.profileId && ['archived', 'suspended', 'rejected'].includes(status))
			return fail(400, { message: 'You cannot deactivate your own administrator account.' });
		const { url, headers } = config();
		const query = new URLSearchParams({ id: `eq.${id}`, select: 'id,role' });
		const check = await fetch(`${url}/rest/v1/profiles?${query}`, { headers });
		if (!check.ok)
			return fail(502, { message: `Unable to verify profile (Supabase HTTP ${check.status}).` });
		const rows = (await check.json()) as Array<{ id: string; role: string }>;
		if (!rows.length) return fail(404, { message: 'Account not found.' });
		const changes: Record<string, unknown> = { account_status: status };
		if (status === 'approved') {
			changes.approved_by = locals.user.profileId;
			changes.approved_at = new Date().toISOString();
		}
		const update = await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(id)}`, {
			method: 'PATCH',
			headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
			body: JSON.stringify(changes)
		});
		if (!update.ok)
			return fail(502, {
				message: `Unable to update account status (Supabase HTTP ${update.status}).`
			});
		return { success: `Account ${status === 'approved' ? 'approved or reactivated' : status}.` };
	},
	createAccount: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') throw error(403, 'Administrator access required.');
		const form = await request.formData();
		const role = String(form.get('role') ?? '') as 'student' | 'teacher' | 'cashier' | 'admin';
		const schoolId = String(form.get('schoolId') ?? '').trim();
		const employeeNo = String(form.get('employeeNo') ?? '').trim();
		const firstName = String(form.get('firstName') ?? '').trim();
		const lastName = String(form.get('lastName') ?? '').trim();
		const email = String(form.get('email') ?? '')
			.trim()
			.toLowerCase();
		const password = String(form.get('password') ?? '');
		const departmentInput = String(form.get('department') ?? '').trim();
		const department = role === 'student' ? undefined : departmentInput;
		const course = String(form.get('course') ?? '').trim();
		const yearLevel = Number(form.get('yearLevel')) || undefined;
		if (!['student', 'teacher', 'cashier', 'admin'].includes(role))
			return fail(400, { message: 'Choose a valid account role.' });
		if (
			!firstName ||
			!lastName ||
			(role !== 'student' && !department) ||
			!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
		)
			return fail(400, { message: 'Complete all required name, department, and email fields.' });
		if (password.length < 8)
			return fail(400, { message: 'Set a password with at least 8 characters.' });
		if (
			role === 'student' &&
			(!schoolId ||
				!course ||
				!yearLevel ||
				!Number.isInteger(yearLevel) ||
				yearLevel < 1 ||
				yearLevel > 6)
		)
			return fail(400, { message: 'Enter the student number, course, and valid year level.' });
		if (role !== 'student' && !employeeNo)
			return fail(400, { message: 'Enter the employee number.' });
		const result = await registerApplicant({
			role,
			schoolId,
			employeeNo,
			firstName,
			lastName,
			email,
			password,
			department,
			course,
			yearLevel,
			createdBy: locals.user.profileId
		});
		if ('error' in result) return fail(400, { message: result.error });
		return { success: `${role[0].toUpperCase()}${role.slice(1)} account created and activated.` };
	}
};
