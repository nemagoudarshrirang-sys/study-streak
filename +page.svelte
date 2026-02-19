<script>
	import { onMount } from 'svelte';
	import { auth, db } from '$lib/firebase.js';
	import { collection, getDocs } from 'firebase/firestore';

	let ready = false;
	let completedSessions = 0;
	let cancelledSessions = 0;
	let resetAttempts = 0;
	let integrityScore = 0;

	function compute() {
		const denom = completedSessions + cancelledSessions + resetAttempts;
		integrityScore = denom > 0 ? Math.round((completedSessions / denom) * 100) : 0;
	}
	function startOfWeek(d) {
		const dt = new Date(d);
		const day = dt.getDay(); // 0=Sun
		const diff = (day + 6) % 7; // make Monday=0
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
		if (typeof dateVal === 'string') {
			dt = new Date(dateVal + 'T00:00:00');
		} else if (dateVal && typeof dateVal.toDate === 'function') {
			dt = dateVal.toDate();
		} else if (dateVal instanceof Date) {
			dt = dateVal;
		}
		if (!dt) return true; // fallback if no date field
		return dt >= sow && dt < eow;
	}

	onMount(() => {
		const unsub = auth.onAuthStateChanged(async (user) => {
			if (!user) return;
			completedSessions = 0;
			cancelledSessions = 0;
			resetAttempts = 0;
			try {
				const col = collection(db, 'users', user.uid, 'sessions');
				const snaps = await getDocs(col);
				snaps.forEach((d) => {
					const s = d.data();
					if (!inCurrentWeek(s.date || s.createdAt)) return;
					const status = s.status || s.state || (s.cancelled ? 'cancelled' : 'completed');
					if (status === 'cancelled') cancelledSessions += 1;
					else completedSessions += 1;
					resetAttempts += Number(s.resetAttempts || 0);
				});
			} catch {}
			compute();
			ready = true;
		});
		return () => unsub?.();
	});
</script>

<main class="page" aria-busy={!ready}>
	<section class="wrap">
		<h2>Focus Integrity</h2>

		<div class="panel">
			<div class="ring" aria-label="Integrity score" style={`--p:${integrityScore}`}>
				<p class="pct">{integrityScore}%</p>
			</div>

			<div class="breakdown">
				<div class="item">
					<p class="label">Completed</p>
					<p class="value">{completedSessions}</p>
				</div>
				<div class="item">
					<p class="label">Cancelled</p>
					<p class="value">{cancelledSessions}</p>
				</div>
				<div class="item">
					<p class="label">Resets</p>
					<p class="value">{resetAttempts}</p>
				</div>
			</div>
		</div>
	</section>
	</main>

<style>
	.page { min-height: 100vh; background: #020617; display: flex; justify-content: center; align-items: center; font-family: system-ui, sans-serif; color: #e5e7eb; }
	.wrap { width: 100%; max-width: 600px; padding: 16px; }
	h2 { margin: 0 0 12px 0; font-size: 1rem; color: #e5e7eb; }
	.panel { background: #0b1220; border-radius: 12px; padding: 16px; display: grid; gap: 14px; justify-items: center; }
	.ring { width: 140px; height: 140px; border-radius: 50%; background:
		conic-gradient(#22c55e calc(var(--p,0) * 1%), #1e293b 0);
		display: grid; place-items: center; }
	.pct { margin: 0; font-size: 2rem; color: #e5e7eb; }
	.breakdown { width: 100%; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
	.item { background: #0b1220; border: 1px solid #1e293b; border-radius: 10px; padding: 10px; text-align: center; }
	.label { margin: 0 0 4px 0; color: #94a3b8; font-size: 0.8rem; }
	.value { margin: 0; color: #e5e7eb; font-weight: 600; font-size: 1rem; }
</style>
