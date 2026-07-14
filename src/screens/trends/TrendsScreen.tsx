import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AppText } from '../../components/AppText';
import { Card } from '../../components/Card';
import { SegmentedControl } from '../../components/SegmentedControl';
import { TrendBarChart } from '../../components/TrendBarChart';
import { ChevronLeftIcon } from '../../components/icons';
import { useStore } from '../../lib/store';
import { useTheme } from '../../theme/ThemeProvider';
import { radii } from '../../theme/tokens';
import {
  DayStats,
  computeDailyStats,
  emptyDayStats,
  formatHours,
  formatMl,
  lastNDayKeys,
  lastNMonthKeys,
  localDayKey,
  monthKeyOf,
  sumStats,
} from '../../lib/stats';

type Range = 'day' | 'week' | 'month' | 'year';

interface MetricDef {
  key: string;
  label: string;
  color: string; // accent bar / current period
  faded: string; // earlier bars
  tileBg: string;
  tileTitle: string;
  tileCaption: string;
  chartValue: (d: DayStats) => number;
  formatTotal: (t: ReturnType<typeof sumStats>) => string;
  formatAvg: (t: ReturnType<typeof sumStats>, days: number) => string;
  caption: (t: ReturnType<typeof sumStats>) => string;
}

const METRICS: MetricDef[] = [
  {
    key: 'milk',
    label: 'Milk',
    color: '#E98862',
    faded: '#F5C1A4',
    tileBg: '#FFDCC2',
    tileTitle: '#6E4429',
    tileCaption: '#B27B54',
    chartValue: (d) => d.milkMl,
    formatTotal: (t) => formatMl(t.milkMl),
    formatAvg: (t, days) => `${formatMl(t.milkMl / days)} / day`,
    caption: (t) => `${t.bottleCount} bottle${t.bottleCount === 1 ? '' : 's'}`,
  },
  {
    key: 'sleep',
    label: 'Sleep',
    color: '#8A7BB8',
    faded: '#CFC4E8',
    tileBg: '#DCD3F0',
    tileTitle: '#4A3D6E',
    tileCaption: '#8A7BB8',
    chartValue: (d) => d.sleepMinutes / 60,
    formatTotal: (t) => formatHours(t.sleepMinutes),
    formatAvg: (t, days) => `${formatHours(t.sleepMinutes / days)} / day`,
    caption: (t) => `${t.sleepSessions} session${t.sleepSessions === 1 ? '' : 's'}`,
  },
  {
    key: 'diapers',
    label: 'Diapers',
    color: '#5E92AC',
    faded: '#B7D6E4',
    tileBg: '#CFE7F2',
    tileTitle: '#2E5A70',
    tileCaption: '#5E92AC',
    chartValue: (d) => d.diaperCount,
    formatTotal: (t) => `${t.diaperCount}`,
    formatAvg: (t, days) => `${(t.diaperCount / days).toFixed(1)} / day`,
    caption: (t) => `${t.diaperWet} wet · ${t.diaperDirty} dirty`,
  },
  {
    key: 'solids',
    label: 'Solids',
    color: '#7A9A58',
    faded: '#C9DCB2',
    tileBg: '#DCE8CE',
    tileTitle: '#43602A',
    tileCaption: '#7A9A58',
    chartValue: (d) => d.solidsCount,
    formatTotal: (t) => `${t.solidsCount}`,
    formatAvg: (t, days) => `${(t.solidsCount / days).toFixed(1)} / day`,
    caption: (t) => `meal${t.solidsCount === 1 ? '' : 's'} of solids`,
  },
  {
    key: 'pump',
    label: 'Pumped',
    color: '#C0798D',
    faded: '#E8C3CE',
    tileBg: '#F7D6DC',
    tileTitle: '#7E4152',
    tileCaption: '#C0798D',
    chartValue: (d) => d.pumpMl,
    formatTotal: (t) => formatMl(t.pumpMl),
    formatAvg: (t, days) => `${formatMl(t.pumpMl / days)} / day`,
    caption: () => 'expressed milk',
  },
];

