import React from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '../theme/ThemeProvider';

/**
 * Segmented picker with an unmistakable selected state in BOTH themes.
 *
 * The hand-rolled versions this replaces used `theme.ink` as the selected
 * background with near-white text — fine in light mode, but in dark mode ink
 * is itself near-white, so the *selected* option rendered white-on-white and
 * vanished (reported as "it says Boy and blank"). Selected now uses the coral
 * accent, which has contrast on either ground.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  compact,
}: {
  options: readonly { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
  compact?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: compact ? 8 : 10,
              borderRadius: 999,
              backgroundColor: active ? theme.coral : theme.border,
              borderWidth: 2,
              borderColor: active ? theme.coralDeep : 'transparent',
            }}
          >
            <AppText
              weight={active ? 900 : 700}
              size={compact ? 12.5 : 13.5}
              color={active ? '#FFFFFF' : theme.textSecondary}
            >
              {opt.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
