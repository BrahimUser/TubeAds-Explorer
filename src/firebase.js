// Firebase Web SDK bootstrap.
//
// Same Firebase project as the React Native app, so the website shares
// listings, favorites and chat threads with mobile users — Le360-style.
import { initializeApp } from 'firebase/app';
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyCGI_GYYqXM14iuDfWjtINO8EF_UqWBC4k',
  authDomain: 'videoadsfinal.firebaseapp.com',
  projectId: 'videoadsfinal',
  storageBucket: 'videoadsfinal.firebasestorage.app',
  messagingSenderId: '759606479065',
  appId: '1:759606479065:web:08512a07413d77d666d6c8',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
// Keep session across reloads (localStorage / browser persistence — Spark-friendly).
setPersistence(auth, browserLocalPersistence).catch(() => {});
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
