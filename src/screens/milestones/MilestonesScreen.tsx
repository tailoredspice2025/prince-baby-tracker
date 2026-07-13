import React from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AppText } from '../../components/AppText';
import { SmallPlusIcon } from '../../components/icons';
import { useStore } from '../../lib/store';
import { useTheme } from '../../theme/ThemeProvider';
import { radii } from '../../theme/tokens';
import { pastels, PastelKey } from '../../theme/tokens';

const CARD_COLORS: PastelKey[] = ['peach', 'lavender', 'sky', 'sage', 'rose', 'sand'];

export function MilestonesScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const baby = useStore((s) => s.activeBaby());
  const achieved = useStore((s) => s.milestonesAchieved).filter((m) => m.babyId === baby.id);
  const upcoming = useStore((s) => s.milestonesUpcoming).filter((m) => m.babyId === baby.id);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <AppText weight={900} size={26} color={theme.ink} style={{ marginBottom: 4 }}>
          Milestones
        </AppText>
        <AppText weight={700} size={13.5} color={theme.textSecondary} style={{ marginBottom: 18 }}>
          {achieved.length} of {achieved.length + upcoming.length} for months 0–4 ✨
        </AppText>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          {achieved.map((m, i) => {
            const c = pastels[CARD_COLORS[i % CARD_COLORS.length]];
            return (
              <View key={m.id} style={{ width: '47%', backgroundColor: theme.surface, borderRadius: radii.cardLg, overflow: 'hidden', ...theme.cardShadow }}>
                <View style={{ height: 110, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
                  {m.photoUri ? (
                    <Image source={{ uri: m.photoUri }} style={{ width: '100%', height: 110 }} resizeMode="cover" />
                  ) : (
                    <AppText size={34}>{m.emoji}</AppText>
                  )}
                </View>
                <View style={{ padding: 12, paddingHorizontal: 14 }}>
                  <AppText weight={800} size={14} color={theme.ink}>
                    {m.name}
                  </AppText>
                  <AppText weight={700} size={11.5} color={theme.textSecondary}>
                    {m.ageLabel} · {m.date ? new Date(m.date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                  </AppText>
                </View>
              </View>
            );
          })}
          <Pressable
            onPress={() => navigation.navigate('AddMilestone')}
            style={{
              width: '47%',
              minHeight: 160,
              backgroundColor: theme.bg,
              borderWidth: 2,
              borderColor: '#E0CDB4',
              borderStyle: 'dashed',
              borderRadius: radii.cardLg,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0E4D2', alignItems: 'center', justifyContent: 'center' }}>
              <SmallPlusIcon />
            </View>
            <AppText weight={800} size={12.5} color="#A98F73">
              Add memory
            </AppText>
          </Pressable>
        </View>

        <AppText weight={900} size={15} color={theme.ink} style={{ marginBottom: 10 }}>
          Coming up
        </AppText>
        <View style={{ backgroundColor: theme.surface, borderRadius: radii.cardLg, overflow: 'hidden', ...theme.cardShadow }}>
          {upcoming.map((m, i) => (
            <View
              key={m.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 13,
                paddingHorizontal: 16,
                borderBottomWidth: i === upcoming.length - 1 ? 0 : 1,
                borderBottomColor: theme.border,
              }}
            >
              <AppText size={18}>{m.emoji}</AppText>
              <AppText weight={800} size={14} color={theme.ink} style={{ flex: 1 }}>
                {m.name}
              </AppText>
              <AppText weight={700} size={11.5} color={theme.textTertiary}>
                {m.typicalAgeRange}
              </AppText>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
