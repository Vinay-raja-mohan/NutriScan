import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { Inter_400Regular } from '@expo-google-fonts/inter';
import { useUserStore } from './src/store/userStore';
import { usePlanStore } from './src/store/planStore';
import { useWasteStore } from './src/store/wasteStore';
import { AppNavigator } from './src/navigation/AppNavigator';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from './src/theme/colors';

export default function App() {
  const { loadProfile, isOnboardingComplete, isLoading } = useUserStore();
  const { loadPlan, loadWater } = usePlanStore();
  const { loadTracker } = useWasteStore();

  let [fontsLoaded] = useFonts({
    SpaceGrotesk_700Bold,
    Inter_400Regular,
  });

  useEffect(() => {
    loadProfile();
    loadPlan();
    loadWater();
    loadTracker();
  }, []);

  if (isLoading || !fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const BioluminescentTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: Colors.background,
      card: Colors.surface,
      text: Colors.textPrimary,
      border: Colors.border,
      primary: Colors.primary,
    },
  };

  return (
    <NavigationContainer theme={BioluminescentTheme}>
      <AppNavigator isOnboardingComplete={isOnboardingComplete} />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
