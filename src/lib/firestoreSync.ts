import {
  collection,
  deleteDoc,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db, ensureSignedIn, isFirebaseConfigured } from './firebase';
import {
  Baby,
  Caregiver,
  Measurement,
  Medication,
  Milestone,
  SicknessEpisode,
  TimelineEvent,
  Vaccine,
} from '../types/models';

export { isFirebaseConfigured };

// Firestore layout (see firestore.rules for the matching security rules):
//   families/{familyId}
//   families/{familyId}/babies/{babyId}
//   families/{familyId}/events/{eventId}
//   families/{familyId}/measurements/{measurementId}
//   families/{familyId}/vaccines/{vaccineId}
//   families/{familyId}/sickness/{episodeId}
//   families/{familyId}/medications/{medId}
//   families/{familyId}/milestones/{milestoneId}
//   families/{familyId}/caregivers/{caregiverId}   caregiverId == auth uid
//   inviteCodes/{code} -> { familyId, createdAtMs }  (join-by-code lookup)
//
// Every write is fire-and-forget from the Zustand store's point of view: the
// store already applied an optimistic local update, so a slow/offline
// network never blocks the UI. Failed writes are queued and retried by
// familySync.ts. When Firebase isn't configured these are no-ops and the
// app runs purely on local state.

/** Collections that sync, keyed by their Firestore subcollection name. */
export type SyncedCollection =
  | 'babies'
  | 'events'
  | 'measurements'
  | 'vaccines'
  | 'sickness'
  | 'medications'
  | 'milestones'
  | 'caregivers';

export type SyncedDoc =
  | Baby
  | TimelineEvent
  | Measurement
  | Vaccine
  | SicknessEpisode
  | Medication
  | Milestone
  | Caregiver;

export const SYNCED_COLLECTIONS: SyncedCollection[] = [
  'babies',
  'events',
  'measurements',
  'vaccines',
  'sickness',
  'medications',
  'milestones',
  'caregivers',
];

const INVITE_CODE_TTL_MS = 24 * 60 * 60 * 1000;

// Live-sync read cost is bounded by only subscribing to a rolling recent
// window of the high-volume `events` collection, rather than a baby's entire
// history. Without this, every cold app launch re-reads all events ever
// logged (the Firebase JS SDK on React Native keeps its cache only in
// memory, so nothing survives a restart) — so reads, and cost, would grow
// unbounded with the baby's age. Older events stay on each device (loaded
// once via fetchFamilySnapshot when joining) and are effectively frozen:
// edits/deletes to items older than this window don't propagate between
// devices, which is an acceptable trade for a flat, predictable bill.
// Every synced doc carries a serverTimestamp `updatedAt`; a fixed cutoff on
// that field only ever excludes a doc by deletion (updatedAt is monotonic),
// so add/edit/delete all still propagate correctly *within* the window.
export const SYNC_WINDOW_DAYS = 14;
const WINDOWED_COLLECTIONS = new Set<SyncedCollection>(['events']);

/** Epoch-ms cutoff for the live sync window (now − SYNC_WINDOW_DAYS). */
export function syncWindowCutoffMs(): number {
  return Date.now() - SYNC_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

/** Firestore rejects `undefined` field values — strip them before writing. */
function withoutUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

/** Throws when unconfigured/offline so callers (familySync queue) can retry. */
export async function writeDoc(familyId: string, col: SyncedCollection, docObj: { id: string }): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  await ensureSignedIn();
  await setDoc(doc(db, 'families', familyId, col, docObj.id), {
    ...withoutUndefined(docObj as Record<string, unknown>),
    updatedAt: serverTimestamp(),
  });
}

export async function removeDoc(familyId: string, col: SyncedCollection, id: string): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  await ensureSignedIn();
  await deleteDoc(doc(db, 'families', familyId, col, id));
}

/** Strips Firestore-only fields so a doc matches the local model shape. */
export function toLocalDoc(data: DocumentData): DocumentData {
  const { updatedAt, ...rest } = data;
  return rest;
}

/** Live-subscribes to one family subcollection; returns an unsubscribe fn.
 * High-volume collections (see WINDOWED_COLLECTIONS) are limited to docs
 * updated within the recent sync window so read cost stays flat as history
 * grows. Small collections (babies, caregivers, vaccines, …) subscribe in
 * full so old-item edits/deletes always propagate. */
export function subscribeCollection(
  familyId: string,
  col: SyncedCollection,
  onChange: (docs: DocumentData[]) => void
): () => void {
  if (!isFirebaseConfigured() || !db) return () => {};
  const ref = collection(db, 'families', familyId, col);
  const q = WINDOWED_COLLECTIONS.has(col)
    ? query(ref, where('updatedAt', '>=', Timestamp.fromMillis(syncWindowCutoffMs())))
    : ref;
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => toLocalDoc(d.data()))),
    (err) => console.warn(`subscribe ${col} failed`, err)
  );
}

