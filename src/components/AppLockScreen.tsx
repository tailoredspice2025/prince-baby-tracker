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
  const authInFlight = useRef(false);
  const backgrounded = useRef(false);

  const tryUnlock = React.useCallback(async () => {
    // Non-reentrant: without this, anything that re-renders mid-prompt can
    // stack a second Face ID request on top of the first.
    if (authInFlight.current) return;
    authInFlight.current = true;
    setChecking(true);
    const ok = await authenticate().catch(() => false);
    authInFlight.current = false;
    setChecking(false);
    if (ok) setUnlocked(true);
  }, []);

  useEffect(() => {
    setUnlocked(!enabled);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      /**
       * Only a REAL trip to the background re-locks.
       *
       * This used to re-lock on `inactive|background` → `active`. The Face ID
       * prompt puts the app into `inactive` and back to `active` all by
       * itself, so a successful unlock was read as "the user just returned
       * from the background" — it re-locked, which re-prompted, which went
       * inactive again. An unbreakable loop that survived force-quitting,
       * because the setting is persisted.
       *
       * iOS also passes through `inactive` on the way to and from a genuine
       * background, so the transition can't be trusted on its own. Tracking
       * whether `background` was actually reached is what distinguishes the
       * two cases.
       */
      if (next === 'background') backgrounded.current = true;
      else if (next === 'active' && backgrounded.current) {
        backgrounded.current = false;
        setUnlocked(false);
      }
    });
    return () => sub.remove();
  }, [enabled]);

  useEffect(() => {
    if (enabled && !unlocked) tryUnlock();
  }, [enabled, unlocked, tryUnlock]);

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
