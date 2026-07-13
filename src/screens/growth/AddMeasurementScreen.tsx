import React, { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AppText } from '../../components/AppText';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/Button';
import { useStore } from '../../lib/store';
import { useTheme } from '../../theme/ThemeProvider';
import { radii } from '../../theme/tokens';

function Field({ label, value, onChangeText, suffix }: { label: string; value: string; onChangeText: (t: string) => void; suffix: string }) {
  const theme = useTheme();
  return (
    <Card radius={radii.card} padding={14} style={{ paddingHorizontal: 18 }}>
      <AppText weight={800} size={11} color={theme.textTertiary} letterSpacing={1} uppercase>
        {label}
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <TextInput
          value={value}
          onChangeText={(t) => onChangeText(t.replace(/[^0-9.]/g, ''))}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={theme.textTertiary}
          style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 18, color: theme.ink, padding: 0, marginTop: 2 }}
        />
        <AppText weight={700} size={14} color={theme.textSecondary}>
          {' '}
          {suffix}
        </AppText>
      </View>
    </Card>
  );
}

export function AddMeasurementScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const addMeasurement = useStore((s) => s.addMeasurement);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [head, setHead] = useState('');

  const save = () => {
    addMeasurement({
      date: new Date().toISOString(),
      weightKg: weight ? parseFloat(weight) : undefined,
      heightCm: height ? parseFloat(height) : undefined,
      headCm: head ? parseFloat(head) : undefined,
    });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1 }}>
        <AppText weight={900} size={26} color={theme.ink} style={{ marginBottom: 4 }}>
          Add measurement
        </AppText>
        <AppText weight={700} size={13.5} color={theme.textSecondary} style={{ marginBottom: 18 }}>
          Leave any field blank to skip it
        </AppText>
        <View style={{ gap: 12 }}>
          <Field label="Weight" value={weight} onChangeText={setWeight} suffix="kg" />
          <Field label="Height / length" value={height} onChangeText={setHeight} suffix="cm" />
          <Field label="Head circumference" value={head} onChangeText={setHead} suffix="cm" />
        </View>
        <View style={{ flex: 1, minHeight: 24 }} />
        <PrimaryButton label="Save measurement" onPress={save} />
      </ScrollView>
    </SafeAreaView>
  );
}
