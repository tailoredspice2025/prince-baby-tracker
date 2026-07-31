import React, { useRef } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '../theme/ThemeProvider';
import { radii } from '../theme/tokens';

/**
 * Tapping anywhere in the card focuses the input.
 *
 * The input used to carry `padding: 0`, so its touch target was one line of
 * text tall — well under the 44pt minimum — and the label and the surrounding
 * space weren't touchable at all. You had to hit the text itself to get a
 * keyboard, which reads as the field being broken.
 */
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
  const inputRef = useRef<TextInput>(null);

  return (
    <Pressable
      onPress={() => inputRef.current?.focus()}
      accessibilityRole="none"
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
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textTertiary}
        multiline={multiline}
        keyboardType={keyboardType}
        returnKeyType={multiline ? undefined : 'done'}
        style={{
          fontFamily: 'Nunito_800ExtraBold',
          fontSize: multiline ? 15 : 18,
          color: value ? theme.ink : theme.textTertiary,
          paddingVertical: 6,
          marginTop: 2,
          minHeight: multiline ? 72 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </Pressable>
  );
}
