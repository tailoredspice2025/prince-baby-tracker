import { describe, expect, it } from 'vitest';
import { computeDailyStats } from '../stats';
import { eventRowFor, sleepDurationMs, sleepRange } from '../eventRow';
import { resolveSleepRange } from '../sleepEdit';
import { durationLabel } from '../time';
import { SEEDED_RECORD_IDS, demoEvents, demoMeasurements, demoVaccines, demoMilestonesUpcoming } from '../demoData';
import { Caregiver, SleepEvent, TimelineEvent } from '../../types/models';

/**
 * One test per bug that actually reached a real build. These are not written
 * for coverage — each one is a regression that shipped, was found on a phone,
 * and cost a build to fix. `npm run verify` runs them, so none can come back
 * quietly.
 */

const at = (d: number, h: number, m = 0) => new Date(2026, 6, d, h, m, 0, 0);
const sleep = (start: Date, end?: Date): SleepEvent => ({
  id: 's1',
  babyId: 'b',
  type: 'sleep',
  startTime: start.toISOString(),
  endTime: end?.toISOString(),
  loggedBy: 'cg-me',
  inputMethod: 'tap',
});

describe('sleep in Trends (build 12–14)', () => {
  it('splits a night sleep across both days', () => {
    const stats = computeDailyStats([sleep(at(30, 21), at(31, 7))], 'b', null, at(31, 12));
    expect(Math.round(stats.get('2026-07-30')!.sleepMinutes)).toBe(180); // 21:00–24:00
    expect(Math.round(stats.get('2026-07-31')!.sleepMinutes)).toBe(420); // 00:00–07:00
  });

  it('does NOT credit 24h a day to an open-ended sleep beyond one day', () => {
    // A sleep with no end used to be read as "still asleep, count until now",
    // so one voice-logged nap inflated every later day by a full 24 hours.
    const stats = computeDailyStats([sleep(at(20, 9))], 'b', null, at(30, 12));
    const runaway = [...stats.values()].filter((d) => d.sleepMinutes >= 24 * 60);
    expect(runaway.length).toBe(0);
  });
});

describe('the midnight ratchet (build 14)', () => {
  it('recovers an 8-minute nap that was stuck reading 24h 8m', () => {
    // start 15:33 on the 30th, end already pushed to the 31st by the old bug
    const { start, end } = resolveSleepRange(at(30, 15, 33).toISOString(), at(30, 15, 33), at(31, 15, 41));
    expect(durationLabel(end.getTime() - start.getTime())).toBe('8m');
  });

  it('still measures a genuine overnight sleep as 10 hours', () => {
    const { start, end } = resolveSleepRange(at(30, 21).toISOString(), at(30, 21), at(31, 7));
    expect(durationLabel(end.getTime() - start.getTime())).toBe('10h 0m');
  });

  it('never produces a negative duration', () => {
    const { start, end } = resolveSleepRange(at(30, 15).toISOString(), at(30, 15), at(30, 14));
    expect(end.getTime()).toBeGreaterThan(start.getTime());
  });
});

describe('what a sleep row shows (build 12)', () => {
  const caregivers: Caregiver[] = [];
  it('shows the duration and BOTH ends, not one bare timestamp', () => {
    const e = sleep(at(30, 21, 15), at(30, 22, 35));
    const row = eventRowFor(e, caregivers, 'cg-me');
    expect(row.title).toBe('Sleep · 1h 20m');
    expect(row.subLine).toContain('–'); // a range, not a single time
    expect(sleepRange(e)).toMatch(/–/);
    expect(sleepDurationMs(e)).toBe(80 * 60 * 1000);
  });

  it('shows a medicine dose, which used to be stored and never displayed', () => {
    const med = {
      id: 'm1', babyId: 'b', type: 'medicine', time: at(30, 9).toISOString(),
      name: 'Vitamin D drops', dose: '400 IU', loggedBy: 'cg-me', inputMethod: 'tap',
    } as TimelineEvent;
    expect(eventRowFor(med, caregivers, 'cg-me').title).toBe('Vitamin D drops · 400 IU');
  });
});

describe('seeded sample data must never reach a real parent (build 18)', () => {
  const uid = (p: string) => `${p}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

  it('knows every seeded record, including the two vaccines marked given', () => {
    const seeded = [...demoEvents, ...demoMeasurements, ...demoVaccines];
    expect(seeded.every((r) => SEEDED_RECORD_IDS.has(r.id))).toBe(true);
    expect(demoVaccines.filter((v) => v.status === 'done').length).toBeGreaterThan(0);
  });

  it('never matches a genuinely logged id', () => {
    // `uid('ev')` produces ids starting "ev-", exactly like the seeded `ev-1`,
    // so a prefix check here would delete real entries.
    const generated = ['ev', 'm', 'v', 's', 'med', 'ms'].flatMap((p) => [uid(p), uid(p), uid(p)]);
    expect(generated.some((id) => SEEDED_RECORD_IDS.has(id))).toBe(false);
  });

  it('keeps the upcoming-milestone suggestions, which are not records', () => {
    expect(demoMilestonesUpcoming.some((m) => SEEDED_RECORD_IDS.has(m.id))).toBe(false);
  });
});
