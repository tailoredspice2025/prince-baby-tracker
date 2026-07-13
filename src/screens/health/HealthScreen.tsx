import React, { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AppText } from '../../components/AppText';
import { AlertTriangleIcon, CheckIcon, DueClockIcon } from '../../components/icons';
import { useStore } from '../../lib/store';
import { useTheme } from '../../theme/ThemeProvider';
import { radii } from '../../theme/tokens';

function SectionCard({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ backgroundColor: theme.surface, borderRadius: radii.cardLg, overflow: 'hidden', marginBottom: 18, ...theme.cardShadow }}>
      {children}
    </View>
  );
}

function Row({ children, last }: { children: React.ReactNode; last?: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 13,
        paddingHorizontal: 16,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: theme.border,
      }}
    >
      {children}
    </View>
  );
}

export function HealthScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const baby = useStore((s) => s.activeBaby());
  const vaccines = useStore((s) => s.vaccines).filter((v) => v.babyId === baby.id);
  const sickness = useStore((s) => s.sickness).filter((s2) => s2.babyId === baby.id);
  const medications = useStore((s) => s.medications).filter((m) => m.babyId === baby.id);

  const nextDue = useMemo(
    () => vaccines.filter((v) => v.status === 'due').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0],
    [vaccines]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
        <AppText weight={900} size={26} color={theme.ink} style={{ marginBottom: 16 }}>
          Health
        </AppText>

        {nextDue && (
          <Pressable
            onPress={() => navigation.navigate('VaccineForm')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F7D6DC', borderRadius: 16, padding: 14, marginBottom: 18 }}
          >
            <AlertTriangleIcon />
            <AppText weight={700} size={13.5} color="#7E4152" style={{ flex: 1 }}>
              {nextDue.name} {nextDue.doseLabel} due {new Date(nextDue.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              {nextDue.clinic ? ` · book with ${nextDue.clinic}` : ' · book with your pediatrician'}
            </AppText>
          </Pressable>
        )}

        <AppText weight={900} size={15} color={theme.ink} style={{ marginBottom: 10 }}>
          Vaccines
        </AppText>
        <SectionCard>
          {vaccines.map((v, i) => {
            const done = v.status === 'done';
            const meta = done
              ? [new Date(v.date).toLocaleDateString([], { month: 'short', day: 'numeric' }), v.site, v.reaction, v.notes].filter(Boolean).join(' · ')
              : `Due ${new Date(v.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}${v.notes ? ` · ${v.notes}` : ''}`;
            return (
              <Row key={v.id} last={i === vaccines.length - 1}>
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: done ? '#DCE8CE' : '#F3E3BC',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {done ? <CheckIcon thin color="#43602A" /> : <DueClockIcon />}
                </View>
                <View style={{ flex: 1 }}>
                  <AppText weight={800} size={14.5} color={theme.ink}>
                    {v.name} · {v.doseLabel}
                  </AppText>
                  <AppText weight={600} size={12} color={theme.textSecondary}>
                    {meta}
                  </AppText>
                </View>
                <AppText weight={800} size={11} color={done ? theme.successGreen : '#A57F2C'}>
                  {done ? 'DONE' : 'DUE'}
                </AppText>
              </Row>
            );
          })}
        </SectionCard>

        <AppText weight={900} size={15} color={theme.ink} style={{ marginBottom: 10 }}>
          Sickness &amp; symptoms
        </AppText>
        <SectionCard>
          {sickness.map((s, i) => (
            <Row key={s.id} last={i === sickness.length - 1}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <AppText weight={800} size={14.5} color={theme.ink}>
                    {s.emoji} {s.title}
                  </AppText>
                  <AppText weight={700} size={12} color={theme.textTertiary}>
                    {new Date(s.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    {s.endDate ? ` – ${new Date(s.endDate).toLocaleDateString([], { day: 'numeric' })}` : ''}
                  </AppText>
                </View>
                {!!s.notes && (
                  <AppText weight={600} size={12} color={theme.textSecondary}>
                    {s.notes}
                  </AppText>
                )}
              </View>
            </Row>
          ))}
          {sickness.length === 0 && (
            <Row last>
              <AppText weight={600} size={13} color={theme.textSecondary}>
                No episodes logged
              </AppText>
            </Row>
          )}
        </SectionCard>

        <AppText weight={900} size={15} color={theme.ink} style={{ marginBottom: 10 }}>
          Medicine
        </AppText>
        <SectionCard>
          {medications.map((m, i) => (
            <Row key={m.id} last={i === medications.length - 1}>
              <View style={{ flex: 1 }}>
                <AppText weight={800} size={14.5} color={theme.ink}>
                  {m.name}
                </AppText>
                <AppText weight={600} size={12} color={theme.textSecondary}>
                  {m.dose} · {m.schedule}
                  {m.ongoing ? ' · ongoing' : m.lastGiven ? ` · last ${new Date(m.lastGiven).toLocaleDateString([], { month: 'short', day: 'numeric' })}` : ''}
                </AppText>
              </View>
              {m.reminderTime ? (
                <View style={{ backgroundColor: '#F3E3BC', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 }}>
                  <AppText weight={800} size={11} color="#A57F2C">
                    {new Date(`1970-01-01T${m.reminderTime}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} ⏰
                  </AppText>
                </View>
              ) : (
                <AppText weight={800} size={11} color={theme.textTertiary}>
                  PRN
                </AppText>
              )}
            </Row>
          ))}
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}
