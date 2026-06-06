import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { OnboardingNavigator } from './OnboardingNavigator';
import { MainTabNavigator } from './MainTabNavigator';

const RootStack = createNativeStackNavigator<RootStackParamList>();

interface AppNavigatorProps {
  isOnboardingComplete: boolean;
}

export const AppNavigator: React.FC<AppNavigatorProps> = ({ isOnboardingComplete }) => (
  <RootStack.Navigator screenOptions={{ headerShown: false }}>
    {!isOnboardingComplete ? (
      <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
    ) : (
      <RootStack.Screen name="MainApp" component={MainTabNavigator} />
    )}
  </RootStack.Navigator>
);
