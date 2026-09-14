import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const AVATAR_STORAGE_KEY = 'qcu-avatar-image';

/** Shared, persisted avatar image (data URL) so header + account page stay in sync. */
function createAvatarStore() {
	const initial = browser ? localStorage.getItem(AVATAR_STORAGE_KEY) : null;
	const { subscribe, set } = writable<string | null>(initial);

	return {
		subscribe,
		set(value: string | null) {
			if (browser) {
				if (value) localStorage.setItem(AVATAR_STORAGE_KEY, value);
				else localStorage.removeItem(AVATAR_STORAGE_KEY);
			}
			set(value);
		}
	};
}

export const avatarImage = createAvatarStore();
