export type Units = 'ml' | 'oz';

export interface Baby {
  id: string;
  familyId: string;
  name: string;
  dob: string; // ISO date
  birthWeightKg: number;
  birthLengthCm: number;
  photoUri?: string;
  active: boolean;
  // Not collected in the onboarding UI (not in the design); defaults to
  // 'male' for WHO percentile lookups. Wire up a real selector if this
  // ships — see src/lib/whoData.ts.
  sex: 'male' | 'female';
}

export type EventType = 'bottle' | 'sleep' | 'diaper' | 'solids' | 'pump' | 'medicine';
export type InputMethod = 'tap' | 'voice';

export interface FeedEvent {
  id: string;
  babyId: string;
  type: 'bottle' | 'solids' | 'pump';
  time: string; // ISO
  quantityMl?: number;
  food?: string;
  side?: 'left' | 'right' | 'both';
  notes?: string;
  loggedBy: string; // caregiver id
  inputMethod: InputMethod;
}

export interface SleepEvent {
  id: string;
  babyId: string;
  type: 'sleep';
  startTime: string; // ISO
  endTime?: string; // ISO, undefined while running
  wokeCount?: number;
  loggedBy: string;
  inputMethod: InputMethod;
}

export interface DiaperEvent {
  id: string;
  babyId: string;
  type: 'diaper';
  time: string;
  kind: 'wet' | 'dirty' | 'both';
  loggedBy: string;
  inputMethod: InputMethod;
}

export interface MedicineEvent {
  id: string;
  babyId: string;
  type: 'medicine';
  time: string;
  name: string;
  dose: string;
  loggedBy: string;
  inputMethod: InputMethod;
}

export type TimelineEvent = FeedEvent | SleepEvent | DiaperEvent | MedicineEvent;

export type MeasurementKind = 'weight' | 'height' | 'head';

export interface Measurement {
  id: string;
  babyId: string;
  date: string; // ISO
  weightKg?: number;
  heightCm?: number;
  headCm?: number;
}

export interface Vaccine {
  id: string;
  babyId: string;
  name: string;
  doseLabel: string; // e.g. "3 of 5"
  status: 'done' | 'due';
  date: string; // ISO — given date if done, due date if due
  site?: string;
  batchNo?: string;
  clinic?: string;
  reaction?: string;
  notes?: string;
  fromVoice?: boolean;
  voiceFields?: Partial<Record<'name' | 'doseLabel' | 'date', boolean>>;
}

export interface SicknessEpisode {
  id: string;
  babyId: string;
  title: string; // e.g. "Mild fever · 38.1°C"
  emoji: string;
  startDate: string;
  endDate?: string;
  notes?: string;
  resolved: boolean;
  photoUri?: string;
}

export interface Medication {
  id: string;
  babyId: string;
  name: string;
  dose: string;
  schedule: string; // e.g. "daily 6 PM" or "as needed"
  prn: boolean;
  ongoing: boolean;
  reminderTime?: string; // "HH:mm"
  lastGiven?: string;
}

export interface Milestone {
  id: string;
  babyId: string;
  name: string;
  emoji: string;
  achieved: boolean;
  ageLabel?: string;
  date?: string;
  photoUri?: string;
  typicalAgeRange?: string;
}

export type CaregiverRole = 'owner' | 'editor' | 'caregiver';

export interface Caregiver {
  id: string;
  familyId: string;
  name: string;
  role: CaregiverRole;
  colorKey: 'peach' | 'sky' | 'sage' | 'lavender' | 'rose' | 'sand';
  loggedCount: number;
  online: boolean;
  lastActive?: string;
  schedule?: string; // e.g. "Mon-Fri"
}

export interface VoicePermissions {
  bottle: boolean;
  solids: boolean;
  sleep: boolean;
  diaper: boolean;
  pump: boolean;
}

export interface Settings {
  units: Units;
  voiceLoggingEnabled: boolean;
  voicePermissions: VoicePermissions;
  forceNightPreview?: boolean;
  // Optional so installs persisted before the feature existed stay valid;
  // treat undefined as disabled / 3 h.
  feedReminderEnabled?: boolean;
  feedReminderHours?: number;
}

export interface ParsedVoiceDraft {
  transcript: string;
  eventType: EventType | 'vaccine' | 'medicine-form' | 'sickness-form' | null;
  title: string;
  detail: string;
  icon: string;
  quantityMl?: number;
  time: string; // ISO, resolved
  raw: Record<string, unknown>;
  recognized: boolean;
}

export interface RunningSleepSession {
  babyId: string;
  startTime: string; // ISO
}
