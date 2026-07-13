import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AppText } from '../../components/AppText';
import { MicIcon } from '../../components/icons';
import { PrimaryButton } from '../../components/Button';
import { FormField } from '../../components/FormField';
import { useStore } from '../../lib/store';
import { useTheme } from '../../theme/ThemeProvider';

export function SicknessFormScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const voiceDraft = useStore((s) => s.voiceDraft);
  const addSicknessEpisode = useStore((s) => s.addSicknessEpisode);
  const closeVoiceSheet = useStore((s) => s.closeVoiceSheet);

  const fromVoice = voiceDraft?.eventType === 'sickness-form';

  const [title, setTitle] = useState('');
  const [temp, setTemp] = useState('');
  const [notes, setNotes] = useState('');

  const save = () => {
    addSicknessEpisode({
      title: title || (temp ? `Fever · ${temp}°C` : 'Symptom'),
      emoji: '🌡️',
      startDate: new Date().toISOString(),
      notes: notes || undefined,
      resolved: false,
    });
    closeVoiceSheet();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1 }}>
        <AppText weight={900} size={26} color={theme.ink} style={{ marginBottom: 4 }}>
          Log sickness
        </AppText>
        {fromVoice ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: theme.coral, alignItems: 'center', justifyContent: 'center' }}>
              <MicIcon size={9} />
            </View>
            <AppText weight={700} size={12.5} color={theme.coralDeep} style={{ flex: 1 }}>
              Pre-filled from "{voiceDraft?.transcript}" — confirm details
            </AppText>
          </View>
        ) : (
          <View style={{ marginBottom: 18 }} />
        )}

        <View style={{ gap: 12, marginBottom: 18 }}>
          <FormField label="Symptom" value={title} onChangeText={setTitle} placeholder="e.g. Mild fever" />
          <FormField label="Temperature" value={temp} onChangeText={setTemp} placeholder="°C" keyboardType="numeric" />
          <FormField label="Notes" value={notes} onChangeText={setNotes} placeholder="Medicine given, when it started…" multiline />
        </View>

        <View style={{ flex: 1, minHeight: 12 }} />
        <PrimaryButton label="Save to health record" onPress={save} />
      </ScrollView>
    </SafeAreaView>
  );
}
