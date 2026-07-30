import React, { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { AppText } from '../../components/AppText';
import { TimelineRow } from '../../components/TimelineRow';
import { ChevronLeftIcon } from '../../components/icons';
import { useStore } from '../../lib/store';
import { useTheme } from '../../theme/ThemeProvider';
import { PastelKey, pastels, radii } from '../../theme/tokens';
import { eventRowFor, eventTime } from '../../lib/eventRow';
import { computeDailyStats, emptyDayStats, formatHours, formatMl, localDayKey } from '../../lib/stats';
import { TimelineEvent } from '../../types/models';

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

/** Full editable log for one calendar day, opened from Trends. */
export function DayTimelineScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ DayLog: { day: string } }, 'DayLog'>>();
  const day = route.params?.day ?? localDayKey(new Date());

  const baby = useStore((s) => s.activeBaby());
  const events = useStore((s) => s.events);
  const caregivers = useStore((s) => s.caregivers);
  const meId = useStore((s) => s.currentCaregiverId);
  const setEditingEvent = useStore((s) => s.setEditingEvent);

  const dayDate = new Date(`${day}T12:00:00`);
  const todayKey = localDayKey(new Date());
  const dayLabel =
    day === todayKey
      ? 'Today'
      : dayDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  const dayEvents = useMemo(() => {
    const dayStart = new Date(`${day}T00:00:00`);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    return events
      .filter((e) => {
        if (e.babyId !== baby.id) return false;
        if (e.type === 'sleep') {
          // include sleeps overlapping the day (nights span midnight)
          const start = new Date(e.startTime);
          const end = e.endTime ? new Date(e.endTime) : new Date();
          return start < dayEnd && end > dayStart;
        }
        return localDayKey(new Date(e.time)) === day;
      })
      .sort((a, b) => new Date(eventTime(b)).getTime() - new Date(eventTime(a)).getTime());
  }, [events, baby.id, day]);

  const stats = useMemo(
    () => computeDailyStats(events, baby.id).get(day) ?? emptyDayStats(day),
    [events, baby.id, day]
  );

  const chips: { label: string; pastel: PastelKey }[] = [
    { label: `${formatMl(stats.milkMl)} · ${stats.bottleCount} bottles`, pastel: 'peach' },
    { label: `${formatHours(stats.sleepMinutes)} sleep`, pastel: 'lavender' },
    { label: `${stats.diaperCount} diapers`, pastel: 'sky' },
    ...(stats.solidsCount > 0 ? [{ label: `${stats.solidsCount} solids`, pastel: 'sage' as PastelKey }] : []),
    ...(stats.pumpMl > 0 ? [{ label: `${formatMl(stats.pumpMl)} pumped`, pastel: 'rose' as PastelKey }] : []),
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: theme.surface,
              alignItems: 'center',
              justifyContent: 'center',
              ...theme.cardShadow,
            }}
          >
            <ChevronLeftIcon />
          </Pressable>
          <AppText weight={900} size={26} color={theme.ink}>
            {dayLabel}
          </AppText>
        </View>
        <AppText weight={700} size={12.5} color={theme.textSecondary} style={{ marginBottom: 14 }}>
          {dayDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} · {baby.name}
        </AppText>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {chips.map((c, i) => (
            <View
              key={i}
              style={{ backgroundColor: pastels[c.pastel].bg, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 }}
            >
              <AppText weight={800} size={11.5} color={pastels[c.pastel].title}>
                {c.label}
              </AppText>
            </View>
          ))}
        </View>

        {dayEvents.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <AppText size={34}>🍼</AppText>
            <AppText weight={800} size={15} color={theme.ink} style={{ marginTop: 8 }}>
              Nothing logged this day
            </AppText>
            <AppText weight={700} size={12.5} color={theme.textSecondary} style={{ marginTop: 2 }}>
              Events you log appear here
            </AppText>
          </View>
        ) : (
          <View>
            {dayEvents.map((e, i) => {
              const r = eventRowFor(e, caregivers, meId);
              return (
                <TimelineRow
                  key={e.id}
                  pastelKey={EVENT_PASTEL[e.type]}
                  emoji={EVENT_EMOJI[e.type]}
                  title={r.title}
                  time={r.time}
                  subLine={r.subLine}
                  isLast={i === dayEvents.length - 1}
                  onPress={() => setEditingEvent(e.id)}
                />
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
