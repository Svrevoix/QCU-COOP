import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Role = 'guest' | 'student' | 'admin';
export interface Session {
	role: Role;
	id: string | null;
}

const STORAGE_KEY = 'qcu-session';
const GUEST_SESSION: Session = { role: 'guest', id: null };

function readStoredSession(): Session {
	if (!browser) return GUEST_SESSION;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? (JSON.parse(raw) as Session) : GUEST_SESSION;
	} catch {
		return GUEST_SESSION;
	}
}

/** Persisted auth session so an authenticated dashboard state survives page reloads. */
function createSessionStore() {
	const { subscribe, set } = writable<Session>(readStoredSession());

	return {
		subscribe,
		login(role: Role, id: string) {
			const next: Session = { role, id };
			if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
			set(next);
		},
		logout() {
			if (browser) localStorage.removeItem(STORAGE_KEY);
			set(GUEST_SESSION);
		}
	};
}

export const session = createSessionStore();
