import React from 'react';
import { Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';

export function Toggle({ value, onChange, disabled }: { value: boolean; onChange?: (v: boolean) => void; disabled?: boolean }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        Haptics.selectionAsync();
        onChange?.(!value);
      }}
      style={{
        width: 44,
        height: 26,
        borderRadius: 999,
        backgroundColor: value ? '#7A9A58' : '#E4D6C2',
        opacity: disabled ? 0.6 : 1,
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: 2,
          left: value ? 22 : 2,
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: '#fff',
        }}
      />
    </Pressable>
  );
}
