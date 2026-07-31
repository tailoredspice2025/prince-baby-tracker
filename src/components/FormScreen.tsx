import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { ModalHeader } from './ModalHeader';

/**
 * Keyboard-safe scaffold for every screen that contains a text input.
 *
 * Ten of the app's eleven forms had no `KeyboardAvoidingView` at all, so the
 * submit button sat underneath the keyboard and you had to tap blank space to
 * dismiss it before you could save. It was reported once against the edit
 * sheet, fixed only there, and left everywhere else — including Onboarding.
 *
 * `actions` renders pinned below the scroll area and above the keyboard, so
 * the primary button is always reachable.
 */
export function FormScreen({
  children,
  actions,
  title,
}: {
  children: React.ReactNode;
  actions?: React.ReactNode;
  /** Renders a back control above the content. Pass it on every modal screen —
   * without one the only exit is finishing the task or an undiscoverable
   * swipe. */
  title?: string;
}) {
  const theme = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 16, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {title && <ModalHeader title={title} />}
          {children}
        </ScrollView>
        {actions && <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>{actions}</View>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
