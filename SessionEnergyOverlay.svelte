<script>
	import { onMount } from 'svelte';
	import { auth, db } from '$lib/firebase.js';
	import { doc, onSnapshot, collection, addDoc } from 'firebase/firestore';

	let show = false;
	let saving = false;
	let err = '';
	let lastCount = 0;

	function save(energy) {
		err = '';
		if (!auth.currentUser) return;
		(async () => {
			try {
				saving = true;
				const uid = auth.currentUser.uid;
				const now = new Date();
				const today = now.toISOString().slice(0, 10);
				const hour = now.getHours();
				const col = collection(db, 'users', uid, 'sessions');
				await addDoc(col, { date: today, energy, hour });
				show = false;
			} catch (e) {
				err = 'Failed to save energy tag';
			} finally {
				saving = false;
			}
		})();
	}

	function pick(energy) {
		save(energy);
	}

	function skip() {
		show = false;
	}

	onMount(() => {
		const unsub = auth.onAuthStateChanged((user) => {
			if (!user) return;
			const ref = doc(db, 'users', user.uid);
			onSnapshot(ref, (snap) => {
				const d = snap.data();
				const count = Number(d?.sessionsToday || 0);
				if (count > lastCount) {
					lastCount = count;
					show = true;
				} else {
					lastCount = count;
				}
			});
		});
		return () => unsub?.();
	});
</script>

{#if show}
<div class="overlay" role="dialog" aria-modal="true">
	<div class="modal">
		<h3>Energy Level</h3>
		<p class="muted">Select how you felt this session</p>
		<div class="buttons">
			<button class="opt low" onclick={() => pick('Low')} aria-disabled={saving}>Low</button>
			<button class="opt med" onclick={() => pick('Medium')} aria-disabled={saving}>Medium</button>
			<button class="opt high" onclick={() => pick('High')} aria-disabled={saving}>High</button>
		</div>
		<button class="skip" onclick={skip}>Skip</button>
		{#if err}<p class="err">{err}</p>{/if}
	</div>
	</div>
{/if}

<style>
	.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.25); display: flex; justify-content: center; align-items: center; z-index: 1003; }
	.modal { background: #0b1220; color: #e5e7eb; border-radius: 12px; padding: 16px; width: 320px; }
	h3 { margin: 0 0 6px 0; font-size: 0.95rem; }
	.muted { color: #94a3b8; font-size: 0.8rem; margin: 0 0 8px 0; }
	.buttons { display: flex; gap: 8px; }
	.opt { flex: 1; border-radius: 10px; border: 1px solid #1e293b; padding: 8px 10px; cursor: pointer; }
	.low { background: #0b1220; color: #e5e7eb; }
	.med { background: #0b1220; color: #e5e7eb; }
	.high { background: #22c55e; color: black; }
	.skip { margin-top: 10px; width: 100%; background: #0b1220; color: #e5e7eb; border: 1px solid #1e293b; border-radius: 10px; padding: 8px 10px; cursor: pointer; }
	.err { color: #94a3b8; font-size: 0.8rem; margin-top: 6px; }
</style>
