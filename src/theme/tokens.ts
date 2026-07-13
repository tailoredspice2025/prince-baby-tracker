// Design tokens transcribed from the Claude Design handoff
// (project/design_handoff_baby_tracker/README.md — "Design Tokens" section)
// and cross-checked against every literal color/size used in the .dc.html screens.

export const lightColors = {
  ink: '#43382F',
  secondary: '#7C6E5F',
  secondaryAlt: '#9B8B7D',
  tertiary: '#B39F8D',
  coral: '#E98862',
  coralDeep: '#C96F4A',
  page: '#FBF4EC',
  canvas: '#F0E9DF',
  separator: '#F2E8DA',
  white: '#FFFFFF',
  successGreen: '#7A9A58',
};

export const nightColors = {
  bg: '#201D2B',
  surface: '#2B2739',
  border: '#3A3450',
  text: '#EFE9DC',
  muted: '#8B84A3',
  lavenderAccent: '#C9B8E8',
  // extra tones used on the 1g screen
  avatarBg: '#3A3450',
  timerPillBg: '#4A4062',
  timerPillText: '#D9CFF2',
  voiceBarText: '#B7AFCB',
};

export type PastelKey = 'peach' | 'lavender' | 'sky' | 'sage' | 'rose' | 'sand';

export const pastels: Record<PastelKey, { bg: string; title: string; caption: string }> = {
  peach: { bg: '#FFDCC2', title: '#6E4429', caption: '#B27B54' },
  lavender: { bg: '#DCD3F0', title: '#4A3D6E', caption: '#8A7BB8' },
  sky: { bg: '#CFE7F2', title: '#2E5A70', caption: '#5E92AC' },
  sage: { bg: '#DCE8CE', title: '#43602A', caption: '#7A9A58' },
  rose: { bg: '#F7D6DC', title: '#7E4152', caption: '#C0798D' },
  sand: { bg: '#F3E3BC', title: '#7A5E20', caption: '#A98A3F' },
};

export const radii = {
  sm: 16,
  card: 18,
  cardLg: 22,
  cardXl: 24,
  cardXxl: 26,
  pill: 999,
};

export const spacing = {
  screenPadding: 20,
  cardPaddingSm: 14,
  cardPaddingLg: 20,
  gridGap: 12,
  sectionGapSm: 18,
  sectionGapLg: 24,
};

export interface ShadowStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export const shadows: Record<'card' | 'cta' | 'darkCard', ShadowStyle> = {
  card: {
    shadowColor: 'rgba(120,90,60,1)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  cta: {
    shadowColor: 'rgba(233,136,98,1)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  darkCard: {
    shadowColor: 'rgba(0,0,0,1)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

export const type = {
  screenTitle: { fontSize: 26, fontWeight: '900' as const },
  cardValue: { fontSize: 32, fontWeight: '900' as const },
  timer: { fontSize: 44, fontWeight: '900' as const },
  rowTitle: { fontSize: 14.5, fontWeight: '800' as const },
  caption: { fontSize: 12, fontWeight: '700' as const },
  captionSm: { fontSize: 11, fontWeight: '800' as const },
};

export const fontFamily = {
  regular: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extraBold: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
};

export const eventGlyphs: Record<string, string> = {
  bottle: '🍼',
  sleep: '🌙',
  diaper: '💧',
  solids: '🥄',
  pump: '🤱',
  medicine: '💊',
  vaccine: '💉',
  sickness: '🌡️',
};
