import { Medication, MedicineEvent, TimelineEvent } from '../types/models';

export interface MedicineChoice {
  name: string;
  dose: string;
}

/**
 * What the Home "Medicine" tile should log when tapped, or `null` when there
 * is nothing honest to log.
 *
 * The tile used to fall back to a hardcoded `'Vitamin D drops' / '400 IU'`.
 * That was invisible while the demo seed guaranteed a Vitamin D medicine
 * existed; build 18 strips the seed, so a parent who adds Paracetamol and taps
 * the tile would get a vitamin they never mentioned recorded against their
 * baby. Never invent a medicine — returning `null` lets the caller open the
 * form instead.
 *
 * Order: the last dose actually given repeats (same as bottle amounts), then a
 * single ongoing medicine is unambiguous enough to assume. More than one and
 * we cannot guess, so the parent picks.
 */
export function defaultMedicine(
  events: TimelineEvent[],
  medications: Medication[],
  babyId: string
): MedicineChoice | null {
  const last = events.find((e) => e.babyId === babyId && e.type === 'medicine') as MedicineEvent | undefined;
  if (last) return { name: last.name, dose: last.dose ?? '' };

  const ongoing = medications.filter((m) => m.babyId === babyId && m.ongoing);
  if (ongoing.length === 1) return { name: ongoing[0].name, dose: ongoing[0].dose };

  return null;
}

/**
 * The medicines offered when the tile is long-pressed. These are the parent's
 * own — the list used to be five hardcoded names, so someone giving vitamins
 * B, C and D separately could not choose between them, which was the whole
 * point of the picker.
 */
export function medicineOptions(medications: Medication[], babyId: string): MedicineChoice[] {
  const mine = medications.filter((m) => m.babyId === babyId);
  // Ongoing first: a daily vitamin is far likelier to be tapped than a course
  // of antibiotics finished last month.
  const ranked = [...mine].sort((a, b) => Number(!!b.ongoing) - Number(!!a.ongoing));
  return ranked.map((m) => ({ name: m.name, dose: m.dose }));
}
