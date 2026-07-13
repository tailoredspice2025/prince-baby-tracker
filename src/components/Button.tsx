import React from 'react';
import { Pressable, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AppText } from './AppText';
import { useTheme } from '../theme/ThemeProvider';
import { radii } from '../theme/tokens';

interface PrimaryButtonProps {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export function PrimaryButton({ label, onPress, disabled, style }: PrimaryButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      style={({ pressed }) => [
        {
          backgroundColor: theme.coral,
          borderRadius: radii.pill,
          paddingVertical: 17,
          alignItems: 'center',
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        theme.ctaShadow,
        style,
      ]}
    >
      <AppText weight={800} size={17} color="#fff">
        {label}
      </AppText>
    </Pressable>
  );
}

export function TextLink({ label, onPress }: { label: string; onPress?: () => void }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={{ paddingTop: 16, alignItems: 'center' }}>
      <AppText weight={700} size={13} color={theme.textTertiary}>
        {label}
      </AppText>
    </Pressable>
  );
}
