import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { AppText } from '../../components/AppText';
import { MicIcon } from '../../components/icons';
import { PrimaryButton } from '../../components/Button';
import { FormField } from '../../components/FormField';
import { DateField } from '../../components/DateField';
import { FormScreen } from '../../components/FormScreen';
import { Toggle } from '../../components/Toggle';
import { useStore } from '../../lib/store';
import { useTheme } from '../../theme/ThemeProvider';

export function SicknessFormScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ SicknessForm: { episodeId?: string } }, 'SicknessForm'>>();
  const editingId = route.params?.episodeId;
  const baby = useStore((s) => s.activeBaby());
  const existing = useStore((s) => s.sickness.find((e) => e.id === editingId));
  const voiceDraft = useStore((s) => s.voiceDraft);
  const addSicknessEpisode = useStore((s) => s.addSicknessEpisode);
  const updateSicknessEpisode = useStore((s) => s.updateSicknessEpisode);
  const deleteSicknessEpisode = useStore((s) => s.deleteSicknessEpisode);
  const closeVoiceSheet = useStore((s) => s.closeVoiceSheet);

  const fromVoice = voiceDraft?.eventType === 'sickness-form';

  const [title, setTitle] = useState(existing?.title ?? '');
  const [temp, setTemp] = useState('');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [startDate, setStartDate] = useState(() => new Date(existing?.startDate ?? Date.now()));
  const [resolved, setResolved] = useState(!!existing?.resolved);

  const save = () => {
    // Temperature is still glued into the title string. That is wrong — the
    // model has no temperature field, so nothing can chart it and a second
    // reading has nowhere to go — but fixing it is the Health redesign
    // (TODO §7), not a build-19 change. Keeping the existing behaviour here
    // rather than half-migrating the data.
    const payload = {
      title: title || (temp ? `Fever · ${temp}°C` : 'Symptom'),
      emoji: '🌡️',
      startDate: startDate.toISOString(),
      notes: notes || undefined,
      resolved,
      endDate: resolved ? existing?.endDate ?? new Date().toISOString() : undefined,
    };
    if (editingId) updateSicknessEpisode(editingId, payload);
    else addSicknessEpisode(payload);
    closeVoiceSheet();
    navigation.goBack();
  };

  const remove = () => {
    if (editingId) deleteSicknessEpisode(editingId);
    navigation.goBack();
  };

  return (
    <FormScreen
      title={editingId ? 'Edit illness' : 'Add illness'}
      actions={
        <View style={{ gap: 10 }}>
          <PrimaryButton label={editingId ? 'Save changes' : 'Save to health record'} onPress={save} />
          {editingId && (
            <Pressable onPress={remove} style={{ backgroundColor: '#F7D6DC', borderRadius: 999, paddingVertical: 14, alignItems: 'center' }}>
              <AppText weight={800} size={14.5} color="#A04E63">
                Delete illness
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
              Pre-filled from "{voiceDraft?.transcript}" — confirm details
            </AppText>
          </View>
        ) : (
          <View style={{ marginBottom: 18 }} />
        )}

        <View style={{ gap: 12, marginBottom: 18 }}>
          {/* Symptoms usually get typed up a day or two later, not the moment
              they start — so the start date is picked, not assumed. */}
          <DateField label="Started" value={startDate} onChange={setStartDate} minimumDate={new Date(baby.dob)} maximumDate={new Date()} />
          <FormField label="Symptom" value={title} onChangeText={setTitle} placeholder="e.g. Mild fever" />
          <FormField label="Temperature" value={temp} onChangeText={setTemp} placeholder="°C" keyboardType="numeric" />
          <FormField label="Notes" value={notes} onChangeText={setNotes} placeholder="Medicine given, when it started…" multiline />

          <View style={{ backgroundColor: theme.surface, borderRadius: 22, padding: 14, paddingHorizontal: 18, ...theme.cardShadow }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <AppText weight={800} size={14.5} color={theme.ink}>
                  Better now
                </AppText>
                <AppText weight={600} size={11.5} color={theme.textTertiary} style={{ marginTop: 1 }}>
                  Closes the episode and stamps today as the end date
                </AppText>
              </View>
              <Toggle value={resolved} onChange={setResolved} />
            </View>
          </View>
        </View>
      </>
    </FormScreen>
  );
}
