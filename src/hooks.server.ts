import { error, redirect, type Handle } from '@sveltejs/kit';
import { readSession } from '$lib/server/auth';

const SESSION_COOKIE = 'qcu-session';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = await readSession(event.cookies.get(SESSION_COOKIE));
	const pathname = event.url.pathname;

	if (pathname === '/staff/login' && event.locals.user) {
		if (event.locals.user.role === 'student') throw redirect(303, '/');
		throw redirect(303, event.locals.user.role === 'admin' ? '/staff/admin' : '/staff/pos');
	}

	if (pathname.startsWith('/staff') && pathname !== '/staff/login') {
		if (!event.locals.user) throw redirect(303, `/staff/login?next=${encodeURIComponent(pathname)}`);
		if (event.locals.user.role === 'student') throw error(403, 'Customer accounts cannot access staff tools.');
		if (event.locals.user.role === 'cashier' && pathname !== '/staff/pos') {
			throw redirect(303, '/staff/pos');
		}
		if (event.locals.user.role === 'admin' && pathname === '/staff/pos') {
			throw redirect(303, '/staff/admin');
		}
	}

	return resolve(event);
};