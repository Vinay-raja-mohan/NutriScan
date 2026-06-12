import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../store/userStore';
import { usePlanStore } from '../../store/planStore';
import { useWasteStore } from '../../store/wasteStore';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { MacroBar } from '../../components/ui/MacroBar';
import { WaterTracker } from '../../components/WaterTracker';
import { Card } from '../../components/ui/Card';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights, FontFamily } from '../../theme/typography';
import { Spacing, Radius, Shadow } from '../../theme/spacing';
import { MOCK_DIET_PLAN } from '../../data/mockDietPlan';
import { getGreeting, getDayKey, formatINR, calculateTDEE } from '../../utils/helpers';
import { MealType, DayKey } from '../../types';

/** Colored letter badge config for each meal type */
const MEAL_BADGE: Record<MealType, { letter: string; color: string }> = {
  breakfast: { letter: 'B', color: '#F59E0B' },
  lunch:     { letter: 'L', color: '#22C55E' },
  dinner:    { letter: 'D', color: '#6366F1' },
  snack:     { letter: 'S', color: '#EC4899' },
};

/** Renders a colored circle with a single letter inside */
const MealBadge: React.FC<{ meal: MealType; size?: number }> = ({ meal, size = 32 }) => {
  const { letter, color } = MEAL_BADGE[meal];
  return (
    <View
      style={[
        styles.mealBadge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color + '22',
        },
      ]}
    >
      <Text
        style={[
          styles.mealBadgeLetter,
          { fontSize: size * 0.45, color },
        ]}
      >
        {letter}
      </Text>
    </View>
  );
};

