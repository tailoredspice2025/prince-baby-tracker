import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FloatingTabBar } from '../components/FloatingTabBar';
import { HomeScreen } from '../screens/home/HomeScreen';
import { GrowthScreen } from '../screens/growth/GrowthScreen';
import { HealthScreen } from '../screens/health/HealthScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

export function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <FloatingTabBar {...props} />}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Growth" component={GrowthScreen} />
      <Tab.Screen name="Health" component={HealthScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
