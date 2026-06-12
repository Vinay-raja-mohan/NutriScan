import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
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

const TabIcon: React.FC<{ icon: any; label: string; focused: boolean }> = ({
  icon, label, focused,
}) => (
  <View style={[styles.tabItem, focused && styles.tabItemActive]}>
    <Ionicons name={icon} size={22} color={focused ? Colors.tabActive : Colors.tabInactive} />
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
        tabBarIcon: ({ focused }) => <TabIcon icon={focused ? "home" : "home-outline"} label="Home" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="Scanner"
      component={ScannerScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon icon={focused ? "scan" : "scan-outline"} label="Scan" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="Chat"
      component={ChatScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon icon={focused ? "chatbubble" : "chatbubble-outline"} label="AI Chat" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="Planner"
      component={PlannerScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon icon={focused ? "calendar" : "calendar-outline"} label="Plan" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon icon={focused ? "person" : "person-outline"} label="Profile" focused={focused} />,
      }}
    />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    borderRadius: Radius['2xl'],
    backgroundColor: Colors.surface,
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 76 : 68,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
    paddingTop: 8,
    paddingHorizontal: 8,
    ...Shadow.md,
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.lg,
    minWidth: 56,
  },
  tabItemActive: {
    backgroundColor: Colors.primaryMuted,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: FontWeights.medium,
    color: Colors.tabInactive,
    marginTop: 4,
  },
  tabLabelActive: {
    color: Colors.tabActive,
    fontWeight: FontWeights.bold,
  },
});
