import React from 'react';
import { Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AppText } from './AppText';
import { MicIcon } from './icons';
import { useStore } from '../lib/store';
import { useTheme } from '../theme/ThemeProvider';

export function VoiceBar({ dim, label }: { dim?: boolean; label: string }) {
  const theme = useTheme();
  const startVoiceHold = useStore((s) => s.startVoiceHold);
  const endVoiceHold = useStore((s) => s.endVoiceHold);

  return (
    <Pressable
      onPressIn={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        startVoiceHold();
      }}
      onPressOut={() => endVoiceHold()}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: theme.mode === 'night' ? theme.surface : '#43382F',
        borderRadius: 999,
        paddingVertical: 12,
        paddingHorizontal: 16,
        opacity: dim ? 0.85 : 1,
        shadowColor: '#43382F',
        shadowOpacity: theme.mode === 'night' ? 0 : 0.25,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 18,
        elevation: theme.mode === 'night' ? 0 : 4,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: theme.coral,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MicIcon size={13} color="#fff" />
      </View>
      <AppText weight={700} size={14} color={theme.mode === 'night' ? theme.textSecondary : '#F5E9DB'} style={{ flex: 1, lineHeight: 18 }}>
        {label}
      </AppText>
    </Pressable>
  );
}
