<script>
	import { settings } from '$lib/settingsStore.js';
	import { onMount } from 'svelte';
	import { auth, db } from '$lib/firebase.js';
	import { doc, getDoc, setDoc } from 'firebase/firestore';

	let soundEnabled = true;
	let autoStartNext = false;
	let minimalStats = false;
	let hardMode = false;

	onMount(() => {
		try {
			const raw = localStorage.getItem('zennexus_settings_extras');
			if (raw) {
				const p = JSON.parse(raw);
				soundEnabled = p.soundEnabled !== false;
				autoStartNext = p.autoStartNext === true;
				minimalStats = p.minimalStats === true;
			}
		} catch {}
		const unsub = auth.onAuthStateChanged(async (user) => {
			if (!user) return;
			const snap = await getDoc(doc(db, 'users', user.uid));
			hardMode = snap.exists() ? !!snap.data().hardMode : false;
		});
		return () => unsub?.();
	});

	function persistExtras() {
		localStorage.setItem(
			'zennexus_settings_extras',
			JSON.stringify({ soundEnabled, autoStartNext, minimalStats })
		);
	}
</script>

<div class="page">
	<div class="card">
		<h2>Settings</h2>

		<section class="item">
			<div class="label">Session Length</div>
			<div class="controls">
				<button aria-label="decrease session" onclick={settings.decrementSessionLength}>−</button>
				<span class="value">{$settings.sessionLength} min</span>
				<button aria-label="increase session" onclick={settings.incrementSessionLength}>+</button>
			</div>
			<div class="hint">Applies to future sessions</div>
		</section>

		<section class="item">
			<div class="label">Daily Goal</div>
			<div class="controls">
				<button aria-label="decrease goal" onclick={settings.decrementDailyGoal}>−</button>
				<span class="value">{$settings.dailyGoal}</span>
				<button aria-label="increase goal" onclick={settings.incrementDailyGoal}>+</button>
			</div>
		</section>

		<section class="item">
			<div class="label">Theme Mode</div>
			<div class="controls">
				<button aria-label="toggle theme" onclick={settings.toggleTheme}>
					{$settings.theme === 'dark' ? 'Dark' : 'Light'}
				</button>
			</div>
			<div class="hint">Soft background/text only</div>
		</section>

		<section class="item">
			<div class="label">Focus Lock</div>
			<div class="controls">
				<button aria-label="toggle focus lock" onclick={settings.toggleFocusLock}>
					{$settings.focusLock ? 'On' : 'Off'}
				</button>
			</div>
			<div class="hint">Background darkens; shows “Focus Lock Active” text.</div>
		</section>

		<section class="item">
			<div class="label">Sound</div>
			<div class="controls">
				<button aria-label="toggle sound" onclick={() => { soundEnabled = !soundEnabled; persistExtras(); }}>
					{soundEnabled ? 'Enabled' : 'Disabled'}
				</button>
			</div>
		</section>

		<section class="item">
			<div class="label">Auto-start Next Session</div>
			<div class="controls">
				<button aria-label="toggle auto-start" onclick={() => { autoStartNext = !autoStartNext; persistExtras(); }}>
					{autoStartNext ? 'On' : 'Off'}
				</button>
			</div>
		</section>

		<section class="item">
			<div class="label">Minimal Stats View</div>
			<div class="controls">
				<button aria-label="toggle minimal stats" onclick={() => { minimalStats = !minimalStats; persistExtras(); }}>
					{minimalStats ? 'Hide' : 'Show'}
				</button>
			</div>
		</section>

		<section class="item">
			<div class="label">Enable Hard Mode</div>
			<div class="controls">
				<button aria-label="toggle hard mode" onclick={async () => {
					if (!auth.currentUser) return;
					hardMode = !hardMode;
					await setDoc(doc(db, 'users', auth.currentUser.uid), { hardMode }, { merge: true });
				}}>
					{hardMode ? 'On' : 'Off'}
				</button>
			</div>
			<div class="hint">Hard Mode prevents session resets.</div>
		</section>

		<section class="item">
			<div class="label">Explore</div>
			<nav class="links" aria-label="More features">
				<a href="/forecast">Forecast</a>
				<a href="/heatmap">Heatmap</a>
				<a href="/energy">Energy</a>
				<a href="/streaks">Streaks</a>
				<a href="/integrity">Integrity</a>
			</nav>
		</section>
	</div>
</div>

<style>
	:global(:root[data-theme="dark"]) .page { --bg:#020617; --card:#0b1220; --text:#e5e7eb; --muted:#94a3b8; --value:#f8fafc; --border:#1e293b; }
	:global(:root[data-theme="light"]) .page { --bg:#f8fafc; --card:#ffffff; --text:#0b1220; --muted:#475569; --value:#0b1220; --border:#cbd5e1; }
	.page { min-height:100vh; background: var(--bg, #020617); display:flex; justify-content:center; align-items:center; font-family: system-ui, sans-serif; }
	.card { background: var(--card, #0b1220); padding: 20px 18px; border-radius: 14px; width: 320px; text-align: left; }
	h2 { margin: 0 0 8px 0; color: var(--text, #e5e7eb); font-size: 1rem; }
	.item { margin-top: 10px; }
	.label { color: var(--muted, #94a3b8); font-size: 0.8rem; margin-bottom: 6px; }
	.controls { display: flex; align-items: center; gap: 8px; }
	.value { color: var(--value, #f8fafc); font-weight: 600; }
	button { border: 1px solid var(--border, #1e293b); background: var(--card, #0b1220); color: var(--text, #e5e7eb); border-radius: 8px; padding: 6px 10px; cursor: pointer; }
	.hint { color: var(--muted, #64748b); font-size: 0.7rem; margin-top: 4px; }
	.links { display: flex; gap: 10px; flex-wrap: wrap; }
	.links a { color: var(--muted, #94a3b8); text-decoration: none; font-size: 0.8rem; border: 1px solid var(--border, #1e293b); padding: 4px 8px; border-radius: 6px; }
	.links a:hover, .links a:focus { color: var(--text, #e5e7eb); }
</style>
