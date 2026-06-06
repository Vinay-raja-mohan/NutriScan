import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { Colors } from '../theme/colors';
import { FontSizes, FontWeights } from '../theme/typography';
import { Radius, Shadow } from '../theme/spacing';

// Screens
import { HomeScreen } from '../screens/home/HomeScreen';
import { ScannerScreen } from '../screens/scanner/ScannerScreen';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { PlannerScreen } from '../screens/planner/PlannerScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TabIcon: React.FC<{ emoji: string; label: string; focused: boolean }> = ({
  emoji, label, focused,
}) => (
  <View style={[styles.tabItem, focused && styles.tabItemActive]}>
    <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>{emoji}</Text>
    <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
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
        tabBarIcon: ({ focused }) => <TabIcon emoji="🔍" label="Scan" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="Chat"
      component={ChatScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon emoji="🤖" label="AI Chat" focused={focused} />,
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
        tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profile" focused={focused} />,
      }}
    />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    height: Platform.OS === 'ios' ? 84 : 68,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    ...Shadow.md,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.lg,
    minWidth: 56,
  },
  tabItemActive: {
    backgroundColor: Colors.primaryMuted,
  },
  tabEmoji: {
    fontSize: 20,
    opacity: 0.6,
  },
  tabEmojiActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    color: Colors.tabInactive,
    marginTop: 2,
  },
  tabLabelActive: {
    color: Colors.tabActive,
    fontWeight: FontWeights.semibold,
  },
});
