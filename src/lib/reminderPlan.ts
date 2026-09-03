import { TimelineEvent, Vaccine } from '../types/models';
import { eventTime } from './eventRow';

/**
 * What every reminder in the app resolves to before anything is scheduled.
 *
 * There are three reminder systems — medicine, feed, vaccine — and until now
 * only medicine had its timing in a module a test could reach. The other two
 * computed their fire times inline inside `notifications.ts`, next to the
 * `expo-notifications` calls, where a test cannot follow. That asymmetry is
 * why a malformed trigger shipped in two of them and not the third.
 *
 * So: one shape, one planner per kind, all pure and tested, and exactly one
 * place in `notifications.ts` that turns a plan into a scheduled notification.
 * A planner cannot get the trigger wrong because it does not build one.
 */
export interface PlannedNotification {
  id: string;
  at: Date;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export const FEED_REMINDER_ID = 'feed-reminder';

/** Every reminder must be in the future — a past date either fires instantly
 * or is dropped, and neither is a reminder. Applied to all three kinds in one
 * place so no planner has to remember it. */
export function inFuture(list: PlannedNotification[], now: Date): PlannedNotification[] {
  return list.filter((p) => p.at.getTime() > now.getTime());
}

/**
 * "It's been N hours since the last feed."
 *
 * Anchored to the most recent feed rather than to the moment the reminder was
 * set, so logging a feed slides it forward instead of leaving an older one to
 * fire. A feed logged at 11:53 with a three-hour gap is due at 14:53.
 */
export function feedReminderPlan(
  lastFeedISO: string | undefined,
  hours: number,
  babyName: string,
  now: Date
): PlannedNotification[] {
  if (!lastFeedISO) return [];
  const last = new Date(lastFeedISO);
  if (Number.isNaN(last.getTime())) return [];
  return inFuture(
    [
      {
        id: FEED_REMINDER_ID,
        at: new Date(last.getTime() + hours * 3600_000),
        title: 'Feeding time? 🍼',
        body: `It's been ${hours} hours since ${babyName}'s last feed`,
      },
    ],
    now
  );
}

/** The feed the reminder should be measured from: the latest bottle or solids
 * this baby has. Deleting or retiming a feed changes the answer, which is why
 * the store recomputes it on those actions and not only on logging. */
export function lastFeedTime(events: TimelineEvent[], babyId: string): string | undefined {
  return events
    .filter((e) => e.babyId === babyId && (e.type === 'bottle' || e.type === 'solids'))
    .map(eventTime)
    .filter(Boolean)
    .sort()
    .pop();
}

/** A booked appointment nudges three times. Offsets already past are dropped,
 * so booking 30 hours out schedules 24h and 2h but not 48h. */
export const VAX_OFFSETS: { key: string; ms: number; label: string }[] = [
  { key: '48h', ms: 48 * 3600_000, label: 'in 2 days' },
  { key: '24h', ms: 24 * 3600_000, label: 'tomorrow' },
  { key: '2h', ms: 2 * 3600_000, label: 'in 2 hours' },
];

export function vaxReminderId(vaccineId: string, key: string): string {
  return `vax-${vaccineId}-${key}`;
}

export function vaccineReminderPlan(vaccine: Vaccine, now: Date): PlannedNotification[] {
  // Only a booked, still-upcoming appointment. A vaccine already given, or one
  // with no time set, must clear its reminders rather than keep them.
  if (vaccine.status !== 'due' || !vaccine.appointmentAt) return [];
  const appt = new Date(vaccine.appointmentAt);
  if (Number.isNaN(appt.getTime()) || appt.getTime() <= now.getTime()) return [];

  const timeLabel = appt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const place = vaccine.clinic ? ` — ${vaccine.clinic}` : '';
  const addr = vaccine.address ? `, ${vaccine.address}` : '';

  return inFuture(
    VAX_OFFSETS.map((o) => ({
      id: vaxReminderId(vaccine.id, o.key),
      at: new Date(appt.getTime() - o.ms),
      title: `${vaccine.name} ${o.label} 💉`,
      body: `${vaccine.doseLabel} at ${timeLabel}${place}${addr}`,
    })),
    now
  );
}
