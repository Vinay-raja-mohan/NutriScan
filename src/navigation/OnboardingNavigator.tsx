import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from './types';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { PersonalInfoScreen } from '../screens/onboarding/PersonalInfoScreen';
import { HealthScreen } from '../screens/onboarding/HealthScreen';
import { DietaryScreen } from '../screens/onboarding/DietaryScreen';
import { GoalsScreen } from '../screens/onboarding/GoalsScreen';
import { SetupCompleteScreen } from '../screens/onboarding/SetupCompleteScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
    <Stack.Screen name="Health" component={HealthScreen} />
    <Stack.Screen name="Dietary" component={DietaryScreen} />
    <Stack.Screen name="Goals" component={GoalsScreen} />
    <Stack.Screen name="SetupComplete" component={SetupCompleteScreen} />
  </Stack.Navigator>
);
