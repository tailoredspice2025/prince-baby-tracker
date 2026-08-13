import { describe, expect, it } from 'vitest';
import { computeDailyStats } from '../stats';
import { eventRowFor, sleepDurationMs, sleepRange } from '../eventRow';
import { resolveSleepRange } from '../sleepEdit';
import { durationLabel } from '../time';
import { SEEDED_RECORD_IDS, demoEvents, demoMeasurements, demoVaccines, demoMedications, demoMilestonesUpcoming } from '../demoData';
import { remindersToArm } from '../bootReminders';
import { defaultMedicine, medicineOptions } from '../medicinePick';
import {
  isDueToday,
  isMedicineReminderId,
  MAX_WINDOW_DAYS,
  MEDICINE_NOTIFICATION_BUDGET,
  MIN_WINDOW_DAYS,
  occurrenceId,
  plannedReminders,
  sameLocalDay,
  windowDays,
} from '../medicineReminders';
import { Caregiver, Medication, SleepEvent, TimelineEvent } from '../../types/models';

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

describe('launch must not arm a reminder nobody set (build 19)', () => {
  it('arms nothing before the store has rehydrated', () => {
    // The store's initial state IS the demo seed, and persist fills it in from
    // AsyncStorage asynchronously. App.tsx armed reminders from that first
    // snapshot, so every launch scheduled a daily 18:00 "Vitamin D drops"
    // notification the parent never created.
    const armed = remindersToArm(false, demoMedications, demoVaccines);
    expect(armed.medications).toEqual([]);
    expect(armed.vaccines).toEqual([]);
  });

  it('never arms a seeded medicine even once hydrated', () => {
    // Build 18's migration cancels it on the version bump, but the migration
    // runs once and this code runs on every launch — so the cancel was being
    // undone the next time the app opened.
    const armed = remindersToArm(true, demoMedications, demoVaccines);
    expect(armed.medications.some((m) => m.name === 'Vitamin D drops')).toBe(false);
    expect(armed.medications).toEqual([]);
    expect(armed.vaccines).toEqual([]);
  });

  it('still arms a medicine the parent actually added', () => {
    const mine: Medication = {
      id: 'med-1754212800000-421337',
      babyId: 'b',
      name: 'Paracetamol',
      dose: '2.5 ml',
      schedule: 'daily 8 PM',
      prn: false,
      ongoing: true,
      reminderTime: '20:00',
    };
    const armed = remindersToArm(true, [...demoMedications, mine], demoVaccines);
    expect(armed.medications).toEqual([mine]);
  });
});

describe('the Medicine tile must not invent a medicine (build 19)', () => {
  const med = (id: string, name: string, ongoing: boolean): Medication => ({
    id,
    babyId: 'b',
    name,
    dose: '2.5 ml',
    schedule: ongoing ? 'daily' : 'as needed',
    prn: !ongoing,
    ongoing,
  });
  const dose = (name: string): TimelineEvent =>
    ({ id: 'ev-x', babyId: 'b', type: 'medicine', time: at(30, 9).toISOString(), name, dose: '400 IU', loggedBy: 'cg-me', inputMethod: 'tap' }) as TimelineEvent;

  it('logs nothing when the parent has added no medicine', () => {
    // It used to fall back to a hardcoded 'Vitamin D drops' / '400 IU'. Once
    // build 18 strips the seed, a parent who only ever added Paracetamol would
    // get a vitamin they never mentioned written into the record that
    // "Export for pediatrician" prints.
    expect(defaultMedicine([], [], 'b')).toBeNull();
  });

  it('never falls back to Vitamin D for someone who takes something else', () => {
    const pick = defaultMedicine([], [med('med-a', 'Paracetamol', true)], 'b');
    expect(pick).toEqual({ name: 'Paracetamol', dose: '2.5 ml' });
  });

  it('repeats the last dose given, like bottle amounts do', () => {
    const pick = defaultMedicine([dose('Calpol')], [med('med-a', 'Paracetamol', true)], 'b');
    expect(pick?.name).toBe('Calpol');
  });

  it('refuses to guess between several vitamins', () => {
    // B, C and D given separately: picking one of them silently would log the
    // wrong drug, so the parent is sent to the picker instead.
    const meds = [med('med-b', 'Vitamin B', true), med('med-c', 'Vitamin C', true), med('med-d', 'Vitamin D', true)];
    expect(defaultMedicine([], meds, 'b')).toBeNull();
    expect(medicineOptions(meds, 'b').map((m) => m.name)).toEqual(['Vitamin B', 'Vitamin C', 'Vitamin D']);
  });

  it('offers the parent their own medicines, not five hardcoded names', () => {
    const meds = [med('med-old', 'Amoxicillin', false), med('med-now', 'Vitamin D', true)];
    // ongoing first — a daily vitamin is likelier than a finished course
    expect(medicineOptions(meds, 'b').map((m) => m.name)).toEqual(['Vitamin D', 'Amoxicillin']);
    expect(medicineOptions(meds, 'other-baby')).toEqual([]);
  });
});