export const HomeScreen: React.FC = () => {
  const { profile } = useUserStore();
  const { weeklyPlan, todayWaterGlasses, setWater, loadWater, setPlan, loadPlan, updateMealStatus } = usePlanStore();
  const { tracker } = useWasteStore();
  const navigation = useNavigation<any>();

  useEffect(() => {
    loadWater();
    loadPlan();
    // Seed mock plan if none exists
    if (!weeklyPlan && profile) {
      setPlan(MOCK_DIET_PLAN(profile.id));
    }
  }, [profile]);

  const dayKey: DayKey = getDayKey();
  const todayPlan = weeklyPlan?.days[dayKey];
  const targetCals = profile ? calculateTDEE(profile) : 1800;
  const meals: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  const consumed = todayPlan
    ? meals.filter(m => todayPlan[m].status === 'logged').reduce((s, m) => s + todayPlan[m].macros.calories, 0)
    : 0;
  const calorieProgress = Math.min((consumed / targetCals) * 100, 100);

  const [displayCals, setDisplayCals] = useState(0);
  useEffect(() => {
    if (consumed === 0) {
      setDisplayCals(0);
      return;
    }
    let start = 0;
    const duration = 800;
    const increment = consumed / (duration / 16);
    const interval = setInterval(() => {
      start += increment;
      if (start >= consumed) {
        setDisplayCals(consumed);
        clearInterval(interval);
      } else {
        setDisplayCals(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(interval);
  }, [consumed]);

  const totalMacros = todayPlan
    ? meals.reduce((acc, m) => ({
        calories: acc.calories + todayPlan[m].macros.calories,
        protein: acc.protein + todayPlan[m].macros.protein,
        carbs: acc.carbs + todayPlan[m].macros.carbs,
        fat: acc.fat + todayPlan[m].macros.fat,
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
    : { calories: 0, protein: 0, carbs: 0, fat: 0 };

  const toggleMeal = (meal: MealType) => {
    if (!todayPlan) return;
    const current = todayPlan[meal].status;
    const next = current === 'logged' ? 'upcoming' : 'logged';
    updateMealStatus(dayKey, meal, next);
  };

  const quickActions: { iconName: React.ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void }[] = [
    { iconName: 'scan-outline',        label: 'Scan Food',   onPress: () => navigation.navigate('Scanner', { initialTab: 'label' }) },
    { iconName: 'restaurant-outline',  label: 'Scan Recipe', onPress: () => navigation.navigate('Scanner', { initialTab: 'ingredient' }) },
    { iconName: 'chatbubble-outline',  label: 'Ask AI',      onPress: () => navigation.navigate('Chat') },
    { iconName: 'create-outline',      label: 'Edit Plan',   onPress: () => navigation.navigate('Planner') },
  ];

  return (
    <>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Hero Header */}
          <LinearGradient colors={Colors.gradientSoft} style={styles.header}>
            <BlurView intensity={20} tint="dark" style={styles.headerGlassPill}>
              <View>
                <Text style={styles.greeting}>{getGreeting()}, {profile?.name?.split(' ')[0] ?? 'there'}!</Text>
                <Text style={styles.headerSub}>Your Daily Overview</Text>
              </View>
            </BlurView>

            {/* Macro Rings */}
            <View style={styles.ringSection}>
              <View style={styles.ringStack}>
                <ProgressRing value={calorieProgress} size={200} strokeWidth={16} color={Colors.primary} trackColor="rgba(255,255,255,0.05)" />
                <View style={{ position: 'absolute' }}>
                  <ProgressRing value={totalMacros.protein ? Math.min((totalMacros.protein / 150) * 100, 100) : 0} size={150} strokeWidth={12} color={Colors.protein} trackColor="rgba(255,255,255,0.05)" />
                </View>
                <View style={{ position: 'absolute' }}>
                  <ProgressRing value={totalMacros.carbs ? Math.min((totalMacros.carbs / 250) * 100, 100) : 0} size={110} strokeWidth={10} color={Colors.carbs} trackColor="rgba(255,255,255,0.05)" />
                </View>
                <View style={{ position: 'absolute' }}>
                  <ProgressRing value={totalMacros.fat ? Math.min((totalMacros.fat / 70) * 100, 100) : 0} size={76} strokeWidth={8} color={Colors.fat} trackColor="rgba(255,255,255,0.05)" />
                </View>
                
                {/* Center Ticking Number */}
                <View style={styles.ringCenterText}>
                  <Text style={styles.ringCals}>{displayCals}</Text>
                  <Text style={styles.ringTarget}>/ {targetCals} kcal</Text>
                </View>
              </View>
              <View style={styles.macroSection}>
                <View style={styles.macroItem}>
                  <Text style={styles.macroValue}>{totalMacros.protein}g</Text>
                  <Text style={styles.macroLabel}>Protein</Text>
                </View>
                <View style={styles.macroDivider} />
                <View style={styles.macroItem}>
                  <Text style={styles.macroValue}>{totalMacros.carbs}g</Text>
                  <Text style={styles.macroLabel}>Carbs</Text>
                </View>
                <View style={styles.macroDivider} />
                <View style={styles.macroItem}>
                  <Text style={styles.macroValue}>{totalMacros.fat}g</Text>
                  <Text style={styles.macroLabel}>Fat</Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.body}>
            {/* Recent Logs (Horizontal Glass Cards) */}
            <View>
              <Text style={styles.sectionTitle}>TODAY'S LOGS</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing[4] }}>
                {todayPlan ? meals.map(meal => {
                  const slot = todayPlan[meal];
                  const logged = slot.status === 'logged';
                  if (!logged) return null; // Only show logged meals in recent logs
                  
                  return (
                    <BlurView key={meal} intensity={20} tint="dark" style={styles.glassLogCard}>
                      <View style={styles.glassLogHeader}>
                        <MealBadge meal={meal} size={32} />
                        <View style={styles.scoreShield}>
                          <Text style={styles.scoreText}>95%</Text>
                        </View>
                      </View>
                      <Text style={styles.glassLogName} numberOfLines={2}>{slot.name}</Text>
                      <Text style={styles.glassLogCals}>{slot.macros.calories} kcal</Text>
                    </BlurView>
                  );
                }) : null}
                {/* Add a prompt card if nothing is logged */}
                {(!todayPlan || !meals.some(m => todayPlan[m].status === 'logged')) && (
                  <BlurView intensity={20} tint="dark" style={[styles.glassLogCard, { justifyContent: 'center', alignItems: 'center' }]}>
                     <Ionicons name="camera-outline" size={24} color={Colors.textSecondary} />
                     <Text style={[styles.glassLogName, { textAlign: 'center', marginTop: Spacing[2] }]}>Nothing logged yet</Text>
                     <Text style={[styles.glassLogCals, { textAlign: 'center' }]}>Scan food to start</Text>
                  </BlurView>
                )}
              </ScrollView>
            </View>

            {/* Waste Saved */}
            <Card style={[styles.card, styles.wasteCard]}>
              <View style={styles.wasteRow}>
                <View style={styles.wasteIconCircle}>
                  <Ionicons name="leaf-outline" size={24} color={Colors.success} />
                </View>
                <View style={styles.wasteInfo}>
                  <Text style={styles.wasteTitle}>WASTE SAVED THIS WEEK</Text>
                  <Text style={styles.wasteValue}>{tracker?.mealsFromPantry ?? 0} meals from leftovers</Text>
                  <Text style={styles.wasteMoney}>Est. {formatINR(tracker?.moneySavedINR ?? 0)} saved</Text>
                </View>
                <View style={styles.co2Container}>
                  <Ionicons name="globe-outline" size={18} color={Colors.success} />
                  <Text style={styles.co2Text}>{(tracker?.co2AvoidedKg ?? 0).toFixed(1)}kg CO2</Text>
                </View>
              </View>
            </Card>

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
            <View style={styles.quickGrid}>
              {quickActions.map((a, i) => (
                <TouchableOpacity key={i} style={styles.quickBtn} activeOpacity={0.8} onPress={a.onPress}>
                  <Ionicons name={a.iconName} size={28} color={Colors.primary} />
                  <Text style={styles.quickLabel}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Water Tracker */}
            <Card style={styles.card}>
              <WaterTracker
                glasses={todayWaterGlasses}
                onGlassPress={setWater}
              />
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 120 },
  header: { padding: Spacing[5], paddingTop: Spacing[4], paddingBottom: Spacing[8] },
  headerGlassPill: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[6], padding: Spacing[4], borderRadius: Radius['2xl'], overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  greeting: { fontFamily: FontFamily.display, fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  headerSub: { fontFamily: FontFamily.body, fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
  ringSection: { alignItems: 'center', gap: Spacing[6] },
  ringStack: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  ringCenterText: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  ringCals: { fontFamily: FontFamily.display, fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.textPrimary },
  ringTarget: { fontFamily: FontFamily.body, fontSize: FontSizes.xs, color: Colors.textSecondary },
  macroSection: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: Radius['2xl'], padding: Spacing[4], gap: Spacing[4], borderWidth: 1, borderColor: Colors.border },
  macroItem: { alignItems: 'center', flex: 1 },
  macroValue: { fontFamily: FontFamily.display, fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  macroLabel: { fontFamily: FontFamily.body, fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
  macroDivider: { width: 1, backgroundColor: Colors.divider },
  body: { padding: Spacing[4], marginTop: -Spacing[4], gap: Spacing[3] },
  card: { borderRadius: Radius.xl },
  wasteCard: { backgroundColor: Colors.successLight },
  sectionTitle: { fontSize: FontSizes.xs, fontWeight: FontWeights.semibold, color: Colors.textSecondary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: Spacing[3] },
  glassLogCard: { width: 140, height: 160, borderRadius: Radius['2xl'], padding: Spacing[4], overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, backgroundColor: 'rgba(24,24,27,0.4)' },
  glassLogHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing[3] },
  scoreShield: { backgroundColor: Colors.successLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm },
  scoreText: { fontFamily: FontFamily.display, fontSize: 10, fontWeight: FontWeights.bold, color: Colors.success },
  glassLogName: { fontFamily: FontFamily.body, fontSize: FontSizes.sm, fontWeight: FontWeights.medium, color: Colors.textPrimary, flex: 1 },
  glassLogCals: { fontFamily: FontFamily.display, fontSize: FontSizes.xs, color: Colors.primaryLight, marginTop: 4, fontWeight: FontWeights.bold },
  mealBadge: { alignItems: 'center', justifyContent: 'center' },
  mealBadgeLetter: { fontFamily: FontFamily.display, fontWeight: FontWeights.bold },
  emptyText: { fontSize: FontSizes.sm, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing[4] },
  wasteRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  wasteIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.successLight, alignItems: 'center', justifyContent: 'center' },
  wasteInfo: { flex: 1 },
  wasteTitle: { fontSize: FontSizes.xs, fontWeight: FontWeights.semibold, color: Colors.success, letterSpacing: 0.8, textTransform: 'uppercase' },
  wasteValue: { fontSize: FontSizes.base, fontWeight: FontWeights.semibold, color: Colors.textPrimary, marginTop: 2 },
  wasteMoney: { fontSize: FontSizes.sm, color: Colors.success, marginTop: 2 },
  co2Container: { alignItems: 'center', gap: 2 },
  co2Text: { fontSize: FontSizes.xs, color: Colors.success, textAlign: 'center', fontWeight: FontWeights.semibold },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3], marginBottom: Spacing[2] },
  quickBtn: { flex: 1, minWidth: '45%', backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing[4], alignItems: 'center', gap: Spacing[2], borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  quickLabel: { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold, color: Colors.textPrimary, textAlign: 'center' },
});
