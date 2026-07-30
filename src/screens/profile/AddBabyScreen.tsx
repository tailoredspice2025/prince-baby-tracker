import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/Button';
import { FormField } from '../../components/FormField';
import { DateField } from '../../components/DateField';
import { Segmented } from '../../components/Segmented';
import { useStore } from '../../lib/store';
import { useTheme } from '../../theme/ThemeProvider';

export function AddBabyScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const addBaby = useStore((s) => s.addBaby);
  const [name, setName] = useState('');
  const [dob, setDob] = useState<Date>(new Date());
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [sex, setSex] = useState<'male' | 'female'>('male');

  const save = () => {
    addBaby({
      name: name || 'Baby',
      dob: dob.toISOString().slice(0, 10),
      birthWeightKg: parseFloat(weight) || 3.3,
      birthLengthCm: parseFloat(length) || 50,
      sex,
    });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1 }}>
        <AppText weight={900} size={26} color={theme.ink} style={{ marginBottom: 18 }}>
          Add another baby
        </AppText>
        <View style={{ gap: 12 }}>
          <FormField label="Name" value={name} onChangeText={setName} placeholder="Baby's name" />
          <DateField label="Born" value={dob} onChange={setDob} maximumDate={new Date()} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <FormField label="Birth weight (kg)" value={weight} onChangeText={(t) => setWeight(t.replace(/[^0-9.]/g, ''))} placeholder="3.3" keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="Length (cm)" value={length} onChangeText={(t) => setLength(t.replace(/[^0-9.]/g, ''))} placeholder="50" keyboardType="numeric" />
            </View>
          </View>
          <View style={{ backgroundColor: theme.surface, borderRadius: 18, padding: 14, paddingHorizontal: 18, ...theme.cardShadow }}>
            <AppText weight={800} size={11} color={theme.textTertiary} letterSpacing={1} uppercase style={{ marginBottom: 8 }}>
              Sex
            </AppText>
            <Segmented
              options={[
                { key: 'male', label: 'Boy' },
                { key: 'female', label: 'Girl' },
              ] as const}
              value={sex}
              onChange={setSex}
            />
          </View>
        </View>
        <View style={{ flex: 1, minHeight: 24 }} />
        <PrimaryButton label="Add baby" onPress={save} disabled={!name} />
      </ScrollView>
    </SafeAreaView>
  );
}
