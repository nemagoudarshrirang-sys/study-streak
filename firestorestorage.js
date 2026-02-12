import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '$lib/firebase';

function getUserRef() {
	const user = auth.currentUser;
	if (!user) throw new Error('User not authenticated');
	return doc(db, 'users', user.uid);
}

export async function loadUserStats() {
	const ref = getUserRef();
	const snap = await getDoc(ref);

	if (!snap.exists()) {
		return {
			streak: 0,
			sessionsToday: 0,
			lastStudyDate: null,
			todaySessions: []
		};
	}

	const data = snap.data();
	return {
		streak: data.streak ?? 0,
		sessionsToday: data.sessionsToday ?? 0,
		lastStudyDate: data.lastStudyDate ?? null,
		todaySessions: Array.isArray(data.todaySessions) ? data.todaySessions : []
	};
}

export async function saveUserStats(stats) {
	const ref = getUserRef();
	await setDoc(ref, stats);
}
