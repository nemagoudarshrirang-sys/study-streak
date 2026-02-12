import { auth, db } from '$lib/firebase.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';

let initialized = false;
let uid = null;
let lastCount = -1;

function today() {
	return new Date().toISOString().slice(0, 10);
}

function readSettings() {
	try {
		const raw = localStorage.getItem('zennexus_settings');
		const p = raw ? JSON.parse(raw) : {};
		return { sessionLength: typeof p.sessionLength === 'number' ? p.sessionLength : 25 };
	} catch {
		return { sessionLength: 25 };
	}
}

export function initDailyTracker() {
	if (initialized) return;
	initialized = true;

	auth.onAuthStateChanged(async (user) => {
		uid = user ? user.uid : null;
		if (!uid) return;

		// Read the user doc once to capture sessionsToday
		const userRef = doc(db, 'users', uid);
		const snap = await getDoc(userRef);
		const count = Number(snap.data()?.sessionsToday || 0);
		const len = readSettings().sessionLength;
		if (count !== lastCount) {
			lastCount = count;
			const ref = doc(db, 'users', uid, 'daily', today());
			await setDoc(ref, { sessions: count, minutes: count * len, date: today() }, { merge: true });
		}
	});
}
