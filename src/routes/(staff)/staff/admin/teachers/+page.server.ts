import { env } from '$env/dynamic/private';
import { fail, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

type Membership = {
	id: number;
	teacher_id: string;
	membership_number: string;
	start_date: string;
	end_date: string;
	active_membership: boolean;
	approved_by: string | null;
};
type TeacherProfile = {
	id: string;
	school_id: string | null;
	employee_no: string | null;
	first_name: string | null;
	last_name: string | null;
	email: string | null;
	account_status: string | null;
	membership: Membership | null;
};

function apiConfig() {
	const url = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
	const key = env.SUPABASE_SECRET_KEY;
	if (!url || !key) throw error(503, 'Configure the Supabase URL and SUPABASE_SECRET_KEY in .env.');
	return { url, headers: { apikey: key, ...(key.startsWith('sb_secret_') ? {} : { Authorization: `Bearer ${key}` }) } };
}

async function supabaseRequest(path: string, init?: RequestInit) {
	const { url, headers } = apiConfig();
	return fetch(`${url}/rest/v1/${path}`, { ...init, headers: { ...headers, ...init?.headers } });
}

async function supabaseErrorDetail(response: Response) {
	const body = await response.text();
	if (!body) return '';

	try {
		const detail = JSON.parse(body) as { message?: unknown; details?: unknown; hint?: unknown };
		const parts = [detail.message, detail.details, detail.hint].filter(
			(part): part is string => typeof part === 'string' && part.length > 0
		);
		return (parts.join(' — ') || body).slice(0, 500);
	} catch {
		return body.slice(0, 500);
	}
}

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user?.role !== 'admin') throw error(403, 'Administrator access required.');
	const [profilesResponse, membershipsResponse] = await Promise.all([
		supabaseRequest('profiles?' + new URLSearchParams({ select: 'id,school_id,employee_no,first_name,last_name,email,account_status', role: 'in.(teacher,faculty)', order: 'last_name.asc,first_name.asc' })),
		supabaseRequest('teacher_memberships?' + new URLSearchParams({ select: 'id,teacher_id,membership_number,start_date,end_date,active_membership,approved_by', order: 'created_at.desc' }))
	]);
	if (!profilesResponse.ok) throw error(502, `Could not load teacher profiles (Supabase HTTP ${profilesResponse.status}).`);
	if (!membershipsResponse.ok) throw error(502, `Could not load teacher memberships (Supabase HTTP ${membershipsResponse.status}). Check the teacher_memberships table columns.`);
	const profiles = await profilesResponse.json() as Omit<TeacherProfile, 'membership'>[];
	const memberships = await membershipsResponse.json() as Membership[];
	const latestByTeacher = new Map<string, Membership>();
	for (const membership of memberships) if (!latestByTeacher.has(membership.teacher_id)) latestByTeacher.set(membership.teacher_id, membership);
	return { teachers: profiles.map((teacher) => ({ ...teacher, membership: latestByTeacher.get(teacher.id) ?? null })) };
};

export const actions: Actions = {
	saveMembership: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') throw error(403, 'Administrator access required.');
		const form = await request.formData();
		const teacherId = String(form.get('teacherId') ?? '').trim();
		const membershipId = String(form.get('membershipId') ?? '').trim();
		const membershipNo = String(form.get('membershipNo') ?? '').trim();
		const startDate = String(form.get('startDate') ?? '').trim();
		const endDate = String(form.get('endDate') ?? '').trim();
		const active = String(form.get('active') ?? '') === 'true';
		if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teacherId)) return fail(400, { message: 'Invalid teacher profile.' });
		if (!membershipNo || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return fail(400, { message: 'Enter a membership number and valid start and end dates.' });
		if (endDate < startDate) return fail(400, { message: 'The end date must be on or after the start date.' });
		const teacherCheck = await supabaseRequest('profiles?' + new URLSearchParams({ select: 'id', id: `eq.${teacherId}`, role: 'in.(teacher,faculty)', limit: '1' }));
		if (!teacherCheck.ok) return fail(502, { message: `Unable to verify teacher profile (Supabase HTTP ${teacherCheck.status}).` });
		if (!(await teacherCheck.json() as unknown[]).length) return fail(404, { message: 'Teacher profile was not found.' });
		const payload = {
			teacher_id: teacherId,
			membership_number: membershipNo,
			start_date: startDate,
			end_date: endDate,
			active_membership: active,
			approved_by: locals.user.profileId
		};
		const query = membershipId ? `teacher_memberships?id=eq.${encodeURIComponent(membershipId)}&teacher_id=eq.${encodeURIComponent(teacherId)}` : 'teacher_memberships';
		const response = await supabaseRequest(query, {
			method: membershipId ? 'PATCH' : 'POST',
			headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
			body: JSON.stringify(payload)
		});
		if (!response.ok) {
			const detail = await supabaseErrorDetail(response);
			return fail(502, {
				message: `Unable to save membership (Supabase HTTP ${response.status})${detail ? `: ${detail}` : '.'}`
			});
		}
		return { success: true, message: active ? 'Teacher membership activated.' : 'Teacher membership marked inactive.' };
	}
};
