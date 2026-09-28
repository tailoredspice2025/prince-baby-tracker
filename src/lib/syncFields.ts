/**
 * Fields that belong to one phone and must never travel through Family Sync.
 *
 * `photoUri` is a path to a file on THIS device (`file:///…/ImagePicker/…`).
 * It used to sync. On the other parent's phone that path points at nothing,
 * but it is non-empty, so `BabyAvatar` tried to load it and showed a broken
 * image instead of the initial-letter fallback — and if that parent had set
 * their own photo, the incoming path overwrote theirs. A code comment claimed
 * "other caregivers see the initial-letter avatar"; the code never did that.
 * The privacy policy also promises photos stay on the device.
 *
 * So: stripped on the way out, and on the way in each phone keeps its own.
 */
export const LOCAL_ONLY_FIELDS = ['photoUri'] as const;

export function stripLocalOnly<T extends Record<string, unknown>>(doc: T): Record<string, unknown> {
  const out: Record<string, unknown> = { ...doc };
  for (const f of LOCAL_ONLY_FIELDS) delete out[f];
  return out;
}

/** A remote doc merged over the local one with the same id, keeping this
 * phone's local-only fields. A doc that is new to this phone keeps none —
 * there is nothing local to keep. */
export function restoreLocalOnly<T extends { id: string }>(local: T[], remote: T[]): T[] {
  const byId = new Map(local.map((d) => [d.id, d as Record<string, unknown>]));
  return remote.map((r) => {
    const mine = byId.get(r.id);
    if (!mine) return r;
    const kept: Record<string, unknown> = {};
    for (const f of LOCAL_ONLY_FIELDS) if (mine[f] !== undefined) kept[f] = mine[f];
    return { ...r, ...kept };
  });
}
