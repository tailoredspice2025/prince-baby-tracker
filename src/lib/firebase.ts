import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  signInAnonymously,
  onAuthStateChanged,
  Auth,
  User,
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// The anonymous sign-in IS this phone's identity in the family: its uid is
// the caregiver doc id, and the rules let only that uid read or write. So it
// must survive a relaunch. A comment here used to claim the SDK persisted it
// automatically; it does not — `getAuth()` on React Native falls back to
// memory, so every cold start signed in as a brand-new stranger and the rules
// (correctly) locked them out of their own family. Persistence must be passed
// to initializeAuth explicitly.

// Firebase project config. In development this reads from EXPO_PUBLIC_*
// env vars (see .env.example) so no real secrets live in source. Until
// those are set, isFirebaseConfigured() is false and the app runs on
// local demo data — see src/lib/store.ts.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

if (isFirebaseConfigured()) {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  try {
    auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    // Already initialised (a fast refresh re-ran this module) — reuse it.
    auth = getAuth(app);
  }
  db = getFirestore(app);
}

export { app, auth, db };

/** Resolves once we have an authenticated (anonymous) user, signing in if needed. */
export function ensureSignedIn(): Promise<User | null> {
  if (!auth) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(
      auth!,
      (user) => {
        unsub();
        if (user) {
          resolve(user);
        } else {
          signInAnonymously(auth!).then((cred) => resolve(cred.user)).catch(reject);
        }
      },
      reject
    );
  });
}
