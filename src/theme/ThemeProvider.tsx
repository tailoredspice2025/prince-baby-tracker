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

function isNightHours(date: Date) {
  const h = date.getHours();
  return h >= 20 || h < 6;
}

/**
 * The minimal night-feeding home screen (NightHomeView) is a SEPARATE
 * concern from the colour theme. It appears only during an active sleep
 * session in night hours (8pm–6am), or when explicitly previewed — NOT
 * merely because the phone or app is in dark colours. (Previously any
 * phone in system dark mode was forced into this stripped screen.)
 */
export function useNightFeedingView() {
  const runningSleepSession = useStore((s) => s.runningSleepSession);
  const forceNight = useStore((s) => s.settings.forceNightPreview);
  return useMemo(
    () => !!forceNight || (!!runningSleepSession && isNightHours(new Date())),
    [forceNight, runningSleepSession]
  );
}

/**
 * Colour theme is user-controlled via Settings → Appearance:
 *   'light' (default) · 'dark' · 'system' (follow the phone).
 * Dark colours no longer trigger the night-feeding screen.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pref = useStore((s) => s.settings.themePreference) ?? 'light';
  const systemScheme = useColorScheme();
  const isDark = pref === 'dark' || (pref === 'system' && systemScheme === 'dark');
  const theme = isDark ? nightTheme : lightTheme;
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
