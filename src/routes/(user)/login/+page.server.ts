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
<<<<<<< Updated upstream
			if (!/^\d{2}-\d{4}$/.test(id) || password.length < 8) {
				return fail(400, { mode: 'signup' as const, message: 'Enter a valid student ID and a password of at least 8 characters.' });
			}
			return fail(503, { mode: 'signup' as const, message: 'Account registration is not configured yet.' });
		}

		const user = authenticate(id, password, 'user');
		if (!user) return fail(400, { mode: 'login' as const, message: 'Invalid Student ID or password.' });

		await setSessionCookie(cookies, user);
		throw redirect(303, '/');
=======
			const role = String(data.get('role') ?? '');
			const schoolId = String(data.get('schoolId') ?? '').trim();
			const employeeNo = String(data.get('employeeNo') ?? '').trim();
			const firstName = String(data.get('firstName') ?? '').trim();
			const lastName = String(data.get('lastName') ?? '').trim();
			const email = String(data.get('email') ?? '').trim().toLowerCase();
			const password = String(data.get('password') ?? '');
			const departmentInput = String(data.get('department') ?? '').trim();
			const course = String(data.get('course') ?? '').trim();
			const yearLevelRaw = String(data.get('yearLevel') ?? '').trim();
			const yearLevel = yearLevelRaw ? Number(yearLevelRaw) : undefined;
			if (role !== 'student' && role !== 'teacher') return fail(400, { mode: 'signup' as const, message: 'Choose Student or Teacher as the account type.' });
			if (!firstName || !lastName || !email || !password || (role === 'teacher' && !departmentInput)) return fail(400, { mode: 'signup' as const, message: 'Complete all required profile fields.' });
			const idNumber = role === 'student' ? schoolId : employeeNo;
			if (!/^\d{2}-\d{4}$/.test(idNumber)) return fail(400, { mode: 'signup' as const, message: 'Enter an ID number with 2 digits, a dash, then 4 digits (for example, 23-2111).' });
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(400, { mode: 'signup' as const, message: 'Enter a valid email address.' });
			if (password.length < 8) return fail(400, { mode: 'signup' as const, message: 'Password must be at least 8 characters.' });
			if (role === 'student' && (!schoolId || !course || !yearLevel || !Number.isInteger(yearLevel) || yearLevel < 1)) return fail(400, { mode: 'signup' as const, message: 'Enter your student number, course, and year level.' });
			if (role === 'teacher' && !employeeNo) return fail(400, { mode: 'signup' as const, message: 'Enter your employee number.' });
			const result = await registerApplicant({ role, schoolId, employeeNo, firstName, lastName, email, password, department: role === 'teacher' ? departmentInput : undefined, course, yearLevel });
			if ('error' in result) return fail(400, { mode: 'signup' as const, message: result.error });
			return { mode: 'login' as const, success: 'Registration submitted. An administrator must approve your account before you can log in.' };
		}

		if (!loginId || !password) return fail(400, { mode: 'login' as const, message: 'Enter your student or employee number and password.' });
		if (!/^\d{2}-\d{4}$/.test(loginId)) return fail(400, { mode: 'login' as const, message: 'Enter an ID number with 2 digits, a dash, then 4 digits (for example, 23-2111).' });
		const result = await signInWithSupabase(loginId, password);
		if ('error' in result) return fail(400, { mode: 'login' as const, message: result.error });
		setSupabaseSession(cookies, result.session);
		throw redirect(303, result.user.role === 'admin' ? '/staff/admin' : result.user.role === 'cashier' ? '/staff/pos/register' : '/');
>>>>>>> Stashed changes
	}
};