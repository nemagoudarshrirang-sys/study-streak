<script>
	import { onMount } from 'svelte';
	import { auth, db } from '$lib/firebase.js';
	import { doc, getDoc, setDoc } from 'firebase/firestore';

	let plannedSessions = 4;
	let plannedMinutes = 100;
	let plannedDate = '';
	let ready = false;
	let saving = false;
	let saved = false;
	let error = '';
	let isPast = false;
	let actualSessions = null;
	let completionPct = null;

	function tomorrowISO() {
		const d = new Date();
		d.setDate(d.getDate() + 1);
		return d.toISOString().slice(0, 10);
	}

	async function loadPlan(uid) {
		const snap = await getDoc(doc(db, 'users', uid));
		if (!snap.exists()) return;
		const data = snap.data();
		const entry = data?.plannerData?.[plannedDate];
		if (!entry) return;
		plannedSessions = Number(entry.plannedSessions ?? plannedSessions);
		plannedMinutes = Number(entry.plannedMinutes ?? plannedMinutes);
		if (isPast) {
			const dSnap = await getDoc(doc(db, 'users', uid, 'daily', plannedDate));
			const act = dSnap.exists() ? Number(dSnap.data().sessions || 0) : 0;
			actualSessions = act;
			if (plannedSessions > 0) {
				completionPct = Math.round((act / plannedSessions) * 100);
			} else {
				completionPct = 0;
			}
		} else {
			actualSessions = null;
			completionPct = null;
		}
	}

	async function savePlan() {
		error = '';
		saved = false;
		if (!auth.currentUser) {
			error = 'Not authenticated';
			return;
		}
		if (isPast) {
			error = 'Cannot edit past plans';
			return;
		}
		try {
			saving = true;
			const uid = auth.currentUser.uid;
			await setDoc(
				doc(db, 'users', uid),
				{
					plannerData: {
						[plannedDate]: {
							plannedSessions: Number(plannedSessions),
							plannedMinutes: Number(plannedMinutes)
						}
					}
				},
				{ merge: true }
			);
			saved = true;
		} catch (e) {
			error = 'Failed to save plan';
		} finally {
			saving = false;
		}
	}

	function computeIsPast(dateStr) {
		const today = new Date().toISOString().slice(0, 10);
		return dateStr < today;
	}

	onMount(() => {
		plannedDate = tomorrowISO();
		isPast = computeIsPast(plannedDate);
		const unsub = auth.onAuthStateChanged(async (user) => {
			if (!user) return;
			ready = true;
			await loadPlan(user.uid);
		});
		return () => unsub?.();
	});
</script>

<main class="page" aria-busy={!ready}>
	<section class="wrap">
		<h2>Tomorrow’s Plan</h2>

		<div class="card">
			<div class="row">
				<label for="date">Date</label>
				<input id="date" type="date" value={plannedDate} oninput={async (e) => {
					plannedDate = e.target.value;
					isPast = plannedDate < new Date().toISOString().slice(0, 10);
					if (auth.currentUser) {
						await loadPlan(auth.currentUser.uid);
					}
				}} />
			</div>

			{#if isPast}
				<div class="row">
					<label>Planned sessions</label>
					<p class="readonly">{plannedSessions}</p>
				</div>
				<div class="row">
					<label>Planned minutes</label>
					<p class="readonly">{plannedMinutes}</p>
				</div>
			{:else}
				<div class="row">
					<label for="sessions">Number of sessions</label>
					<input id="sessions" type="number" min="1" max="20" value={plannedSessions} oninput={(e) => (plannedSessions = Number(e.target.value))} />
				</div>
				<div class="row">
					<label for="minutes">Total planned focus time (minutes)</label>
					<input id="minutes" type="number" min="15" max="1000" value={plannedMinutes} oninput={(e) => (plannedMinutes = Number(e.target.value))} />
				</div>
				<button class="save" onclick={savePlan} aria-disabled={saving}>{saving ? 'Saving…' : 'Save Plan'}</button>
				{#if saved}<p class="ok">Plan saved</p>{/if}
				{#if error}<p class="err">{error}</p>{/if}
			{/if}
		</div>

		<section class="compare" aria-live="polite">
			<h3 class="sub">Actual vs Planned</h3>
			{#if isPast}
				<ul class="list">
					<li>Planned sessions: {plannedSessions}</li>
					<li>Actual sessions: {actualSessions ?? 0}</li>
					<li>Completion: {completionPct ?? 0}%</li>
				</ul>
			{:else}
				<p class="muted">Set your plan for upcoming days.</p>
				<ul class="list">
					<li>Planned sessions: {plannedSessions}</li>
					<li>Planned minutes: {plannedMinutes}</li>
				</ul>
			{/if}
		</section>
	</section>
</main>

<style>
	.page {
		min-height: 100vh;
		background: #020617;
		display: flex;
		justify-content: center;
		align-items: center;
		font-family: system-ui, sans-serif;
		color: #e5e7eb;
	}
	.wrap { width: 100%; max-width: 560px; padding: 16px; }
	h2 { margin: 0 0 12px 0; font-size: 1rem; color: #e5e7eb; }
	.card { background: #0b1220; border-radius: 12px; padding: 16px; }
	.row { display: grid; grid-template-columns: 1fr; gap: 6px; margin-bottom: 10px; }
	label { color: #94a3b8; font-size: 0.85rem; }
	input {
		width: 100%;
		padding: 10px;
		border-radius: 10px;
		border: 1px solid #1e293b;
		background: #0b1220;
		color: #e5e7eb;
	}
	.save {
		margin-top: 6px;
		width: 100%;
		border: 1px solid #1e293b;
		background: #22c55e;
		color: black;
		border-radius: 10px;
		padding: 10px;
		cursor: pointer;
	}
	.ok { color: #94a3b8; font-size: 0.85rem; margin-top: 6px; }
	.err { color: #94a3b8; font-size: 0.85rem; margin-top: 6px; }
	.readonly { color: #e5e7eb; margin: 0; }
	.compare { margin-top: 14px; background: #0b1220; border-radius: 12px; padding: 16px; }
	.sub { margin: 0 0 6px 0; font-size: 0.95rem; color: #e5e7eb; }
	.muted { color: #94a3b8; font-size: 0.85rem; margin: 0 0 8px; }
	.list { margin: 0; padding-left: 18px; color: #e5e7eb; }
</style>
