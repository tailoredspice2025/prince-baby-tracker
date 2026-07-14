import React, { useMemo, useState } from 'react';
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
import { useTheme } from '../../theme/ThemeProvider';
import { ageString, clockTime, durationLabel, relativeTime } from '../../lib/time';
import { eventRowFor } from '../../lib/eventRow';
import { DiaperEvent, FeedEvent, MedicineEvent, SleepEvent, TimelineEvent } from '../../types/models';
import { PastelKey } from '../../theme/tokens';
import { NightHomeView } from './NightHomeView';
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

export function HomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const baby = useStore((s) => s.activeBaby());
  const events = useStore((s) => s.events);
  const caregivers = useStore((s) => s.caregivers);
  const medications = useStore((s) => s.medications);
  const runningSleepSession = useStore((s) => s.runningSleepSession);
  const logQuickEvent = useStore((s) => s.logQuickEvent);
  const toggleSleep = useStore((s) => s.toggleSleep);
  const setEditingEvent = useStore((s) => s.setEditingEvent);
  const voiceEnabled = useStore((s) => s.settings.voiceLoggingEnabled);
  const [pickerType, setPickerType] = useState<PickerType | null>(null);

  if (theme.mode === 'night') return <NightHomeView />;

  const now = new Date();
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
  const lastSleep = lastByType.sleep as SleepEvent | undefined;

  const sleepCaption = runningSleepSession
    ? `Sleeping ${durationLabel(now.getTime() - new Date(runningSleepSession.startTime).getTime())}`
    : lastSleep?.endTime
    ? `Awake ${durationLabel(now.getTime() - new Date(lastSleep.endTime).getTime())}`
    : 'No sleep logged';

  const dueMed = medications.find((m) => m.ongoing && m.reminderTime);

  const timeline = useMemo(
    () =>
      [...babyEvents]
        .sort((a, b) => {
          const ta = 'time' in a ? a.time : a.endTime ?? a.startTime;
          const tb = 'time' in b ? b.time : b.endTime ?? b.startTime;
          return new Date(tb).getTime() - new Date(ta).getTime();
        })
        .slice(0, 5),
    [babyEvents]
  );

  const rowFor = (e: TimelineEvent) => eventRowFor(e, caregivers);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
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
            <Pressable style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center', ...theme.cardShadow }}>
              <BellIcon />
            </Pressable>
          </View>

          {dueMed && (
            <Pressable
              onPress={() => logQuickEvent('medicine')}
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
                caption={bottle ? `${relativeTime(bottle.time, now)} · ${bottle.quantityMl}ml` : 'Tap to log'}
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
                caption={diaper ? `${relativeTime(diaper.time, now)} · ${diaper.kind}` : 'Tap to log'}
                onPress={() => logQuickEvent('diaper')}
                onLongPress={() => setPickerType('diaper')}
              />
            </View>
            <View style={{ width: '47%' }}>
              <QuickLogTile
                pastelKey={EVENT_PASTEL.solids}
                icon={<SolidsIcon />}
                title="Solids"
                caption={solids ? `${relativeTime(solids.time, now)}${solids.food ? ` · ${solids.food}` : ''}` : 'Tap to log'}
                onPress={() => logQuickEvent('solids')}
                onLongPress={() => setPickerType('solids')}
              />
            </View>
            <View style={{ width: '47%' }}>
              <QuickLogTile
                pastelKey={EVENT_PASTEL.pump}
                icon={<PumpIcon />}
                title="Pump"
                caption={pump ? `${relativeTime(pump.time, now)} · ${pump.quantityMl}ml` : 'Tap to log'}
                onPress={() => logQuickEvent('pump')}
                onLongPress={() => setPickerType('pump')}
              />
            </View>
            <View style={{ width: '47%' }}>
              <QuickLogTile
                pastelKey={EVENT_PASTEL.medicine}
                icon={<MedicineIcon />}
                title="Medicine"
                caption={medicine ? `${medicine.name} · ${relativeTime(medicine.time, now)}` : 'Vit D · daily'}
                onPress={() => logQuickEvent('medicine')}
              />
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <AppText weight={900} size={17} color={theme.ink}>
              Today
            </AppText>
            <Pressable onPress={() => navigation.navigate('Trends')} hitSlop={10}>
              <AppText weight={800} size={12.5} color={theme.coralDeep}>
                See all ›
              </AppText>
            </Pressable>
          </View>
          <View>
            {timeline.map((e, i) => {
              const r = rowFor(e);
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
          </View>
        </ScrollView>
      </SafeAreaView>
      <QuickLogPicker type={pickerType} onClose={() => setPickerType(null)} />
    </View>
  );
}
