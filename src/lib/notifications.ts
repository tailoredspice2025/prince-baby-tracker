import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Medication, Vaccine } from '../types/models';
import { isMedicineReminderId, plannedReminders } from './medicineReminders';
import { SEEDED_MEDICATION_IDS } from './demoData';
import {
  FEED_REMINDER_ID,
  PlannedNotification,
  VAX_OFFSETS,
  feedReminderPlan,
  vaccineReminderPlan,
  vaxReminderId,
} from './reminderPlan';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** The only way this file builds a "fire at this moment" trigger.
 *
 * The feed and vaccine reminders used to write `{ date, channelId } as
 * Notifications.DateTriggerInput`. `DateTriggerInput` *requires*
 * `type: SchedulableTriggerInputTypes.DATE`, so the cast was not a tidy-up —
 * it was asserting a shape the object did not have, and silencing the one
 * check that would have caught it. Without the discriminator expo cannot tell
 * which kind of trigger it was given, and the notification does not arrive
 * when it should: a feed logged at 11:53 with a three-hour reminder produced a
 * notification seven minutes later.
 *
 * Returning a properly typed value with no assertion makes the compiler the
 * guard, which is stronger than a test here — a wrong shape stops the build.
 */
function dateTrigger(at: Date): Notifications.DateTriggerInput {
  return { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: 'reminders' };
}

/** The only place a plan becomes a scheduled notification. Every reminder in
 * the app goes through here, so there is one trigger construction to get right
 * rather than three. */
async function schedule(list: PlannedNotification[]) {
  for (const p of list) {
    await Notifications.scheduleNotificationAsync({
      identifier: p.id,
      content: {
        title: p.title,
        body: p.body,
        sound: Platform.OS === 'ios' ? 'default' : undefined,
        ...(p.data ? { data: p.data } : {}),
      },
      trigger: dateTrigger(p.at),
    }).catch(() => {});
  }
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

/** Removes every medicine reminder this app has pending — dated occurrences
 * and, importantly, the pre-build-20 `med-{id}` *repeating* alarms. An upgrade
 * that leaves one of those behind keeps buzzing daily forever, whatever is
 * scheduled alongside it, because a repeat cannot be skipped once armed. */
async function cancelAllMedicineReminders() {
  const pending = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
  await Promise.all(
    pending
      .filter((n) => isMedicineReminderId(n.identifier))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {}))
  );
}

/** Kept for the seeded-data strip, which cancels by id before the medication
 * itself is removed from the store. */
export async function cancelMedicationReminder(medId: string) {
  const pending = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
  await Promise.all(
    pending
      .filter((n) => n.identifier === `med-${medId}` || n.identifier.startsWith(`med-${medId}-`))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {}))
  );
}

/**
 * Brings the pending medicine notifications in line with the medicines.
 *
 * Cancel-everything-then-schedule-the-plan rather than incremental edits: the
 * plan is a pure function of the medicines and the clock, so there is no
 * accumulated state to drift out of step. Call it whenever either input
 * changes — a dose logged, a medicine added, edited or deleted, and at launch.
 *
 * A dose logged today removes today's notification and leaves the rest of the
 * window intact. That is the whole fix: the old repeating alarm fired every
 * evening regardless, because iOS cannot run code when a local notification is
 * delivered, so "already given" has to be decided here, at scheduling time.
 */
export async function syncMedicationReminders(medications: Medication[], now: Date = new Date()) {
  await cancelAllMedicineReminders();

  // Sample data is allowed to be visible; it is never allowed to ring.
  const real = medications.filter((m) => !SEEDED_MEDICATION_IDS.includes(m.id));

  await schedule(
    plannedReminders(real, now).map((p) => ({ ...p, data: { medicationIds: p.medicationIds } }))
  );
}

/** Cancels all reminders for a vaccine appointment (done/edited/deleted). */
export async function cancelVaccineReminders(vaccineId: string) {
  await Promise.all(
    VAX_OFFSETS.map((o) => Notifications.cancelScheduledNotificationAsync(vaxReminderId(vaccineId, o.key)).catch(() => {}))
  );
}

/** Idempotent — safe on every launch and every sync. Cancels first so a
 * retimed or completed appointment cannot leave a stale nudge behind. */
export async function scheduleVaccineReminders(vaccine: Vaccine, now: Date = new Date()) {
  await cancelVaccineReminders(vaccine.id);
  await schedule(vaccineReminderPlan(vaccine, now));
}

export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

export async function cancelReminder(identifier: string) {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

/** (Re)schedules the single "time to feed" reminder for `hours` after the most
 * recent feed. Cancels first, so logging, retiming or deleting a feed slides
 * it rather than leaving an older one armed. */
export async function rescheduleFeedReminder(lastFeedISO: string | undefined, hours: number, babyName: string, now: Date = new Date()) {
  await cancelFeedReminder();
  await schedule(feedReminderPlan(lastFeedISO, hours, babyName, now));
}

export async function cancelFeedReminder() {
  await Notifications.cancelScheduledNotificationAsync(FEED_REMINDER_ID).catch(() => {});
}
