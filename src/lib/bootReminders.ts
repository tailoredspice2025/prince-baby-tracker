import { Medication, Vaccine } from '../types/models';
import { SEEDED_MEDICATION_IDS, SEEDED_VACCINE_IDS } from './demoData';

/**
 * Decides what the app is allowed to arm at launch.
 *
 * Two rules, both learned the hard way:
 *
 * 1. **Nothing before rehydration.** The store's initial state is the demo
 *    seed, and `persist` fills it in from AsyncStorage asynchronously — so at
 *    first render `medications` is still `demoMedications`. Arming from that
 *    snapshot scheduled a daily 18:00 "Vitamin D drops" notification on every
 *    launch, on every install, from data the parent never entered. Build 18's
 *    migration cancels it once, but the next launch armed it again, because
 *    the migration only runs on the version bump and this effect runs every
 *    time.
 *
 * 2. **Never a seeded id, ever.** Even after hydration, belt and braces: if a
 *    seeded record survives some future migration gap it must not be able to
 *    buzz a phone. Sample data is allowed to be visible; it is not allowed to
 *    ring.
 */
export function remindersToArm(
  hydrated: boolean,
  medications: Medication[],
  vaccines: Vaccine[]
): { medications: Medication[]; vaccines: Vaccine[] } {
  if (!hydrated) return { medications: [], vaccines: [] };
  return {
    medications: medications.filter((m) => !SEEDED_MEDICATION_IDS.includes(m.id)),
    vaccines: vaccines.filter((v) => !SEEDED_VACCINE_IDS.includes(v.id)),
  };
}
