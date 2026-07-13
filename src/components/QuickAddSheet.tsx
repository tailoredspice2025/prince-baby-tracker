import React from 'react';
import { Modal, Pressable, View } from 'react-native';
import { AppText } from './AppText';
import { useStore } from '../lib/store';
import { useTheme } from '../theme/ThemeProvider';
import { radii } from '../theme/tokens';
import { navigate } from '../navigation/navigationRef';

const ITEMS: { label: string; emoji: string; route: string }[] = [
  { label: 'Add measurement', emoji: '📏', route: 'AddMeasurement' },
  { label: 'Log vaccine', emoji: '💉', route: 'VaccineForm' },
  { label: 'Log sickness', emoji: '🌡️', route: 'SicknessForm' },
  { label: 'Log medicine', emoji: '💊', route: 'MedicineForm' },
  { label: 'Add memory', emoji: '✨', route: 'AddMilestone' },
];

export function QuickAddSheet() {
  const visible = useStore((s) => s.quickAddVisible);
  const close = useStore((s) => s.closeQuickAdd);
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(32,25,20,0.35)', justifyContent: 'flex-end' }} onPress={close}>
        <Pressable
          style={{
            backgroundColor: theme.bg,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            padding: 20,
            paddingBottom: 40,
            gap: 4,
          }}
        >
          <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: theme.border, alignSelf: 'center', marginBottom: 18 }} />
          {ITEMS.map((item) => (
            <Pressable
              key={item.route}
              onPress={() => {
                close();
                navigate(item.route);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                backgroundColor: theme.surface,
                borderRadius: radii.card,
                padding: 16,
                marginBottom: 8,
                ...theme.cardShadow,
              }}
            >
              <AppText size={20}>{item.emoji}</AppText>
              <AppText weight={800} size={15} color={theme.ink}>
                {item.label}
              </AppText>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
