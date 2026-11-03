import { fail, redirect } from '@sveltejs/kit';
import { setSupabaseSession, signInWithSupabase } from '$lib/server/auth';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const loginId = String(data.get('loginId') ?? '').trim();
		const password = String(data.get('password') ?? '');
		const result = await signInWithSupabase(loginId, password);
		if ('error' in result) return fail(400, { message: result.error });
		if (result.user.role === 'student' || result.user.role === 'teacher') return fail(403, { message: 'This account does not have staff access.' });

		setSupabaseSession(cookies, result.session);
		throw redirect(303, result.user.role === 'admin' ? '/staff/admin' : '/staff/pos');
	}
};
