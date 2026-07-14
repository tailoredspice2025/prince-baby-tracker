import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useStore } from '../lib/store';
import { MainTabs } from './MainTabs';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { VoicePermissionsScreen } from '../screens/voice/VoicePermissionsScreen';
import { VaccineFormScreen } from '../screens/voice/VaccineFormScreen';
import { MedicineFormScreen } from '../screens/health/MedicineFormScreen';
import { SicknessFormScreen } from '../screens/health/SicknessFormScreen';
import { AddMeasurementScreen } from '../screens/growth/AddMeasurementScreen';
import { MilestonesScreen } from '../screens/milestones/MilestonesScreen';
import { TrendsScreen } from '../screens/trends/TrendsScreen';
import { DayTimelineScreen } from '../screens/trends/DayTimelineScreen';
import { AddMilestoneScreen } from '../screens/milestones/AddMilestoneScreen';
import { AddBabyScreen } from '../screens/profile/AddBabyScreen';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const onboarded = useStore((s) => s.onboarded);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!onboarded && <Stack.Screen name="Onboarding" component={OnboardingScreen} />}
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="Milestones" component={MilestonesScreen} />
      <Stack.Screen name="Trends" component={TrendsScreen} />
      <Stack.Screen name="DayLog" component={DayTimelineScreen} />
      <Stack.Screen name="VoicePermissions" component={VoicePermissionsScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="VaccineForm" component={VaccineFormScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="MedicineForm" component={MedicineFormScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="SicknessForm" component={SicknessFormScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="AddMeasurement" component={AddMeasurementScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="AddMilestone" component={AddMilestoneScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="AddBaby" component={AddBabyScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
