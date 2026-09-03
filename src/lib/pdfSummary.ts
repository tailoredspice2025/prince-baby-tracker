import { RunningSleepSession, TimelineEvent } from '../types/models';
import { computeDailyStats, DayStats } from './stats';

/**
 * The daily-rhythm figures a pediatrician actually asks about — feeds per day,
 * how much milk, how long asleep, how many wet nappies.
 *
 * These were missing from "Export for pediatrician" entirely: the export took
 * measurements, vaccines, sickness and medications, and was never handed
 * `events` at all. So the app's core data — everything the six Home tiles log —
 * reached Home and Trends and stopped there. The one document that leaves the
 * app and goes to a clinician had none of it.
 */
export interface RhythmSummary {
  days: number;
  from: string;
  to: string;
  bottlesPerDay: number;
  milkMlPerDay: number;
  solidsPerDay: number;
  diapersPerDay: number;
  wetPerDay: number;
  dirtyPerDay: number;
  sleepMinutesPerDay: number;
  sleepSessionsPerDay: number;
}

/** Averaged over the days that have data, not over the calendar window: a
 * parent who logged four days out of seven should see their actual daily
 * pattern, not a figure diluted by three days they never opened the app. */
export function rhythmSummary(
  events: TimelineEvent[],
  babyId: string,
  windowDays = 14,
  asOf: Date = new Date(),
  runningSleep?: RunningSleepSession | null
): RhythmSummary | null {
  const cutoff = new Date(asOf);
  cutoff.setDate(cutoff.getDate() - (windowDays - 1));
  cutoff.setHours(0, 0, 0, 0);

  const stats = computeDailyStats(events, babyId, runningSleep, asOf);
  const within: DayStats[] = [...stats.values()]
    .filter((d) => new Date(`${d.day}T00:00:00`) >= cutoff)
    .sort((a, b) => a.day.localeCompare(b.day));

  const active = within.filter(
    (d) => d.bottleCount || d.solidsCount || d.diaperCount || d.sleepMinutes || d.medicineCount || d.pumpMl
  );
  if (active.length === 0) return null;

  const per = (pick: (d: DayStats) => number) =>
    Math.round((active.reduce((sum, d) => sum + pick(d), 0) / active.length) * 10) / 10;

  return {
    days: active.length,
    from: active[0].day,
    to: active[active.length - 1].day,
    bottlesPerDay: per((d) => d.bottleCount),
    milkMlPerDay: Math.round(active.reduce((s, d) => s + d.milkMl, 0) / active.length),
    solidsPerDay: per((d) => d.solidsCount),
    diapersPerDay: per((d) => d.diaperCount),
    wetPerDay: per((d) => d.diaperWet),
    dirtyPerDay: per((d) => d.diaperDirty),
    sleepMinutesPerDay: Math.round(active.reduce((s, d) => s + d.sleepMinutes, 0) / active.length),
    sleepSessionsPerDay: per((d) => d.sleepSessions),
  };
}

/** "10 h 8 m" — hours and minutes, because a clinician reads sleep that way
 * and 608 minutes means nothing at a glance. */
export function hoursMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h === 0) return `${m} m`;
  return m === 0 ? `${h} h` : `${h} h ${m} m`;
}
