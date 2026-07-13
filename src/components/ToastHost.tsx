import React from 'react';
import { Pressable, View } from 'react-native';
import { useStore } from '../lib/store';
import { AppText } from './AppText';

export function ToastHost() {
  const toasts = useStore((s) => s.toasts);
  const dismissToast = useStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <View style={{ position: 'absolute', left: 20, right: 20, bottom: 110, gap: 8 }} pointerEvents="box-none">
      {toasts.map((t) => (
        <View
          key={t.id}
          style={{
            backgroundColor: '#43382F',
            borderRadius: 16,
            paddingVertical: 12,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowOffset: { width: 0, height: 6 },
            shadowRadius: 16,
            elevation: 6,
          }}
        >
          <AppText weight={700} size={13.5} color="#F5E9DB" style={{ flex: 1 }}>
            {t.message}
          </AppText>
          {t.onUndo && (
            <Pressable
              onPress={() => {
                t.onUndo?.();
                dismissToast(t.id);
              }}
              hitSlop={8}
            >
              <AppText weight={800} size={13} color="#E98862">
                Undo
              </AppText>
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}
