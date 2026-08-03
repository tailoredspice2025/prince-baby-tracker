import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import {
  Baby,
  Caregiver,
  DiaperEvent,
  FeedEvent,
  Measurement,
  Medication,
  MedicineEvent,
  Milestone,
  ParsedVoiceDraft,
  RunningSleepSession,
  Settings,
  SicknessEpisode,
  SleepEvent,
  TimelineEvent,
  Vaccine,
  VoicePermissions,
} from '../types/models';
import {
  demoBaby,
  DEMO_CAREGIVER_IDS,
  demoEvents,
  ME_CAREGIVER_ID,
  meCaregiver,
  demoHistoryEvents,
  demoMeasurements,
  demoMedications,
  demoMilestonesAchieved,
  demoMilestonesUpcoming,
  demoSettings,
  demoSickness,
  demoVaccines,
  SEEDED_MEDICATION_IDS,
  SEEDED_RECORD_IDS,
  SEEDED_VACCINE_IDS,
} from './demoData';
import {
  createFamily,
  deleteFamilyData,
  fetchFamilySnapshot,
  getUid,
  isFirebaseConfigured,
  joinFamily,
  removeCaregiverDoc,
  resolveInviteCode,
  syncWindowCutoffMs,
  SyncedCollection,
} from './firestoreSync';
import { pendingIds, startFamilySync, stopFamilySync, syncDelete, syncWrite, uploadLocalData } from './familySync';
import { eventTime } from './eventRow';
import {
  cancelFeedReminder,
  cancelMedicationReminder,
  cancelVaccineReminders,
  ensureNotificationPermissions,
  rescheduleFeedReminder,
  scheduleMedicationReminder,
  scheduleVaccineReminders,
} from './notifications';

/** Drops every seeded sample record, keeping anything the user logged.
 * Matched by exact id — a prefix check would also delete real entries, since
 * `uid('ev')` produces ids beginning `ev-`. `milestonesUpcoming` stays: those
 * are suggestions to aim at, not records of things that happened. */
