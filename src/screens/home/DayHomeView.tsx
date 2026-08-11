import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AppText } from '../../components/AppText';
import { BellIcon, ClockIcon } from '../../components/icons';
import { BottleIcon, SleepIcon, DiaperIcon, SolidsIcon, PumpIcon, MedicineIcon } from '../../components/icons';
import { QuickLogTile } from '../../components/QuickLogTile';
import { PickerType, QuickLogPicker } from '../../components/QuickLogPicker';
import { TimelineRow } from '../../components/TimelineRow';
import { VoiceBar } from '../../components/VoiceBar';
import { useStore } from '../../lib/store';
import { defaultMedicine } from '../../lib/medicinePick';
import { FEATURES } from '../../lib/features';
import { useTheme } from '../../theme/ThemeProvider';
import { useContentStyle } from '../../theme/layout';
import { ageString, clockTime, durationLabel, relativeTime } from '../../lib/time';
import { eventRowFor } from '../../lib/eventRow';
import { DiaperEvent, FeedEvent, MedicineEvent, SleepEvent, TimelineEvent } from '../../types/models';
import { PastelKey } from '../../theme/tokens';
import { BabyAvatar } from '../../components/BabyAvatar';

const EVENT_PASTEL: Record<TimelineEvent['type'], PastelKey> = {
  bottle: 'peach',
  sleep: 'lavender',
  diaper: 'sky',
  solids: 'sage',
  pump: 'rose',
  medicine: 'sand',
};
const EVENT_EMOJI: Record<TimelineEvent['type'], string> = {
  bottle: '🍼',
  sleep: '🌙',
  diaper: '💧',
  solids: '🥄',
  pump: '🤱',
  medicine: '💊',
};

/**
 * The full home screen. Kept as its own component so `HomeScreen` can switch
 * between this and the night view without any hook running conditionally —
 * an early `return` above a `useMemo` changes the hook count between renders
 * and crashes React ("rendered fewer hooks than expected"), which is exactly
 * what starting a sleep session after 8pm used to do.
 */
