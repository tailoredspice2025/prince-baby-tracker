import React, { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AppText } from '../../components/AppText';
import { AlertTriangleIcon, CheckIcon, DueClockIcon } from '../../components/icons';
import { useStore } from '../../lib/store';
import { doseSummary, lastGivenLabel, peakTemp } from '../../lib/healthModel';
import { dateRange } from '../../lib/time';
import { useTheme } from '../../theme/ThemeProvider';
import { useContentStyle } from '../../theme/layout';
import { radii } from '../../theme/tokens';

function SectionCard({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ backgroundColor: theme.surface, borderRadius: radii.cardLg, overflow: 'hidden', marginBottom: 18, ...theme.cardShadow }}>
      {children}
    </View>
  );
}

/** Every section needs its own way in. Vaccines had two add buttons and the
 * other two sections had none, which was survivable only while the demo seed
 * guaranteed both were non-empty — after build 18 strips it, a new parent
 * lands on an empty section with no visible route out of it. */
function AddButton({ emoji, label, onPress }: { emoji: string; label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: theme.surface,
        borderWidth: 2,
        borderColor: '#E0CDB4',
        borderStyle: 'dashed',
        borderRadius: radii.cardLg,
        paddingVertical: 14,
        marginBottom: 18,
      }}
    >
      <AppText size={15}>{emoji}</AppText>
      <AppText weight={800} size={13.5} color="#A98F73">
        {label}
      </AppText>
    </Pressable>
  );
}

function EmptyRow({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <Row last>
      <AppText weight={600} size={13} color={theme.textSecondary}>
        {text}
      </AppText>
    </Row>
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
  const contentStyle = useContentStyle();
  const navigation = useNavigation<any>();
  const baby = useStore((s) => s.activeBaby());
  const vaccines = useStore((s) => s.vaccines).filter((v) => v.babyId === baby.id);
  const sickness = useStore((s) => s.sickness).filter((s2) => s2.babyId === baby.id);
  const medications = useStore((s) => s.medications).filter((m) => m.babyId === baby.id);
  const events = useStore((s) => s.events);

  const nextDue = useMemo(
    () => vaccines.filter((v) => v.status === 'due').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0],
    [vaccines]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={[{ padding: 20, paddingBottom: 140 }, contentStyle]}>
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
        <AddButton emoji="📅" label="Add vaccine appointment" onPress={() => navigation.navigate('VaccineForm', { mode: 'appointment' })} />
        <SectionCard>
          {vaccines.length === 0 && <EmptyRow text="No vaccines recorded yet" />}
          {vaccines.map((v, i) => {
            const done = v.status === 'done';
            const meta = done
              ? [new Date(v.date).toLocaleDateString([], { month: 'short', day: 'numeric' }), v.site, v.batchNo && `batch ${v.batchNo}`, v.reaction, v.notes].filter(Boolean).join(' · ')
              : v.appointmentAt
              ? `${new Date(v.appointmentAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} · ${new Date(v.appointmentAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}🔔${v.clinic ? ` · ${v.clinic}` : ''}`
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
          {/* Tap to edit. `updateSicknessEpisode` and `deleteSicknessEpisode`
              have been in the store since build 16 with no screen calling
              them, so a mistyped temperature was permanent. */}
          {sickness.map((s, i) => (
            <Row key={s.id} last={i === sickness.length - 1}>
              <Pressable onPress={() => navigation.navigate('SicknessForm', { episodeId: s.id })} style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <AppText weight={800} size={14.5} color={theme.ink}>
                    {s.emoji} {s.title}
                  </AppText>
                  <AppText weight={700} size={12} color={theme.textTertiary}>
                    {dateRange(s.startDate, s.endDate)}
                  </AppText>
                </View>
                <AppText weight={600} size={12} color={theme.textSecondary}>
                  {[
                    peakTemp(s) ? `peak ${peakTemp(s)!.tempC}°` : null,
                    doseSummary(events, s.id) || null,
                    s.notes,
                    s.resolved ? 'resolved' : 'ongoing',
                    'tap to edit',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </AppText>
              </Pressable>
            </Row>
          ))}
          {sickness.length === 0 && <EmptyRow text="No illnesses recorded yet" />}
        </SectionCard>
        <AddButton emoji="🌡️" label="Add an illness" onPress={() => navigation.navigate('SicknessForm')} />

        <AppText weight={900} size={15} color={theme.ink} style={{ marginBottom: 10 }}>
          Medicine
        </AppText>
        <SectionCard>
          {/* Tap to edit — dose, schedule, reminder time, or delete. The store
              has had updateMedication/deleteMedication since build 16 with no
              screen calling them. */}
          {medications.length === 0 && <EmptyRow text="No medicines added yet" />}
          {medications.map((m, i) => (
            <Row key={m.id} last={i === medications.length - 1}>
              <Pressable
                onPress={() => navigation.navigate('MedicineForm', { medicationId: m.id })}
                style={{ flex: 1 }}
              >
                <AppText weight={800} size={14.5} color={theme.ink}>
                  {m.name}
                </AppText>
                <AppText weight={600} size={12} color={theme.textSecondary}>
                  {[m.dose, m.schedule, lastGivenLabel(events, m), 'tap to edit'].filter(Boolean).join(' · ')}
                </AppText>
              </Pressable>
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
        <AddButton emoji="💊" label="Add a medicine" onPress={() => navigation.navigate('MedicineForm')} />
      </ScrollView>
    </SafeAreaView>
  );
}
