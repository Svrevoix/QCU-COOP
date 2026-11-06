import { fail, redirect } from '@sveltejs/kit';
import { signInWithSupabase, setSessionCookie } from '$lib/server/auth';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const id = String(data.get('loginId') ?? data.get('studentId') ?? '').trim();
		const password = String(data.get('password') ?? '');
		if (!/^\d{2}-\d{4}$/.test(id)) {
			return fail(400, { message: 'Enter an employee number with 2 digits, a dash, then 4 digits.' });
		}
		const result = await signInWithSupabase(id, password);
		if ('error' in result) return fail(400, { message: 'Invalid employee ID or password, or the account is not active.' });
		if (result.user.role !== 'admin' && result.user.role !== 'cashier') {
			return fail(400, { message: 'This account does not have staff access.' });
		}

		await setSessionCookie(cookies, result.user);
		throw redirect(303, result.user.role === 'admin' ? '/staff/admin' : '/staff/pos/register');
	}
};