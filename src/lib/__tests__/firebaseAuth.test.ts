import { createRequire } from 'node:module';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Build 26 shipped with `getAuth(app)`. On React Native that keeps the
 * anonymous sign-in in memory only, so after any relaunch the phone was a new
 * uid — not a caregiver of its own family — and the rules refused every read
 * and write. Sync died silently the first time the app was closed. A comment
 * said the SDK persisted it automatically; nothing checked the comment.
 *
 * Kept in its own file: vi.mock is hoisted over the whole file.
 */

const calls = vi.hoisted(() => ({
  initializeAuth: [] as unknown[][],
  getAuth: 0,
  persistenceStorage: [] as unknown[],
}));

const fakeStorage = vi.hoisted(() => ({ getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() }));

vi.mock('@react-native-async-storage/async-storage', () => ({ default: fakeStorage }));
vi.mock('firebase/app', () => ({ initializeApp: () => ({ name: 'app' }), getApps: () => [] }));
vi.mock('firebase/firestore', () => ({ getFirestore: () => ({}) }));
vi.mock('firebase/auth', () => ({
  getReactNativePersistence: (storage: unknown) => {
    calls.persistenceStorage.push(storage);
    return { kind: 'rn-persistence' };
  },
  initializeAuth: (...args: unknown[]) => {
    calls.initializeAuth.push(args);
    return { kind: 'auth' };
  },
  getAuth: () => {
    calls.getAuth += 1;
    return { kind: 'auth' };
  },
  signInAnonymously: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('Firebase auth survives a relaunch', () => {
  it('initialises auth with AsyncStorage persistence, not the in-memory default', async () => {
    vi.stubEnv('EXPO_PUBLIC_FIREBASE_API_KEY', 'test-key');
    vi.stubEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID', 'denbaby');

    const { auth } = await import('../firebase');

    expect(auth).toBeDefined();
    expect(calls.getAuth).toBe(0);
    expect(calls.persistenceStorage).toEqual([fakeStorage]);
    expect(calls.initializeAuth).toHaveLength(1);
    expect(calls.initializeAuth[0][1]).toEqual({ persistence: { kind: 'rn-persistence' } });
  });

  it('the React Native build of @firebase/auth really exports getReactNativePersistence', () => {
    // The app's typing for it is a local declaration (src/types/firebase-auth-rn.d.ts),
    // so check the real file Metro bundles on iOS.
    // Resolved the way Metro does: the package's `react-native` export condition.
    const require = createRequire(import.meta.url);
    const pkgPath = require.resolve('@firebase/auth/package.json');
    const entry: string = require(pkgPath).exports['.']['react-native'].default;
    const rn = require(path.join(path.dirname(pkgPath), entry));
    expect(typeof rn.getReactNativePersistence).toBe('function');
  });
});
