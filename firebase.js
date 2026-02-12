import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCOwQ66go69CWYHqmL2XVr9Sd6gd1n4l4E",
  authDomain: "study-streak-57383.firebaseapp.com",
  projectId: "study-streak-57383"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

export { db, firebase };
