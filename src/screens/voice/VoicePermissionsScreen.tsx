import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { ModalHeader } from '../../components/ModalHeader';
import { Toggle } from '../../components/Toggle';
import { useStore } from '../../lib/store';
import { useTheme } from '../../theme/ThemeProvider';
import { radii } from '../../theme/tokens';
import { VoicePermissions } from '../../types/models';

const AUTO_ROWS: { key: keyof VoicePermissions; emoji: string; label: string; example: string }[] = [
  { key: 'bottle', emoji: '🍼', label: 'Feeds — bottle & solids', example: '"feed done 120 ml at 12"' },
  { key: 'sleep', emoji: '🌙', label: 'Sleep', example: '"slept from 2 to 4"' },
  { key: 'diaper', emoji: '💧', label: 'Diapers — pee & poo', example: '"wet diaper just now"' },
  { key: 'pump', emoji: '🤱', label: 'Pumping', example: '"pumped 90 ml left side"' },
];

const FORM_ROWS = [
  { emoji: '💉', label: 'Vaccines', sub: 'Needs exact name, dose & site' },
  { emoji: '💊', label: 'Medicine', sub: 'Voice pre-fills, you confirm the dose' },
  { emoji: '🌡️', label: 'Sickness & symptoms', sub: 'Temperature, notes, photos' },
];

export function VoicePermissionsScreen() {
  const theme = useTheme();
  const settings = useStore((s) => s.settings);
  const toggleVoicePermission = useStore((s) => s.toggleVoicePermission);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <ModalHeader title="Voice logging" />
        <AppText weight={700} size={13.5} color={theme.textSecondary} style={{ marginBottom: 18 }}>
          Choose what can be logged by speaking
        </AppText>

        <AppText weight={900} size={15} color={theme.ink} style={{ marginBottom: 10 }}>
          Auto-log by voice
        </AppText>
        <View style={{ backgroundColor: theme.surface, borderRadius: radii.cardLg, overflow: 'hidden', ...theme.cardShadow, marginBottom: 8 }}>
          {AUTO_ROWS.map((row, i) => (
            <View
              key={row.key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 13,
                paddingHorizontal: 16,
                borderBottomWidth: i === AUTO_ROWS.length - 1 ? 0 : 1,
                borderBottomColor: theme.border,
              }}
            >
              <AppText size={18}>{row.emoji}</AppText>
              <View style={{ flex: 1 }}>
                <AppText weight={800} size={14.5} color={theme.ink}>
                  {row.label}
                </AppText>
                <AppText weight={600} size={11.5} color={theme.textSecondary}>
                  {row.example}
                </AppText>
              </View>
              <Toggle value={settings.voicePermissions[row.key]} onChange={() => toggleVoicePermission(row.key)} />
            </View>
          ))}
        </View>
        <AppText weight={600} size={11.5} color={theme.textSecondary} style={{ marginHorizontal: 4, marginBottom: 20 }}>
          Auto-logged after a 3-second undo window. You can always edit later.
        </AppText>

        <AppText weight={900} size={15} color={theme.ink} style={{ marginBottom: 10 }}>
          Always ask — opens a form
        </AppText>
        <View style={{ backgroundColor: theme.surface, borderRadius: radii.cardLg, overflow: 'hidden', ...theme.cardShadow, marginBottom: 8 }}>
          {FORM_ROWS.map((row, i) => (
            <View
              key={row.label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 13,
                paddingHorizontal: 16,
                borderBottomWidth: i === FORM_ROWS.length - 1 ? 0 : 1,
                borderBottomColor: theme.border,
              }}
            >
              <AppText size={18}>{row.emoji}</AppText>
              <View style={{ flex: 1 }}>
                <AppText weight={800} size={14.5} color={theme.ink}>
                  {row.label}
                </AppText>
                <AppText weight={600} size={11.5} color={theme.textSecondary}>
                  {row.sub}
                </AppText>
              </View>
              <View style={{ backgroundColor: '#F3E3BC', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 }}>
                <AppText weight={800} size={11} color="#A57F2C">
                  FORM
                </AppText>
              </View>
            </View>
          ))}
        </View>
        <AppText weight={600} size={11.5} color={theme.textSecondary} style={{ marginHorizontal: 4 }}>
          Health records are never auto-saved — voice only pre-fills the form so nothing important is logged wrong.
        </AppText>
      </ScrollView>
    </SafeAreaView>
  );
}
