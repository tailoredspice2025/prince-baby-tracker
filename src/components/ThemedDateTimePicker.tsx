import React from 'react';
import DateTimePicker, { IOSNativeProps, AndroidNativeProps } from '@react-native-community/datetimepicker';
import { useTheme } from '../theme/ThemeProvider';

/**
 * `DateTimePicker` that is told which theme it is sitting in.
 *
 * On iOS the picker colours its own text from the **device's** appearance,
 * while the card behind it is coloured by the app's own Appearance setting.
 * When the two disagree — phone in dark, app in Light — the picker renders
 * light text on a white card and the time is invisible. Reported against the
 * vaccine appointment picker; all six pickers in the app had the same bug.
 *
 * Same root cause as the "says Boy and blank" segmented control in build 11:
 * a control coloured by one system inside a container coloured by another.
 * That one was fixed in isolation and never swept for, which is how this
 * survived. Always use this wrapper — never a bare `DateTimePicker`.
 *
 * `themeVariant` is iOS-only; Android ignores it.
 */
type Props = (IOSNativeProps | AndroidNativeProps) & { value: Date };

export function ThemedDateTimePicker(props: Props) {
  const theme = useTheme();
  return <DateTimePicker {...(props as IOSNativeProps)} themeVariant={theme.mode === 'night' ? 'dark' : 'light'} />;
}
