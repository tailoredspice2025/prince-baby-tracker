import React, { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppText } from './AppText';
import { useTheme } from '../theme/ThemeProvider';
import { radii } from '../theme/tokens';

/** Tap-to-pick date field. Replaces free-text date entry (which was easy to
 * mistype and previously dropped unparseable values). iOS shows an inline
 * spinner; Android opens the system dialog. */
export function DateField({
  label,
  value,
  onChange,
  maximumDate,
  minimumDate,
}: {
  label: string;
  value: Date;
  onChange: (d: Date) => void;
  maximumDate?: Date;
  minimumDate?: Date;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View style={{ backgroundColor: theme.surface, borderRadius: radii.card, padding: 14, paddingHorizontal: 18, ...theme.cardShadow }}>
      <AppText weight={800} size={11} color={theme.textTertiary} letterSpacing={1} uppercase>
        {label}
      </AppText>
      <Pressable onPress={() => setOpen((o) => !o)} accessibilityRole="button">
        <AppText weight={800} size={18} color={theme.ink} style={{ marginTop: 2 }}>
          {value.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })} ▾
        </AppText>
      </Pressable>
      {Platform.OS === 'ios' && open && (
        <DateTimePicker
          value={value}
          mode="date"
          display="spinner"
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          onChange={(_e, d) => d && onChange(d)}
        />
      )}
      {Platform.OS === 'android' && open && (
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          onChange={(e, d) => {
            setOpen(false);
            if (e.type === 'set' && d) onChange(d);
          }}
        />
      )}
    </View>
  );
}
