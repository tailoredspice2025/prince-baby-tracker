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
              backgroundColor: active ? theme.ink : theme.surface,
              borderRadius: 999,
              paddingVertical: 9,
              ...(active ? {} : theme.cardShadow),
            }}
          >
            <AppText weight={active ? 800 : 700} size={13.5} color={active ? '#F5E9DB' : theme.textSecondary}>
              {opt.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
