<script>
	import { onMount } from 'svelte';
	import { auth, db } from '$lib/firebase.js';
	import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

	let ready = false;
	let weeklyMinutes = 0;
	let weeklyCompleted = 0;
	let weeklyTarget = 28; // default 4×7
	let goalCompletion = 0;
	let integrityPct = 0;
	let disciplineScore = 0;
	let summaryText = '';

	function startOfWeek(d) {
		const dt = new Date(d);
		const day = dt.getDay(); // 0=Sun
		const diff = (day + 6) % 7; // Monday=0
		dt.setDate(dt.getDate() - diff);
		dt.setHours(0, 0, 0, 0);
		return dt;
	}
	function inCurrentWeek(dateVal) {
		const now = new Date();
		const sow = startOfWeek(now);
		const eow = new Date(sow);
		eow.setDate(sow.getDate() + 7);
		let dt;
		if (typeof dateVal === 'string') dt = new Date(dateVal + 'T00:00:00');
		else if (dateVal && typeof dateVal.toDate === 'function') dt = dateVal.toDate();
		else if (dateVal instanceof Date) dt = dateVal;
		if (!dt) return true;
		return dt >= sow && dt < eow;
	}
	function readDailyGoal() {
		try {
			const p = JSON.parse(localStorage.getItem('zennexus_settings') || '{}');
			const g = typeof p.dailyGoal === 'number' ? p.dailyGoal : 4;
			return g;
		} catch {
			return 4;
		}
	}
	function makeSummary(gc, integ, mins) {
		if (gc >= 90 && integ >= 85) return 'Excellent consistency and integrity this week.';
		if (gc >= 70 && integ >= 70) return 'Solid performance with room to tighten integrity.';
		if (gc < 50) return 'Goal completion was low; plan lighter, achievable targets.';
		if (integ < 60) return 'Frequent cancels/resets; try shorter sessions to build momentum.';
		return 'Steady week; keep refining your routine.';
	}

	onMount(() => {
		const unsub = auth.onAuthStateChanged(async (user) => {
			if (!user) return;
			const dailyGoal = readDailyGoal();
			weeklyTarget = dailyGoal * 7;

			// Sum weekly minutes and sessions from daily
			weeklyMinutes = 0;
			weeklyCompleted = 0;
			const sow = startOfWeek(new Date());
			for (let i = 0; i < 7; i++) {
				const d = new Date(sow);
				d.setDate(sow.getDate() + i);
				const key = d.toISOString().slice(0, 10);
				const snap = await getDoc(doc(db, 'users', user.uid, 'daily', key));
				if (snap.exists()) {
					weeklyMinutes += Number(snap.data().minutes || 0);
					weeklyCompleted += Number(snap.data().sessions || 0);
				}
			}

			// Integrity % this week from sessions
			let comp = 0;
			let canc = 0;
			try {
				const col = collection(db, 'users', user.uid, 'sessions');
				const snaps = await getDocs(col);
				snaps.forEach((d) => {
					const s = d.data();
					if (!inCurrentWeek(s.date || s.createdAt)) return;
					const status = s.status || s.state || (s.cancelled ? 'cancelled' : 'completed');
					if (status === 'cancelled') canc += 1;
					else comp += 1;
				});
			} catch {}
			const denom = comp + canc;
			integrityPct = denom > 0 ? Math.round((comp / denom) * 100) : 0;

			goalCompletion = weeklyTarget > 0 ? Math.round((weeklyCompleted / weeklyTarget) * 100) : 0;
			disciplineScore = Math.max(0, Math.min(100, Math.round(goalCompletion * 0.6 + integrityPct * 0.4)));

			summaryText = makeSummary(goalCompletion, integrityPct, weeklyMinutes);
			ready = true;
		});
		return () => unsub?.();
	});
</script>

<main class="page" aria-busy={!ready}>
	<section class="wrap">
		<h2>Weekly Review</h2>

		<div class="grid">
			<div class="card">
				<p class="label">Focus Time</p>
				<p class="value">{weeklyMinutes} min</p>
			</div>
			<div class="card">
				<p class="label">Goal Completion</p>
				<p class="value">{goalCompletion}%</p>
			</div>
			<div class="card">
				<p class="label">Integrity</p>
				<p class="value">{integrityPct}%</p>
			</div>
			<div class="card">
				<p class="label">Discipline Score</p>
				<p class="value">{disciplineScore}</p>
			</div>
		</div>

		<article class="summary" aria-live="polite">
			<p class="text">{summaryText}</p>
		</article>
	</section>
</main>

<style>
	.page { min-height: 100vh; background: #020617; display: flex; justify-content: center; align-items: center; font-family: system-ui, sans-serif; color: #e5e7eb; }
	.wrap { width: 100%; max-width: 720px; padding: 16px; }
	h2 { margin: 0 0 12px 0; font-size: 1rem; color: #e5e7eb; }
	.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
	.card { background: #0b1220; border-radius: 12px; padding: 12px; border: 1px solid #1e293b; }
	.label { color: #94a3b8; font-size: 0.8rem; margin: 0 0 4px 0; }
	.value { color: #e5e7eb; font-weight: 700; font-size: 1.2rem; margin: 0; }
	.summary { margin-top: 14px; background: #0b1220; border: 1px solid #1e293b; border-radius: 12px; padding: 12px; }
	.text { margin: 0; color: #e5e7eb; }
</style>
