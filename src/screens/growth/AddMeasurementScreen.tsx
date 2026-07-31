import React, { useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { AppText } from '../../components/AppText';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/Button';
import { DateField } from '../../components/DateField';
import { FormScreen } from '../../components/FormScreen';
import { useStore } from '../../lib/store';
import { useTheme } from '../../theme/ThemeProvider';
import { radii } from '../../theme/tokens';

function Field({ label, value, onChangeText, suffix }: { label: string; value: string; onChangeText: (t: string) => void; suffix: string }) {
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);
  return (
    // Tapping anywhere in the card focuses the input. The input used to sit in
    // a row with no `flex`, so an empty field was one character wide and only a
    // sliver at the far left opened the keypad.
    <Pressable onPress={() => inputRef.current?.focus()}>
      <Card radius={radii.card} padding={14} style={{ paddingHorizontal: 18 }}>
        <AppText weight={800} size={11} color={theme.textTertiary} letterSpacing={1} uppercase>
          {label}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={(t) => onChangeText(t.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            returnKeyType="done"
            placeholder="0"
            placeholderTextColor={theme.textTertiary}
            style={{ flex: 1, fontFamily: 'Nunito_800ExtraBold', fontSize: 18, color: theme.ink, paddingVertical: 6, marginTop: 2 }}
          />
          <AppText weight={700} size={14} color={theme.textSecondary}>
            {suffix}
          </AppText>
        </View>
      </Card>
    </Pressable>
  );
}

/**
 * Add or edit a measurement.
 *
 * The date is picked, not assumed. It used to be hardcoded to `new Date()`,
 * which matters more here than anywhere else in the app: the growth chart
 * plots against age (`date − dob`), so a weight from last week's clinic visit
 * entered today landed at the wrong age and reported the **wrong WHO
 * percentile**. Transcribing from the red book afterwards is the normal way
 * this screen gets used, not an edge case.
 */
export function AddMeasurementScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ AddMeasurement: { measurementId?: string } }, 'AddMeasurement'>>();
  const editingId = route.params?.measurementId;

  const baby = useStore((s) => s.activeBaby());
  const existing = useStore((s) => s.measurements.find((m) => m.id === editingId));
  const addMeasurement = useStore((s) => s.addMeasurement);
  const updateMeasurement = useStore((s) => s.updateMeasurement);
  const deleteMeasurement = useStore((s) => s.deleteMeasurement);

  const [date, setDate] = useState<Date>(existing ? new Date(existing.date) : new Date());
  const [weight, setWeight] = useState(existing?.weightKg != null ? String(existing.weightKg) : '');
  const [height, setHeight] = useState(existing?.heightCm != null ? String(existing.heightCm) : '');
  const [head, setHead] = useState(existing?.headCm != null ? String(existing.headCm) : '');

  const num = (t: string) => {
    const n = parseFloat(t);
    return t && Number.isFinite(n) ? n : undefined;
  };

  const save = () => {
    const payload = {
      date: date.toISOString(),
      weightKg: num(weight),
      heightCm: num(height),
      headCm: num(head),
    };
    if (editingId) updateMeasurement(editingId, payload);
    else addMeasurement(payload);
    navigation.goBack();
  };

  const remove = () => {
    if (editingId) deleteMeasurement(editingId);
    navigation.goBack();
  };

  const nothingEntered = !weight && !height && !head;

  return (
    <FormScreen
      title={editingId ? 'Edit measurement' : 'Add measurement'}
      actions={
        <View style={{ gap: 10 }}>
          <PrimaryButton label={editingId ? 'Save changes' : 'Save measurement'} onPress={save} disabled={nothingEntered} />
          {editingId && (
            <Pressable onPress={remove} style={{ backgroundColor: '#F7D6DC', borderRadius: 999, paddingVertical: 14, alignItems: 'center' }}>
              <AppText weight={800} size={14.5} color="#A04E63">
                Delete measurement
              </AppText>
            </Pressable>
          )}
        </View>
      }
    >
      <AppText weight={700} size={13.5} color={theme.textSecondary} style={{ marginBottom: 18 }}>
        Leave any field blank to skip it
      </AppText>
      <View style={{ gap: 12 }}>
        {/* Can't be before the baby was born, can't be in the future — both
            would put the point off the growth curve entirely. */}
        <DateField label="Date measured" value={date} onChange={setDate} minimumDate={new Date(baby.dob)} maximumDate={new Date()} />
        <Field label="Weight" value={weight} onChangeText={setWeight} suffix="kg" />
        <Field label="Height / length" value={height} onChangeText={setHeight} suffix="cm" />
        <Field label="Head circumference" value={head} onChangeText={setHead} suffix="cm" />
      </View>
    </FormScreen>
  );
}
