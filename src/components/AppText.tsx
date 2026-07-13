import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';

type Weight = 400 | 600 | 700 | 800 | 900;

const FAMILY: Record<Weight, string> = {
  400: 'Nunito_400Regular',
  600: 'Nunito_600SemiBold',
  700: 'Nunito_700Bold',
  800: 'Nunito_800ExtraBold',
  900: 'Nunito_900Black',
};

export interface AppTextProps extends TextProps {
  weight?: Weight;
  size?: number;
  color?: string;
  lineHeight?: number;
  letterSpacing?: number;
  center?: boolean;
  uppercase?: boolean;
}

export function AppText({
  weight = 600,
  size = 14,
  color,
  lineHeight,
  letterSpacing,
  center,
  uppercase,
  style,
  children,
  ...rest
}: AppTextProps) {
  const s: TextStyle = {
    fontFamily: FAMILY[weight],
    fontSize: size,
    color,
    lineHeight,
    letterSpacing,
    textAlign: center ? 'center' : undefined,
    textTransform: uppercase ? 'uppercase' : undefined,
  };
  return (
    <Text style={[s, style]} {...rest}>
      {children}
    </Text>
  );
}
