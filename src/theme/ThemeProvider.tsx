import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, nightColors, shadows, ShadowStyle } from './tokens';
import { useStore } from '../lib/store';

export type AppTheme = {
  mode: 'light' | 'night';
  bg: string;
  surface: string;
  border: string;
  ink: string;
  textSecondary: string;
  textTertiary: string;
  coral: string;
  coralDeep: string;
  successGreen: string;
  cardShadow: ShadowStyle;
  ctaShadow: ShadowStyle;
};

const lightTheme: AppTheme = {
  mode: 'light',
  bg: lightColors.page,
  surface: lightColors.white,
  border: lightColors.separator,
  ink: lightColors.ink,
  textSecondary: lightColors.secondaryAlt,
  textTertiary: lightColors.tertiary,
  coral: lightColors.coral,
  coralDeep: lightColors.coralDeep,
  successGreen: lightColors.successGreen,
  cardShadow: shadows.card,
  ctaShadow: shadows.cta,
};

const nightTheme: AppTheme = {
  mode: 'night',
  bg: nightColors.bg,
  surface: nightColors.surface,
  border: nightColors.border,
  ink: nightColors.text,
  textSecondary: nightColors.muted,
  textTertiary: nightColors.muted,
  coral: lightColors.coral,
  coralDeep: lightColors.coralDeep,
  successGreen: lightColors.successGreen,
  cardShadow: shadows.darkCard,
  ctaShadow: shadows.cta,
};

const ThemeContext = createContext<AppTheme>(lightTheme);

/** Night mode triggers automatically on a running sleep session during
 * night hours (8pm-6am), or when the system is in dark mode — per the
 * 1g spec: "Trigger: automatic on a running sleep session during night
 * hours, or system dark mode." */
function isNightHours(date: Date) {
  const h = date.getHours();
  return h >= 20 || h < 6;
}

export function useComputedNightMode() {
  const systemScheme = useColorScheme();
  const runningSleepSession = useStore((s) => s.runningSleepSession);
  return useMemo(() => {
    if (systemScheme === 'dark') return true;
    if (runningSleepSession && isNightHours(new Date())) return true;
    return false;
  }, [systemScheme, runningSleepSession]);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const isNight = useComputedNightMode();
  const forceNight = useStore((s) => s.settings.forceNightPreview);
  const theme = forceNight || isNight ? nightTheme : lightTheme;
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
