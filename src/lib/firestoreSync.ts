import {
  collection,
  deleteDoc,
  doc,
  DocumentData,
  onSnapshot,
  Query,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db, ensureSignedIn, isFirebaseConfigured } from './firebase';
import { TimelineEvent, Vaccine } from '../types/models';

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
//   families/{familyId}/caregivers/{caregiverId}
//   inviteCodes/{code} -> { familyId }   (short-lived lookup doc for "join by code")
//
// Every write is fire-and-forget from the Zustand store's point of view: the
// store already applied an optimistic local update, so a slow/offline
// network never blocks the UI. When Firebase isn't configured (see
// isFirebaseConfigured in firebase.ts) these are no-ops and the app runs
// purely on local demo state.

let cachedFamilyId: string | null = null;

async function familyEventsCollection(familyId: string) {
  await ensureSignedIn();
  return collection(db!, 'families', familyId, 'events');
}

export async function syncWriteEvent(event: TimelineEvent, familyId = cachedFamilyId ?? 'demo-family') {
  if (!isFirebaseConfigured() || !db) return;
  try {
    const col = await familyEventsCollection(familyId);
    await setDoc(doc(col, event.id), { ...event, updatedAt: serverTimestamp() });
  } catch (err) {
    console.warn('syncWriteEvent failed (will retry on next write)', err);
  }
}

export async function syncDeleteEvent(eventId: string, familyId = cachedFamilyId ?? 'demo-family') {
  if (!isFirebaseConfigured() || !db) return;
  try {
    const col = await familyEventsCollection(familyId);
    await deleteDoc(doc(col, eventId));
  } catch (err) {
    console.warn('syncDeleteEvent failed', err);
  }
}

export async function syncWriteVaccine(vaccine: Vaccine, familyId = cachedFamilyId ?? 'demo-family') {
  if (!isFirebaseConfigured() || !db) return;
  try {
    await ensureSignedIn();
    const col = collection(db, 'families', familyId, 'vaccines');
    await setDoc(doc(col, vaccine.id), { ...vaccine, updatedAt: serverTimestamp() });
  } catch (err) {
    console.warn('syncWriteVaccine failed', err);
  }
}

/** Subscribes to a family's live event feed; returns an unsubscribe fn. Used to
 * reconcile the local store with what other caregivers logged in real time. */
export function subscribeFamilyEvents(
  familyId: string,
  onChange: (events: DocumentData[]) => void
): () => void {
  if (!isFirebaseConfigured() || !db) return () => {};
  cachedFamilyId = familyId;
  const q: Query = query(collection(db, 'families', familyId, 'events'));
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => d.data()));
  });
}

function randomShareCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

/** Creates an invite-code doc that resolves to the given family, for the
 * "Invite caregiver · Share code" row on the profile screen. */
export async function createInviteCode(familyId: string): Promise<string> {
  if (!isFirebaseConfigured() || !db) return randomShareCode(); // still usable to show in the UI in demo mode
  await ensureSignedIn();
  const code = randomShareCode();
  await setDoc(doc(db, 'inviteCodes', code), { familyId, createdAt: serverTimestamp() });
  return code;
}

export async function joinFamilyByCode(code: string): Promise<string | null> {
  if (!isFirebaseConfigured() || !db) return null;
  await ensureSignedIn();
  const snap = await new Promise<DocumentData | undefined>((resolve) => {
    const unsub = onSnapshot(doc(db!, 'inviteCodes', code), (d) => {
      unsub();
      resolve(d.data());
    });
  });
  return (snap?.familyId as string) ?? null;
}
