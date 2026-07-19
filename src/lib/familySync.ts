import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  isFirebaseConfigured,
  removeDoc,
  subscribeCollection,
  SyncedCollection,
  SYNCED_COLLECTIONS,
  writeDoc,
} from './firestoreSync';

// Sync orchestration between the Zustand store and Firestore.
//
// Outbound: the store calls syncWrite/syncDelete on every mutation. Ops go
// through a persisted queue (AsyncStorage) that is flushed immediately and
// re-flushed on app start, so a write that fails offline survives an app
// restart and lands when the network returns. Ops are applied in order;
// a failure stops the flush (it retries from the same op next flush).
//
// Inbound: startFamilySync() live-subscribes to every family subcollection
// and hands each snapshot to the store. Firestore's latency compensation
// includes this device's own pending writes in snapshots, so remote state
// is authoritative — except for docs still waiting in our queue, which the
// store keeps at their (newer) local version until the queue drains.
//
// Everything no-ops when no family is linked or Firebase isn't configured.

type SyncOp =
  | { op: 'write'; familyId: string; col: SyncedCollection; doc: { id: string } }
  | { op: 'delete'; familyId: string; col: SyncedCollection; id: string };

const QUEUE_KEY = 'denbaby-sync-queue';

let queue: SyncOp[] = [];
let queueLoaded = false;
let flushing = false;
let activeFamilyId: string | null = null;
let unsubscribers: (() => void)[] = [];

async function loadQueue(): Promise<void> {
  if (queueLoaded) return;
  queueLoaded = true;
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (raw) queue = [...JSON.parse(raw), ...queue];
  } catch {
    // an unreadable queue is dropped — local data is still intact
  }
}

function persistQueue(): void {
  AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue)).catch(() => {});
}

/** Ids with a queued write, per collection — the store keeps these local
 * versions when applying a remote snapshot so unsynced edits don't revert. */
export function pendingIds(col: SyncedCollection): Set<string> {
  const ids = new Set<string>();
  for (const op of queue) {
    if (op.col === col && op.op === 'write') ids.add(op.doc.id);
  }
  return ids;
}

async function flush(): Promise<void> {
  if (flushing || !isFirebaseConfigured()) return;
  flushing = true;
  try {
    await loadQueue();
    while (queue.length > 0) {
      const op = queue[0];
      try {
        if (op.op === 'write') await writeDoc(op.familyId, op.col, op.doc);
        else await removeDoc(op.familyId, op.col, op.id);
      } catch (err) {
        console.warn('sync flush paused (will retry)', err);
        break; // keep order — retry from this op on the next flush
      }
      queue.shift();
      persistQueue();
    }
  } finally {
    flushing = false;
  }
}

function enqueue(op: SyncOp): void {
  queue.push(op);
  persistQueue();
  flush().catch(() => {});
}

/** Fire-and-forget write of one doc to the linked family. No-op unlinked. */
export function syncWrite(col: SyncedCollection, docObj: { id: string }): void {
  if (!activeFamilyId || !isFirebaseConfigured()) return;
  enqueue({ op: 'write', familyId: activeFamilyId, col, doc: docObj });
}

/** Fire-and-forget delete of one doc from the linked family. No-op unlinked. */
export function syncDelete(col: SyncedCollection, id: string): void {
  if (!activeFamilyId || !isFirebaseConfigured()) return;
  enqueue({ op: 'delete', familyId: activeFamilyId, col, id });
}

export type RemoteApply = (col: SyncedCollection, docs: Record<string, unknown>[]) => void;

/**
 * Starts live sync for a family: flushes any queued ops from a previous
 * run, then subscribes to every synced subcollection. Safe to call again
 * (e.g. on app start) — an existing subscription set is torn down first.
 */
export function startFamilySync(familyId: string, applyRemote: RemoteApply): void {
  stopFamilySync();
  activeFamilyId = familyId;
  loadQueue().then(() => flush().catch(() => {}));
  unsubscribers = SYNCED_COLLECTIONS.map((col) =>
    subscribeCollection(familyId, col, (docs) => applyRemote(col, docs as Record<string, unknown>[]))
  );
}

/** Tears down subscriptions (leave family / sign-out). Queued ops for the
 * old family are dropped — after leaving, this device must not write. */
export function stopFamilySync(): void {
  unsubscribers.forEach((u) => u());
  unsubscribers = [];
  activeFamilyId = null;
  queue = [];
  persistQueue();
}

/** Pushes the device's full local dataset to the family — used once when
 * the family is first created so existing solo history becomes shared. */
export function uploadLocalData(collections: Partial<Record<SyncedCollection, { id: string }[]>>): void {
  for (const col of SYNCED_COLLECTIONS) {
    for (const docObj of collections[col] ?? []) syncWrite(col, docObj);
  }
}
