import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const store = {
  async get(key) {
    try {
      const snapshot = await get(ref(db, key));
      return snapshot.exists() ? JSON.parse(snapshot.val()) : null;
    } catch (e) {
      console.error('Firebase get error:', e);
      return null;
    }
  },
  async set(key, data) {
    try {
      await set(ref(db, key), JSON.stringify(data));
    } catch (e) {
      console.error('Firebase set error:', e);
    }
  },
};

export { db, store };
