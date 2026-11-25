import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export type AppearancePreset = 'midnight-royal' | 'campus-sky-mist' | 'qcu-navy-gold';

export const appearanceOptions: ReadonlyArray<{
	value: AppearancePreset;
	label: string;
	gradient: string;
}> = [
	{
		value: 'midnight-royal',
		label: 'Midnight Royal',
		gradient: 'linear-gradient(120deg, #070d1a, #2563eb, #22d3ee)'
	},
	{
		value: 'campus-sky-mist',
		label: 'Campus Sky Mist',
		gradient: 'linear-gradient(120deg, #dcebfa, #ffffff, #93c5fd)'
	},
	{
		value: 'qcu-navy-gold',
		label: 'QCU Navy & Gold',
		gradient: 'linear-gradient(120deg, #091124, #192647, #fbbf24)'
	}
];

const STORAGE_KEY = 'qcu-appearance';
const DEFAULT_APPEARANCE: AppearancePreset = 'midnight-royal';

export function isAppearancePreset(value: string | null | undefined): value is AppearancePreset {
	return appearanceOptions.some((option) => option.value === value);
}

export function isDarkAppearance(value: AppearancePreset) {
	return value !== 'campus-sky-mist';
}

function getStoredAppearance(): AppearancePreset {
	if (!browser) return DEFAULT_APPEARANCE;

	const storedAppearance = localStorage.getItem(STORAGE_KEY);
	if (isAppearancePreset(storedAppearance)) return storedAppearance;

	const legacyTheme = localStorage.getItem('theme') ?? localStorage.getItem('qcu-theme');
	if (legacyTheme === 'light') return 'campus-sky-mist';
	if (legacyTheme === 'dark') return 'midnight-royal';

	return DEFAULT_APPEARANCE;
}

const appearanceStore = writable<AppearancePreset>(getStoredAppearance());

function applyAppearance(value: AppearancePreset) {
	if (!browser) return;

	const root = document.documentElement;
	root.dataset.appearance = value;
	root.dataset.theme = isDarkAppearance(value) ? 'dark' : 'light';
	root.classList.toggle('dark', isDarkAppearance(value));
	localStorage.setItem(STORAGE_KEY, value);
}

appearanceStore.subscribe(applyAppearance);

if (browser) {
	window.addEventListener('storage', (event) => {
		if (event.key === STORAGE_KEY && isAppearancePreset(event.newValue)) {
			appearanceStore.set(event.newValue);
		}
	});
}

export const appearance = {
	subscribe: appearanceStore.subscribe,
	initialize() {
		if (browser) appearanceStore.set(getStoredAppearance());
	},
	set(value: AppearancePreset) {
		appearanceStore.set(value);
	}
};
