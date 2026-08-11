import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { AppText } from '../../components/AppText';
import { MicIcon } from '../../components/icons';
import { PrimaryButton } from '../../components/Button';
import { FormField } from '../../components/FormField';
import { DateField } from '../../components/DateField';
import { FormScreen } from '../../components/FormScreen';
import { ThemedDateTimePicker } from '../../components/ThemedDateTimePicker';
import { Toggle } from '../../components/Toggle';
import { useStore } from '../../lib/store';
import { useTheme } from '../../theme/ThemeProvider';

const COMMON_MEDS = ['vitamin d', 'paracetamol', 'tylenol', 'calpol', 'ibuprofen', 'amoxicillin'];

function guessMedName(transcript: string): string | undefined {
  const lower = transcript.toLowerCase();
  const hit = COMMON_MEDS.find((m) => lower.includes(m));
  if (!hit) return undefined;
  return hit
    .split(' ')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

export function MedicineFormScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ MedicineForm: { medicationId?: string } }, 'MedicineForm'>>();
  const editingId = route.params?.medicationId;
  const baby = useStore((s) => s.activeBaby());
  const existing = useStore((s) => s.medications.find((m) => m.id === editingId));
  const voiceDraft = useStore((s) => s.voiceDraft);
  const addMedication = useStore((s) => s.addMedication);
  const updateMedication = useStore((s) => s.updateMedication);
  const deleteMedication = useStore((s) => s.deleteMedication);
  const closeVoiceSheet = useStore((s) => s.closeVoiceSheet);

  const fromVoice = voiceDraft?.eventType === 'medicine-form';
  const guessedName = useMemo(() => (fromVoice ? guessMedName(voiceDraft!.transcript) : undefined), [fromVoice, voiceDraft]);

  const [name, setName] = useState(existing?.name ?? guessedName ?? '');
  const [dose, setDose] = useState(existing?.dose ?? '');
  const [schedule, setSchedule] = useState(existing?.schedule ?? 'as needed');
  const [notes, setNotes] = useState('');
  const [givenAt, setGivenAt] = useState(() => new Date(existing?.lastGiven ?? Date.now()));

  // Daily reminder. `reminderTime` used to be readable in three places and
  // writable in none — the only medications with reminders were the seeded
  // ones, so nobody could create, retime or add a second.
  const [remind, setRemind] = useState(!!existing?.reminderTime);
  const [remindAt, setRemindAt] = useState(() => {
    const d = new Date();
    if (existing?.reminderTime) {
      const [h, m] = existing.reminderTime.split(':').map(Number);
      d.setHours(h, m, 0, 0);
    } else {
      d.setHours(18, 0, 0, 0);
    }
    return d;
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  const save = () => {
    const payload = {
      name: name || 'Medicine',
      dose: dose || '—',
      schedule,
      prn: schedule.toLowerCase().includes('need'),
      // A reminder only makes sense for something taken regularly, so asking
      // for one marks it ongoing regardless of how the schedule is worded.
      ongoing: remind || !schedule.toLowerCase().includes('need'),
      lastGiven: givenAt.toISOString(),
      reminderTime: remind ? hhmm(remindAt) : undefined,
    };
    if (editingId) updateMedication(editingId, payload);
    else addMedication(payload);
    closeVoiceSheet();
    navigation.goBack();
  };

  const remove = () => {
    if (editingId) deleteMedication(editingId);
    navigation.goBack();
  };

  return (
    <FormScreen
      title={editingId ? 'Edit medicine' : 'Add medicine'}
      actions={
        <View style={{ gap: 10 }}>
          <PrimaryButton label={editingId ? 'Save changes' : 'Save to health record'} onPress={save} />
          {editingId && (
            <Pressable onPress={remove} style={{ backgroundColor: '#F7D6DC', borderRadius: 999, paddingVertical: 14, alignItems: 'center' }}>
              <AppText weight={800} size={14.5} color="#A04E63">
                Delete medicine
              </AppText>
            </Pressable>
          )}
        </View>
      }
    >
      <>
        {fromVoice ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: theme.coral, alignItems: 'center', justifyContent: 'center' }}>
              <MicIcon size={9} />
            </View>
            <AppText weight={700} size={12.5} color={theme.coralDeep} style={{ flex: 1 }}>
              Pre-filled from "{voiceDraft?.transcript}" — confirm the dose
            </AppText>
          </View>
        ) : (
          <View style={{ marginBottom: 18 }} />
        )}

        <View style={{ gap: 12, marginBottom: 18 }}>
          <DateField label="Last given" value={givenAt} onChange={setGivenAt} minimumDate={new Date(baby.dob)} maximumDate={new Date()} />
          <FormField label="Medicine" value={name} onChangeText={setName} placeholder="e.g. Vitamin D drops" fromVoice={!!guessedName} />
          <FormField label="Dose" value={dose} onChangeText={setDose} placeholder="e.g. 2.5 ml" />
          <FormField label="Schedule" value={schedule} onChangeText={setSchedule} placeholder="daily 6 PM / as needed" />
          <FormField label="Notes" value={notes} onChangeText={setNotes} placeholder="Reaction, reason, next dose…" multiline />

          <View style={{ backgroundColor: theme.surface, borderRadius: 22, padding: 14, paddingHorizontal: 18, ...theme.cardShadow }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <AppText weight={800} size={14.5} color={theme.ink}>
                  Remind me daily
                </AppText>
                <AppText weight={600} size={11.5} color={theme.textTertiary} style={{ marginTop: 1 }}>
                  A notification at the same time every day
                </AppText>
              </View>
              <Toggle value={remind} onChange={setRemind} />
            </View>
            {remind && (
              <>
                <Pressable onPress={() => setPickerOpen((o) => !o)} style={{ marginTop: 10 }}>
                  <AppText weight={800} size={11} color={theme.textTertiary} letterSpacing={1} uppercase>
                    Reminder time
                  </AppText>
                  <AppText weight={800} size={18} color={theme.ink} style={{ marginTop: 2 }}>
                    {remindAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} ▾
                  </AppText>
                </Pressable>
                {pickerOpen && (
                  <ThemedDateTimePicker
                    value={remindAt}
                    mode="time"
                    display="spinner"
                    onChange={(_e, d) => d && setRemindAt(d)}
                  />
                )}
              </>
            )}
          </View>
        </View>

      </>
    </FormScreen>
  );
}
