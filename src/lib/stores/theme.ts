import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';
const LEGACY_STORAGE_KEY = 'qcu-theme';

function getStoredTheme(): Theme {
	if (!browser) return 'light';
	const storedTheme = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
	return storedTheme === 'dark' ? 'dark' : 'light';
}

const themeStore = writable<Theme>(getStoredTheme());

function applyTheme(value: Theme) {
	if (!browser) return;

	document.documentElement.dataset.theme = value;
	document.documentElement.classList.toggle('dark', value === 'dark');
	localStorage.setItem(STORAGE_KEY, value);
}

themeStore.subscribe(applyTheme);

if (browser) {
	window.addEventListener('storage', (event) => {
		if (event.key === STORAGE_KEY) {
			themeStore.set(event.newValue === 'dark' ? 'dark' : 'light');
		}
	});
}

export const theme = {
	subscribe: themeStore.subscribe,
	initialize() {
		if (browser) themeStore.set(getStoredTheme());
	},
	set(value: Theme) {
		themeStore.set(value);
	},
	toggle() {
		themeStore.update((value) => (value === 'dark' ? 'light' : 'dark'));
	}
};
