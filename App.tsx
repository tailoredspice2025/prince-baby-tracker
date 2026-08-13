import 'react-native-gesture-handler';
import React, { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { navigationRef } from './src/navigation/navigationRef';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';

import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ToastHost } from './src/components/ToastHost';
import { QuickAddSheet } from './src/components/QuickAddSheet';
import { EventEditSheet } from './src/components/EventEditSheet';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { VoiceListeningSheet } from './src/screens/voice/VoiceListeningSheet';
import { AppLockScreen } from './src/components/AppLockScreen';
import { useStore } from './src/lib/store';
import { remindersToArm } from './src/lib/bootReminders';
import { ensureNotificationPermissions, syncMedicationReminders, scheduleVaccineReminders, setupNotificationChannel } from './src/lib/notifications';

SplashScreen.preventAutoHideAsync().catch(() => {});

function AppInner() {
  const theme = useTheme();

  useEffect(() => {
    setupNotificationChannel();

    // Everything below reads persisted state, so it must wait for AsyncStorage
    // to come back. Reading it at first render meant reading the demo seed:
    // that armed a daily 18:00 "Vitamin D drops" notification on every launch,
    // and left a linked device unable to reconnect family sync because
    // familyId was still null.
    const onReady = () => {
      const { medications, vaccines, initFamilySync } = useStore.getState();
      initFamilySync();
      ensureNotificationPermissions().then((granted) => {
        if (!granted) return;
        const arm = remindersToArm(true, medications, vaccines);
        // Re-arms the rolling window every launch. Each medicine reminder is a
        // dated one-shot rather than a repeating alarm — that is what lets a
        // logged dose remove a single day — so the window needs topping up.
        syncMedicationReminders(arm.medications).catch(() => {});
        arm.vaccines.forEach((v) => scheduleVaccineReminders(v).catch(() => {}));
      });
    };

    if (useStore.persist.hasHydrated()) {
      onReady();
      return;
    }
    return useStore.persist.onFinishHydration(onReady);
  }, []);

  const navTheme = {
    ...DefaultTheme,
    dark: theme.mode === 'night',
    colors: {
      ...DefaultTheme.colors,
      background: theme.bg,
      card: theme.surface,
      text: theme.ink,
      border: theme.border,
      primary: theme.coral,
    },
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <AppLockScreen>
        <NavigationContainer ref={navigationRef} theme={navTheme}>
          <RootNavigator />
        </NavigationContainer>
        <QuickAddSheet />
        <EventEditSheet />
        <VoiceListeningSheet />
        <ToastHost />
      </AppLockScreen>
      <StatusBar style={theme.mode === 'night' ? 'light' : 'dark'} />
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  const onLayout = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayout}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <ThemeProvider>
            <AppInner />
          </ThemeProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
