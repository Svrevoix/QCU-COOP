import { fail, redirect } from '@sveltejs/kit';
import { authenticate, setSessionCookie } from '$lib/server/auth';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const id = String(data.get('studentId') ?? '').trim();
		const password = String(data.get('password') ?? '');
		const mode = data.get('mode');

		if (mode === 'signup') {
			if (!/^\d{2}-\d{4}$/.test(id) || password.length < 8) {
				return fail(400, { mode: 'signup' as const, message: 'Enter a valid student ID and a password of at least 8 characters.' });
			}
			return fail(503, { mode: 'signup' as const, message: 'Account registration is not configured yet.' });
		}

		const user = authenticate(id, password, 'user');
		if (!user) return fail(400, { mode: 'login' as const, message: 'Invalid Student ID or password.' });

		await setSessionCookie(cookies, user);
		throw redirect(303, '/');
	}
};