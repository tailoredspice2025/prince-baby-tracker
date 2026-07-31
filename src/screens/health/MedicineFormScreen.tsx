import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppText } from '../../components/AppText';
import { MicIcon } from '../../components/icons';
import { PrimaryButton } from '../../components/Button';
import { FormField } from '../../components/FormField';
import { DateField } from '../../components/DateField';
import { FormScreen } from '../../components/FormScreen';
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
  const baby = useStore((s) => s.activeBaby());
  const voiceDraft = useStore((s) => s.voiceDraft);
  const addMedication = useStore((s) => s.addMedication);
  const closeVoiceSheet = useStore((s) => s.closeVoiceSheet);

  const fromVoice = voiceDraft?.eventType === 'medicine-form';
  const guessedName = useMemo(() => (fromVoice ? guessMedName(voiceDraft!.transcript) : undefined), [fromVoice, voiceDraft]);

  const [name, setName] = useState(guessedName ?? '');
  const [dose, setDose] = useState('');
  const [schedule, setSchedule] = useState('as needed');
  const [notes, setNotes] = useState('');
  const [givenAt, setGivenAt] = useState(() => new Date());

  const save = () => {
    addMedication({
      name: name || 'Medicine',
      dose: dose || '—',
      schedule,
      prn: schedule.toLowerCase().includes('need'),
      ongoing: !schedule.toLowerCase().includes('need'),
      lastGiven: givenAt.toISOString(),
    });
    closeVoiceSheet();
    navigation.goBack();
  };

  return (
    <FormScreen title="Log medicine" actions={<PrimaryButton label="Save to health record" onPress={save} />}>
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
        </View>

      </>
    </FormScreen>
  );
}
