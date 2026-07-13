import React, { useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/Button';
import { FormField } from '../../components/FormField';
import { CameraIcon } from '../../components/icons';
import { useStore } from '../../lib/store';
import { useTheme } from '../../theme/ThemeProvider';
import { ageString } from '../../lib/time';

export function AddMilestoneScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const baby = useStore((s) => s.activeBaby());
  const addMilestone = useStore((s) => s.addMilestone);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('✨');
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  const save = () => {
    addMilestone({
      name: name || 'New memory',
      emoji: emoji || '✨',
      ageLabel: ageString(baby.dob),
      date: new Date().toISOString(),
      photoUri,
    });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1 }}>
        <AppText weight={900} size={26} color={theme.ink} style={{ marginBottom: 18 }}>
          Add memory
        </AppText>
        <View style={{ gap: 12 }}>
          <Pressable
            onPress={pickPhoto}
            style={{
              height: 140,
              borderRadius: 22,
              backgroundColor: photoUri ? theme.surface : '#FFE8D6',
              borderWidth: photoUri ? 0 : 2,
              borderColor: '#E9B893',
              borderStyle: 'dashed',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              overflow: 'hidden',
            }}
          >
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={{ width: '100%', height: 140 }} resizeMode="cover" />
            ) : (
              <>
                <CameraIcon />
                <AppText weight={700} size={12} color="#CE8B5C">
                  Add a photo
                </AppText>
              </>
            )}
          </Pressable>
          <FormField label="What happened" value={name} onChangeText={setName} placeholder="e.g. First giggle" />
          <FormField label="Emoji" value={emoji} onChangeText={setEmoji} placeholder="✨" />
        </View>
        <View style={{ flex: 1, minHeight: 24 }} />
        <PrimaryButton label="Save memory" onPress={save} />
      </ScrollView>
    </SafeAreaView>
  );
}
