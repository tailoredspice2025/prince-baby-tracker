import React from 'react';
import { Platform, Pressable, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { AppText } from './AppText';
import { PlusIcon, HomeTabIcon, GrowthTabIcon, HealthTabIcon, BabyTabIcon } from './icons';
import { useTheme } from '../theme/ThemeProvider';
import { useStore } from '../lib/store';

const ICONS: Record<string, (active: boolean, color: string) => React.ReactNode> = {
  Home: (active, color) => <HomeTabIcon filled={active} color={active ? '#E98862' : color} />,
  Growth: (_a, color) => <GrowthTabIcon color={color} />,
  Health: (_a, color) => <HealthTabIcon color={color} />,
  Profile: (_a, color) => <BabyTabIcon color={color} />,
};

const LABELS: Record<string, string> = { Home: 'Home', Growth: 'Growth', Health: 'Health', Profile: 'Baby' };

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const openQuickAdd = useStore((s) => s.openQuickAdd);

  return (
    <View style={{ position: 'absolute', left: 20, right: 20, bottom: 24 }}>
      <View
        style={{
          borderRadius: 999,
          overflow: 'hidden',
          shadowColor: 'rgba(120,90,60,1)',
          shadowOpacity: 0.18,
          shadowOffset: { width: 0, height: 8 },
          shadowRadius: 24,
          elevation: 8,
        }}
      >
        <BlurView
          intensity={theme.mode === 'night' ? 40 : 60}
          tint={theme.mode === 'night' ? 'dark' : 'light'}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 10,
            paddingHorizontal: 24,
            backgroundColor:
              Platform.OS === 'android'
                ? theme.mode === 'night'
                  ? 'rgba(43,39,57,0.96)'
                  : 'rgba(255,255,255,0.96)'
                : theme.mode === 'night'
                ? 'rgba(43,39,57,0.75)'
                : 'rgba(255,255,255,0.75)',
          }}
        >
          {state.routes.slice(0, 2).map((route, i) => {
            const active = state.index === i;
            const color = active ? theme.coralDeep : theme.mode === 'night' ? theme.textSecondary : '#B3A493';
            return (
              <Pressable
                key={route.key}
                onPress={() => {
                  Haptics.selectionAsync();
                  navigation.navigate(route.name);
                }}
                style={{ alignItems: 'center', gap: 3 }}
              >
                {ICONS[route.name]?.(active, color)}
                <AppText weight={active ? 800 : 700} size={10} color={color}>
                  {LABELS[route.name]}
                </AppText>
              </Pressable>
            );
          })}

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              openQuickAdd();
            }}
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: theme.coral,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: -26,
              shadowColor: 'rgba(233,136,98,1)',
              shadowOpacity: 0.4,
              shadowOffset: { width: 0, height: 6 },
              shadowRadius: 16,
              elevation: 6,
            }}
          >
            <PlusIcon size={20} color="#fff" />
          </Pressable>

          {state.routes.slice(2, 4).map((route, idx) => {
            const i = idx + 2;
            const active = state.index === i;
            const color = active ? theme.coralDeep : theme.mode === 'night' ? theme.textSecondary : '#B3A493';
            return (
              <Pressable
                key={route.key}
                onPress={() => {
                  Haptics.selectionAsync();
                  navigation.navigate(route.name);
                }}
                style={{ alignItems: 'center', gap: 3 }}
              >
                {ICONS[route.name]?.(active, color)}
                <AppText weight={active ? 800 : 700} size={10} color={color}>
                  {LABELS[route.name]}
                </AppText>
              </Pressable>
            );
          })}
        </BlurView>
      </View>
    </View>
  );
}
