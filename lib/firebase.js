import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set, runTransaction, onValue } from 'firebase/database';

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

  // Atomic read-modify-write. Safely merges concurrent writes from multiple users.
  async transact(key, updateFn) {
    try {
      const result = await runTransaction(ref(db, key), (current) => {
        const state = current ? JSON.parse(current) : null;
        const next = updateFn(state);
        return next == null ? null : JSON.stringify(next);
      });
      if (result.committed && result.snapshot.exists()) {
        return JSON.parse(result.snapshot.val());
      }
      return null;
    } catch (e) {
      console.error('Firebase transact error:', e);
      return null;
    }
  },

  // Real-time subscription to changes
  subscribe(key, callback) {
    try {
      const r = ref(db, key);
      return onValue(r, (snapshot) => {
        try {
          const val = snapshot.val();
          callback(val ? JSON.parse(val) : null);
        } catch (e) {
          console.error('Firebase subscribe parse error:', e);
        }
      });
    } catch (e) {
      console.error('Firebase subscribe init error:', e);
      return () => {};
    }
  },
};

export { db, store };
