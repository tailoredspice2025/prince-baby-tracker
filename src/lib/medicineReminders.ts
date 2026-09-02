import { Medication } from '../types/models';

/**
 * One place that decides whether a medicine is outstanding, and which
 * notifications should therefore exist.
 *
 * The bug this replaces: a medicine reminder was one repeating daily alarm
 * (`trigger: { hour, minute, repeats: true }`). A repeat fires unconditionally
 * — iOS has no way to run code when a *local* notification is delivered, so
 * "skip it if the dose was already given" cannot be decided at delivery. It
 * has to be decided when scheduling. Nothing did: logging a dose stamped
 * `lastGiven` and never touched the schedule, so the 6pm buzz arrived every
 * evening whether or not the vitamin had been given that morning.
 *
 * `isDueToday` also existed, correctly, inline inside `DayHomeView` — which is
 * why the Home banner cleared but the notification did not. Logic that lives
 * in a component gets exactly one caller. It lives here now so both surfaces
 * read the same answer, and so it can be tested without rendering anything.
 */

/** iOS keeps only the 64 soonest pending local notifications and silently
 * drops the rest, so the rolling window below has to fit a budget rather than
 * schedule a year of reminders. Feed reminders and vaccine nudges need room
 * too — vaccines take three each. */
export const MEDICINE_NOTIFICATION_BUDGET = 48;
export const MAX_WINDOW_DAYS = 14;
export const MIN_WINDOW_DAYS = 2;

export interface PlannedReminder {
  /** Stable per slot, so one evening can be cancelled without disturbing the
   * rest — `med-{HH-mm}-{YYYY-MM-DD}`. Keyed by time rather than by medicine
   * because a slot is now shared. */
  id: string;
  medicationIds: string[];
  at: Date;
  title: string;
  body: string;
}

export function sameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** One id per time slot per day. Three vitamins at 6pm share it, which is the
 * point: the phone should buzz once for one moment in the evening. */
export function occurrenceId(reminderTime: string, day: Date): string {
  return `med-${reminderTime.replace(':', '-')}-${dayKey(day)}`;
}

/** True when this medicine's dose for `day` has already been logged. */
export function givenOn(med: Medication, day: Date): boolean {
  if (!med.lastGiven) return false;
  const given = new Date(med.lastGiven);
  if (Number.isNaN(given.getTime())) return false;
  return sameLocalDay(given, day);
}

/** Outstanding right now: a scheduled medicine whose dose today is not logged.
 * The Home banner and the scheduler both ask this, which is the point. */
export function isDueToday(med: Medication, now: Date): boolean {
  if (!med.ongoing || !med.reminderTime) return false;
  return !givenOn(med, now);
}

/** How many days ahead to schedule, given how many *time slots* are competing
 * for the budget. Grouping by time is what makes this affordable: three
 * vitamins at 6pm cost one slot, not three, so the window stays a fortnight
 * instead of collapsing. Never fewer than two, or a single quiet day would end
 * the chain. */
export function windowDays(slotCount: number): number {
  if (slotCount <= 0) return 0;
  return Math.max(MIN_WINDOW_DAYS, Math.min(MAX_WINDOW_DAYS, Math.floor(MEDICINE_NOTIFICATION_BUDGET / slotCount)));
}

/**
 * Exactly which notifications should be pending, given the medicines and the
 * current time. Deliberately a pure function of its inputs: the caller cancels
 * everything and schedules this, so there is no incremental state to drift.
 *
 * The trade-off worth knowing: because each occurrence is a dated one-shot,
 * reminders lapse if the app is not opened within the window. That is the cost
 * of being able to skip a day at all, and the re-arm happens on launch, on
 * logging a dose, and on editing a medicine — for an app a parent opens
 * several times a day, the window is generous.
 */
export function plannedReminders(medications: Medication[], now: Date): PlannedReminder[] {
  const active = medications.filter((m) => m.ongoing && !!m.reminderTime);

  // Group by time first. Three vitamins at 6pm used to schedule three separate
  // notifications — three buzzes for one moment, which is how people end up
  // turning reminders off altogether.
  const slots = new Map<string, Medication[]>();
  for (const m of active) {
    const key = m.reminderTime!;
    if (!/^\d{1,2}:\d{2}$/.test(key)) continue;
    slots.set(key, [...(slots.get(key) ?? []), m]);
  }

  const days = windowDays(slots.size);
  const planned: PlannedReminder[] = [];

  for (const [time, meds] of slots) {
    const [hour, minute] = time.split(':').map(Number);
    if (Number.isNaN(hour) || Number.isNaN(minute)) continue;

    for (let offset = 0; offset < days; offset += 1) {
      const at = new Date(now);
      at.setDate(at.getDate() + offset);
      at.setHours(hour, minute, 0, 0);

      // Today's slot may already have passed — scheduling it would either fire
      // immediately or be dropped, and neither is a reminder.
      if (at.getTime() <= now.getTime()) continue;

      // Only the medicines still outstanding that day. A slot where every dose
      // is logged produces no notification at all.
      const due = meds.filter((m) => !givenOn(m, at));
      if (due.length === 0) continue;

      planned.push({
        id: occurrenceId(time, at),
        medicationIds: due.map((m) => m.id),
        at,
        title: due.length === 1 ? `${due[0].name} · ${due[0].dose}` : `${due.length} medicines due`,
        body: due.length === 1 ? `Time for ${due[0].name} (${due[0].schedule})` : due.map((m) => m.name).join(', '),
      });
    }
  }

  return planned.sort((a, b) => a.at.getTime() - b.at.getTime());
}

/** Identifiers this module owns, so a stale one can be recognised and removed.
 * Includes the pre-build-20 shape `med-{id}` with no date: those were the
 * repeating alarms, and an upgrade that leaves one pending keeps buzzing
 * forever regardless of anything scheduled afterwards. */
export function isMedicineReminderId(identifier: string): boolean {
  return identifier.startsWith('med-');
}
