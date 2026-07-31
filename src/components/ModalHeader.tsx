import React from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppText } from './AppText';
import { ChevronLeftIcon } from './icons';
import { useTheme } from '../theme/ThemeProvider';

/**
 * Visible way out of a modal screen.
 *
 * `RootNavigator` sets `headerShown: false` for the whole stack, and none of
 * the nine modal screens drew their own exit — so the only ways out were
 * completing the task or the iOS drag-down gesture, which people find by
 * accident if at all. Reported on "Add memory": had to close the app.
 *
 * `DayTimelineScreen` already had the right pattern; this is that, extracted
 * so every modal gets one and a new screen can't forget.
 */
export function ModalHeader({ title }: { title: string }) {
  const theme = useTheme();
  const navigation = useNavigation();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 }}>
      <Pressable
        onPress={() => navigation.goBack()}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: theme.surface,
          alignItems: 'center',
          justifyContent: 'center',
          ...theme.cardShadow,
        }}
      >
        <ChevronLeftIcon color={theme.textSecondary} />
      </Pressable>
      <AppText weight={900} size={22} color={theme.ink} style={{ flex: 1 }}>
        {title}
      </AppText>
    </View>
  );
}
