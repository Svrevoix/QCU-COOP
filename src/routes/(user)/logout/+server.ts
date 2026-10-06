import { clearSessionCookie } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ cookies }) => {
	clearSessionCookie(cookies);
	return new Response(null, { status: 204 });
};