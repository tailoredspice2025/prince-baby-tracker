import React from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '../theme/ThemeProvider';
import { pastels, PastelKey } from '../theme/tokens';

export function TimelineRow({
  pastelKey,
  emoji,
  title,
  time,
  subLine,
  isLast,
  onPress,
}: {
  pastelKey: PastelKey;
  emoji: string;
  title: string;
  time: string;
  subLine: string;
  isLast?: boolean;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const p = pastels[pastelKey];
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', gap: 12 }}>
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: p.bg, alignItems: 'center', justifyContent: 'center' }}>
          <AppText size={15}>{emoji}</AppText>
        </View>
        {!isLast && <View style={{ width: 2, flex: 1, backgroundColor: theme.mode === 'night' ? theme.border : '#EBDCC9' }} />}
      </View>
      <View style={{ flex: 1, paddingBottom: isLast ? 0 : 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <AppText weight={800} size={14.5} color={theme.ink}>
            {title}
          </AppText>
          <AppText weight={700} size={12} color={theme.textTertiary}>
            {time}
          </AppText>
        </View>
        <AppText weight={600} size={12.5} color={theme.textSecondary}>
          {subLine}
        </AppText>
      </View>
    </Pressable>
  );
}
