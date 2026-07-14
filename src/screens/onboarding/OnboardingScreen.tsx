import React, { useState } from 'react';
import { Image, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { AppText } from '../../components/AppText';
import { CameraIcon } from '../../components/icons';
import { PrimaryButton, TextLink } from '../../components/Button';
import { useStore } from '../../lib/store';
import { useTheme } from '../../theme/ThemeProvider';
import { radii } from '../../theme/tokens';

function FieldCard({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  style,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
  style?: any;
}) {
  const theme = useTheme();
  return (
    <View style={[{ backgroundColor: theme.surface, borderRadius: radii.card, padding: 14, paddingHorizontal: 18, ...theme.cardShadow }, style]}>
      <AppText weight={800} size={11} color={theme.textTertiary} letterSpacing={1} uppercase>
        {label}
      </AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textTertiary}
        keyboardType={keyboardType}
        style={{ fontFamily: 'Nunito_700Bold', fontSize: 18, color: theme.ink, padding: 0, marginTop: 2 }}
      />
    </View>
  );
}

export function OnboardingScreen() {
  const theme = useTheme();
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const [name, setName] = useState('Prince');
  const [born, setBorn] = useState('March 8, 2026');
  const [weight, setWeight] = useState('3.4');
  const [length, setLength] = useState('51');
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  const submit = () => {
    // "Born" is free text (e.g. "March 8, 2026" or "2026-03-08") — keep the
    // seeded dob only if it can't be parsed as a date.
    const parsedDob = new Date(born);
    completeOnboarding({
      name: name || 'Prince',
      ...(isNaN(parsedDob.getTime()) ? {} : { dob: parsedDob.toISOString().slice(0, 10) }),
      birthWeightKg: parseFloat(weight) || 3.4,
      birthLengthCm: parseFloat(length) || 51,
      sex,
      photoUri,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 24, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 34 }}>
          <View style={{ height: 5, flex: 1, borderRadius: 3, backgroundColor: theme.coral }} />
          <View style={{ height: 5, flex: 1, borderRadius: 3, backgroundColor: '#EFDFCB' }} />
          <View style={{ height: 5, flex: 1, borderRadius: 3, backgroundColor: '#EFDFCB' }} />
        </View>

        <Pressable
          onPress={pickPhoto}
          style={{
            width: 128,
            height: 128,
            borderRadius: 64,
            backgroundColor: '#FFE8D6',
            borderWidth: 2,
            borderColor: '#E9B893',
            borderStyle: photoUri ? 'solid' : 'dashed',
            alignSelf: 'center',
            marginBottom: 10,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            overflow: 'hidden',
          }}
        >
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={{ width: 128, height: 128 }} />
          ) : (
            <>
              <CameraIcon />
              <AppText weight={700} size={11} color="#CE8B5C">
                Add photo
              </AppText>
            </>
          )}
        </Pressable>

        <AppText weight={900} size={28} color={theme.ink} center>
          Hello, little one
        </AppText>
        <AppText size={14} color={theme.textSecondary} center style={{ marginTop: 4, marginBottom: 28 }}>
          Tell us about your baby
        </AppText>

        <View style={{ gap: 12 }}>
          <FieldCard label="Name" value={name} onChangeText={setName} placeholder="Baby's name" />
          <FieldCard label="Born" value={born} onChangeText={setBorn} placeholder="Date of birth" />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <FieldCard label="Birth weight" value={`${weight} kg`} onChangeText={(t) => setWeight(t.replace(/[^0-9.]/g, ''))} keyboardType="numeric" style={{ flex: 1 }} />
            <FieldCard label="Length" value={`${length} cm`} onChangeText={(t) => setLength(t.replace(/[^0-9.]/g, ''))} keyboardType="numeric" style={{ flex: 1 }} />
          </View>
          <View style={{ backgroundColor: theme.surface, borderRadius: radii.card, padding: 14, paddingHorizontal: 18, ...theme.cardShadow }}>
            <AppText weight={800} size={11} color={theme.textTertiary} letterSpacing={1} uppercase style={{ marginBottom: 8 }}>
              Sex — for growth percentiles
            </AppText>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {([
                { key: 'male', label: 'Boy' },
                { key: 'female', label: 'Girl' },
              ] as const).map((opt) => {
                const active = sex === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => setSex(opt.key)}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      paddingVertical: 9,
                      borderRadius: 999,
                      backgroundColor: active ? theme.ink : '#F0E4D2',
                    }}
                  >
                    <AppText weight={active ? 800 : 700} size={13.5} color={active ? '#F5E9DB' : theme.textSecondary}>
                      {opt.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View style={{ flex: 1, minHeight: 24 }} />
        <PrimaryButton label="Continue" onPress={submit} />
        <TextLink label="Invite a caregiver later" onPress={submit} />
      </ScrollView>
    </SafeAreaView>
  );
}
