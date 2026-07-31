import React, { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/Button';
import { FormField } from '../../components/FormField';
import { DateField } from '../../components/DateField';
import { FormScreen } from '../../components/FormScreen';
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
  const [date, setDate] = useState(() => new Date());

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
      // Age at the time of the memory, not the age today.
      ageLabel: ageString(baby.dob, date),
      date: date.toISOString(),
      photoUri,
    });
    navigation.goBack();
  };

  return (
    <FormScreen title="Add memory" actions={<PrimaryButton label="Save memory" onPress={save} />}>
      <>
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
          <DateField label="When it happened" value={date} onChange={setDate} minimumDate={new Date(baby.dob)} maximumDate={new Date()} />
        </View>
      </>
    </FormScreen>
  );
}
