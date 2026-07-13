import React from 'react';
import { TextInput, View } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '../theme/ThemeProvider';
import { radii } from '../theme/tokens';

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  fromVoice,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  fromVoice?: boolean;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric';
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.surface,
        borderRadius: radii.card,
        padding: 14,
        paddingHorizontal: 18,
        ...theme.cardShadow,
        borderWidth: fromVoice ? 2 : 0,
        borderColor: theme.coral,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <AppText weight={800} size={11} color={fromVoice ? theme.coralDeep : theme.textTertiary} letterSpacing={1} uppercase>
          {label}
        </AppText>
        {fromVoice && <AppText size={11}>🎙️</AppText>}
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textTertiary}
        multiline={multiline}
        keyboardType={keyboardType}
        style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: multiline ? 15 : 18, color: value ? theme.ink : theme.textTertiary, padding: 0, marginTop: 2 }}
      />
    </View>
  );
}
