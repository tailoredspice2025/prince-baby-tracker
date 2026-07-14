import { RunningSleepSession, TimelineEvent } from '../types/models';

// Client-side aggregation of the event log into per-day totals, powering
// the Trends screen (day/week/month/year summaries). Days are bucketed in
// the device's local timezone — a baby's "day" is the parent's calendar
// day. Sleep sessions that span midnight are split at each day boundary
// so nightly sleep counts toward both days proportionally.

export interface DayStats {
  day: string; // local 'YYYY-MM-DD'
  milkMl: number; // bottle feeds only
  pumpMl: number;
  bottleCount: number;
  solidsCount: number;
  diaperCount: number;
  diaperWet: number;
  diaperDirty: number;
  sleepMinutes: number;
  sleepSessions: number;
  medicineCount: number;
}

export function emptyDayStats(day: string): DayStats {
  return {
    day,
    milkMl: 0,
    pumpMl: 0,
    bottleCount: 0,
    solidsCount: 0,
    diaperCount: 0,
    diaperWet: 0,
    diaperDirty: 0,
    sleepMinutes: 0,
    sleepSessions: 0,
    medicineCount: 0,
  };
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function localDayKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function monthKeyOf(dayKey: string): string {
  return dayKey.slice(0, 7); // 'YYYY-MM'
}

/** Last n calendar days as local day keys, oldest first, ending today. */
export function lastNDayKeys(n: number, now: Date = new Date()): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    keys.push(localDayKey(d));
  }
  return keys;
}

/** Last n calendar months as 'YYYY-MM' keys, oldest first, ending this month. */
export function lastNMonthKeys(n: number, now: Date = new Date()): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}`);
  }
  return keys;
}

function ensure(map: Map<string, DayStats>, day: string): DayStats {
  let s = map.get(day);
  if (!s) {
    s = emptyDayStats(day);
    map.set(day, s);
  }
  return s;
}

function addSleepSpan(map: Map<string, DayStats>, start: Date, end: Date) {
  let cur = new Date(start);
  while (cur < end) {
    const dayEnd = new Date(cur);
    dayEnd.setHours(24, 0, 0, 0);
    const chunkEnd = dayEnd < end ? dayEnd : end;
    ensure(map, localDayKey(cur)).sleepMinutes += (chunkEnd.getTime() - cur.getTime()) / 60000;
    cur = chunkEnd;
  }
}

/**
 * Bucket every event for a baby into per-day totals. A still-running sleep
 * session (not yet in the event log) counts up to `asOf`.
 */
export function computeDailyStats(
  events: TimelineEvent[],
  babyId: string,
  runningSleep?: RunningSleepSession | null,
  asOf: Date = new Date()
): Map<string, DayStats> {
  const map = new Map<string, DayStats>();

  for (const e of events) {
    if (e.babyId !== babyId) continue;
    if (e.type === 'sleep') {
      const start = new Date(e.startTime);
      const end = e.endTime ? new Date(e.endTime) : asOf;
      if (end > start) addSleepSpan(map, start, end);
      ensure(map, localDayKey(start)).sleepSessions += 1;
      continue;
    }
    const s = ensure(map, localDayKey(new Date(e.time)));
    if (e.type === 'bottle') {
      s.bottleCount += 1;
      s.milkMl += e.quantityMl ?? 0;
    } else if (e.type === 'pump') {
      s.pumpMl += e.quantityMl ?? 0;
    } else if (e.type === 'solids') {
      s.solidsCount += 1;
    } else if (e.type === 'diaper') {
      s.diaperCount += 1;
      if (e.kind === 'wet' || e.kind === 'both') s.diaperWet += 1;
      if (e.kind === 'dirty' || e.kind === 'both') s.diaperDirty += 1;
    } else if (e.type === 'medicine') {
      s.medicineCount += 1;
    }
  }

  if (runningSleep && runningSleep.babyId === babyId) {
    const start = new Date(runningSleep.startTime);
    if (asOf > start) addSleepSpan(map, start, asOf);
    ensure(map, localDayKey(start)).sleepSessions += 1;
  }

  return map;
}

export interface PeriodTotals {
  milkMl: number;
  pumpMl: number;
  bottleCount: number;
  solidsCount: number;
  diaperCount: number;
  diaperWet: number;
  diaperDirty: number;
  sleepMinutes: number;
  sleepSessions: number;
  medicineCount: number;
}

export function sumStats(list: DayStats[]): PeriodTotals {
  const t: PeriodTotals = {
    milkMl: 0,
    pumpMl: 0,
    bottleCount: 0,
    solidsCount: 0,
    diaperCount: 0,
    diaperWet: 0,
    diaperDirty: 0,
    sleepMinutes: 0,
    sleepSessions: 0,
    medicineCount: 0,
  };
  for (const d of list) {
    t.milkMl += d.milkMl;
    t.pumpMl += d.pumpMl;
    t.bottleCount += d.bottleCount;
    t.solidsCount += d.solidsCount;
    t.diaperCount += d.diaperCount;
    t.diaperWet += d.diaperWet;
    t.diaperDirty += d.diaperDirty;
    t.sleepMinutes += d.sleepMinutes;
    t.sleepSessions += d.sleepSessions;
    t.medicineCount += d.medicineCount;
  }
  return t;
}

export function formatMl(ml: number): string {
  if (ml >= 1000) return `${(ml / 1000).toFixed(ml >= 10000 ? 0 : 1)} L`;
  return `${Math.round(ml)} ml`;
}

export function formatHours(minutes: number): string {
  const h = minutes / 60;
  return `${h >= 10 ? Math.round(h) : h.toFixed(1)} h`;
}
