import React from 'react';
import { Modal, Pressable, View } from 'react-native';
import { AppText } from './AppText';
import { useStore } from '../lib/store';
import { useTheme } from '../theme/ThemeProvider';
import { PastelKey, pastels, radii } from '../theme/tokens';
import { DiaperEvent } from '../types/models';

export type PickerType = 'bottle' | 'diaper' | 'solids' | 'pump' | 'medicine';

const CONFIG: Record<
  PickerType,
  {
    title: string;
    pastel: PastelKey;
    options: { label: string; opts: { quantityMl?: number; kind?: DiaperEvent['kind']; food?: string; name?: string; dose?: string } }[];
  }
> = {
  bottle: {
    title: 'Bottle — how much?',
    pastel: 'peach',
    options: [60, 90, 120, 150, 180].map((ml) => ({ label: `${ml} ml`, opts: { quantityMl: ml } })),
  },
  diaper: {
    title: 'Diaper — what kind?',
    pastel: 'sky',
    options: (['wet', 'dirty', 'both'] as const).map((kind) => ({ label: kind, opts: { kind } })),
  },
  solids: {
    title: 'Solids — what food?',
    pastel: 'sage',
    options: ['pear', 'apple', 'banana', 'carrot', 'oat cereal', 'sweet potato'].map((food) => ({ label: food, opts: { food } })),
  },
  pump: {
    title: 'Pump — how much?',
    pastel: 'rose',
    options: [60, 90, 120, 150].map((ml) => ({ label: `${ml} ml`, opts: { quantityMl: ml } })),
  },
  medicine: {
    title: 'Medicine — which one?',
    pastel: 'sand',
    options: [
      { name: 'Vitamin D drops', dose: '400 IU' },
      { name: 'Paracetamol', dose: '2.5 ml' },
      { name: 'Ibuprofen', dose: '2.5 ml' },
      { name: 'Colic drops', dose: '' },
      { name: 'Iron drops', dose: '' },
    ].map((m) => ({ label: m.name, opts: { name: m.name, dose: m.dose } })),
  },
};

/** Bottom sheet opened by long-pressing a quick-log tile: pick the amount
 * or kind instead of logging the tile's default. */
export function QuickLogPicker({ type, onClose }: { type: PickerType | null; onClose: () => void }) {
  const theme = useTheme();
  const logQuickEvent = useStore((s) => s.logQuickEvent);
  if (!type) return null;
  const cfg = CONFIG[type];
  const p = pastels[cfg.pastel];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(32,25,20,0.35)', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable
          style={{
            backgroundColor: theme.bg,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            padding: 20,
            paddingBottom: 40,
          }}
        >
          <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: theme.border, alignSelf: 'center', marginBottom: 16 }} />
          <AppText weight={900} size={17} color={theme.ink} style={{ marginBottom: 14 }}>
            {cfg.title}
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {cfg.options.map((o) => (
              <Pressable
                key={o.label}
                onPress={() => {
                  logQuickEvent(type, o.opts);
                  onClose();
                }}
                style={{
                  backgroundColor: p.bg,
                  borderRadius: radii.pill,
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  minWidth: '29%',
                  alignItems: 'center',
                }}
              >
                <AppText weight={800} size={14.5} color={p.title}>
                  {o.label}
                </AppText>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
