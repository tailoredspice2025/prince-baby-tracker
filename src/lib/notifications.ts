import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Medication, Vaccine } from '../types/models';
import { isMedicineReminderId, plannedReminders } from './medicineReminders';
import { SEEDED_MEDICATION_IDS } from './demoData';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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

  for (const planned of plannedReminders(real, now)) {
    await Notifications.scheduleNotificationAsync({
      identifier: planned.id,
      content: {
        title: planned.title,
        body: planned.body,
        sound: Platform.OS === 'ios' ? 'default' : undefined,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: planned.at,
        channelId: 'reminders',
      },
    }).catch(() => {});
  }
}

// A booked vaccine appointment nudges the parents three times: 48h, 24h,
// and 2h before the appointment time. Each is its own notification with a
// stable id (`vax-{id}-48h` etc.) so rescheduling overwrites cleanly and
// both parents' devices can arm the same set idempotently after a sync.
const VAX_OFFSETS: { key: string; ms: number; label: string }[] = [
  { key: '48h', ms: 48 * 3600_000, label: 'in 2 days' },
  { key: '24h', ms: 24 * 3600_000, label: 'tomorrow' },
  { key: '2h', ms: 2 * 3600_000, label: 'in 2 hours' },
];

function vaxReminderId(vaccineId: string, key: string) {
  return `vax-${vaccineId}-${key}`;
}

/** Cancels all reminders for a vaccine appointment (done/edited/deleted). */
export async function cancelVaccineReminders(vaccineId: string) {
  await Promise.all(
    VAX_OFFSETS.map((o) => Notifications.cancelScheduledNotificationAsync(vaxReminderId(vaccineId, o.key)).catch(() => {}))
  );
}

/**
 * (Re)schedules the 48h/24h/2h reminders for an upcoming vaccine
 * appointment. Only applies to a 'due' vaccine with an appointmentAt time;
 * anything else clears any stale reminders. Offsets already in the past are
 * skipped (e.g. an appointment booked 30h out schedules only 24h + 2h).
 * Idempotent — safe to call on every sync/app-launch.
 */
export async function scheduleVaccineReminders(vaccine: Vaccine) {
  await cancelVaccineReminders(vaccine.id);
  if (vaccine.status !== 'due' || !vaccine.appointmentAt) return;
  const apptMs = new Date(vaccine.appointmentAt).getTime();
  if (isNaN(apptMs) || apptMs <= Date.now()) return;
  const timeLabel = new Date(apptMs).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const place = vaccine.clinic ? ` — ${vaccine.clinic}` : '';
  const addr = vaccine.address ? `, ${vaccine.address}` : '';
  for (const o of VAX_OFFSETS) {
    const fireAt = apptMs - o.ms;
    if (fireAt <= Date.now()) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: vaxReminderId(vaccine.id, o.key),
      content: {
        title: `${vaccine.name} ${o.label} 💉`,
        body: `${vaccine.doseLabel} at ${timeLabel}${place}${addr}`,
        sound: Platform.OS === 'ios' ? 'default' : undefined,
      },
      trigger: { date: new Date(fireAt), channelId: 'reminders' } as Notifications.DateTriggerInput,
    });
  }
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

const FEED_REMINDER_ID = 'feed-reminder';

/**
 * (Re)schedules the single "time to feed" reminder for `hours` after the
 * most recent feed. Called on every feed log, so the reminder keeps
 * sliding forward and only fires after a genuine gap.
 */
export async function rescheduleFeedReminder(lastFeedISO: string, hours: number, babyName: string) {
  await Notifications.cancelScheduledNotificationAsync(FEED_REMINDER_ID).catch(() => {});
  const fireAt = new Date(new Date(lastFeedISO).getTime() + hours * 3600_000);
  if (fireAt.getTime() <= Date.now()) return;
  await Notifications.scheduleNotificationAsync({
    identifier: FEED_REMINDER_ID,
    content: {
      title: `Feeding time? 🍼`,
      body: `It's been ${hours} hours since ${babyName}'s last feed`,
      sound: Platform.OS === 'ios' ? 'default' : undefined,
    },
    trigger: { date: fireAt, channelId: 'reminders' } as Notifications.DateTriggerInput,
  });
}

export async function cancelFeedReminder() {
  await Notifications.cancelScheduledNotificationAsync(FEED_REMINDER_ID).catch(() => {});
}