const RANGE_OPTIONS: { key: Range; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
];

export function TrendsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const baby = useStore((s) => s.activeBaby());
  const events = useStore((s) => s.events);
  const runningSleep = useStore((s) => s.runningSleepSession);
  const [range, setRange] = useState<Range>('week');

  const daily = useMemo(
    () => computeDailyStats(events, baby.id, runningSleep),
    [events, baby.id, runningSleep]
  );
  const dayFor = (k: string) => daily.get(k) ?? emptyDayStats(k);
  const dobKey = useMemo(() => localDayKey(new Date(baby.dob)), [baby.dob]);

  const view = useMemo(() => {
    const now = new Date();
    // Days the baby has actually been alive within the window — averages
    // divide by these, not the full window, so a 2-week-old isn't shown
    // averaging over 30 days.
    const aliveDays = (keys: string[]) => Math.max(1, keys.filter((k) => k >= dobKey).length);

    if (range === 'week') {
      const keys = lastNDayKeys(7, now);
      const stats = keys.map(dayFor);
      const labels = keys.map((k) => 'SMTWTFS'[new Date(`${k}T12:00:00`).getDay()]);
      return { periodLabel: 'Last 7 days', stats, labels, days: aliveDays(keys) };
    }
    if (range === 'month') {
      const keys = lastNDayKeys(30, now);
      const stats = keys.map(dayFor);
      const labels = keys.map((k, i) =>
        (keys.length - 1 - i) % 7 === 0 ? `${parseInt(k.slice(8), 10)}` : null
      );
      return { periodLabel: 'Last 30 days', stats, labels, days: aliveDays(keys) };
    }
    // year: bucket the last 365 days by month, chart the per-day average
    const dayKeys = lastNDayKeys(365, now);
    const monthKeys = lastNMonthKeys(12, now);
    const byMonth = new Map<string, DayStats[]>();
    for (const k of dayKeys) {
      const mk = monthKeyOf(k);
      if (!byMonth.has(mk)) byMonth.set(mk, []);
      if (k >= dobKey) byMonth.get(mk)!.push(dayFor(k));
    }
    const monthStats = monthKeys.map((mk) => ({
      totals: sumStats(byMonth.get(mk) ?? []),
      activeDays: (byMonth.get(mk) ?? []).length,
    }));
    const labels = monthKeys.map((mk) =>
      new Date(`${mk}-15T12:00:00`).toLocaleDateString([], { month: 'narrow' })
    );
    return {
      periodLabel: 'Last 12 months',
      stats: dayKeys.map(dayFor),
      labels,
      days: aliveDays(dayKeys),
      monthStats,
    };
  }, [daily, range, dobKey]);

  const totals = useMemo(() => sumStats(view.stats), [view]);

  const todayKey = localDayKey(new Date());
  const yesterdayKey = lastNDayKeys(2)[0];
  const today = dayFor(todayKey);
  const yesterday = dayFor(yesterdayKey);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
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
            Trends
          </AppText>
        </View>

        <View style={{ marginBottom: 10 }}>
          <SegmentedControl options={RANGE_OPTIONS} value={range} onChange={setRange} />
        </View>
        <AppText weight={700} size={12.5} color={theme.textSecondary} style={{ marginBottom: 16 }}>
          {range === 'day'
            ? new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
            : `${view.periodLabel} · ${baby.name}`}
        </AppText>

        {range === 'day' ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <DayTile m={METRICS[0]} value={formatMl(today.milkMl)} delta={deltaLabel(today.milkMl - yesterday.milkMl, 'ml')} sub={`${today.bottleCount} bottle${today.bottleCount === 1 ? '' : 's'}`} />
            <DayTile m={METRICS[1]} value={formatHours(today.sleepMinutes)} delta={deltaLabel((today.sleepMinutes - yesterday.sleepMinutes) / 60, 'h')} sub={`${today.sleepSessions} session${today.sleepSessions === 1 ? '' : 's'}`} />
            <DayTile m={METRICS[2]} value={`${today.diaperCount}`} delta={deltaLabel(today.diaperCount - yesterday.diaperCount)} sub={`${today.diaperWet} wet · ${today.diaperDirty} dirty`} />
            <DayTile m={METRICS[3]} value={`${today.solidsCount}`} delta={deltaLabel(today.solidsCount - yesterday.solidsCount)} sub="meals of solids" />
            <DayTile m={METRICS[4]} value={formatMl(today.pumpMl)} delta={deltaLabel(today.pumpMl - yesterday.pumpMl, 'ml')} sub="expressed milk" />
            <DayTile
              m={{ ...METRICS[0], label: 'Medicine', tileBg: '#F3E3BC', tileTitle: '#7A5E20', tileCaption: '#A98A3F' }}
              value={`${today.medicineCount}`}
              delta={deltaLabel(today.medicineCount - yesterday.medicineCount)}
              sub={`medicine dose${today.medicineCount === 1 ? '' : 's'}`}
            />
          </View>
        ) : (
          METRICS.map((m) => {
            let values: number[];
            if (range === 'year' && view.monthStats) {
              values = view.monthStats.map(({ totals: t, activeDays }) =>
                activeDays === 0 ? 0 : m.chartValue({ ...emptyDayStats(''), milkMl: t.milkMl / activeDays, pumpMl: t.pumpMl / activeDays, sleepMinutes: t.sleepMinutes / activeDays, diaperCount: t.diaperCount / activeDays, solidsCount: t.solidsCount / activeDays, bottleCount: t.bottleCount / activeDays, diaperWet: 0, diaperDirty: 0, sleepSessions: 0, medicineCount: 0 } as DayStats)
              );
            } else {
              values = view.stats.map(m.chartValue);
            }
            return (
              <Card key={m.key} radius={radii.cardXl} padding={18} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                  <AppText weight={800} size={11} color={theme.textTertiary} letterSpacing={1} uppercase>
                    {m.label}
                  </AppText>
                  <AppText weight={700} size={11.5} color={m.color}>
                    {m.formatAvg(totals, view.days)}
                  </AppText>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
                  <AppText weight={900} size={24} color={theme.ink}>
                    {m.formatTotal(totals)}
                  </AppText>
                  <AppText weight={700} size={12} color={theme.textSecondary}>
                    {m.caption(totals)}
                  </AppText>
                </View>
                <TrendBarChart
                  values={values}
                  labels={view.labels}
                  color={m.color}
                  fadedColor={m.faded}
                />
                {range === 'year' && (
                  <AppText weight={700} size={10.5} color={theme.textTertiary} style={{ marginTop: 4 }}>
                    Bars show the daily average for each month
                  </AppText>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function deltaLabel(diff: number, unit?: string): string {
  const rounded = Math.round(diff * 10) / 10;
  if (rounded === 0) return 'same as yesterday';
  const val = Number.isInteger(rounded) ? `${Math.abs(rounded)}` : `${Math.abs(rounded).toFixed(1)}`;
  return `${rounded > 0 ? '+' : '−'}${val}${unit ? ` ${unit}` : ''} vs yesterday`;
}

function DayTile({ m, value, delta, sub }: { m: MetricDef; value: string; delta: string; sub: string }) {
  return (
    <View
      style={{
        width: '48.2%',
        backgroundColor: m.tileBg,
        borderRadius: radii.cardXl,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <AppText weight={800} size={11} color={m.tileCaption} letterSpacing={1} uppercase>
        {m.label}
      </AppText>
      <AppText weight={900} size={22} color={m.tileTitle} style={{ marginTop: 2 }}>
        {value}
      </AppText>
      <AppText weight={700} size={11} color={m.tileCaption} style={{ marginTop: 1 }}>
        {sub}
      </AppText>
      <AppText weight={700} size={10.5} color={m.tileTitle} style={{ marginTop: 6, opacity: 0.75 }}>
        {delta}
      </AppText>
    </View>
  );
}
