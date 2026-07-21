import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppText } from '../../components/AppText';
import { MicIcon } from '../../components/icons';
import { PrimaryButton } from '../../components/Button';
import { FormField } from '../../components/FormField';
import { useStore } from '../../lib/store';
import { useTheme } from '../../theme/ThemeProvider';
import { radii } from '../../theme/tokens';
import { parseVaccineDraft } from '../../lib/vaccineParser';

/** Cross-platform appointment date+time chooser. iOS shows an inline
 * datetime spinner; Android walks a date dialog then a time dialog. */
function AppointmentDateTime({ value, onChange }: { value: Date; onChange: (d: Date) => void }) {
  const theme = useTheme();
  const [iosOpen, setIosOpen] = useState(false);
  const [androidStep, setAndroidStep] = useState<'date' | 'time' | null>(null);
  const label = `${value.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} · ${value.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;

  return (
    <View style={{ backgroundColor: theme.surface, borderRadius: radii.card, padding: 14, paddingHorizontal: 18, ...theme.cardShadow }}>
      <AppText weight={800} size={11} color={theme.textTertiary} letterSpacing={1} uppercase>
        Appointment date &amp; time
      </AppText>
      <Pressable onPress={() => (Platform.OS === 'ios' ? setIosOpen((o) => !o) : setAndroidStep('date'))}>
        <AppText weight={800} size={18} color={theme.ink} style={{ marginTop: 2 }}>
          {label} ▾
        </AppText>
      </Pressable>
      {Platform.OS === 'ios' && iosOpen && (
        <DateTimePicker
          value={value}
          mode="datetime"
          display="spinner"
          minimumDate={new Date()}
          onChange={(_e, d) => d && onChange(d)}
        />
      )}
      {Platform.OS === 'android' && androidStep && (
        <DateTimePicker
          value={value}
          mode={androidStep}
          display="default"
          minimumDate={androidStep === 'date' ? new Date() : undefined}
          onChange={(e, d) => {
            if (e.type !== 'set' || !d) {
              setAndroidStep(null);
              return;
            }
            if (androidStep === 'date') {
              const nd = new Date(value);
              nd.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
              onChange(nd);
              setAndroidStep('time');
            } else {
              const nd = new Date(value);
              nd.setHours(d.getHours(), d.getMinutes(), 0, 0);
              onChange(nd);
              setAndroidStep(null);
            }
          }}
        />
      )}
    </View>
  );
}

export function VaccineFormScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const voiceDraft = useStore((s) => s.voiceDraft);
  const addVaccine = useStore((s) => s.addVaccine);
  const closeVoiceSheet = useStore((s) => s.closeVoiceSheet);

  const parsed = useMemo(
    () => (voiceDraft && voiceDraft.eventType === 'vaccine' ? parseVaccineDraft(voiceDraft.transcript) : null),
    [voiceDraft]
  );

  // Voice always means "logging a dose that just happened"; the explicit
  // "Add appointment" entry passes mode: 'appointment'. Default to given.
  const [mode, setMode] = useState<'appointment' | 'given'>(
    route.params?.mode === 'appointment' && !parsed ? 'appointment' : 'given'
  );

  const [name, setName] = useState(parsed?.name ?? '');
  const [dose, setDose] = useState(parsed?.doseLabel ?? '');
  const [date, setDate] = useState(
    parsed?.date
      ? new Date(parsed.date).toLocaleDateString([], { month: 'short', day: 'numeric' })
      : new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })
  );
  const [site, setSite] = useState('');
  const [batch, setBatch] = useState('');
  const [clinic, setClinic] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  // default appointment: tomorrow at 10:00
  const [apptAt, setApptAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d;
  });

  const save = () => {
    if (mode === 'appointment') {
      addVaccine({
        name: name || 'Vaccine',
        doseLabel: dose || '—',
        status: 'due',
        date: apptAt.toISOString(),
        appointmentAt: apptAt.toISOString(),
        clinic: clinic || undefined,
        address: address || undefined,
        notes: notes || undefined,
      });
    } else {
      addVaccine({
        name: name || 'Vaccine',
        doseLabel: dose || '—',
        status: 'done',
        date: new Date().toISOString(),
        site: site || undefined,
        batchNo: batch || undefined,
        clinic: clinic || undefined,
        address: address || undefined,
        notes: notes || undefined,
        fromVoice: !!parsed,
        voiceFields: parsed?.fields,
      });
    }
    closeVoiceSheet();
    navigation.goBack();
  };

  const isAppt = mode === 'appointment';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <AppText weight={900} size={26} color={theme.ink} style={{ marginBottom: 14 }}>
          {isAppt ? 'Vaccine appointment' : 'Log vaccine'}
        </AppText>

        {/* mode toggle (hidden when pre-filled from voice — that's always a given dose) */}
        {!parsed && (
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
            {([
              { key: 'appointment', label: 'Upcoming appointment' },
              { key: 'given', label: 'Log a given dose' },
            ] as const).map((opt) => {
              const active = mode === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setMode(opt.key)}
                  style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 999, backgroundColor: active ? theme.ink : '#F0E4D2' }}
                >
                  <AppText weight={active ? 800 : 700} size={12.5} color={active ? '#F5E9DB' : theme.textSecondary}>
                    {opt.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        )}

        {parsed && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: theme.coral, alignItems: 'center', justifyContent: 'center' }}>
              <MicIcon size={9} />
            </View>
            <AppText weight={700} size={12.5} color={theme.coralDeep} style={{ flex: 1 }}>
              Pre-filled from "{voiceDraft?.transcript}"
            </AppText>
          </View>
        )}

        <View style={{ gap: 12, marginBottom: 18 }}>
          <FormField label="Vaccine" value={name} onChangeText={setName} placeholder="e.g. DTaP" fromVoice={parsed?.fields.name} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <FormField label="Dose" value={dose} onChangeText={setDose} placeholder="e.g. 3 of 5" fromVoice={parsed?.fields.doseLabel} />
            </View>
            {!isAppt && (
              <View style={{ flex: 1 }}>
                <FormField label="Date" value={date} onChangeText={setDate} placeholder="Today" fromVoice={parsed?.fields.date} />
              </View>
            )}
          </View>

          {isAppt && (
            <>
              <AppointmentDateTime value={apptAt} onChange={setApptAt} />
              <View style={{ backgroundColor: '#F3E3BC', borderRadius: 14, padding: 12, paddingHorizontal: 16, flexDirection: 'row', gap: 8 }}>
                <AppText size={15}>🔔</AppText>
                <AppText weight={700} size={12.5} color="#8A6D28" style={{ flex: 1 }}>
                  Both parents will be reminded 48 hours, 24 hours, and 2 hours before.
                </AppText>
              </View>
            </>
          )}

          {!isAppt && (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <FormField label="Injection site" value={site} onChangeText={setSite} placeholder="Select…" />
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Batch no." value={batch} onChangeText={setBatch} placeholder="Optional" />
              </View>
            </View>
          )}

          <FormField label="Clinic / doctor" value={clinic} onChangeText={setClinic} placeholder="Dr. Rao · Sunrise Pediatrics" />
          <FormField label="Address" value={address} onChangeText={setAddress} placeholder="Clinic address (shown in the reminder)" />
          <FormField label="Notes" value={notes} onChangeText={setNotes} placeholder="Any reaction, fever, notes for next visit…" multiline />
        </View>

        <View style={{ flex: 1, minHeight: 12 }} />
        <PrimaryButton label={isAppt ? 'Save appointment & set reminders' : 'Save to health record'} onPress={save} />
        {parsed && (
          <AppText weight={700} size={12} color={theme.textTertiary} center style={{ paddingTop: 12 }}>
            🎙️ fields came from voice — tap any to correct
          </AppText>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
