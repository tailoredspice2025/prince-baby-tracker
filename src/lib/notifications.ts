import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Medication, Vaccine } from '../types/models';

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

/** Schedules a repeating daily reminder for an ongoing medication with a reminderTime ("HH:mm"). */
export async function scheduleMedicationReminder(med: Medication) {
  if (!med.reminderTime) return;
  const [hour, minute] = med.reminderTime.split(':').map(Number);
  await Notifications.scheduleNotificationAsync({
    identifier: `med-${med.id}`,
    content: {
      title: `${med.name} · ${med.dose}`,
      body: `Time for ${med.name} (${med.schedule})`,
      sound: Platform.OS === 'ios' ? 'default' : undefined,
    },
    trigger: { hour, minute, repeats: true, channelId: 'reminders' } as Notifications.CalendarTriggerInput,
  });
}

/** Schedules a one-off reminder a day before a vaccine's due date, at 9am. */
export async function scheduleVaccineReminder(vaccine: Vaccine) {
  if (vaccine.status !== 'due') return;
  const due = new Date(vaccine.date);
  const reminderDate = new Date(due);
  reminderDate.setDate(reminderDate.getDate() - 1);
  reminderDate.setHours(9, 0, 0, 0);
  if (reminderDate.getTime() <= Date.now()) return;
  await Notifications.scheduleNotificationAsync({
    identifier: `vax-${vaccine.id}`,
    content: {
      title: `${vaccine.name} due tomorrow`,
      body: `${vaccine.doseLabel} is due ${due.toLocaleDateString([], { month: 'short', day: 'numeric' })}`,
    },
    trigger: { date: reminderDate } as Notifications.DateTriggerInput,
  });
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
