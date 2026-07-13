import React from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from './AppText';
import { pastels, PastelKey, radii } from '../theme/tokens';

export function QuickLogTile({
  pastelKey,
  icon,
  title,
  caption,
  onPress,
  onLongPress,
}: {
  pastelKey: PastelKey;
  icon: React.ReactNode;
  title: string;
  caption: string;
  onPress?: () => void;
  onLongPress?: () => void;
}) {
  const p = pastels[pastelKey];
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => ({
        backgroundColor: p.bg,
        borderRadius: radii.cardLg,
        padding: 16,
        gap: 8,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View>{icon}</View>
      <AppText weight={800} size={16} color={p.title}>
        {title}
      </AppText>
      <AppText weight={700} size={12} color={p.caption}>
        {caption}
      </AppText>
    </Pressable>
  );
}
