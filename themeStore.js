import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const KEY = 'zennexus_theme';
const DEFAULT = 'dark';

function read() {
	if (!browser) return DEFAULT;
	const v = localStorage.getItem(KEY);
	return v === 'light' ? 'light' : 'dark';
}

function apply(theme) {
	if (!browser) return;
	document.documentElement.setAttribute('data-theme', theme);
}

const store = writable(read());

if (browser) {
	apply(read());
	store.subscribe((t) => {
		localStorage.setItem(KEY, t);
		apply(t);
	});
}

export const theme = {
	subscribe: store.subscribe,
	toggle: () => {
		store.update((t) => (t === 'dark' ? 'light' : 'dark'));
	}
};