describe('a daily reminder must stop once the dose is logged (build 20)', () => {
  const med = (over: Partial<Medication> = {}): Medication => ({
    id: 'med-a',
    babyId: 'b',
    name: 'Vitamin D drops',
    dose: '400 IU',
    schedule: 'daily 6 PM',
    prn: false,
    ongoing: true,
    reminderTime: '18:00',
    ...over,
  });

  it('cancels today once the dose is logged, and keeps tomorrow', () => {
    // The reported bug. It was one repeating alarm, so it fired every evening
    // whether or not the vitamin had been given that morning — iOS cannot run
    // code when a local notification is delivered, so the skip has to happen
    // at scheduling time.
    const now = at(10, 9); // 9am, dose given at 8am
    const plan = plannedReminders([med({ lastGiven: at(10, 8).toISOString() })], now);
    expect(plan.some((p) => sameLocalDay(p.at, now))).toBe(false);
    expect(plan.some((p) => sameLocalDay(p.at, at(11, 18)))).toBe(true);
  });

  it('still reminds today when the dose has NOT been given', () => {
    const now = at(10, 9);
    const plan = plannedReminders([med()], now);
    expect(plan[0].at.getHours()).toBe(18);
    expect(sameLocalDay(plan[0].at, now)).toBe(true);
  });

  it('never schedules a slot that has already passed today', () => {
    // 9pm with a 6pm reminder: scheduling it would fire instantly or be
    // dropped, and neither is a reminder.
    const plan = plannedReminders([med()], at(10, 21));
    expect(plan.every((p) => p.at.getTime() > at(10, 21).getTime())).toBe(true);
    expect(sameLocalDay(plan[0].at, at(11, 18))).toBe(true);
  });

  it('yesterday\'s dose does not silence today', () => {
    const plan = plannedReminders([med({ lastGiven: at(9, 18).toISOString() })], at(10, 9));
    expect(sameLocalDay(plan[0].at, at(10, 18))).toBe(true);
  });

  it('stays inside the iOS 64-notification limit as medicines multiply', () => {
    // iOS keeps only the 64 soonest pending notifications and drops the rest
    // silently, so a fortnight each for ten vitamins would lose the tail
    // without any error.
    const many = Array.from({ length: 10 }, (_, i) => med({ id: `med-${i}`, name: `Vitamin ${i}` }));
    expect(plannedReminders(many, at(10, 9)).length).toBeLessThanOrEqual(MEDICINE_NOTIFICATION_BUDGET + many.length);
    expect(windowDays(1)).toBe(MAX_WINDOW_DAYS);
    expect(windowDays(10)).toBeGreaterThanOrEqual(MIN_WINDOW_DAYS);
  });

  it('schedules nothing for a medicine with the reminder switched off', () => {
    expect(plannedReminders([med({ reminderTime: undefined })], at(10, 9))).toEqual([]);
    expect(plannedReminders([med({ ongoing: false })], at(10, 9))).toEqual([]);
  });

  it('gives the banner and the scheduler the same answer', () => {
    // The banner cleared and the notification did not, because isDueToday
    // lived inside DayHomeView where the scheduler could not reach it.
    const given = med({ lastGiven: at(10, 8).toISOString() });
    const now = at(10, 9);
    expect(isDueToday(given, now)).toBe(false);
    expect(plannedReminders([given], now).some((p) => sameLocalDay(p.at, now))).toBe(false);

    const notGiven = med();
    expect(isDueToday(notGiven, now)).toBe(true);
    expect(plannedReminders([notGiven], now).some((p) => sameLocalDay(p.at, now))).toBe(true);
  });

  it('recognises the old repeating alarm so an upgrade can remove it', () => {
    // Installs on build 19 and earlier hold a `med-{id}` repeating alarm. Left
    // pending it buzzes forever, no matter what is scheduled alongside it.
    expect(isMedicineReminderId('med-med-a')).toBe(true);
    expect(isMedicineReminderId(occurrenceId('med-a', at(10, 18)))).toBe(true);
    expect(isMedicineReminderId('vax-v1-48h')).toBe(false);
    expect(isMedicineReminderId('feed-reminder')).toBe(false);
  });
});

describe('a newly added medicine reminds today (build 20)', () => {
  const fresh = (over: Partial<Medication> = {}): Medication => ({
    id: 'med-new',
    babyId: 'b',
    name: 'Vitamin C',
    dose: '5 ml',
    schedule: 'daily 6 PM',
    prn: false,
    ongoing: true,
    reminderTime: '18:00',
    ...over,
  });

  it('reminds this evening, not tomorrow', () => {
    // The medicine form defaulted `lastGiven` to Date.now(), so a medicine
    // added at 10am was stamped as already taken — and a logged dose
    // suppresses that day's reminder, so adding "Vitamin C" with a 6pm
    // reminder produced silence until the next day.
    const plan = plannedReminders([fresh()], at(10, 10));
    expect(sameLocalDay(plan[0].at, at(10, 18))).toBe(true);
  });

  it('is due today the moment it is added', () => {
    expect(isDueToday(fresh(), at(10, 10))).toBe(true);
  });

  it('a real logged dose still suppresses the same day', () => {
    // The suppression itself must survive — this is the fix from earlier in
    // build 20, and it must not be traded away to fix the default.
    const given = fresh({ lastGiven: at(10, 8).toISOString() });
    expect(isDueToday(given, at(10, 10))).toBe(false);
    expect(plannedReminders([given], at(10, 10)).some((p) => sameLocalDay(p.at, at(10, 10)))).toBe(false);
  });
});
