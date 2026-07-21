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
import { VoiceListeningSheet } from './src/screens/voice/VoiceListeningSheet';
import { AppLockScreen } from './src/components/AppLockScreen';
import { useStore } from './src/lib/store';
import { ensureNotificationPermissions, scheduleMedicationReminder, scheduleVaccineReminders, setupNotificationChannel } from './src/lib/notifications';

SplashScreen.preventAutoHideAsync().catch(() => {});

function AppInner() {
  const theme = useTheme();
  const medications = useStore((s) => s.medications);
  const vaccines = useStore((s) => s.vaccines);

  useEffect(() => {
    setupNotificationChannel();
    // reconnect family live-sync if this device is linked (no-op otherwise)
    useStore.getState().initFamilySync();
    ensureNotificationPermissions().then((granted) => {
      if (!granted) return;
      medications.forEach((m) => scheduleMedicationReminder(m).catch(() => {}));
      vaccines.forEach((v) => scheduleVaccineReminders(v).catch(() => {}));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <ThemeProvider>
          <AppInner />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
