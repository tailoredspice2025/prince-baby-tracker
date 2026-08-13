import {
  Baby,
  Caregiver,
  Measurement,
  Medication,
  Milestone,
  Settings,
  SicknessEpisode,
  TimelineEvent,
  Vaccine,
} from '../types/models';

// Seed data mirrors the copy in the Claude Design mockups (Prince, born
// Mar 8 2026, Mom/Dad/Anita, the exact vaccine/sickness/medicine rows,
// etc.) so the app is navigable and visually matches the designs before
// any real Firebase project is wired up. See src/lib/store.ts.

const FAMILY_ID = 'demo-family';
const BABY_ID = 'demo-baby-prince';

function todayAt(hour: number, minute: number, dayOffset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export const demoBaby: Baby = {
  id: BABY_ID,
  familyId: FAMILY_ID,
  name: 'Prince',
  dob: '2026-03-08',
  birthWeightKg: 3.4,
  birthLengthCm: 51,
  active: true,
  sex: 'male',
};

export const demoCaregivers: Caregiver[] = [
  { id: 'cg-mom', familyId: FAMILY_ID, name: 'Mom', role: 'owner', colorKey: 'rose', loggedCount: 214, online: true },
  { id: 'cg-dad', familyId: FAMILY_ID, name: 'Dad', role: 'editor', colorKey: 'sky', loggedCount: 178, online: false, lastActive: '2h ago' },
  { id: 'cg-nanny', familyId: FAMILY_ID, name: 'Anita · nanny', role: 'caregiver', colorKey: 'sage', loggedCount: 96, online: false, schedule: 'Mon–Fri' },
];

/** The ids above are seed/demo only. A real install logs as *this* device's
 * caregiver — see meCaregiver / ME_CAREGIVER_ID below. */
export const DEMO_CAREGIVER_IDS = demoCaregivers.map((c) => c.id);

/** Stable local id for "me" before (or without) Family Sync. Once a family
 * is created/joined this is replaced by the Firebase auth uid. */
export const ME_CAREGIVER_ID = 'cg-me';

export function meCaregiver(name = 'You'): Caregiver {
  return {
    id: ME_CAREGIVER_ID,
    familyId: FAMILY_ID,
    name,
    role: 'owner',
    colorKey: 'peach',
    loggedCount: 0,
    online: true,
  };
}

const demoTodayEvents: TimelineEvent[] = [
  {
    id: 'ev-1',
    babyId: BABY_ID,
    type: 'bottle',
    time: todayAt(9, 5),
    quantityMl: 120,
    notes: 'Formula',
    loggedBy: ME_CAREGIVER_ID,
    inputMethod: 'voice',
  },
  {
    id: 'ev-2',
    babyId: BABY_ID,
    type: 'diaper',
    time: todayAt(8, 50),
    kind: 'wet',
    loggedBy: ME_CAREGIVER_ID,
    inputMethod: 'tap',
  },
  {
    id: 'ev-3',
    babyId: BABY_ID,
    type: 'sleep',
    startTime: todayAt(23, 20, -1),
    endTime: todayAt(6, 0),
    loggedBy: ME_CAREGIVER_ID,
    inputMethod: 'tap',
  },
];

// mulberry32 — tiny deterministic PRNG so the generated history is stable
// across reloads (same day offset → same events) while still looking organic.
function seededRand(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * ~12 weeks of plausible history (bottles, naps + night sleep, diapers,
 * pumping, daily vitamin D, and solids ramping in over the last month) so
 * the Trends screen has real day/week/month curves to show before any
 * Firebase project is connected. Excludes today — today's rows come from
 * demoTodayEvents and live logging.
 */
function generateHistoryEvents(days = 84): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const caregivers = [ME_CAREGIVER_ID];

  for (let d = days; d >= 1; d--) {
    const rand = seededRand(d * 7919);
    const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
    const jitter = (range: number) => Math.floor(rand() * range * 2) - range;
    let n = 0;
    const id = () => `ev-h-${d}-${n++}`;

    // Bottles: 5–7 across the day, 100–160 ml
    const bottles = 5 + Math.floor(rand() * 3);
    for (let i = 0; i < bottles; i++) {
      const hour = 6.5 + (i * 15) / bottles;
      events.push({
        id: id(),
        babyId: BABY_ID,
        type: 'bottle',
        time: todayAt(Math.floor(hour), Math.floor((hour % 1) * 60) + jitter(15), -d),
        quantityMl: 100 + Math.floor(rand() * 7) * 10,
        loggedBy: pick(caregivers),
        inputMethod: rand() < 0.3 ? 'voice' : 'tap',
      });
    }

    // Solids: none until ~5 weeks ago, then ramping to 1–2/day
    const solidsCount = d <= 14 ? 1 + Math.floor(rand() * 2) : d <= 35 ? Math.floor(rand() * 2) : 0;
    const foods = ['pear', 'apple', 'banana', 'carrot', 'oat cereal', 'sweet potato'];
    for (let i = 0; i < solidsCount; i++) {
      events.push({
        id: id(),
        babyId: BABY_ID,
        type: 'solids',
        time: todayAt(i === 0 ? 11 : 17, 30 + jitter(20), -d),
        food: pick(foods),
        loggedBy: pick(caregivers),
        inputMethod: 'tap',
      });
    }

    // Naps: two daytime naps
    const napPlans: [number, number][] = [
      [9, 50 + Math.floor(rand() * 50)],
      [14, 45 + Math.floor(rand() * 45)],
    ];
    for (const [startHour, mins] of napPlans) {
      const start = new Date(todayAt(startHour, jitter(25) + 25, -d));
      const end = new Date(start.getTime() + mins * 60000);
      events.push({
        id: id(),
        babyId: BABY_ID,
        type: 'sleep',
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        loggedBy: pick(caregivers),
        inputMethod: 'tap',
      });
    }

    // Night sleep: starts this evening, ends next morning (spans midnight).
    // Skipped for d=1 — last night's sleep is already seeded as ev-3 in
    // demoTodayEvents, and generating it here would double-count today.
    if (d > 1) {
      const nightStart = new Date(todayAt(22, jitter(35), -d));
      const nightEnd = new Date(todayAt(6, 15 + jitter(30), -d + 1));
      events.push({
        id: id(),
        babyId: BABY_ID,
        type: 'sleep',
        startTime: nightStart.toISOString(),
        endTime: nightEnd.toISOString(),
        loggedBy: pick(caregivers),
        inputMethod: 'tap',
      });
    }

    // Diapers: 5–8, mostly wet
    const diapers = 5 + Math.floor(rand() * 4);
    for (let i = 0; i < diapers; i++) {
      const r = rand();
      events.push({
        id: id(),
        babyId: BABY_ID,
        type: 'diaper',
        time: todayAt(7 + Math.floor((i * 15) / diapers), Math.floor(rand() * 60), -d),
        kind: r < 0.6 ? 'wet' : r < 0.85 ? 'dirty' : 'both',
        loggedBy: pick(caregivers),
        inputMethod: rand() < 0.2 ? 'voice' : 'tap',
      });
    }

    // Pumping: 1–2 sessions
    const pumps = 1 + (rand() < 0.5 ? 1 : 0);
    for (let i = 0; i < pumps; i++) {
      events.push({
        id: id(),
        babyId: BABY_ID,
        type: 'pump',
        time: todayAt(i === 0 ? 8 : 20, 30 + jitter(20), -d),
        quantityMl: 80 + Math.floor(rand() * 6) * 10,
        side: rand() < 0.5 ? 'left' : rand() < 0.5 ? 'right' : 'both',
        loggedBy: ME_CAREGIVER_ID,
        inputMethod: 'tap',
      });
    }

    // Daily vitamin D
    events.push({
      id: id(),
      babyId: BABY_ID,
      type: 'medicine',
      time: todayAt(18, jitter(10), -d),
      name: 'Vitamin D drops',
      dose: '400 IU',
      loggedBy: pick(caregivers),
      inputMethod: 'tap',
    });
  }

  return events;
}

export const demoHistoryEvents: TimelineEvent[] = generateHistoryEvents();

export const demoEvents: TimelineEvent[] = [...demoTodayEvents, ...demoHistoryEvents];

export const demoMeasurements: Measurement[] = [
  { id: 'm-birth', babyId: BABY_ID, date: '2026-03-08', weightKg: 3.4, heightCm: 51, headCm: 34.5 },
  { id: 'm-2mo', babyId: BABY_ID, date: '2026-05-08', weightKg: 5.9, heightCm: 58.6, headCm: 39.2 },
  { id: 'm-4mo', babyId: BABY_ID, date: '2026-07-08', weightKg: 7.1, heightCm: 63, headCm: 41.5 },
];

export const demoVaccines: Vaccine[] = [
  { id: 'v-1', babyId: BABY_ID, name: 'DTaP', doseLabel: 'dose 2', status: 'done', date: '2026-05-12', site: 'left thigh', reaction: 'no fever' },
  { id: 'v-2', babyId: BABY_ID, name: 'Rotavirus', doseLabel: 'dose 2', status: 'done', date: '2026-05-12', notes: 'oral' },
  { id: 'v-3', babyId: BABY_ID, name: 'DTaP', doseLabel: 'dose 3', status: 'due', date: '2026-09-08', notes: '6-month visit' },
];

export const demoSickness: SicknessEpisode[] = [
  {
    id: 's-1',
    babyId: BABY_ID,
    title: 'Mild fever · 38.1°C',
    emoji: '🌡️',
    startDate: '2026-06-30',
    endDate: '2026-07-01',
    notes: 'After vaccines · resolved · paracetamol ×2',
    resolved: true,
  },
  {
    id: 's-2',
    babyId: BABY_ID,
    title: 'Diaper rash · mild',
    emoji: '🩹',
    startDate: '2026-06-14',
    endDate: '2026-06-18',
    notes: 'Zinc cream at each change · photo attached',
    resolved: true,
  },
];

export const demoMedications: Medication[] = [
  { id: 'med-1', babyId: BABY_ID, name: 'Vitamin D drops', dose: '400 IU', schedule: 'daily 6 PM', prn: false, ongoing: true, reminderTime: '18:00' },
  { id: 'med-2', babyId: BABY_ID, name: 'Paracetamol syrup', dose: '2.5 ml', schedule: 'as needed', prn: true, ongoing: false, lastGiven: '2026-07-01' },
];

export const demoMilestonesAchieved: Milestone[] = [
  { id: 'ms-1', babyId: BABY_ID, name: 'First smile', emoji: '😊', ageLabel: '6 weeks', date: '2026-04-19' },
  { id: 'ms-2', babyId: BABY_ID, name: 'First roll-over', emoji: '🔄', ageLabel: '3.5 mo', date: '2026-06-24' },
  { id: 'ms-3', babyId: BABY_ID, name: 'First laugh', emoji: '😂', ageLabel: '3 mo', date: '2026-06-10' },
];

export const demoMilestonesUpcoming: Milestone[] = [
  { id: 'ms-up-1', babyId: BABY_ID, name: 'Sits with support', emoji: '🪑', typicalAgeRange: '~5 mo' },
  { id: 'ms-up-2', babyId: BABY_ID, name: 'First tooth', emoji: '🦷', typicalAgeRange: '4–7 mo' },
  { id: 'ms-up-3', babyId: BABY_ID, name: 'First solids', emoji: '🥄', typicalAgeRange: '~6 mo' },
];

export const demoSettings: Settings = {
  units: 'ml',
  voiceLoggingEnabled: true,
  voicePermissions: { bottle: true, solids: true, sleep: true, diaper: true, pump: false },
};

export { FAMILY_ID, BABY_ID, daysAgoISO };

/**
 * Every id the app ships with as sample data.
 *
 * These records exist so the screens aren't empty during development. They
 * must never survive into real use: the seed includes two vaccines marked
 * *given*, a fever episode, and invented weights that drive the WHO percentile
 * curve — and "Export for pediatrician" builds its PDF from exactly those
 * arrays. A parent could hand a clinician a document stating their baby had
 * DTaP and Rotavirus on a date nothing happened.
 *
 * Matched by exact id, never by prefix: `uid('ev')` produces `ev-<timestamp>`,
 * which a `startsWith('ev-')` check would delete along with the seed.
 */
export const SEEDED_RECORD_IDS: ReadonlySet<string> = new Set<string>([
  ...demoEvents.map((e) => e.id),
  ...demoMeasurements.map((m) => m.id),
  ...demoVaccines.map((v) => v.id),
  ...demoSickness.map((s) => s.id),
  ...demoMedications.map((m) => m.id),
  ...demoMilestonesAchieved.map((m) => m.id),
]);

/** Ids of seeded records that arm a notification, so they can be cancelled. */
export const SEEDED_MEDICATION_IDS = demoMedications.map((m) => m.id);
export const SEEDED_VACCINE_IDS = demoVaccines.map((v) => v.id);
