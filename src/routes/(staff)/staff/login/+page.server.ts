import { fail, redirect } from '@sveltejs/kit';
import { authenticate, setSessionCookie } from '$lib/server/auth';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const id = String(data.get('studentId') ?? '').trim();
		const password = String(data.get('password') ?? '');
		const staff = authenticate(id, password, 'staff');
		if (!staff) return fail(400, { message: 'Invalid employee ID or password.' });

		await setSessionCookie(cookies, staff);
		throw redirect(303, staff.role === 'admin' ? '/staff/admin' : '/staff/pos');
	}
};