import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import type { Cookies } from '@sveltejs/kit';

const ACCESS_TOKEN_COOKIE = 'qcu-supabase-access';
const REFRESH_TOKEN_COOKIE = 'qcu-supabase-refresh';

export interface AuthenticatedUser {
	role: 'student' | 'teacher' | 'admin' | 'cashier';
	id: string;
	profileId: string;
	email?: string;
	firstName?: string;
	lastName?: string;
	department?: string;
	course?: string;
	yearLevel?: number;
	coopMember: boolean;
}

type SupabaseUser = {
	id: string;
	email?: string;
};

type AccountProfile = {
	id: string;
	email: string | null;
	school_id: string | null;
	employee_no: string | null;
	login_id: string | null;
	role: string | null;
	account_status: string | null;
	first_name: string | null;
	last_name: string | null;
	department: string | null;
	course: string | null;
	year_level: number | null;
};

type SupabaseTokenResponse = {
	access_token: string;
	refresh_token: string;
	expires_in?: number;
	user: SupabaseUser;
};

function supabaseConfig() {
	const url = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
	const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
	if (!url || !key) {
		throw new Error(
			'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.'
		);
	}
	return { url, key, secretKey: env.SUPABASE_SECRET_KEY };
}

function roleFromProfile(profile: AccountProfile): AuthenticatedUser['role'] | null {
	const role = profile.role?.trim().toLowerCase();
	if (['admin', 'administrator'].includes(role ?? '')) return 'admin';
	if (['cashier', 'staff'].includes(role ?? '')) return 'cashier';
	if (['teacher', 'faculty'].includes(role ?? '')) return 'teacher';
	if (['student', 'customer', 'user', 'member'].includes(role ?? '')) return 'student';
	return null;
}

function accountIsEnabled(profile: AccountProfile) {
	const status = profile.account_status?.trim().toLowerCase() ?? '';
	return !/(pending|inactive|suspend|disabled|blocked|locked|rejected|archived)/.test(status);
}

async function userFromProfile(profile: AccountProfile): Promise<AuthenticatedUser | null> {
	const role = roleFromProfile(profile);
	if (!role || !profile.email) return null;
	const id =
		role === 'student'
			? profile.school_id || profile.login_id || profile.employee_no || profile.email
			: profile.employee_no || profile.login_id || profile.school_id || profile.email;
	const coopMember = role === 'teacher' ? await teacherHasActiveMembership(profile.id) : false;
	return {
		role,
		id,
		profileId: profile.id,
		email: profile.email,
		firstName: profile.first_name ?? undefined,
		lastName: profile.last_name ?? undefined,
		department: profile.department ?? undefined,
		course: profile.course ?? undefined,
		yearLevel: profile.year_level ?? undefined,
		coopMember
	};
}

async function teacherHasActiveMembership(teacherId: string) {
	const { url, secretKey } = supabaseConfig();
	if (!secretKey) {
		throw new Error(
			'Add SUPABASE_SECRET_KEY to .env so the server can check teacher membership securely.'
		);
	}
	const query = new URLSearchParams({
		select: 'status,start_date,end_date',
		teacher_id: `eq.${teacherId}`,
		order: 'start_date.desc',
		limit: '50'
	});
	const response = await fetch(`${url}/rest/v1/memberships?${query}`, {
		headers: {
			apikey: secretKey,
			Authorization: `Bearer ${secretKey}`
		}
	});
	if (!response.ok) {
		throw new Error(
			`Unable to check teacher membership (HTTP ${response.status}). Check the memberships table schema.`
		);
	}
	const today = new Date().toISOString().slice(0, 10);
	const memberships = (await response.json()) as Array<{
		status: string | null;
		start_date: string | null;
		end_date: string | null;
	}>;
	return memberships.some(
		(membership) =>
			membership.status?.trim().toLowerCase() === 'active' &&
			(!membership.start_date || membership.start_date <= today) &&
			(!membership.end_date || membership.end_date >= today)
	);
}

async function findProfile(filters: Record<string, string>) {
	const { url, secretKey } = supabaseConfig();
	if (!secretKey) {
		throw new Error(
			'Add SUPABASE_SECRET_KEY to .env so the server can look up profile IDs securely.'
		);
	}
	const query = new URLSearchParams({
		select:
			'id,email,school_id,employee_no,login_id,role,account_status,first_name,last_name,department,course,year_level',
		limit: '2',
		...filters
	});
	const response = await fetch(`${url}/rest/v1/profiles?${query}`, {
		headers: {
			apikey: secretKey,
			Authorization: `Bearer ${secretKey}`
		}
	});
	if (!response.ok) {
		throw new Error(
			`Unable to look up this account in the profiles table (HTTP ${response.status}). Check the Supabase key and profiles schema.`
		);
	}
	const profiles = (await response.json()) as AccountProfile[];
	if (profiles.length > 1) {
		throw new Error('More than one account matches that login. Contact an administrator.');
	}
	return profiles[0] ?? null;
}

