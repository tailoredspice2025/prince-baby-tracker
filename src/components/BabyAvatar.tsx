import React from 'react';
import { Image, View } from 'react-native';
import { AppText } from './AppText';
import { Baby } from '../types/models';

export function BabyAvatar({
  baby,
  size,
  bg = '#FFDCC2',
  color = '#C96F4A',
  fontSize,
}: {
  baby: Baby;
  size: number;
  bg?: string;
  color?: string;
  fontSize?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {baby.photoUri ? (
        <Image source={{ uri: baby.photoUri }} style={{ width: size, height: size }} />
      ) : (
        <AppText weight={900} size={fontSize ?? size * 0.43} color={color}>
          {baby.name.charAt(0)}
        </AppText>
      )}
    </View>
  );
}