export function DayHomeView() {
  const theme = useTheme();
  const contentStyle = useContentStyle();
  const navigation = useNavigation<any>();
  const baby = useStore((s) => s.activeBaby());
  const events = useStore((s) => s.events);
  const caregivers = useStore((s) => s.caregivers);
  const meId = useStore((s) => s.currentCaregiverId);
  const medications = useStore((s) => s.medications);
  const runningSleepSession = useStore((s) => s.runningSleepSession);
  const logQuickEvent = useStore((s) => s.logQuickEvent);
  const toggleSleep = useStore((s) => s.toggleSleep);
  const setEditingEvent = useStore((s) => s.setEditingEvent);
  const voiceSetting = useStore((s) => s.settings.voiceLoggingEnabled);
  const setThemePreference = useStore((s) => s.setThemePreference);
  const [pickerType, setPickerType] = useState<PickerType | null>(null);

  // Gated on the build-time switch as well as the stored setting — the stored
  // one is already true on every existing install, so it alone would leave the
  // bar visible on exactly the devices we're hiding it from. features.ts.
  const voiceEnabled = FEATURES.voiceLogging && voiceSetting;

  // Ticks once a minute so the running sleep timer and the "3m ago" captions
  // stay honest without a re-render every second.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const babyEvents = useMemo(() => events.filter((e) => e.babyId === baby.id), [events, baby.id]);

  const lastByType = useMemo(() => {
    const map: Partial<Record<TimelineEvent['type'], TimelineEvent>> = {};
    for (const e of babyEvents) {
      const t = 'time' in e ? e.time : e.endTime ?? e.startTime;
      const existing = map[e.type];
      const existingTime = existing ? ('time' in existing ? existing.time : existing.endTime ?? existing.startTime) : null;
      if (!existing || new Date(t) > new Date(existingTime!)) map[e.type] = e;
    }
    return map;
  }, [babyEvents]);

  const bottle = lastByType.bottle as FeedEvent | undefined;
  const diaper = lastByType.diaper as DiaperEvent | undefined;
  const solids = lastByType.solids as FeedEvent | undefined;
  const pump = lastByType.pump as FeedEvent | undefined;
  const medicine = lastByType.medicine as MedicineEvent | undefined;
  const medicineDefault = useMemo(() => defaultMedicine(babyEvents, medications, baby.id), [babyEvents, medications, baby.id]);
  const lastSleep = lastByType.sleep as SleepEvent | undefined;

  const sleepElapsedMs = runningSleepSession
    ? now.getTime() - new Date(runningSleepSession.startTime).getTime()
    : 0;
  const sleepCaption = runningSleepSession
    ? `Sleeping ${durationLabel(sleepElapsedMs)} · tap to end`
    : lastSleep?.endTime
    ? `Awake ${durationLabel(now.getTime() - new Date(lastSleep.endTime).getTime())}`
    : 'Tap to start sleep';

  // Only due if it hasn't already been given today. This used to be
  // `ongoing && reminderTime` with no reference to `lastGiven`, so the banner
  // reappeared on every launch however many times you'd logged the dose.
  const dueMed = medications.find((m) => {
    if (!m.ongoing || !m.reminderTime) return false;
    if (!m.lastGiven) return true;
    const given = new Date(m.lastGiven);
    return !(given.getFullYear() === now.getFullYear() && given.getMonth() === now.getMonth() && given.getDate() === now.getDate());
  });

  // Scoped to today so the "Today" heading is truthful — this is where a
  // just-logged entry shows up, which wasn't obvious before.
  const todayEvents = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return [...babyEvents]
      .filter((e) => new Date('time' in e ? e.time : e.endTime ?? e.startTime) >= start)
      .sort((a, b) => {
        const ta = 'time' in a ? a.time : a.endTime ?? a.startTime;
        const tb = 'time' in b ? b.time : b.endTime ?? b.startTime;
        return new Date(tb).getTime() - new Date(ta).getTime();
      });
  }, [babyEvents]);
  const timeline = useMemo(() => todayEvents.slice(0, 8), [todayEvents]);

  // A running session isn't an event yet, so it would otherwise be invisible
  // until you stop it — you'd tap Sleep and nothing would appear in Today.
  const runningCount = runningSleepSession ? 1 : 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={[{ padding: 20, paddingBottom: 140 }, contentStyle]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <BabyAvatar baby={baby} size={46} fontSize={20} />
            <View style={{ flex: 1 }}>
              <AppText weight={900} size={21} color={theme.ink}>
                Good morning
              </AppText>
              <AppText weight={700} size={13} color={theme.textSecondary}>
                {baby.name} · {ageString(baby.dob, now)}
              </AppText>
            </View>
            {/* One tap, light or dark. It does what the moon looks like it
                does — it does NOT strip the screen down. */}
            <Pressable
              onPress={() => setThemePreference(theme.mode === 'night' ? 'light' : 'dark')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={theme.mode === 'night' ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center', marginRight: 8, ...theme.cardShadow }}
            >
              <SleepIcon size={17} color={theme.textSecondary} />
            </Pressable>
            {/* Had no onPress at all — a styled circle that did nothing.
                Health is where reminders actually live: vaccines due and
                medicines with daily reminders. */}
            <Pressable
              onPress={() => navigation.navigate('Health')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Reminders"
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center', ...theme.cardShadow }}
            >
              <BellIcon />
            </Pressable>
          </View>

          {/* Logs the medicine this banner NAMES, not whatever was taken last.
              It used to call logQuickEvent('medicine') bare, which reuses the
              most recent medicine event's name — so once you'd logged anything
              else, tapping "Vitamin D drops · due" logged that other medicine
              instead, `lastGiven` never matched, and the banner never cleared. */}
          {dueMed && (
            <Pressable
              onPress={() => logQuickEvent('medicine', { name: dueMed.name, dose: dueMed.dose })}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F3E3BC', borderRadius: 16, paddingVertical: 11, paddingHorizontal: 14, marginBottom: 14 }}
            >
              <ClockIcon />
              <AppText weight={700} size={13.5} color="#7A5E20" style={{ flex: 1 }}>
                {dueMed.name} · today {dueMed.reminderTime && new Date(`1970-01-01T${dueMed.reminderTime}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </AppText>
              <AppText weight={800} size={12} color="#A57F2C">
                Done ✓
              </AppText>
            </Pressable>
          )}

          {voiceEnabled && (
            <View style={{ marginBottom: 20 }}>
              <VoiceBar label={`Hold to speak — "${baby.name} drank 120 ml at 9"`} />
            </View>
          )}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
            <View style={{ width: '47%' }}>
              <QuickLogTile
                pastelKey={EVENT_PASTEL.bottle}
                icon={<BottleIcon color="#C96F4A" />}
                title="Bottle"
                caption={
                  bottle
                    ? `${relativeTime(bottle.time, now)} · ${bottle.quantityMl}ml · hold to change`
                    : 'Tap to log · hold to choose'
                }
                onPress={() => logQuickEvent('bottle')}
                onLongPress={() => setPickerType('bottle')}
              />
            </View>
            <View style={{ width: '47%' }}>
              <QuickLogTile
                pastelKey={EVENT_PASTEL.sleep}
                icon={<SleepIcon />}
                title="Sleep"
                caption={sleepCaption}
                onPress={toggleSleep}
              />
            </View>
            <View style={{ width: '47%' }}>
              <QuickLogTile
                pastelKey={EVENT_PASTEL.diaper}
                icon={<DiaperIcon />}
                title="Diaper"
                caption={diaper ? `${relativeTime(diaper.time, now)} · ${diaper.kind} · hold to change` : 'Tap to log · hold to choose'}
                onPress={() => logQuickEvent('diaper')}
                onLongPress={() => setPickerType('diaper')}
              />
            </View>
            <View style={{ width: '47%' }}>
              <QuickLogTile
                pastelKey={EVENT_PASTEL.solids}
                icon={<SolidsIcon />}
                title="Solids"
                caption={solids ? `${relativeTime(solids.time, now)}${solids.food ? ` · ${solids.food}` : ''} · hold to change` : 'Tap to log · hold to choose'}
                onPress={() => logQuickEvent('solids')}
                onLongPress={() => setPickerType('solids')}
              />
            </View>
            <View style={{ width: '47%' }}>
              <QuickLogTile
                pastelKey={EVENT_PASTEL.pump}
                icon={<PumpIcon />}
                title="Pump"
                caption={pump ? `${relativeTime(pump.time, now)} · ${pump.quantityMl}ml · hold to change` : 'Tap to log · hold to choose'}
                onPress={() => logQuickEvent('pump')}
                onLongPress={() => setPickerType('pump')}
              />
            </View>
            <View style={{ width: '47%' }}>
              <QuickLogTile
                pastelKey={EVENT_PASTEL.medicine}
                icon={<MedicineIcon />}
                title="Medicine"
                caption={
                  medicine
                    ? `${medicine.name} · ${relativeTime(medicine.time, now)} · hold to change`
                    : medicineDefault
                    ? `${medicineDefault.name} · tap to log · hold to choose`
                    : 'Add a medicine to start logging'
                }
                // With nothing to repeat, the tile opens the form instead of
                // inventing "Vitamin D drops" — which is what it used to log
                // for a parent who had only ever added Paracetamol.
                onPress={() => (medicineDefault ? logQuickEvent('medicine') : navigation.navigate('MedicineForm'))}
                onLongPress={() => setPickerType('medicine')}
              />
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <AppText weight={900} size={17} color={theme.ink}>
              Today{todayEvents.length + runningCount ? ` · ${todayEvents.length + runningCount}` : ''}
            </AppText>
            <Pressable onPress={() => navigation.navigate('Trends')} hitSlop={10}>
              <AppText weight={800} size={12.5} color={theme.coralDeep}>
                See all ›
              </AppText>
            </Pressable>
          </View>
          <View>
            {/* In progress, so it can't be an event row yet — but it must be
                visible the moment you tap Sleep. */}
            {runningSleepSession && (
              <Pressable
                onPress={toggleSleep}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.surface, borderRadius: 18, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: theme.coral, ...theme.cardShadow }}
              >
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#DCD3F0', alignItems: 'center', justifyContent: 'center' }}>
                  <AppText size={15}>🌙</AppText>
                </View>
                <View style={{ flex: 1 }}>
                  <AppText weight={800} size={14.5} color={theme.ink}>
                    Sleeping · {durationLabel(sleepElapsedMs)}
                  </AppText>
                  <AppText weight={600} size={12.5} color={theme.textSecondary}>
                    Started {clockTime(runningSleepSession.startTime)} · tap to end
                  </AppText>
                </View>
              </Pressable>
            )}
            {timeline.length === 0 && !runningSleepSession && (
              <View style={{ backgroundColor: theme.surface, borderRadius: 18, padding: 18, ...theme.cardShadow }}>
                <AppText weight={700} size={13.5} color={theme.textSecondary}>
                  Nothing logged yet today — tap a tile above and it'll appear here.
                </AppText>
              </View>
            )}
            {timeline.map((e, i) => {
              const r = eventRowFor(e, caregivers, meId);
              return (
                <TimelineRow
                  key={e.id}
                  pastelKey={EVENT_PASTEL[e.type]}
                  emoji={EVENT_EMOJI[e.type]}
                  title={r.title}
                  time={r.time}
                  subLine={r.subLine}
                  isLast={i === timeline.length - 1}
                  onPress={() => setEditingEvent(e.id)}
                />
              );
            })}
            {timeline.length > 0 && (
              <AppText weight={600} size={11.5} color={theme.textTertiary} style={{ marginTop: 8 }}>
                Tap any entry to edit or delete it
              </AppText>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
      <QuickLogPicker type={pickerType} onClose={() => setPickerType(null)} />
    </View>
  );
}
