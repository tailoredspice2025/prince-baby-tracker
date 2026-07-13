import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AppText } from '../../components/AppText';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Card } from '../../components/Card';
import { GrowthChart } from '../../components/GrowthChart';
import { PlusIcon } from '../../components/icons';
import { useStore } from '../../lib/store';
import { useTheme } from '../../theme/ThemeProvider';
import { computePercentile } from '../../lib/percentiles';
import { radii } from '../../theme/tokens';
import { clockTime } from '../../lib/time';

type MeasureKey = 'weight' | 'height' | 'head';

const CONFIG: Record<MeasureKey, { label: string; unit: string; valueOf: (m: any) => number | undefined; field: 'weightKg' | 'heightCm' | 'headCm' }> = {
  weight: { label: 'Weight', unit: 'kg', field: 'weightKg', valueOf: (m) => m.weightKg },
  height: { label: 'Height', unit: 'cm', field: 'heightCm', valueOf: (m) => m.heightCm },
  head: { label: 'Head', unit: 'cm', field: 'headCm', valueOf: (m) => m.headCm },
};

export function GrowthScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const baby = useStore((s) => s.activeBaby());
  const measurements = useStore((s) => s.measurements);
  const [tab, setTab] = useState<MeasureKey>('weight');

  const babyMeasurements = useMemo(
    () => measurements.filter((m) => m.babyId === baby.id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [measurements, baby.id]
  );
  const latest = babyMeasurements[babyMeasurements.length - 1];
  const previous = babyMeasurements[babyMeasurements.length - 2];

  const cfg = CONFIG[tab];
  const latestValue = latest ? cfg.valueOf(latest) : undefined;
  const pct = latest && latestValue !== undefined ? computePercentile(tab, baby.sex, latestValue, baby.dob, latest.date) : null;

  const heightLatest = latest?.heightCm;
  const headLatest = latest?.headCm;
  const heightPct = latest && heightLatest !== undefined ? computePercentile('height', baby.sex, heightLatest, baby.dob, latest.date) : null;
  const headPct = latest && headLatest !== undefined ? computePercentile('head', baby.sex, headLatest, baby.dob, latest.date) : null;

  const deltaLabel = useMemo(() => {
    if (!latest || !previous || latestValue === undefined) return '';
    const prevValue = cfg.valueOf(previous);
    if (prevValue === undefined) return '';
    const diff = latestValue - prevValue;
    if (tab === 'weight') {
      const grams = Math.round(diff * 1000);
      return `${grams >= 0 ? '+' : ''}${grams} g since last measurement · steady curve`;
    }
    return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)} ${cfg.unit} since last measurement`;
  }, [latest, previous, latestValue, tab]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
        <AppText weight={900} size={26} color={theme.ink} style={{ marginBottom: 16 }}>
          Growth
        </AppText>

        <View style={{ marginBottom: 18 }}>
          <SegmentedControl
            options={[
              { key: 'weight', label: 'Weight' },
              { key: 'height', label: 'Height' },
              { key: 'head', label: 'Head' },
            ]}
            value={tab}
            onChange={setTab}
          />
        </View>

        <Card radius={radii.cardXl} padding={20} style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <AppText weight={900} size={32} color={theme.ink}>
                {latestValue ?? '—'}
              </AppText>
              <AppText weight={700} size={15} color={theme.textSecondary}> {cfg.unit}</AppText>
            </View>
            {pct && (
              <View style={{ backgroundColor: '#DCE8CE', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 12 }}>
                <AppText weight={800} size={12} color="#43602A">
                  {pct.percentile}
                  {ordinalSuffix(pct.percentile)} percentile
                </AppText>
              </View>
            )}
          </View>
          <AppText weight={700} size={12.5} color={theme.textSecondary} style={{ marginBottom: 14 }}>
            {deltaLabel}
          </AppText>
          <GrowthChart measure={tab} sex={baby.sex} dob={baby.dob} measurements={babyMeasurements} valueOf={cfg.valueOf} unit={cfg.unit} />
        </Card>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
          <Card radius={radii.cardXxl} padding={16} style={{ flex: 1 }}>
            <AppText weight={800} size={11} color={theme.textTertiary} letterSpacing={1} uppercase>
              Height
            </AppText>
            <AppText weight={900} size={20} color={theme.ink}>
              {heightLatest ?? '—'} cm
            </AppText>
            {heightPct && (
              <AppText weight={700} size={11.5} color={theme.successGreen}>
                {heightPct.percentile}
                {ordinalSuffix(heightPct.percentile)} pct
              </AppText>
            )}
          </Card>
          <Card radius={radii.cardXxl} padding={16} style={{ flex: 1 }}>
            <AppText weight={800} size={11} color={theme.textTertiary} letterSpacing={1} uppercase>
              Head
            </AppText>
            <AppText weight={900} size={20} color={theme.ink}>
              {headLatest ?? '—'} cm
            </AppText>
            {headPct && (
              <AppText weight={700} size={11.5} color={theme.successGreen}>
                {headPct.percentile}
                {ordinalSuffix(headPct.percentile)} pct
              </AppText>
            )}
          </Card>
        </View>

        <Pressable
          onPress={() => navigation.navigate('AddMeasurement')}
          style={{ backgroundColor: '#FFDCC2', borderRadius: radii.cardXxl, padding: 14, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 12 }}
        >
          <PlusIcon size={20} color="#C96F4A" />
          <AppText weight={800} size={14} color="#6E4429" style={{ flex: 1 }}>
            Add measurement
          </AppText>
          <AppText weight={700} size={12} color="#B27B54">
            {latest ? `Last: ${new Date(latest.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}` : 'No data yet'}
          </AppText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function ordinalSuffix(n: number): string {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}
