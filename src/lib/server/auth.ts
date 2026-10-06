import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import type { Cookies } from '@sveltejs/kit';

const SESSION_COOKIE = 'qcu-session';
const SESSION_DURATION_SECONDS = 60 * 60 * 8;
const DEVELOPMENT_SECRET = 'qcu-coop-development-only-change-before-deploying';

export interface AuthenticatedUser {
	role: 'student' | 'admin' | 'cashier';
	id: string;
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
	const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(signingSecret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
	return encodeBase64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))));
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
		if (!['student', 'admin', 'cashier'].includes(user.role) || typeof user.id !== 'string' || user.expiresAt <= Date.now()) return null;
		return user;
	} catch {
		return null;
	}
}

export function authenticate(id: string, password: string, audience: 'user' | 'staff') {
	const studentId = env.STUDENT_LOGIN_ID || (dev ? '23-2111' : '');
	const studentPassword = env.STUDENT_LOGIN_PASSWORD || (dev ? 'password' : '');
	const adminId = env.STAFF_ADMIN_ID || (dev ? '00-0000' : '');
	const adminPassword = env.STAFF_ADMIN_PASSWORD || (dev ? 'password1' : '');
	const cashierId = env.STAFF_CASHIER_ID || (dev ? '11-1111' : '');
	const cashierPassword = env.STAFF_CASHIER_PASSWORD || (dev ? 'password2' : '');

	if (audience === 'user' && id === studentId && password === studentPassword) return { role: 'student' as const, id };
	if (audience === 'staff' && id === adminId && password === adminPassword) return { role: 'admin' as const, id };
	if (audience === 'staff' && id === cashierId && password === cashierPassword) return { role: 'cashier' as const, id };
	return null;
}

export async function setSessionCookie(cookies: Cookies, user: Omit<AuthenticatedUser, 'expiresAt'>) {
	const session: AuthenticatedUser = { ...user, expiresAt: Date.now() + SESSION_DURATION_SECONDS * 1000 };
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
