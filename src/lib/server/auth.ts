import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import type { Cookies } from '@sveltejs/kit';

const SESSION_COOKIE = 'qcu-session';
const SESSION_DURATION_SECONDS = 60 * 60 * 8;
const DEVELOPMENT_SECRET = 'qcu-coop-development-only-change-before-deploying';

export interface AuthenticatedUser {
	role: 'student' | 'teacher' | 'admin' | 'cashier';
	id: string;
	profileId: string;
	expiresAt: number;
}

function signingSecret() {
	const secret = env.SESSION_SECRET || (dev ? DEVELOPMENT_SECRET : '');
	if (!secret) throw new Error('SESSION_SECRET must be configured outside development.');
	return secret;
}

function encodeBase64Url(bytes: Uint8Array) {
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(value: string) {
	const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4));
	return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function sign(payload: string) {
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(signingSecret()),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	return encodeBase64Url(
		new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)))
	);
}

export async function readSession(token: string | undefined): Promise<AuthenticatedUser | null> {
	if (!token) return null;
	const [payload, signature] = token.split('.');
	if (!payload || !signature) return null;

	try {
		const expected = decodeBase64Url(await sign(payload));
		const received = decodeBase64Url(signature);
		if (expected.length !== received.length) return null;
		let difference = 0;
		for (let index = 0; index < expected.length; index += 1) difference |= expected[index] ^ received[index];
		if (difference !== 0) return null;

		const user = JSON.parse(new TextDecoder().decode(decodeBase64Url(payload))) as AuthenticatedUser;
		if (
			!['student', 'teacher', 'admin', 'cashier'].includes(user.role) ||
			typeof user.id !== 'string' ||
			typeof user.profileId !== 'string' ||
			typeof user.expiresAt !== 'number' ||
			user.expiresAt <= Date.now()
		) {
			return null;
		}
		return user;
	} catch {
		return null;
	}
}

function supabaseConfig() {
	const url = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
	const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
	const secretKey = env.SUPABASE_SECRET_KEY;
	if (!url || !publishableKey || !secretKey) {
		throw new Error(
			'Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, and SUPABASE_SECRET_KEY in the environment.'
		);
	}
	return {
		url,
		publishableKey,
		adminHeaders: {
			 apikey: secretKey,
			...(secretKey.startsWith('sb_secret_') ? {} : { Authorization: `Bearer ${secretKey}` })
		}
	};
}

type LoginProfile = {
	id: string;
	login_id: string;
	email: string;
	role: string;
	account_status: string | null;
};

function isAuthenticatedRole(role: string): role is AuthenticatedUser['role'] {
	return role === 'student' || role === 'teacher' || role === 'admin' || role === 'cashier';
}

export async function signInWithSupabase(id: string, password: string) {
	const { url, publishableKey, adminHeaders } = supabaseConfig();
	const query = new URLSearchParams({
		select: 'id,login_id,email,role,account_status',
		login_id: `eq.${id}`,
		limit: '1'
	});
	const profileResponse = await fetch(`${url}/rest/v1/profiles?${query}`, { headers: adminHeaders });
	if (!profileResponse.ok) {
		throw new Error(`Could not verify the account with Supabase (HTTP ${profileResponse.status}).`);
	}
	const profiles = (await profileResponse.json()) as LoginProfile[];
	const profile = profiles[0];
	const accountStatus = profile?.account_status?.trim().toLowerCase();
	if (
		!profile ||
		!['active', 'approved'].includes(accountStatus ?? '') ||
		!isAuthenticatedRole(profile.role)
	) {
		return { error: 'Invalid ID or password, or the account is not active.' } as const;
	}

	const authResponse = await fetch(`${url}/auth/v1/token?grant_type=password`, {
		method: 'POST',
		headers: { apikey: publishableKey, 'Content-Type': 'application/json' },
		body: JSON.stringify({ email: profile.email, password })
	});
	if (!authResponse.ok) {
		return { error: 'Invalid ID or password, or the account is not active.' } as const;
	}
	const authResult = (await authResponse.json()) as { user?: { id?: string } };
	if (authResult.user?.id !== profile.id) {
		return { error: 'Invalid ID or password, or the account is not active.' } as const;
	}

	return {
		user: { role: profile.role, id: profile.login_id, profileId: profile.id }
	} as const;
}

export async function setSessionCookie(
	cookies: Cookies,
	user: Omit<AuthenticatedUser, 'expiresAt'>
) {
	const session: AuthenticatedUser = {
		...user,
		expiresAt: Date.now() + SESSION_DURATION_SECONDS * 1000
	};
	const payload = encodeBase64Url(new TextEncoder().encode(JSON.stringify(session)));
	cookies.set(SESSION_COOKIE, `${payload}.${await sign(payload)}`, {
		httpOnly: true,
		secure: !dev,
		sameSite: 'lax',
		path: '/',
		maxAge: SESSION_DURATION_SECONDS
	});
}

export function clearSessionCookie(cookies: Cookies) {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}
