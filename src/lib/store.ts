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
  demoCaregivers,
  demoEvents,
  demoHistoryEvents,
  demoMeasurements,
  demoMedications,
  demoMilestonesAchieved,
  demoMilestonesUpcoming,
  demoSettings,
  demoSickness,
  demoVaccines,
} from './demoData';
import { syncDeleteEvent, syncWriteEvent, syncWriteVaccine, isFirebaseConfigured } from './firestoreSync';
import { scheduleMedicationReminder, scheduleVaccineReminder } from './notifications';

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
  logQuickEvent: (type: 'bottle' | 'diaper' | 'solids' | 'pump' | 'medicine') => void;
  toggleSleep: () => void;
  editingEventId: string | null;
  setEditingEvent: (id: string | null) => void;
  updateEvent: (id: string, patch: Partial<TimelineEvent>) => void;
  deleteEvent: (id: string) => void;
  addMeasurement: (m: Omit<Measurement, 'id' | 'babyId'>) => void;
  addVaccine: (v: Omit<Vaccine, 'id' | 'babyId'>) => void;
  addSicknessEpisode: (s: Omit<SicknessEpisode, 'id' | 'babyId'>) => void;
  addMedication: (m: Omit<Medication, 'id' | 'babyId'>) => void;
  addMilestone: (m: Omit<Milestone, 'id' | 'babyId' | 'achieved'>) => void;
  setUnits: (u: Settings['units']) => void;
  setVoiceLoggingEnabled: (v: boolean) => void;
  toggleVoicePermission: (key: keyof VoicePermissions) => void;
  addCaregiver: (c: Omit<Caregiver, 'id' | 'familyId'>) => void;
  setVoiceDraft: (d: ParsedVoiceDraft | null) => void;
  applyVoiceDraft: () => void;
  dismissToast: (id: string) => void;
  pushToast: (t: Omit<Toast, 'id'>) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
  onboarded: false,
  babies: [demoBaby],
  activeBabyId: demoBaby.id,
  currentCaregiverId: 'cg-mom',
  caregivers: demoCaregivers,
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

  completeOnboarding: (baby) =>
    set((s) => ({
      onboarded: true,
      babies: s.babies.map((b) => (b.id === s.activeBabyId ? { ...b, ...baby } : b)),
    })),

  addBaby: (baby) => {
    const id = uid('baby');
    set((s) => ({
      babies: [...s.babies.map((b) => ({ ...b, active: false })), { ...baby, id, familyId: 'demo-family', active: true }],
      activeBabyId: id,
    }));
  },

  setActiveBaby: (id) =>
    set((s) => ({
      activeBabyId: id,
      babies: s.babies.map((b) => ({ ...b, active: b.id === id })),
    })),

  setBabyPhoto: (uri) =>
    set((s) => ({
      babies: s.babies.map((b) => (b.id === s.activeBabyId ? { ...b, photoUri: uri } : b)),
    })),

  editingEventId: null,
  setEditingEvent: (id) => set({ editingEventId: id }),

  updateEvent: (id, patch) =>
    set((s) => ({
      events: s.events.map((e) => {
        if (e.id !== id) return e;
        const updated = { ...e, ...patch } as TimelineEvent;
        syncWriteEvent(updated);
        return updated;
      }),
    })),

  deleteEvent: (id) => {
    const removed = get().events.find((e) => e.id === id);
    set((s) => ({ events: s.events.filter((e) => e.id !== id), editingEventId: null }));
    syncDeleteEvent(id);
    if (removed) {
      get().pushToast({
        message: 'Event deleted',
        onUndo: () => {
          set((s) => ({ events: [removed, ...s.events] }));
          syncWriteEvent(removed);
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

  logQuickEvent: (type) => {
    const babyId = get().activeBabyId;
    const loggedBy = get().currentCaregiverId;
    const now = new Date().toISOString();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (type === 'bottle') {
      const ev: FeedEvent = { id: uid('ev'), babyId, type: 'bottle', time: now, quantityMl: 120, notes: 'Formula', loggedBy, inputMethod: 'tap' };
      set((s) => ({ events: [ev, ...s.events] }));
      syncWriteEvent(ev);
      get().pushToast({ message: 'Bottle · 120 ml logged', onUndo: () => set((s) => ({ events: s.events.filter((e) => e.id !== ev.id) })) });
    } else if (type === 'diaper') {
      const ev: DiaperEvent = { id: uid('ev'), babyId, type: 'diaper', time: now, kind: 'wet', loggedBy, inputMethod: 'tap' };
      set((s) => ({ events: [ev, ...s.events] }));
      syncWriteEvent(ev);
      get().pushToast({ message: 'Diaper · wet logged', onUndo: () => set((s) => ({ events: s.events.filter((e) => e.id !== ev.id) })) });
    } else if (type === 'solids') {
      const ev: FeedEvent = { id: uid('ev'), babyId, type: 'solids', time: now, food: 'pear', loggedBy, inputMethod: 'tap' };
      set((s) => ({ events: [ev, ...s.events] }));
      syncWriteEvent(ev);
      get().pushToast({ message: 'Solids logged', onUndo: () => set((s) => ({ events: s.events.filter((e) => e.id !== ev.id) })) });
    } else if (type === 'pump') {
      const ev: FeedEvent = { id: uid('ev'), babyId, type: 'pump', time: now, quantityMl: 90, side: 'left', loggedBy, inputMethod: 'tap' };
      set((s) => ({ events: [ev, ...s.events] }));
      syncWriteEvent(ev);
      get().pushToast({ message: 'Pump · 90 ml logged', onUndo: () => set((s) => ({ events: s.events.filter((e) => e.id !== ev.id) })) });
    } else if (type === 'medicine') {
      const ev: MedicineEvent = { id: uid('ev'), babyId, type: 'medicine', time: now, name: 'Vitamin D drops', dose: '400 IU', loggedBy, inputMethod: 'tap' };
      set((s) => ({ events: [ev, ...s.events] }));
      syncWriteEvent(ev);
      get().pushToast({ message: 'Vitamin D drops logged', onUndo: () => set((s) => ({ events: s.events.filter((e) => e.id !== ev.id) })) });
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
      syncWriteEvent(ev);
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
  },

  addVaccine: (v) => {
    const babyId = get().activeBabyId;
    const vaccine: Vaccine = { id: uid('v'), babyId, ...v };
    set((s) => ({ vaccines: [...s.vaccines, vaccine] }));
    syncWriteVaccine(vaccine);
    scheduleVaccineReminder(vaccine).catch(() => {});
  },

  addSicknessEpisode: (sEp) => {
    const babyId = get().activeBabyId;
    const episode: SicknessEpisode = { id: uid('s'), babyId, ...sEp };
    set((s) => ({ sickness: [episode, ...s.sickness] }));
  },

  addMedication: (m) => {
    const babyId = get().activeBabyId;
    const med: Medication = { id: uid('med'), babyId, ...m };
    set((s) => ({ medications: [med, ...s.medications] }));
    scheduleMedicationReminder(med).catch(() => {});
  },

  addMilestone: (m) => {
    const babyId = get().activeBabyId;
    const milestone: Milestone = { id: uid('ms'), babyId, achieved: true, ...m };
    set((s) => ({ milestonesAchieved: [milestone, ...s.milestonesAchieved] }));
  },

  setUnits: (u) => set((s) => ({ settings: { ...s.settings, units: u } })),
  setVoiceLoggingEnabled: (v) => set((s) => ({ settings: { ...s.settings, voiceLoggingEnabled: v } })),
  toggleVoicePermission: (key) =>
    set((s) => ({
      settings: { ...s.settings, voicePermissions: { ...s.settings.voicePermissions, [key]: !s.settings.voicePermissions[key] } },
    })),

  addCaregiver: (c) =>
    set((s) => ({ caregivers: [...s.caregivers, { id: uid('cg'), familyId: 'demo-family', ...c }] })),

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
      syncWriteEvent(ev);
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
      syncWriteEvent(ev);
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
      syncWriteEvent(ev);
    }
    set({ voiceDraft: null });
  },
    }),
    {
      name: 'prince-baby-tracker',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      // v0 → v1: installs persisted before the Trends screen existed only
      // have the 3-event demo seed; append the generated demo history so
      // trends have data, without touching anything the user logged.
      migrate: (persisted: any, version) => {
        if (version < 1 && persisted?.events && !persisted.events.some((e: any) => String(e.id).startsWith('ev-h-'))) {
          persisted.events = [...persisted.events, ...demoHistoryEvents];
        }
        return persisted;
      },
      // persist only durable data — transient UI state (sheets, toasts,
      // live transcript) always starts fresh
      partialize: (s) => ({
        onboarded: s.onboarded,
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
