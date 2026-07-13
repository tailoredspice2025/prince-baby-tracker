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

export const demoEvents: TimelineEvent[] = [
  {
    id: 'ev-1',
    babyId: BABY_ID,
    type: 'bottle',
    time: todayAt(9, 5),
    quantityMl: 120,
    notes: 'Formula',
    loggedBy: 'cg-dad',
    inputMethod: 'voice',
  },
  {
    id: 'ev-2',
    babyId: BABY_ID,
    type: 'diaper',
    time: todayAt(8, 50),
    kind: 'wet',
    loggedBy: 'cg-mom',
    inputMethod: 'tap',
  },
  {
    id: 'ev-3',
    babyId: BABY_ID,
    type: 'sleep',
    startTime: todayAt(23, 20, -1),
    endTime: todayAt(6, 0),
    wokeCount: 2,
    loggedBy: 'cg-nanny',
    inputMethod: 'tap',
  },
];

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
  { id: 'ms-1', babyId: BABY_ID, name: 'First smile', emoji: '😊', achieved: true, ageLabel: '6 weeks', date: '2026-04-19' },
  { id: 'ms-2', babyId: BABY_ID, name: 'First roll-over', emoji: '🔄', achieved: true, ageLabel: '3.5 mo', date: '2026-06-24' },
  { id: 'ms-3', babyId: BABY_ID, name: 'First laugh', emoji: '😂', achieved: true, ageLabel: '3 mo', date: '2026-06-10' },
];

export const demoMilestonesUpcoming: Milestone[] = [
  { id: 'ms-up-1', babyId: BABY_ID, name: 'Sits with support', emoji: '🪑', achieved: false, typicalAgeRange: '~5 mo' },
  { id: 'ms-up-2', babyId: BABY_ID, name: 'First tooth', emoji: '🦷', achieved: false, typicalAgeRange: '4–7 mo' },
  { id: 'ms-up-3', babyId: BABY_ID, name: 'First solids', emoji: '🥄', achieved: false, typicalAgeRange: '~6 mo' },
];

export const demoSettings: Settings = {
  units: 'ml',
  voiceLoggingEnabled: true,
  voicePermissions: { bottle: true, solids: true, sleep: true, diaper: true, pump: false },
};

export { FAMILY_ID, BABY_ID, daysAgoISO };
