import { auth, db } from '$lib/firebase.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';

let initialized = false;
let uid = null;

function today() {
	return new Date().toISOString().slice(0, 10);
}

async function incExitAttempt() {
	if (!uid) return;
	const ref = doc(db, 'users', uid, 'integrity', today());
	const snap = await getDoc(ref);
	const current = snap.exists() ? Number(snap.data().exitAttempts || 0) : 0;
	await setDoc(ref, { exitAttempts: current + 1, date: today() }, { merge: true });
}

export function initIntegrityTracking() {
	if (initialized) return;
	initialized = true;

	auth.onAuthStateChanged((user) => {
		uid = user ? user.uid : null;
	});

	document.addEventListener('visibilitychange', () => {
		if (document.hidden) {
			incExitAttempt();
		}
	});
}
