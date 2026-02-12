import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const SESSION_OPTIONS = [25, 30, 45];
const DEFAULTS = {
	sessionLength: 25,
	dailyGoal: 4,
	theme: 'dark',
	focusLock: false
};

function read() {
	if (!browser) return DEFAULTS;
	try {
		const raw = localStorage.getItem('zennexus_settings');
		if (!raw) return DEFAULTS;
		const parsed = JSON.parse(raw);
		return {
			sessionLength: SESSION_OPTIONS.includes(parsed.sessionLength) ? parsed.sessionLength : DEFAULTS.sessionLength,
			dailyGoal:
				typeof parsed.dailyGoal === 'number' && parsed.dailyGoal >= 2 && parsed.dailyGoal <= 10
					? parsed.dailyGoal
					: DEFAULTS.dailyGoal,
			theme: parsed.theme === 'light' ? 'light' : 'dark',
			focusLock: parsed.focusLock === true
		};
	} catch {
		return DEFAULTS;
	}
}

function ensureFocusLockElements() {
	if (!browser) return;
	let overlay = document.getElementById('focus-lock-overlay');
	let label = document.getElementById('focus-lock-text');
	if (!overlay) {
		overlay = document.createElement('div');
		overlay.id = 'focus-lock-overlay';
		overlay.style.position = 'fixed';
		overlay.style.inset = '0';
		overlay.style.background = 'rgba(0,0,0,0.25)';
		overlay.style.pointerEvents = 'none';
		overlay.style.zIndex = '999';
		overlay.style.display = 'none';
		document.body.appendChild(overlay);
	}
	if (!label) {
		label = document.createElement('div');
		label.id = 'focus-lock-text';
		label.textContent = 'Focus Lock Active';
		label.style.position = 'fixed';
		label.style.bottom = '6px';
		label.style.left = '50%';
		label.style.transform = 'translateX(-50%)';
		label.style.color = '#94a3b8';
		label.style.fontSize = '12px';
		label.style.pointerEvents = 'none';
		label.style.zIndex = '1000';
		label.style.display = 'none';
		document.body.appendChild(label);
	}
}

function applyTheme(theme) {
	if (!browser) return;
	document.documentElement.setAttribute('data-theme', theme);
}

function applyFocusLock(on) {
	if (!browser) return;
	ensureFocusLockElements();
	const overlay = document.getElementById('focus-lock-overlay');
	const label = document.getElementById('focus-lock-text');
	if (!overlay || !label) return;
	overlay.style.display = on ? 'block' : 'none';
	label.style.display = on ? 'block' : 'none';
}

function createStore() {
	const store = writable(read());

	if (browser) {
		const initial = read();
		applyTheme(initial.theme);
		applyFocusLock(initial.focusLock);
		store.subscribe((v) => {
			localStorage.setItem('zennexus_settings', JSON.stringify(v));
			applyTheme(v.theme);
			applyFocusLock(v.focusLock);
		});
	}

	function setSessionLength(val) {
		if (!SESSION_OPTIONS.includes(val)) return;
		store.update((s) => ({ ...s, sessionLength: val }));
	}
	function incrementSessionLength() {
		store.update((s) => {
			const idx = SESSION_OPTIONS.indexOf(s.sessionLength);
			const next = SESSION_OPTIONS[Math.min(idx + 1, SESSION_OPTIONS.length - 1)];
			return { ...s, sessionLength: next };
		});
	}
	function decrementSessionLength() {
		store.update((s) => {
			const idx = SESSION_OPTIONS.indexOf(s.sessionLength);
			const prev = SESSION_OPTIONS[Math.max(idx - 1, 0)];
			return { ...s, sessionLength: prev };
		});
	}

	function setDailyGoal(val) {
		const n = Math.max(2, Math.min(10, Number(val) || DEFAULTS.dailyGoal));
		store.update((s) => ({ ...s, dailyGoal: n }));
	}
	function incrementDailyGoal() {
		store.update((s) => ({ ...s, dailyGoal: Math.min(10, s.dailyGoal + 1) }));
	}
	function decrementDailyGoal() {
		store.update((s) => ({ ...s, dailyGoal: Math.max(2, s.dailyGoal - 1) }));
	}

	function toggleTheme() {
		store.update((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }));
	}

	function toggleFocusLock() {
		store.update((s) => ({ ...s, focusLock: !s.focusLock }));
	}

	return {
		subscribe: store.subscribe,
		setSessionLength,
		incrementSessionLength,
		decrementSessionLength,
		setDailyGoal,
		incrementDailyGoal,
		decrementDailyGoal,
		toggleTheme,
		toggleFocusLock
	};
}

export const settings = createStore();
