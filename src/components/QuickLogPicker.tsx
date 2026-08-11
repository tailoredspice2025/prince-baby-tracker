import React, { useMemo } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppText } from './AppText';
import { useStore } from '../lib/store';
import { medicineOptions } from '../lib/medicinePick';
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
  // Medicine has no fixed options — they are the parent's own medicines,
  // filled in by the component below. The hardcoded five made the picker
  // useless to anyone giving vitamins B, C and D separately.
  medicine: {
    title: 'Medicine — which one?',
    pastel: 'sand',
    options: [],
  },
};

/** Bottom sheet opened by long-pressing a quick-log tile: pick the amount
 * or kind instead of logging the tile's default. */
export function QuickLogPicker({ type, onClose }: { type: PickerType | null; onClose: () => void }) {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const logQuickEvent = useStore((s) => s.logQuickEvent);
  const babyId = useStore((s) => s.activeBabyId);
  const medications = useStore((s) => s.medications);
  const myMedicines = useMemo(() => medicineOptions(medications, babyId), [medications, babyId]);
  if (!type) return null;
  const cfg = CONFIG[type];
  const p = pastels[cfg.pastel];
  const options =
    type === 'medicine'
      ? myMedicines.map((m) => ({ label: m.dose ? `${m.name} · ${m.dose}` : m.name, opts: { name: m.name, dose: m.dose } }))
      : cfg.options;

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
            {type === 'medicine' && myMedicines.length === 0 ? 'No medicines yet' : cfg.title}
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {options.map((o) => (
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
          {type === 'medicine' && (
            <Pressable
              onPress={() => {
                onClose();
                navigation.navigate('MedicineForm');
              }}
              style={{
                marginTop: myMedicines.length ? 12 : 0,
                borderWidth: 2,
                borderColor: '#E0CDB4',
                borderStyle: 'dashed',
                borderRadius: radii.pill,
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <AppText weight={800} size={14} color="#A98F73">
                {myMedicines.length ? '+ Add another medicine' : '+ Add a medicine'}
              </AppText>
            </Pressable>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
