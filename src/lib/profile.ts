import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const AVATAR_STORAGE_KEY = 'qcu-avatar-image';
let activeProfileId: string | null = null;

export function avatarStorageKey(profileId: string) {
	return `${AVATAR_STORAGE_KEY}:${profileId}`;
}

/** Account-scoped avatar image (data URL) shared by the header and account page. */
function createAvatarStore() {
	const { subscribe, set } = writable<string | null>(null);

	return {
		subscribe,
		setAccount(profileId: string | null) {
			if (activeProfileId === profileId) return;
			activeProfileId = profileId;
			set(
				browser && profileId
					? localStorage.getItem(avatarStorageKey(profileId))
					: null
			);
		},
		set(value: string | null) {
			if (browser && activeProfileId) {
				const key = avatarStorageKey(activeProfileId);
				if (value) localStorage.setItem(key, value);
				else localStorage.removeItem(key);
			}
			set(value);
		}
	};
}

export const avatarImage = createAvatarStore();
