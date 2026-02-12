<script>
	import { onMount } from 'svelte';
	import { auth, db } from '$lib/firebase.js';
	import { doc, onSnapshot, collection, addDoc } from 'firebase/firestore';

	let show = false;
	let note = '';
	let limit = 120;
	let saving = false;
	let err = '';
	let lastCount = 0;

	function cap(s) {
		return s.length > limit ? s.slice(0, limit) : s;
	}

	async function saveNote() {
		err = '';
		if (!auth.currentUser) return;
		try {
			saving = true;
			const uid = auth.currentUser.uid;
			const today = new Date().toISOString().slice(0, 10);
			const col = collection(db, 'users', uid, 'sessions');
			await addDoc(col, { date: today, note: cap(note) });
			show = false;
			note = '';
		} catch (e) {
			err = 'Failed to save';
		} finally {
			saving = false;
		}
	}

	function skipNote() {
		show = false;
		note = '';
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
					note = '';
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
		<h3>Session Notes</h3>
		<p class="muted">Add a short note (optional)</p>
		<textarea maxlength={limit} value={note} oninput={(e) => (note = cap(e.target.value))} />
		<div class="actions">
			<button class="primary" onclick={saveNote} aria-disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
			<button class="secondary" onclick={skipNote}>Skip</button>
		</div>
		{#if err}<p class="err">{err}</p>{/if}
	</div>
</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0,0,0,0.25);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1002;
	}
	.modal {
		background: #0b1220;
		color: #e5e7eb;
		border-radius: 12px;
		padding: 16px;
		width: 320px;
	}
	h3 { margin: 0 0 6px 0; font-size: 0.95rem; }
	.muted { color: #94a3b8; font-size: 0.8rem; margin: 0 0 8px 0; }
	textarea {
		width: 100%;
		min-height: 80px;
		border-radius: 10px;
		border: 1px solid #1e293b;
		background: #0b1220;
		color: #e5e7eb;
		padding: 10px;
	}
	.actions { display: flex; gap: 8px; margin-top: 10px; }
	.primary {
		background: #22c55e;
		color: black;
		border: 1px solid #1e293b;
		border-radius: 10px;
		padding: 8px 10px;
		cursor: pointer;
	}
	.secondary {
		background: #0b1220;
		color: #e5e7eb;
		border: 1px solid #1e293b;
		border-radius: 10px;
		padding: 8px 10px;
		cursor: pointer;
	}
	.err { color: #94a3b8; font-size: 0.8rem; margin-top: 6px; }
</style>
