import React, { createContext, useContext } from 'react';
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

/**
 * The minimal night-feeding home screen (NightHomeView) is a SEPARATE
 * concern from the colour theme, and it is now purely opt-in: you turn it on
 * with the moon button on the home header and off again from inside it.
 *
 * It used to switch itself on whenever a sleep session was running during
 * night hours. That made the whole home screen disappear behind a two-button
 * view the moment you tapped Sleep after 8pm — the same unwanted takeover as
 * the old "system dark mode means night" behaviour, just with a different
 * trigger. Anything that flips this at runtime must never gate a hook.
 */
export function useNightFeedingView() {
  return useStore((s) => !!s.settings.forceNightPreview);
}

/** Forces night colours for the night-feeding view regardless of the user's
 * Appearance setting — otherwise "Night mode 🌙" renders on a cream page. */
export function NightThemeProvider({ children }: { children: React.ReactNode }) {
  return <ThemeContext.Provider value={nightTheme}>{children}</ThemeContext.Provider>;
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
