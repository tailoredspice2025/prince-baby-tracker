import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AppText } from '../../components/AppText';
import { MicIcon } from '../../components/icons';
import { PrimaryButton } from '../../components/Button';
import { FormField } from '../../components/FormField';
import { useStore } from '../../lib/store';
import { useTheme } from '../../theme/ThemeProvider';
import { parseVaccineDraft } from '../../lib/vaccineParser';

export function VaccineFormScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const voiceDraft = useStore((s) => s.voiceDraft);
  const addVaccine = useStore((s) => s.addVaccine);
  const closeVoiceSheet = useStore((s) => s.closeVoiceSheet);

  const parsed = useMemo(() => (voiceDraft && voiceDraft.eventType === 'vaccine' ? parseVaccineDraft(voiceDraft.transcript) : null), [voiceDraft]);

  const [name, setName] = useState(parsed?.name ?? '');
  const [dose, setDose] = useState(parsed?.doseLabel ?? '');
  const [date, setDate] = useState(parsed?.date ? new Date(parsed.date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }));
  const [site, setSite] = useState('');
  const [batch, setBatch] = useState('');
  const [clinic, setClinic] = useState('');
  const [notes, setNotes] = useState('');

  const save = () => {
    addVaccine({
      name: name || 'Vaccine',
      doseLabel: dose || '—',
      status: 'done',
      date: new Date().toISOString(),
      site: site || undefined,
      batchNo: batch || undefined,
      clinic: clinic || undefined,
      notes: notes || undefined,
      fromVoice: !!parsed,
      voiceFields: parsed?.fields,
    });
    closeVoiceSheet();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1 }}>
        <AppText weight={900} size={26} color={theme.ink} style={{ marginBottom: 4 }}>
          Log vaccine
        </AppText>
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
        {!parsed && <View style={{ marginBottom: 18 }} />}

        <View style={{ gap: 12, marginBottom: 18 }}>
          <FormField label="Vaccine" value={name} onChangeText={setName} placeholder="e.g. DTaP" fromVoice={parsed?.fields.name} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <FormField label="Dose" value={dose} onChangeText={setDose} placeholder="e.g. 3 of 5" fromVoice={parsed?.fields.doseLabel} />
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="Date" value={date} onChangeText={setDate} placeholder="Today" fromVoice={parsed?.fields.date} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <FormField label="Injection site" value={site} onChangeText={setSite} placeholder="Select…" />
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="Batch no." value={batch} onChangeText={setBatch} placeholder="Optional" />
            </View>
          </View>
          <FormField label="Clinic / doctor" value={clinic} onChangeText={setClinic} placeholder="Dr. Rao · Sunrise Pediatrics" />
          <FormField label="Notes" value={notes} onChangeText={setNotes} placeholder="Any reaction, fever, notes for next visit…" multiline />
        </View>

        <View style={{ flex: 1, minHeight: 12 }} />
        <PrimaryButton label="Save to health record" onPress={save} />
        {parsed && (
          <AppText weight={700} size={12} color={theme.textTertiary} center style={{ paddingTop: 12 }}>
            🎙️ fields came from voice — tap any to correct
          </AppText>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
