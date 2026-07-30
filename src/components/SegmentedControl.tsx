import React from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '../theme/ThemeProvider';

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={{
              flex: 1,
              alignItems: 'center',
              // coral (not theme.ink) for the selected pill: in dark mode ink
              // is near-white, so ink + light text made the selected option
              // invisible on Growth/Trends.
              backgroundColor: active ? theme.coral : theme.surface,
              borderRadius: 999,
              paddingVertical: 9,
              ...(active ? {} : theme.cardShadow),
            }}
          >
            <AppText weight={active ? 900 : 700} size={13.5} color={active ? '#FFFFFF' : theme.textSecondary}>
              {opt.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
