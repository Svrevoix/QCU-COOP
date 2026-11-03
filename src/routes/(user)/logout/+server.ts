import { clearSessionCookie } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
	await clearSessionCookie(cookies);
	return new Response(null, { status: 204 });
};
