import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { Colors } from '../theme/colors';
import { FontSizes, FontWeights, FontFamily } from '../theme/typography';
import { Radius, Shadow, Spacing } from '../theme/spacing';

import { HomeScreen } from '../screens/home/HomeScreen';
import { ScannerScreen } from '../screens/scanner/ScannerScreen';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { PlannerScreen } from '../screens/planner/PlannerScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TabIcon: React.FC<{ emoji: string; label: string; focused: boolean }> = ({
  emoji, label, focused,
}) => (
  <View style={styles.tabItem}>
    <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>{emoji}</Text>
    {focused && <Text style={styles.tabLabel}>{label}</Text>}
    {focused && <View style={styles.tabDot} />}
  </View>
);

// Elevated FAB-style scan button
const ScannerTabIcon: React.FC<{ focused: boolean }> = ({ focused }) => (
  <View style={styles.fabWrapper}>
    <View style={[styles.fab, focused && styles.fabActive, Shadow.primaryGlow]}>
      <Text style={styles.fabIcon}>⬡</Text>
    </View>
  </View>
);

export const MainTabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarShowLabel: false,
    }}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="Scanner"
      component={ScannerScreen}
      options={{
        tabBarIcon: ({ focused }) => <ScannerTabIcon focused={focused} />,
        tabBarStyle: { display: 'none' }, // Hide tab bar on scanner (full screen cam)
      }}
    />
    <Tab.Screen
      name="Chat"
      component={ChatScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon emoji="🤖" label="AI" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="Planner"
      component={PlannerScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon emoji="📅" label="Plan" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Me" focused={focused} />,
      }}
    />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    height: Platform.OS === 'ios' ? 88 : 70,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 10,
    paddingHorizontal: Spacing[2],
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minWidth: 52,
  },
  tabEmoji: {
    fontSize: 22,
    opacity: 0.4,
  },
  tabEmojiActive: {
    opacity: 1,
  },
  tabLabel: {
    fontFamily: FontFamily.display,
    fontSize: 10,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
    marginTop: 1,
  },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginTop: 2,
  },
  // FAB Scanner Button
  fabWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 12 : 8,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabActive: {
    backgroundColor: Colors.primary,
  },
  fabIcon: {
    fontSize: 26,
  },
});
