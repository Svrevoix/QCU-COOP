import { env } from '$env/dynamic/private';

export type ApplicantInput = {
	role: 'student' | 'teacher' | 'cashier' | 'admin';
	schoolId?: string;
	employeeNo?: string;
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	department: string;
	course?: string;
	yearLevel?: number;
	createdBy?: string;
};

function config() {
	const url = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
	const key = env.SUPABASE_SECRET_KEY;
	if (!url || !key) throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env before accepting registrations.');
	return { url, headers: { apikey: key, ...(key.startsWith('sb_secret_') ? {} : { Authorization: `Bearer ${key}` }) } };
}

export async function registerApplicant(applicant: ApplicantInput) {
	const { url, headers } = config();
	const authResponse = await fetch(`${url}/auth/v1/admin/users`, {
		method: 'POST',
		headers: { ...headers, 'Content-Type': 'application/json' },
		body: JSON.stringify({ email: applicant.email, password: applicant.password, email_confirm: true })
	});
	if (!authResponse.ok) {
		const detail = await authResponse.json().catch(() => ({})) as { msg?: string; message?: string };
		return { error: detail.msg || detail.message || 'Could not create the login account. Check that the email is not already registered.' } as const;
	}
	const authUser = await authResponse.json() as { id: string };
	const loginId = applicant.role === 'student' ? applicant.schoolId! : applicant.employeeNo!;
	const createdByAdmin = Boolean(applicant.createdBy);
	const profile = {
		id: authUser.id,
		school_id: applicant.role === 'student' ? loginId : null,
		employee_no: applicant.role !== 'student' ? loginId : null,
		login_id: loginId,
		first_name: applicant.firstName,
		last_name: applicant.lastName,
		email: applicant.email,
		role: applicant.role,
		registration_source: createdByAdmin ? 'admin' : 'self',
		account_status: createdByAdmin ? 'active' : 'pending',
		avatar_path: null,
		approved_by: applicant.createdBy || null,
		approved_at: createdByAdmin ? new Date().toISOString() : null,
		department: applicant.department || null,
		course: applicant.role === 'student' ? applicant.course || null : null,
		year_level: applicant.role === 'student' ? applicant.yearLevel ?? null : null
	};
	const profileResponse = await fetch(`${url}/rest/v1/profiles`, {
		method: 'POST',
		headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
		body: JSON.stringify(profile)
	});
	if (!profileResponse.ok) {
		await fetch(`${url}/auth/v1/admin/users/${encodeURIComponent(authUser.id)}`, { method: 'DELETE', headers });
		const detail = await profileResponse.json().catch(() => ({})) as { message?: string; details?: string };
		return { error: detail.message || detail.details || 'Could not save the profile. Check the profiles table columns and required fields.' } as const;
	}
	return { success: true } as const;
}
