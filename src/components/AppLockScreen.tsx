import React, { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { PrimaryButton } from './Button';
import { LockIcon } from './icons';
import { useTheme } from '../theme/ThemeProvider';
import { useStore } from '../lib/store';
import { authenticate } from '../lib/appLock';

/**
 * Gates all app content behind Face ID / Touch ID / passcode when the user
 * has turned on App Lock in Settings. Re-locks on every background→
 * foreground transition, not just cold launch — a lock that only checked
 * once at startup wouldn't protect against someone picking up an
 * already-running phone.
 */
export function AppLockScreen({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const enabled = useStore((s) => s.settings.appLockEnabled ?? false);
  const [unlocked, setUnlocked] = useState(!enabled);
  const [checking, setChecking] = useState(false);
  const appState = useRef(AppState.currentState);

  const tryUnlock = React.useCallback(async () => {
    setChecking(true);
    const ok = await authenticate().catch(() => false);
    setChecking(false);
    if (ok) setUnlocked(true);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setUnlocked(true);
      return;
    }
    setUnlocked(false);
    tryUnlock();
  }, [enabled, tryUnlock]);

  useEffect(() => {
    if (!enabled) return;
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        setUnlocked(false);
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [enabled]);

  useEffect(() => {
    if (enabled && !unlocked && !checking) tryUnlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, unlocked]);

  if (unlocked) return <>{children}</>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <View
        style={{
          width: 84,
          height: 84,
          borderRadius: 42,
          backgroundColor: theme.surface,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
          ...theme.cardShadow,
        }}
      >
        <LockIcon size={32} color={theme.coral} />
      </View>
      <AppText weight={900} size={22} color={theme.ink} center style={{ marginBottom: 6 }}>
        DenBaby is locked
      </AppText>
      <AppText weight={700} size={14} color={theme.textSecondary} center style={{ marginBottom: 28 }}>
        Unlock with Face ID to continue
      </AppText>
      <PrimaryButton label={checking ? 'Checking…' : 'Unlock'} onPress={tryUnlock} disabled={checking} style={{ paddingHorizontal: 48 }} />
    </SafeAreaView>
  );
}
