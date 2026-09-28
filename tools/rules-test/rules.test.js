import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import {
  collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, Timestamp, updateDoc,
} from 'firebase/firestore';

// Family F belongs to alice (owner). bob is a legitimate invitee. mallory is
// any stranger with the app's public Firebase config and anonymous auth —
// which is everyone who downloads the app, because the config ships in it.
const F = 'fam-alice';
const CODE = 'ABC234';
const EXPIRED = 'OLD999';
let env;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'denbaby-rules-test',
    firestore: { rules: readFileSync(process.env.RULES ?? new URL('../../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});
afterAll(async () => env?.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'families', F), { ownerUid: 'alice', createdAtMs: 1 });
    await setDoc(doc(db, 'families', F, 'caregivers', 'alice'), { id: 'alice', familyId: F, name: 'Alice', role: 'owner' });
    await setDoc(doc(db, 'families', F, 'babies', 'b1'), { id: 'b1', name: 'Prince', dob: '2026-03-08' });
    await setDoc(doc(db, 'families', F, 'sickness', 's1'), { id: 's1', title: 'Fever', readings: [{ tempC: 38.4 }] });
    await setDoc(doc(db, 'inviteCodes', CODE), { familyId: F, createdAt: Timestamp.now() });
    await setDoc(doc(db, 'inviteCodes', EXPIRED), { familyId: F, createdAt: Timestamp.fromMillis(Date.now() - 25 * 3600_000) });
  });
});

const as = (uid) => env.authenticatedContext(uid).firestore();
// the join write, exactly as the client makes it
const joinAs = (uid, code, role = 'editor') =>
  setDoc(doc(as(uid), 'families', F, 'caregivers', uid), { id: uid, familyId: F, name: uid, role, inviteCode: code });

describe('ATTACKS — a stranger with the public config', () => {
  it('cannot list every invite code (which would reveal every familyId)', async () => {
    await assertFails(getDocs(collection(as('mallory'), 'inviteCodes')));
  });

  it('cannot add themselves to a family with no invite code', async () => {
    await assertFails(setDoc(doc(as('mallory'), 'families', F, 'caregivers', 'mallory'), { id: 'mallory', familyId: F, role: 'editor' }));
  });

  it('cannot join with a made-up code', async () => {
    await assertFails(joinAs('mallory', 'ZZZZZZ'));
  });

  it('cannot join with an expired code', async () => {
    await assertFails(joinAs('mallory', EXPIRED));
  });

  it('cannot use a code minted for a different family', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'inviteCodes', 'MAL234'), { familyId: 'fam-mallory', createdAt: Timestamp.now() });
    });
    await assertFails(joinAs('mallory', 'MAL234'));
  });

  it('cannot join as owner even with a valid code', async () => {
    await assertFails(joinAs('mallory', CODE, 'owner'));
  });

  it('cannot read the baby or its health records', async () => {
    await assertFails(getDoc(doc(as('mallory'), 'families', F, 'babies', 'b1')));
    await assertFails(getDoc(doc(as('mallory'), 'families', F, 'sickness', 's1')));
    await assertFails(getDocs(collection(as('mallory'), 'families', F, 'sickness')));
  });

  it('cannot mint an invite code for a family they are not in', async () => {
    await assertFails(setDoc(doc(as('mallory'), 'inviteCodes', 'NEW234'), { familyId: F, createdAt: serverTimestamp() }));
  });

  it('cannot take over an existing family by re-creating its root', async () => {
    await assertFails(setDoc(doc(as('mallory'), 'families', F), { ownerUid: 'mallory' }));
  });
});

describe('ATTACKS — a member overreaching', () => {
  beforeEach(async () => { await joinAs('bob', CODE); });

  it('cannot promote themselves to owner', async () => {
    await assertFails(updateDoc(doc(as('bob'), 'families', F, 'caregivers', 'bob'), { role: 'owner' }));
  });

  it('cannot remove the owner', async () => {
    await assertFails(deleteDoc(doc(as('bob'), 'families', F, 'caregivers', 'alice')));
  });

  it('cannot delete the family', async () => {
    await assertFails(deleteDoc(doc(as('bob'), 'families', F)));
  });

  it('cannot mint a code that outlives the 24h window', async () => {
    await assertFails(setDoc(doc(as('bob'), 'inviteCodes', 'FUT234'), {
      familyId: F, createdAt: Timestamp.fromMillis(Date.now() + 365 * 24 * 3600_000),
    }));
  });
});

describe('LEGITIMATE — every flow the app actually uses', () => {
  it('a new parent can create a family (root first, then themselves as owner)', async () => {
    const db = as('carol');
    await assertSucceeds(setDoc(doc(db, 'families', 'fam-carol'), { ownerUid: 'carol', createdAtMs: 1, updatedAt: serverTimestamp() }));
    await assertSucceeds(setDoc(doc(db, 'families', 'fam-carol', 'caregivers', 'carol'), {
      id: 'carol', familyId: 'fam-carol', name: 'Carol', role: 'owner', updatedAt: serverTimestamp(),
    }));
  });

  it('the owner can mint an invite code', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), 'inviteCodes', 'NEW234'), { familyId: F, createdAtMs: 1, createdAt: serverTimestamp() }));
  });

  it('anyone signed in can look up one code by its exact value', async () => {
    await assertSucceeds(getDoc(doc(as('bob'), 'inviteCodes', CODE)));
  });

  it('an invitee can join with a live code and then read and write the family', async () => {
    await assertSucceeds(joinAs('bob', CODE));
    await assertSucceeds(getDoc(doc(as('bob'), 'families', F, 'sickness', 's1')));
    await assertSucceeds(getDocs(collection(as('bob'), 'families', F, 'sickness')));
    await assertSucceeds(setDoc(doc(as('bob'), 'families', F, 'events', 'e1'), { id: 'e1', type: 'bottle', updatedAt: serverTimestamp() }));
    await assertSucceeds(getDocs(collection(as('bob'), 'families', F, 'caregivers')));
  });

  it('a member can rename themselves (setMyName overwrites their own doc)', async () => {
    await joinAs('bob', CODE);
    await assertSucceeds(setDoc(doc(as('bob'), 'families', F, 'caregivers', 'bob'), {
      id: 'bob', familyId: F, name: 'Bobby', role: 'editor', updatedAt: serverTimestamp(),
    }));
  });

  it('a member can leave (delete their own caregiver doc)', async () => {
    await joinAs('bob', CODE);
    await assertSucceeds(deleteDoc(doc(as('bob'), 'families', F, 'caregivers', 'bob')));
  });

  it('the owner can remove a member', async () => {
    await joinAs('bob', CODE);
    await assertSucceeds(deleteDoc(doc(as('alice'), 'families', F, 'caregivers', 'bob')));
  });

  it('the owner can wipe the family in the order deleteFamilyData uses', async () => {
    await joinAs('bob', CODE);
    const db = as('alice');
    await assertSucceeds(deleteDoc(doc(db, 'families', F, 'babies', 'b1')));
    await assertSucceeds(deleteDoc(doc(db, 'families', F, 'sickness', 's1')));
    await assertSucceeds(deleteDoc(doc(db, 'families', F, 'caregivers', 'bob')));
    await assertSucceeds(deleteDoc(doc(db, 'families', F)));
    await assertSucceeds(deleteDoc(doc(db, 'families', F, 'caregivers', 'alice')));
  });
});