/** One-shot fetch of every synced subcollection — used by the join flow. */
export async function fetchFamilySnapshot(familyId: string): Promise<Record<SyncedCollection, DocumentData[]>> {
  if (!isFirebaseConfigured() || !db) throw new Error('Firebase not configured');
  await ensureSignedIn();
  const out = {} as Record<SyncedCollection, DocumentData[]>;
  for (const col of SYNCED_COLLECTIONS) {
    const snap = await getDocs(collection(db, 'families', familyId, col));
    out[col] = snap.docs.map((d) => toLocalDoc(d.data()));
  }
  return out;
}

/** Signs in (anonymously) and returns the stable device identity. */
export async function getUid(): Promise<string | null> {
  if (!isFirebaseConfigured()) return null;
  const user = await ensureSignedIn();
  return user?.uid ?? null;
}

/**
 * Bootstraps a brand-new family: caregiver doc first (the rules' entry
 * point — only a doc whose id matches your uid may be created in an empty
 * family), then the family root doc.  Returns the new familyId.
 */
export async function createFamily(caregiver: Caregiver): Promise<string> {
  if (!isFirebaseConfigured() || !db) throw new Error('Firebase not configured');
  const uid = await getUid();
  if (!uid) throw new Error('Sign-in failed');
  const familyId = `fam-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  await setDoc(doc(db, 'families', familyId, 'caregivers', uid), {
    ...withoutUndefined({ ...caregiver, id: uid, familyId } as unknown as Record<string, unknown>),
    updatedAt: serverTimestamp(),
  });
  await setDoc(doc(db, 'families', familyId), { createdAtMs: Date.now(), updatedAt: serverTimestamp() });
  return familyId;
}

function randomShareCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

/** Creates an invite-code doc that resolves to the given family. Codes
 * expire after 24 h (enforced client-side on join — see joinFamilyByCode). */
export async function createInviteCode(familyId: string): Promise<string> {
  if (!isFirebaseConfigured() || !db) return randomShareCode(); // still usable to show in the UI in demo mode
  await ensureSignedIn();
  const code = randomShareCode();
  await setDoc(doc(db, 'inviteCodes', code), { familyId, createdAtMs: Date.now(), createdAt: serverTimestamp() });
  return code;
}

/** Resolves an invite code to a familyId, or null if unknown/expired. */
export async function resolveInviteCode(code: string): Promise<string | null> {
  if (!isFirebaseConfigured() || !db) return null;
  await ensureSignedIn();
  const snap = await getDoc(doc(db, 'inviteCodes', code.toUpperCase()));
  const data = snap.data();
  if (!data?.familyId) return null;
  if (typeof data.createdAtMs === 'number' && Date.now() - data.createdAtMs > INVITE_CODE_TTL_MS) return null;
  return data.familyId as string;
}

/** Adds the current device to a family as a new caregiver (the join flow). */
export async function joinFamily(familyId: string, caregiver: Omit<Caregiver, 'id' | 'familyId'>): Promise<string> {
  if (!isFirebaseConfigured() || !db) throw new Error('Firebase not configured');
  const uid = await getUid();
  if (!uid) throw new Error('Sign-in failed');
  await setDoc(doc(db, 'families', familyId, 'caregivers', uid), {
    ...withoutUndefined({ ...caregiver, id: uid, familyId } as unknown as Record<string, unknown>),
    updatedAt: serverTimestamp(),
  });
  return uid;
}

/** Removes a caregiver from the family (their device loses access on the
 * next security-rules check; used by both "remove" and "leave family"). */
export async function removeCaregiverDoc(familyId: string, caregiverId: string): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  await ensureSignedIn();
  await deleteDoc(doc(db, 'families', familyId, 'caregivers', caregiverId));
}

/** Deletes every doc in the family's subtree (client-side iteration —
 * fine at family scale). Caregiver docs go last so access survives the
 * deletion pass; the caller's own caregiver doc is the very last delete. */
export async function deleteFamilyData(familyId: string): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  const uid = await getUid();
  const dataCollections = SYNCED_COLLECTIONS.filter((c) => c !== 'caregivers');
  for (const col of dataCollections) {
    const snap = await getDocs(collection(db, 'families', familyId, col));
    for (const d of snap.docs) await deleteDoc(d.ref);
  }
  const cgSnap = await getDocs(collection(db, 'families', familyId, 'caregivers'));
  const others = cgSnap.docs.filter((d) => d.id !== uid);
  for (const d of others) await deleteDoc(d.ref);
  await deleteDoc(doc(db, 'families', familyId));
  const own = cgSnap.docs.find((d) => d.id === uid);
  if (own) await deleteDoc(own.ref);
}