function stripSeededRecords(s: {
  events: TimelineEvent[];
  measurements: Measurement[];
  vaccines: Vaccine[];
  sickness: SicknessEpisode[];
  medications: Medication[];
  milestonesAchieved: Milestone[];
}) {
  const keep = <T extends { id: string }>(rows: T[]) => rows.filter((r) => !SEEDED_RECORD_IDS.has(r.id));
  return {
    events: keep(s.events),
    measurements: keep(s.measurements),
    vaccines: keep(s.vaccines),
    sickness: keep(s.sickness),
    medications: keep(s.medications),
    milestonesAchieved: keep(s.milestonesAchieved),
  };
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export interface Toast {
  id: string;
  message: string;
  onUndo?: () => void;
}

interface AppState {
  onboarded: boolean;
  // Family sync (multi-caregiver): null until this device creates or joins
  // a family. myUid is the Firebase anonymous-auth uid, which doubles as
  // this device's caregiver id once linked.
  familyId: string | null;
  myUid: string | null;
  babies: Baby[];
  activeBabyId: string;
  currentCaregiverId: string;
  caregivers: Caregiver[];
  events: TimelineEvent[];
  measurements: Measurement[];
  vaccines: Vaccine[];
  sickness: SicknessEpisode[];
  medications: Medication[];
  milestonesAchieved: Milestone[];
  milestonesUpcoming: Milestone[];
  settings: Settings;
  runningSleepSession: RunningSleepSession | null;
  voiceDraft: ParsedVoiceDraft | null;
  voiceSheetVisible: boolean;
  voiceHoldActive: boolean;
  voiceListening: boolean;
  liveTranscript: string;
  quickAddVisible: boolean;
  toasts: Toast[];

  openQuickAdd: () => void;
  closeQuickAdd: () => void;
  startVoiceHold: () => void;
  endVoiceHold: () => void;
  closeVoiceSheet: () => void;
  setVoiceListening: (v: boolean) => void;
  setLiveTranscript: (t: string) => void;
  activeBaby: () => Baby;
  completeOnboarding: (baby: Partial<Baby>) => void;
  addBaby: (baby: Omit<Baby, 'id' | 'familyId' | 'active'>) => void;
  setActiveBaby: (id: string) => void;
  setBabyPhoto: (uri: string) => void;
  logQuickEvent: (
    type: 'bottle' | 'diaper' | 'solids' | 'pump' | 'medicine',
    opts?: { quantityMl?: number; kind?: DiaperEvent['kind']; food?: string; name?: string; dose?: string }
  ) => void;
  toggleSleep: () => void;
  editingEventId: string | null;
  setEditingEvent: (id: string | null) => void;
  updateEvent: (id: string, patch: Partial<TimelineEvent>) => void;
  deleteEvent: (id: string) => void;
  addMeasurement: (m: Omit<Measurement, 'id' | 'babyId'>) => void;
  /** Measurements, sickness, medication and milestones were add-only: a
   * mistyped weight sat in the growth curve forever. Every record type that
   * can be created can now be corrected and removed. */
  updateMeasurement: (id: string, patch: Partial<Measurement>) => void;
  deleteMeasurement: (id: string) => void;
  updateSicknessEpisode: (id: string, patch: Partial<SicknessEpisode>) => void;
  deleteSicknessEpisode: (id: string) => void;
  updateMedication: (id: string, patch: Partial<Medication>) => void;
  deleteMedication: (id: string) => void;
  updateMilestone: (id: string, patch: Partial<Milestone>) => void;
  deleteMilestone: (id: string) => void;
  addVaccine: (v: Omit<Vaccine, 'id' | 'babyId'>) => void;
  updateVaccine: (id: string, patch: Partial<Vaccine>) => void;
  deleteVaccine: (id: string) => void;
  addSicknessEpisode: (s: Omit<SicknessEpisode, 'id' | 'babyId'>) => void;
  addMedication: (m: Omit<Medication, 'id' | 'babyId'>) => void;
  addMilestone: (m: Omit<Milestone, 'id' | 'babyId' | 'achieved'>) => void;
  setUnits: (u: Settings['units']) => void;
  setThemePreference: (p: NonNullable<Settings['themePreference']>) => void;
  /** Night-feeding view is opt-in — it never takes over the screen by itself. */
  setForceNightPreview: (v: boolean) => void;
  setVoiceLoggingEnabled: (v: boolean) => void;
  setAppLockEnabled: (v: boolean) => void;
  setFeedReminder: (enabled: boolean, hours?: number) => void;
  toggleVoicePermission: (key: keyof VoicePermissions) => void;
  addCaregiver: (c: Omit<Caregiver, 'id' | 'familyId'>) => void;
  /** The name shown next to everything this device logs. */
  myName: () => string;
  setMyName: (name: string) => void;
  // Family sync lifecycle
  initFamilySync: () => void;
  createFamilyAndLink: (myName: string) => Promise<void>;
  joinFamilyWithCode: (code: string, myName: string) => Promise<'ok' | 'invalid-code' | 'error'>;
  leaveFamily: (opts?: { deleteCloudData?: boolean }) => Promise<void>;
  removeCaregiver: (caregiverId: string) => void;
  applyRemoteCollection: (col: SyncedCollection, docs: Record<string, unknown>[]) => void;
  setVoiceDraft: (d: ParsedVoiceDraft | null) => void;
  applyVoiceDraft: () => void;
  dismissToast: (id: string) => void;
  pushToast: (t: Omit<Toast, 'id'>) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
  onboarded: false,
  familyId: null,
  myUid: null,
  babies: [demoBaby],
  activeBabyId: demoBaby.id,
  // This device logs as its own caregiver from the start — never the demo
  // mum/dad/nanny (which made entries show an attribution nobody chose).
  currentCaregiverId: ME_CAREGIVER_ID,
  caregivers: [meCaregiver()],
  events: demoEvents,
  measurements: demoMeasurements,
  vaccines: demoVaccines,
  sickness: demoSickness,
  medications: demoMedications,
  milestonesAchieved: demoMilestonesAchieved,
  milestonesUpcoming: demoMilestonesUpcoming,
  settings: demoSettings,
  runningSleepSession: null,
  voiceDraft: null,
  voiceSheetVisible: false,
  voiceHoldActive: false,
  voiceListening: false,
  liveTranscript: '',
  quickAddVisible: false,
  toasts: [],

  openQuickAdd: () => set({ quickAddVisible: true }),
  closeQuickAdd: () => set({ quickAddVisible: false }),
  startVoiceHold: () => set({ voiceSheetVisible: true, voiceHoldActive: true, voiceDraft: null, liveTranscript: '' }),
  endVoiceHold: () => set({ voiceHoldActive: false }),
  closeVoiceSheet: () => set({ voiceSheetVisible: false, voiceHoldActive: false, voiceListening: false, liveTranscript: '', voiceDraft: null }),
  setVoiceListening: (v) => set({ voiceListening: v }),
  setLiveTranscript: (t) => set({ liveTranscript: t }),

  activeBaby: () => {
    const s = get();
    return s.babies.find((b) => b.id === s.activeBabyId) ?? s.babies[0];
  },

  completeOnboarding: (baby) => {
    // Sample data must not survive into real use. It includes two vaccines
    // marked *given*, a fever episode and invented weights that drive the WHO
    // percentile curve — and "Export for pediatrician" builds its PDF from
    // those same arrays, so a parent could hand a clinician a record of
    // vaccinations that never happened. It also carries a Vitamin D
    // medication that armed a daily 18:00 notification nobody set.
    SEEDED_MEDICATION_IDS.forEach((id) => cancelMedicationReminder(id).catch(() => {}));
    SEEDED_VACCINE_IDS.forEach((id) => cancelVaccineReminders(id).catch(() => {}));
    set((s) => ({
      onboarded: true,
      babies: s.babies.map((b) => (b.id === s.activeBabyId ? { ...b, ...baby } : b)),
      ...stripSeededRecords(s),
    }));
    const updated = get().activeBaby();
    syncWrite('babies', updated);
  },

  addBaby: (baby) => {
    const id = uid('baby');
    const familyId = get().familyId ?? 'demo-family';
    const newBaby: Baby = { ...baby, id, familyId, active: true };
    set((s) => ({
      babies: [...s.babies.map((b) => ({ ...b, active: false })), newBaby],
      activeBabyId: id,
    }));
    syncWrite('babies', newBaby);
  },

  setActiveBaby: (id) =>
    set((s) => ({
      activeBabyId: id,
      babies: s.babies.map((b) => ({ ...b, active: b.id === id })),
    })),

  setBabyPhoto: (uri) => {
    set((s) => ({
      babies: s.babies.map((b) => (b.id === s.activeBabyId ? { ...b, photoUri: uri } : b)),
    }));
    // Note: the photo URI is a device-local file path — it labels the baby on
    // this phone but doesn't transfer the image itself. Cloud photo storage
    // is a later enhancement; other caregivers see the initial-letter avatar.
    syncWrite('babies', get().activeBaby());
  },

  editingEventId: null,
  setEditingEvent: (id) => set({ editingEventId: id }),

  updateEvent: (id, patch) =>
    set((s) => ({
      events: s.events.map((e) => {
        if (e.id !== id) return e;
        const updated = { ...e, ...patch } as TimelineEvent;
        syncWrite('events', updated);
        return updated;
      }),
    })),

  deleteEvent: (id) => {
    const removed = get().events.find((e) => e.id === id);
    set((s) => ({ events: s.events.filter((e) => e.id !== id), editingEventId: null }));
    syncDelete('events', id);
    if (removed) {
      get().pushToast({
        message: 'Event deleted',
        onUndo: () => {
          set((s) => ({ events: [removed, ...s.events] }));
          syncWrite('events', removed);
        },
      });
    }
  },

  pushToast: (t) => {
    const id = uid('toast');
    set((s) => ({ toasts: [...s.toasts, { id, ...t }] }));
    setTimeout(() => get().dismissToast(id), 4000);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  logQuickEvent: (type, opts) => {
    const babyId = get().activeBabyId;
    const loggedBy = get().currentCaregiverId;
    const now = new Date().toISOString();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    /** Most recent amount logged for this feed type, so a one-tap log
     * repeats what this baby actually takes instead of a fixed 120 ml. */
    const lastAmount = (t: 'bottle' | 'pump'): number | undefined => {
      const s = get();
      return s.events
        .filter((e) => e.babyId === s.activeBabyId && e.type === t && (e as FeedEvent).quantityMl != null)
        .sort((a, b) => eventTime(b).localeCompare(eventTime(a)))
        .map((e) => (e as FeedEvent).quantityMl)[0];
    };

    if (type === 'bottle') {
      const quantityMl = opts?.quantityMl ?? lastAmount('bottle') ?? 120;
      const ev: FeedEvent = { id: uid('ev'), babyId, type: 'bottle', time: now, quantityMl, notes: 'Formula', loggedBy, inputMethod: 'tap' };
      set((s) => ({ events: [ev, ...s.events] }));
      syncWrite('events', ev);
      get().pushToast({ message: `Bottle · ${quantityMl} ml logged`, onUndo: () => set((s) => ({ events: s.events.filter((e) => e.id !== ev.id) })) });
    } else if (type === 'diaper') {
      const kind = opts?.kind ?? 'wet';
      const ev: DiaperEvent = { id: uid('ev'), babyId, type: 'diaper', time: now, kind, loggedBy, inputMethod: 'tap' };
      set((s) => ({ events: [ev, ...s.events] }));
      syncWrite('events', ev);
      get().pushToast({ message: `Diaper · ${kind} logged`, onUndo: () => set((s) => ({ events: s.events.filter((e) => e.id !== ev.id) })) });
    } else if (type === 'solids') {
      const food = opts?.food ?? 'pear';
      const ev: FeedEvent = { id: uid('ev'), babyId, type: 'solids', time: now, food, loggedBy, inputMethod: 'tap' };
      set((s) => ({ events: [ev, ...s.events] }));
      syncWrite('events', ev);
      get().pushToast({ message: `Solids · ${food} logged`, onUndo: () => set((s) => ({ events: s.events.filter((e) => e.id !== ev.id) })) });
    } else if (type === 'pump') {
      const quantityMl = opts?.quantityMl ?? lastAmount('pump') ?? 90;
      const ev: FeedEvent = { id: uid('ev'), babyId, type: 'pump', time: now, quantityMl, side: 'left', loggedBy, inputMethod: 'tap' };
      set((s) => ({ events: [ev, ...s.events] }));
      syncWrite('events', ev);
      get().pushToast({ message: `Pump · ${quantityMl} ml logged`, onUndo: () => set((s) => ({ events: s.events.filter((e) => e.id !== ev.id) })) });
    } else if (type === 'medicine') {
      // Repeats whatever was last given rather than always Vitamin D, the same
      // way bottle amounts repeat — and it stays editable afterwards.
      const s = get();
      const last = s.events.find((e) => e.babyId === babyId && e.type === 'medicine') as MedicineEvent | undefined;
      const name = opts?.name ?? last?.name ?? 'Vitamin D drops';
      const dose = opts?.dose ?? (opts?.name ? '' : last?.dose ?? '400 IU');
      const ev: MedicineEvent = { id: uid('ev'), babyId, type: 'medicine', time: now, name, dose, loggedBy, inputMethod: 'tap' };
      // Mark the matching ongoing medication as given, so the "due today"
      // banner on Home actually clears. Logging a dose used to write the event
      // and leave `lastGiven` untouched, so nothing could ever mark it done.
      set((st) => ({
        events: [ev, ...st.events],
        medications: st.medications.map((m) => {
          if (m.babyId !== babyId || !m.ongoing || m.name !== name) return m;
          const updated = { ...m, lastGiven: now };
          syncWrite('medications', updated);
          return updated;
        }),
      }));
      syncWrite('events', ev);
      get().pushToast({ message: `${name} logged`, onUndo: () => set((st) => ({ events: st.events.filter((e) => e.id !== ev.id) })) });
    }

    if ((type === 'bottle' || type === 'solids') && get().settings.feedReminderEnabled) {
      rescheduleFeedReminder(now, get().settings.feedReminderHours ?? 3, get().activeBaby().name).catch(() => {});
    }
  },

  toggleSleep: () => {
    const s = get();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (s.runningSleepSession) {
      const ev: SleepEvent = {
        id: uid('ev'),
        babyId: s.activeBabyId,
        type: 'sleep',
        startTime: s.runningSleepSession.startTime,
        endTime: new Date().toISOString(),
        loggedBy: s.currentCaregiverId,
        inputMethod: 'tap',
      };
      set((st) => ({ events: [ev, ...st.events], runningSleepSession: null }));
      syncWrite('events', ev);
      get().pushToast({ message: 'Sleep session ended' });
    } else {
      set({ runningSleepSession: { babyId: s.activeBabyId, startTime: new Date().toISOString() } });
      get().pushToast({ message: 'Sleep session started' });
    }
  },

  addMeasurement: (m) => {
    const babyId = get().activeBabyId;
    const measurement: Measurement = { id: uid('m'), babyId, ...m };
    set((s) => ({ measurements: [...s.measurements, measurement] }));
    syncWrite('measurements', measurement);
  },

  updateMeasurement: (id, patch) =>
    set((s) => ({
      measurements: s.measurements.map((m) => {
        if (m.id !== id) return m;
        const updated = { ...m, ...patch };
        syncWrite('measurements', updated);
        return updated;
      }),
    })),

  deleteMeasurement: (id) => {
    const removed = get().measurements.find((m) => m.id === id);
    set((s) => ({ measurements: s.measurements.filter((m) => m.id !== id) }));
    syncDelete('measurements', id);
    if (removed) {
      get().pushToast({
        message: 'Measurement deleted',
        onUndo: () => {
          set((s) => ({ measurements: [...s.measurements, removed] }));
          syncWrite('measurements', removed);
        },
      });
    }
  },

  updateSicknessEpisode: (id, patch) =>
    set((s) => ({
      sickness: s.sickness.map((e) => {
        if (e.id !== id) return e;
        const updated = { ...e, ...patch };
        syncWrite('sickness', updated);
        return updated;
      }),
    })),

  deleteSicknessEpisode: (id) => {
    set((s) => ({ sickness: s.sickness.filter((e) => e.id !== id) }));
    syncDelete('sickness', id);
    get().pushToast({ message: 'Episode deleted' });
  },

  updateMedication: (id, patch) =>
    set((s) => ({
      medications: s.medications.map((m) => {
        if (m.id !== id) return m;
        const updated = { ...m, ...patch };
        syncWrite('medications', updated);
        scheduleMedicationReminder(updated).catch(() => {});
        return updated;
      }),
    })),

  deleteMedication: (id) => {
    set((s) => ({ medications: s.medications.filter((m) => m.id !== id) }));
    syncDelete('medications', id);
    cancelMedicationReminder(id).catch(() => {});
    get().pushToast({ message: 'Medicine deleted' });
  },

  updateMilestone: (id, patch) =>
    set((s) => ({
      milestonesAchieved: s.milestonesAchieved.map((m) => {
        if (m.id !== id) return m;
        const updated = { ...m, ...patch };
        syncWrite('milestones', updated);
        return updated;
      }),
    })),

  deleteMilestone: (id) => {
    set((s) => ({ milestonesAchieved: s.milestonesAchieved.filter((m) => m.id !== id) }));
    syncDelete('milestones', id);
    get().pushToast({ message: 'Memory deleted' });
  },

  addVaccine: (v) => {
    const babyId = get().activeBabyId;
    const vaccine: Vaccine = { id: uid('v'), babyId, ...v };
    set((s) => ({ vaccines: [...s.vaccines, vaccine] }));
    syncWrite('vaccines', vaccine);
    scheduleVaccineReminders(vaccine).catch(() => {});
  },

  updateVaccine: (id, patch) => {
    let updated: Vaccine | undefined;
    set((s) => ({
      vaccines: s.vaccines.map((v) => {
        if (v.id !== id) return v;
        updated = { ...v, ...patch };
        return updated;
      }),
    }));
    if (updated) {
      syncWrite('vaccines', updated);
      // reschedule (or clear, if it's now 'done') this appointment's reminders
      scheduleVaccineReminders(updated).catch(() => {});
    }
  },

  deleteVaccine: (id) => {
    set((s) => ({ vaccines: s.vaccines.filter((v) => v.id !== id) }));
    syncDelete('vaccines', id);
    cancelVaccineReminders(id).catch(() => {});
  },

  addSicknessEpisode: (sEp) => {
    const babyId = get().activeBabyId;
    const episode: SicknessEpisode = { id: uid('s'), babyId, ...sEp };
    set((s) => ({ sickness: [episode, ...s.sickness] }));
    syncWrite('sickness', episode);
  },

  addMedication: (m) => {
    const babyId = get().activeBabyId;
    const med: Medication = { id: uid('med'), babyId, ...m };
    set((s) => ({ medications: [med, ...s.medications] }));
    syncWrite('medications', med);
    scheduleMedicationReminder(med).catch(() => {});
  },

  addMilestone: (m) => {
    const babyId = get().activeBabyId;
    const milestone: Milestone = { id: uid('ms'), babyId, achieved: true, ...m };
    set((s) => ({ milestonesAchieved: [milestone, ...s.milestonesAchieved] }));
    syncWrite('milestones', milestone);
  },

  setUnits: (u) => set((s) => ({ settings: { ...s.settings, units: u } })),
  setThemePreference: (p) => set((s) => ({ settings: { ...s.settings, themePreference: p } })),
  setForceNightPreview: (v) => set((s) => ({ settings: { ...s.settings, forceNightPreview: v } })),
  setVoiceLoggingEnabled: (v) => set((s) => ({ settings: { ...s.settings, voiceLoggingEnabled: v } })),
  setAppLockEnabled: (v) => set((s) => ({ settings: { ...s.settings, appLockEnabled: v } })),

  setFeedReminder: (enabled, hours) => {
    const prevHours = get().settings.feedReminderHours ?? 3;
    const nextHours = hours ?? prevHours;
    set((s) => ({ settings: { ...s.settings, feedReminderEnabled: enabled, feedReminderHours: nextHours } }));
    if (!enabled) {
      cancelFeedReminder().catch(() => {});
      return;
    }
    ensureNotificationPermissions().catch(() => {});
    // anchor to the most recent feed so the reminder is meaningful immediately
    const s = get();
    const lastFeed = s.events
      .filter((e) => e.babyId === s.activeBabyId && (e.type === 'bottle' || e.type === 'solids'))
      .map((e) => ('time' in e ? e.time : ''))
      .sort()
      .pop();
    if (lastFeed) rescheduleFeedReminder(lastFeed, nextHours, s.activeBaby().name).catch(() => {});
  },
  toggleVoicePermission: (key) =>
    set((s) => ({
      settings: { ...s.settings, voicePermissions: { ...s.settings.voicePermissions, [key]: !s.settings.voicePermissions[key] } },
    })),

  addCaregiver: (c) =>
    set((s) => ({ caregivers: [...s.caregivers, { id: uid('cg'), familyId: 'demo-family', ...c }] })),

  myName: () => {
    const s = get();
    return s.caregivers.find((c) => c.id === s.currentCaregiverId)?.name ?? 'You';
  },

  /** Renames this device's caregiver. Syncs when a family is linked so the
   * other parent sees the new name against past and future entries. */
  setMyName: (name) => {
    const trimmed = name.trim() || 'You';
    const meId = get().currentCaregiverId;
    let updated: Caregiver | undefined;
    set((s) => ({
      caregivers: s.caregivers.some((c) => c.id === meId)
        ? s.caregivers.map((c) => {
            if (c.id !== meId) return c;
            updated = { ...c, name: trimmed };
            return updated;
          })
        : [...s.caregivers, (updated = { ...meCaregiver(trimmed), id: meId })],
    }));
    if (updated && get().familyId) syncWrite('caregivers', updated);
  },

  // ——— Family sync lifecycle ———————————————————————————————————————————

  /** Reconnects live sync on app start when this device is already linked. */
  initFamilySync: () => {
    const { familyId, applyRemoteCollection } = get();
    if (familyId && isFirebaseConfigured()) {
      startFamilySync(familyId, applyRemoteCollection);
    }
  },

  /** First "Invite caregiver" tap: creates the cloud family, makes this
   * device its owner, and uploads all existing local data so solo history
   * becomes the family's shared history. */
  createFamilyAndLink: async (myName) => {
    const s = get();
    const me: Caregiver = {
      id: 'pending', // replaced with the auth uid by createFamily
      familyId: 'pending',
      name: myName || 'Parent',
      role: 'owner',
      colorKey: 'peach',
      loggedCount: 0,
      online: true,
    };
    const familyId = await createFamily(me);
    const uidNow = await getUid();
    if (!uidNow) throw new Error('Sign-in failed');
    // Events this device logged under the local demo caregiver id now belong
    // to the real identity, so "logged by" survives the switch to cloud.
    const remappedEvents = s.events.map((e) =>
      e.loggedBy === s.currentCaregiverId ? { ...e, loggedBy: uidNow } : e
    );
    set({
      familyId,
      myUid: uidNow,
      currentCaregiverId: uidNow,
      caregivers: [{ ...me, id: uidNow, familyId }],
      events: remappedEvents,
      babies: s.babies.map((b) => ({ ...b, familyId })),
    });
    startFamilySync(familyId, get().applyRemoteCollection);
    const now = get();
    uploadLocalData({
      babies: now.babies,
      events: now.events,
      measurements: now.measurements,
      vaccines: now.vaccines,
      sickness: now.sickness,
      medications: now.medications,
      milestones: now.milestonesAchieved,
    });
  },

  /** Join flow: the family's cloud data becomes this device's data. */
  joinFamilyWithCode: async (code, myName) => {
    try {
      const familyId = await resolveInviteCode(code.trim());
      if (!familyId) return 'invalid-code';
      const uidNow = await joinFamily(familyId, {
        name: myName || 'Parent',
        role: 'editor',
        colorKey: 'sky',
        loggedCount: 0,
        online: true,
      });
      const snapshot = await fetchFamilySnapshot(familyId);
      const babies = (snapshot.babies as unknown as Baby[]) ?? [];
      const activeBabyId = babies.find((b) => b.active)?.id ?? babies[0]?.id ?? get().activeBabyId;
      set({
        familyId,
        myUid: uidNow,
        currentCaregiverId: uidNow,
        onboarded: true,
        babies: babies.length ? babies.map((b) => ({ ...b, active: b.id === activeBabyId })) : get().babies,
        activeBabyId,
        caregivers: (snapshot.caregivers as unknown as Caregiver[]) ?? [],
        events: (snapshot.events as unknown as TimelineEvent[]) ?? [],
        measurements: (snapshot.measurements as unknown as Measurement[]) ?? [],
        vaccines: (snapshot.vaccines as unknown as Vaccine[]) ?? [],
        sickness: (snapshot.sickness as unknown as SicknessEpisode[]) ?? [],
        medications: (snapshot.medications as unknown as Medication[]) ?? [],
        milestonesAchieved: (snapshot.milestones as unknown as Milestone[]) ?? [],
      });
      startFamilySync(familyId, get().applyRemoteCollection);
      return 'ok';
    } catch (err) {
      console.warn('joinFamilyWithCode failed', err);
      return 'error';
    }
  },

  /** Detaches this device. Data logged so far stays on the phone; the
   * cloud copy stays with the family unless deleteCloudData is set (owner
   * wiping the whole family). */
  leaveFamily: async (opts) => {
    const { familyId, myUid } = get();
    if (!familyId) return;
    stopFamilySync();
    try {
      if (opts?.deleteCloudData) {
        await deleteFamilyData(familyId);
      } else if (myUid) {
        await removeCaregiverDoc(familyId, myUid);
      }
    } catch (err) {
      console.warn('leaveFamily cloud cleanup failed', err);
    }
    set({ familyId: null, myUid: null });
  },

  /** Owner removing another caregiver from the family. */
  removeCaregiver: (caregiverId) => {
    const { familyId } = get();
    set((s) => ({ caregivers: s.caregivers.filter((c) => c.id !== caregiverId) }));
    if (familyId) removeCaregiverDoc(familyId, caregiverId).catch((err) => console.warn('removeCaregiver failed', err));
  },

  /** Inbound merge: a live snapshot replaces the local slice, except docs
   * with a still-queued local write, which keep their (newer) local
   * version until the queue drains — last-write-wins without clobbering
   * offline edits. */
  applyRemoteCollection: (col, docs) => {
    const pending = pendingIds(col);
    const keepLocal = <T extends { id: string }>(local: T[]): T[] => local.filter((d) => pending.has(d.id));
    const merge = <T extends { id: string }>(local: T[], remote: T[]): T[] => {
      const kept = keepLocal(local);
      const keptIds = new Set(kept.map((d) => d.id));
      return [...kept, ...remote.filter((d) => !keptIds.has(d.id))];
    };
    if (col === 'events') {
      // Events sync a rolling recent window (see firestoreSync), so a remote
      // snapshot is authoritative only for that window. Retain local events
      // that fall OUTSIDE it — older frozen history the listener no longer
      // covers — plus any with a still-queued write. Within the window,
      // remote wins (adds/edits/deletes all propagate).
      set((s) => {
        const remote = docs as unknown as TimelineEvent[];
        const remoteIds = new Set(remote.map((d) => d.id));
        const windowCutoff = new Date(syncWindowCutoffMs()).toISOString();
        const keptLocal = s.events.filter(
          (e) => !remoteIds.has(e.id) && (eventTime(e) < windowCutoff || pending.has(e.id))
        );
        return {
          events: [...remote, ...keptLocal].sort((a, b) => eventTime(b).localeCompare(eventTime(a))),
        };
      });
    } else if (col === 'measurements') {
      set((s) => ({
        measurements: merge(s.measurements, docs as unknown as Measurement[]).sort((a, b) =>
          a.date.localeCompare(b.date)
        ),
      }));
    } else if (col === 'vaccines') {
      const remote = docs as unknown as Vaccine[];
      set((s) => ({ vaccines: merge(s.vaccines, remote) }));
      // Reminders are per-device, so arm this phone's copy for every synced
      // appointment — this is what makes both parents get nudged when one of
      // them books it. Idempotent (stable ids); clears any that became done.
      remote.forEach((v) => scheduleVaccineReminders(v).catch(() => {}));
    } else if (col === 'sickness') {
      set((s) => ({ sickness: merge(s.sickness, docs as unknown as SicknessEpisode[]) }));
    } else if (col === 'medications') {
      set((s) => ({ medications: merge(s.medications, docs as unknown as Medication[]) }));
    } else if (col === 'milestones') {
      set((s) => ({ milestonesAchieved: merge(s.milestonesAchieved, docs as unknown as Milestone[]) }));
    } else if (col === 'babies') {
      set((s) => {
        const remote = docs as unknown as Baby[];
        if (!remote.length) return {};
        const merged = merge(s.babies, remote);
        const activeStillExists = merged.some((b) => b.id === s.activeBabyId);
        const activeBabyId = activeStillExists ? s.activeBabyId : merged[0].id;
        return { babies: merged.map((b) => ({ ...b, active: b.id === activeBabyId })), activeBabyId };
      });
    } else if (col === 'caregivers') {
      set((s) => {
        const remote = docs as unknown as Caregiver[];
        if (!remote.length) return {};
        // Being removed from the family remotely detaches this device.
        if (s.myUid && !remote.some((c) => c.id === s.myUid) && !pending.has(s.myUid)) {
          stopFamilySync();
          return { familyId: null, myUid: null, caregivers: remote };
        }
        return { caregivers: remote };
      });
    }
  },

  setVoiceDraft: (d) => set({ voiceDraft: d }),

  applyVoiceDraft: () => {
    const draft = get().voiceDraft;
    if (!draft || !draft.recognized) return;
    const babyId = get().activeBabyId;
    const loggedBy = get().currentCaregiverId;
    if (draft.eventType === 'bottle' || draft.eventType === 'solids' || draft.eventType === 'pump') {
      const ev: FeedEvent = {
        id: uid('ev'),
        babyId,
        type: draft.eventType,
        time: draft.time,
        quantityMl: draft.quantityMl,
        loggedBy,
        inputMethod: 'voice',
      };
      set((s) => ({ events: [ev, ...s.events] }));
      syncWrite('events', ev);
      if (draft.eventType !== 'pump' && get().settings.feedReminderEnabled) {
        rescheduleFeedReminder(draft.time, get().settings.feedReminderHours ?? 3, get().activeBaby().name).catch(() => {});
      }
    } else if (draft.eventType === 'diaper') {
      const ev: DiaperEvent = {
        id: uid('ev'),
        babyId,
        type: 'diaper',
        time: draft.time,
        kind: (draft.raw.kind as DiaperEvent['kind']) ?? 'wet',
        loggedBy,
        inputMethod: 'voice',
      };
      set((s) => ({ events: [ev, ...s.events] }));
      syncWrite('events', ev);
    } else if (draft.eventType === 'sleep') {
      const ev: SleepEvent = {
        id: uid('ev'),
        babyId,
        type: 'sleep',
        startTime: (draft.raw.startTime as string) ?? draft.time,
        endTime: draft.raw.endTime as string | undefined,
        loggedBy,
        inputMethod: 'voice',
      };
      set((s) => ({ events: [ev, ...s.events] }));
      syncWrite('events', ev);
    }
    set({ voiceDraft: null });
  },
    }),
    {
      name: 'denbaby',
      storage: createJSONStorage(() => AsyncStorage),
      version: 4,
      // v0 → v1: installs persisted before the Trends screen existed only
      // have the 3-event demo seed; append the generated demo history so
      // trends have data, without touching anything the user logged.
      // v1 → v2: family-sync fields added; default to unlinked.
      // v2 → v3: this device gets its own caregiver identity instead of
      // logging as the demo "Mom". Solo installs had demo mum/dad/nanny in
      // caregivers[] and currentCaregiverId 'cg-mom', so entries showed an
      // attribution the user never chose. Family-linked installs are left
      // alone — their caregivers come from the cloud and their id is the
      // auth uid.
      migrate: (persisted: any, version) => {
        if (version < 1 && persisted?.events && !persisted.events.some((e: any) => String(e.id).startsWith('ev-h-'))) {
          persisted.events = [...persisted.events, ...demoHistoryEvents];
        }
        if (version < 2) {
          persisted.familyId = persisted.familyId ?? null;
          persisted.myUid = persisted.myUid ?? null;
        }
        if (version < 3 && !persisted?.familyId) {
          persisted.currentCaregiverId = ME_CAREGIVER_ID;
          const kept = (persisted.caregivers ?? []).filter(
            (c: any) => c && !DEMO_CAREGIVER_IDS.includes(c.id) && c.id !== ME_CAREGIVER_ID
          );
          persisted.caregivers = [meCaregiver(), ...kept];
          // re-attribute anything logged as a demo caregiver to this device,
          // so the timeline reads consistently instead of naming strangers
          persisted.events = (persisted.events ?? []).map((e: any) =>
            e && DEMO_CAREGIVER_IDS.includes(e.loggedBy) ? { ...e, loggedBy: ME_CAREGIVER_ID } : e
          );
        }
        if (version < 4) {
          // Installs that onboarded before build 18 still carry the sample
          // data — including the two "given" vaccines and the 18:00 Vitamin D
          // alarm. Remove it by exact id so anything genuinely logged stays.
          for (const col of ['events', 'measurements', 'vaccines', 'sickness', 'medications', 'milestonesAchieved'] as const) {
            persisted[col] = (persisted[col] ?? []).filter((r: any) => r && !SEEDED_RECORD_IDS.has(r.id));
          }
          SEEDED_MEDICATION_IDS.forEach((id) => cancelMedicationReminder(id).catch(() => {}));
          SEEDED_VACCINE_IDS.forEach((id) => cancelVaccineReminders(id).catch(() => {}));
        }
        return persisted;
      },
      // persist only durable data — transient UI state (sheets, toasts,
      // live transcript) always starts fresh
      partialize: (s) => ({
        onboarded: s.onboarded,
        familyId: s.familyId,
        myUid: s.myUid,
        babies: s.babies,
        activeBabyId: s.activeBabyId,
        currentCaregiverId: s.currentCaregiverId,
        caregivers: s.caregivers,
        events: s.events,
        measurements: s.measurements,
        vaccines: s.vaccines,
        sickness: s.sickness,
        medications: s.medications,
        milestonesAchieved: s.milestonesAchieved,
        milestonesUpcoming: s.milestonesUpcoming,
        settings: s.settings,
        runningSleepSession: s.runningSleepSession,
      }),
    }
  )
);

export { isFirebaseConfigured };