async function profileForLoginId(loginId: string) {
	for (const column of ['login_id', 'school_id', 'employee_no']) {
		const profile = await findProfile({ [column]: `eq.${loginId}` });
		if (profile) return profile;
	}
	return null;
}

async function profileForAuthId(id: string) {
	return findProfile({ id: `eq.${id}` });
}

async function profileForEmail(email: string) {
	return findProfile({ email: `eq.${email}` });
}

async function authRequest(path: string, body: Record<string, unknown>) {
	const { url, key } = supabaseConfig();
	return fetch(`${url}/auth/v1/${path}`, {
		method: 'POST',
		headers: { apikey: key, 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
}

export async function signInWithSupabase(loginId: string, password: string) {
	try {
		const profile = await profileForLoginId(loginId);
		if (!profile) {
			return { error: 'No account was found for that student or employee number.' } as const;
		}
		if (!accountIsEnabled(profile)) {
			return { error: 'This account is not active. Contact an administrator.' } as const;
		}
		const user = await userFromProfile(profile);
		if (!user) {
			return { error: 'This account has no recognized role. Contact an administrator.' } as const;
		}
		const response = await authRequest('token?grant_type=password', {
			email: profile.email,
			password
		});
		if (!response.ok) {
			return { error: 'Invalid student or employee number or password.' } as const;
		}
		const session = (await response.json()) as SupabaseTokenResponse;
		return { session, user } as const;
	} catch (cause) {
		return {
			error: cause instanceof Error ? cause.message : 'Unable to connect to Supabase.'
		} as const;
	}
}

export function setSupabaseSession(cookies: Cookies, session: SupabaseTokenResponse) {
	const common = { httpOnly: true, secure: !dev, sameSite: 'lax' as const, path: '/' };
	cookies.set(ACCESS_TOKEN_COOKIE, session.access_token, {
		...common,
		maxAge: session.expires_in ?? 3600
	});
	cookies.set(REFRESH_TOKEN_COOKIE, session.refresh_token, {
		...common,
		maxAge: 60 * 60 * 24 * 30
	});
}

export async function readSession(cookies: Cookies): Promise<AuthenticatedUser | null> {
	let accessToken = cookies.get(ACCESS_TOKEN_COOKIE);
	const refreshToken = cookies.get(REFRESH_TOKEN_COOKIE);
	if (!accessToken && !refreshToken) return null;
	try {
		const { url, key } = supabaseConfig();
		if (!accessToken && refreshToken) {
			const refreshed = await authRequest('token?grant_type=refresh_token', {
				refresh_token: refreshToken
			});
			if (!refreshed.ok) {
				clearSupabaseCookies(cookies);
				return null;
			}
			const session = (await refreshed.json()) as SupabaseTokenResponse;
			setSupabaseSession(cookies, session);
			accessToken = session.access_token;
		}
		if (!accessToken) return null;
		let response = await fetch(`${url}/auth/v1/user`, {
			headers: { apikey: key, Authorization: `Bearer ${accessToken}` }
		});
		if (response.status === 401 && refreshToken) {
			const refreshed = await authRequest('token?grant_type=refresh_token', {
				refresh_token: refreshToken
			});
			if (!refreshed.ok) {
				clearSupabaseCookies(cookies);
				return null;
			}
			const session = (await refreshed.json()) as SupabaseTokenResponse;
			setSupabaseSession(cookies, session);
			accessToken = session.access_token;
			response = await fetch(`${url}/auth/v1/user`, {
				headers: { apikey: key, Authorization: `Bearer ${accessToken}` }
			});
		}
		if (!response.ok) return null;
		const authUser = (await response.json()) as SupabaseUser;
		if (!authUser.email) return null;
		const profile =
			(await profileForAuthId(authUser.id)) ?? (await profileForEmail(authUser.email));
		const user = profile && accountIsEnabled(profile) ? await userFromProfile(profile) : null;
		if (!user) {
			clearSupabaseCookies(cookies);
			return null;
		}
		return user;
	} catch {
		return null;
	}
}

export async function clearSessionCookie(cookies: Cookies) {
	const accessToken = cookies.get(ACCESS_TOKEN_COOKIE);
	if (accessToken) {
		try {
			const { url, key } = supabaseConfig();
			await fetch(`${url}/auth/v1/logout`, {
				method: 'POST',
				headers: { apikey: key, Authorization: `Bearer ${accessToken}` }
			});
		} catch {
			// Clear the browser session even if Supabase is temporarily unavailable.
		}
	}
	clearSupabaseCookies(cookies);
}

function clearSupabaseCookies(cookies: Cookies) {
	cookies.delete(ACCESS_TOKEN_COOKIE, { path: '/' });
	cookies.delete(REFRESH_TOKEN_COOKIE, { path: '/' });
}
