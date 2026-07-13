import React from 'react';
import { View, ViewProps, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { radii, spacing } from '../theme/tokens';

interface CardProps extends ViewProps {
  radius?: number;
  padding?: number;
  noShadow?: boolean;
  bg?: string;
  border?: boolean;
}

export function Card({ radius = radii.card, padding = spacing.cardPaddingSm, noShadow, bg, border, style, children, ...rest }: CardProps) {
  const theme = useTheme();
  const s: ViewStyle = {
    backgroundColor: bg ?? theme.surface,
    borderRadius: radius,
    padding,
    ...(noShadow ? {} : theme.cardShadow),
    ...(border ? { borderWidth: 1, borderColor: theme.border } : {}),
  };
  return (
    <View style={[s, style]} {...rest}>
      {children}
    </View>
  );
}
