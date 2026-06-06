import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '../../store/userStore';
import { usePlanStore } from '../../store/planStore';
import { useWasteStore } from '../../store/wasteStore';
import { WaterTracker } from '../../components/WaterTracker';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights, FontFamily } from '../../theme/typography';
import { Spacing, Radius, Shadow } from '../../theme/spacing';
import { MOCK_DIET_PLAN } from '../../data/mockDietPlan';
import { getGreeting, getDayKey, calculateTDEE } from '../../utils/helpers';
import { MealType, DayKey } from '../../types';

const MEAL_ICONS: Record<MealType, string> = {
  breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎',
};

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TODAY_IDX = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

// Animated stat card with slide-up entrance
const StatCard: React.FC<{
  icon: string; value: string; label: string; progress: number;
  barColor: string; delay: number;
}> = ({ icon, value, label, progress, barColor, delay }) => {
  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
    ]).start();
    Animated.timing(barAnim, {
      toValue: progress,
      duration: 800,
      delay: delay + 200,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <Animated.View style={[
      styles.statCard,
      { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      Shadow.sm,
    ]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statBarTrack}>
        <Animated.View style={[styles.statBarFill, {
          backgroundColor: barColor,
          width: barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }]} />
      </View>
    </Animated.View>
  );
};

export const HomeScreen: React.FC = () => {
  const { profile } = useUserStore();
  const { weeklyPlan, todayWaterGlasses, setWater, loadWater, loadPlan, setPlan, updateMealStatus } = usePlanStore();
  const { tracker } = useWasteStore();

  const headerAnim = useRef(new Animated.Value(-20)).current;
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadWater();
    loadPlan();
    if (!weeklyPlan && profile) {
      setPlan(MOCK_DIET_PLAN(profile.id));
    }
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(headerFade, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [profile]);

  const dayKey: DayKey = getDayKey();
  const todayPlan = weeklyPlan?.days[dayKey];
  const targetCals = profile ? calculateTDEE(profile) : 2100;
  const meals: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  const consumed = todayPlan
    ? meals.filter(m => todayPlan[m].status === 'logged')
        .reduce((s, m) => s + todayPlan[m].macros.calories, 0)
    : 0;

  const totalMacros = todayPlan
    ? meals.reduce((acc, m) => ({
        calories: acc.calories + todayPlan[m].macros.calories,
        protein: acc.protein + todayPlan[m].macros.protein,
        carbs: acc.carbs + todayPlan[m].macros.carbs,
        fat: acc.fat + todayPlan[m].macros.fat,
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
    : { calories: 1842, protein: 89, carbs: 210, fat: 52 };

  const toggleMeal = (meal: MealType) => {
    if (!todayPlan) return;
    const next = todayPlan[meal].status === 'logged' ? 'upcoming' : 'logged';
    updateMealStatus(dayKey, meal, next);
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <SafeAreaView style={styles.safe}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* ── Header ── */}
          <Animated.View style={[
            styles.header,
            { opacity: headerFade, transform: [{ translateY: headerAnim }] },
          ]}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarRing}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {profile?.name?.charAt(0)?.toUpperCase() ?? 'V'}
                  </Text>
                </View>
              </View>
              <View style={styles.greetingBlock}>
                <Text style={styles.greeting}>
                  {getGreeting()}, {profile?.name?.split(' ')[0] ?? 'there'} 👋
                </Text>
                <Text style={styles.greetingSub}>Track your nutrition today</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.iconBtn}>
                <Text style={styles.iconBtnText}>🔔</Text>
                <View style={styles.notifDot} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn}>
                <Text style={styles.iconBtnText}>🔥</Text>
                <Text style={styles.streakNum}>5</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* ── Week Strip ── */}
          <View style={styles.weekStrip}>
            {DAYS_SHORT.map((day, i) => (
              <View key={day} style={styles.dayCol}>
                <Text style={styles.dayName}>{day}</Text>
                <View style={[styles.dayCircle, i === TODAY_IDX && styles.dayCircleActive]}>
                  <Text style={[styles.dayNum, i === TODAY_IDX && styles.dayNumActive]}>
                    {new Date(Date.now() - (TODAY_IDX - i) * 86400000).getDate()}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* ── Nutrition Stats Row ── */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow} contentContainerStyle={styles.statsContent}>
            <StatCard icon="🔥" value={`${consumed || totalMacros.calories}`} label="Calories" progress={Math.min((consumed || totalMacros.calories) / targetCals, 1)} barColor={Colors.calories} delay={0} />
            <StatCard icon="💧" value={`${totalMacros.protein}g`} label="Protein" progress={Math.min(totalMacros.protein / 120, 1)} barColor={Colors.protein} delay={80} />
            <StatCard icon="🌾" value={`${totalMacros.carbs}g`} label="Carbs" progress={Math.min(totalMacros.carbs / 280, 1)} barColor={Colors.carbs} delay={160} />
            <StatCard icon="💊" value={`${totalMacros.fat}g`} label="Fat" progress={Math.min(totalMacros.fat / 70, 1)} barColor={Colors.fat} delay={240} />
          </ScrollView>

          {/* ── Calorie Progress Bar ── */}
          <View style={styles.section}>
            <View style={styles.calHeader}>
              <Text style={styles.sectionTitle}>DAILY GOAL</Text>
              <Text style={styles.calNumbers}>
                <Text style={styles.calConsumed}>{consumed || totalMacros.calories} </Text>
                <Text style={styles.calTarget}>/ {targetCals} kcal</Text>
              </Text>
            </View>
            <View style={styles.calTrack}>
              <View style={[
                styles.calFill,
                {
                  width: `${Math.min(((consumed || totalMacros.calories) / targetCals) * 100, 100)}%`,
                  ...Shadow.primaryGlow,
                },
              ]} />
            </View>
          </View>

          {/* ── Today's Meals ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TODAY'S MEALS</Text>
            {todayPlan ? meals.map((meal, idx) => {
              const slot = todayPlan[meal];
              const logged = slot.status === 'logged';
              return (
                <TouchableOpacity
                  key={meal}
                  style={[styles.mealCard, logged && styles.mealCardLogged]}
                  onPress={() => toggleMeal(meal)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.mealEmoji}>{MEAL_ICONS[meal]}</Text>
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealName}>{slot.name}</Text>
                    <View style={styles.mealMeta}>
                      <View style={styles.mealBadge}>
                        <Text style={styles.mealBadgeText}>🔥 {slot.macros.calories} kcal</Text>
                      </View>
                      <View style={[styles.mealBadge, { backgroundColor: Colors.proteinMuted }]}>
                        <Text style={[styles.mealBadgeText, { color: Colors.protein }]}>P: {slot.macros.protein}g</Text>
                      </View>
                      <View style={[styles.mealBadge, { backgroundColor: Colors.carbsMuted }]}>
                        <Text style={[styles.mealBadgeText, { color: Colors.carbs }]}>C: {slot.macros.carbs}g</Text>
                      </View>
                    </View>
                  </View>
                  <View style={[styles.logBtn, logged && styles.logBtnActive]}>
                    <Text style={[styles.logBtnText, logged && styles.logBtnTextActive]}>
                      {logged ? '✓' : '○'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>🤖</Text>
                <Text style={styles.emptyTitle}>No plan yet</Text>
                <Text style={styles.emptySubtitle}>Go to Planner to generate your AI meal plan</Text>
              </View>
            )}
          </View>

          {/* ── Water Tracker ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>HYDRATION</Text>
            <View style={styles.card}>
              <WaterTracker glasses={todayWaterGlasses} onGlassPress={setWater} />
            </View>
          </View>

          {/* ── Waste Saved ── */}
          <View style={[styles.card, styles.wasteCard]}>
            <View style={styles.wasteRow}>
              <Text style={styles.wasteEmoji}>♻️</Text>
              <View style={styles.wasteInfo}>
                <Text style={styles.wasteTitle}>WASTE SAVED THIS WEEK</Text>
                <Text style={styles.wasteValue}>{tracker?.mealsFromPantry ?? 3} meals from leftovers</Text>
                <Text style={styles.wasteStat}>🌍 {(tracker?.co2AvoidedKg ?? 0.8).toFixed(1)}kg CO₂ avoided</Text>
              </View>
            </View>
          </View>

          <View style={{ height: Spacing[8] }} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 16 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing[4], paddingTop: Spacing[4], paddingBottom: Spacing[3] },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  avatarRing: { width: 46, height: 46, borderRadius: 23, borderWidth: 2.5, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Shadow.primaryGlow },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: FontFamily.display, fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.primary },
  greetingBlock: { gap: 2 },
  greeting: { fontFamily: FontFamily.display, fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  greetingSub: { fontFamily: FontFamily.body, fontSize: FontSizes.xs, color: Colors.textSecondary },
  headerRight: { flexDirection: 'row', gap: Spacing[2] },
  iconBtn: { position: 'relative', width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  iconBtnText: { fontSize: 16 },
  notifDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.danger, borderWidth: 1.5, borderColor: Colors.background },
  streakNum: { position: 'absolute', bottom: 4, right: 4, fontFamily: FontFamily.display, fontSize: 8, fontWeight: FontWeights.bold, color: Colors.primary },

  // Week Strip
  weekStrip: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing[4], paddingVertical: Spacing[3] },
  dayCol: { alignItems: 'center', gap: 6 },
  dayName: { fontFamily: FontFamily.body, fontSize: 10, color: Colors.textMuted, fontWeight: FontWeights.medium },
  dayCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  dayCircleActive: { backgroundColor: Colors.primary, ...Shadow.primaryGlow },
  dayNum: { fontFamily: FontFamily.display, fontSize: FontSizes.sm, fontWeight: FontWeights.semibold, color: Colors.textSecondary },
  dayNumActive: { color: Colors.textInverse, fontWeight: FontWeights.bold },

  // Stats Row
  statsRow: { marginBottom: Spacing[2] },
  statsContent: { paddingHorizontal: Spacing[4], gap: Spacing[3], paddingVertical: Spacing[1] },
  statCard: {
    width: 96, backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing[3], alignItems: 'center', gap: Spacing[1],
    borderWidth: 1, borderColor: Colors.border,
  },
  statIcon: { fontSize: 22 },
  statValue: { fontFamily: FontFamily.display, fontSize: FontSizes.xl, fontWeight: FontWeights.extrabold, color: Colors.textPrimary },
  statLabel: { fontFamily: FontFamily.body, fontSize: FontSizes.xs, color: Colors.textSecondary },
  statBarTrack: { width: '100%', height: 4, backgroundColor: Colors.divider, borderRadius: Radius.full, overflow: 'hidden', marginTop: Spacing[1] },
  statBarFill: { height: '100%', borderRadius: Radius.full },

  // Sections
  section: { paddingHorizontal: Spacing[4], marginBottom: Spacing[4] },
  sectionTitle: { fontFamily: FontFamily.body, fontSize: FontSizes.xs, fontWeight: FontWeights.bold, color: Colors.textSecondary, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: Spacing[3] },

  // Calorie bar
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[2] },
  calNumbers: { fontFamily: FontFamily.display },
  calConsumed: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.primary },
  calTarget: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  calTrack: { height: 10, backgroundColor: Colors.surface, borderRadius: Radius.full, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  calFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: Radius.full },

  // Meal cards
  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing[4], borderWidth: 1, borderColor: Colors.border },
  mealCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing[4], marginBottom: Spacing[3],
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow.sm,
  },
  mealCardLogged: { borderColor: Colors.borderActive, backgroundColor: 'rgba(168, 224, 99, 0.06)' },
  mealEmoji: { fontSize: 32, width: 44, textAlign: 'center' },
  mealInfo: { flex: 1, gap: Spacing[2] },
  mealName: { fontFamily: FontFamily.display, fontSize: FontSizes.base, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  mealMeta: { flexDirection: 'row', gap: Spacing[1], flexWrap: 'wrap' },
  mealBadge: { backgroundColor: Colors.caloriesMuted, borderRadius: Radius.full, paddingHorizontal: Spacing[2], paddingVertical: 3 },
  mealBadgeText: { fontFamily: FontFamily.body, fontSize: 10, fontWeight: FontWeights.semibold, color: Colors.calories },
  logBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  logBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary, ...Shadow.primaryGlow },
  logBtnText: { fontSize: 16, color: Colors.textMuted },
  logBtnTextActive: { color: Colors.textInverse, fontWeight: FontWeights.bold },

  emptyCard: { alignItems: 'center', gap: Spacing[2], padding: Spacing[6], backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontFamily: FontFamily.display, fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  emptySubtitle: { fontFamily: FontFamily.body, fontSize: FontSizes.sm, color: Colors.textSecondary, textAlign: 'center' },

  // Waste card
  wasteCard: { marginHorizontal: Spacing[4], backgroundColor: Colors.successLight },
  wasteRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  wasteEmoji: { fontSize: 36 },
  wasteInfo: { flex: 1, gap: 4 },
  wasteTitle: { fontFamily: FontFamily.body, fontSize: FontSizes.xs, fontWeight: FontWeights.bold, color: Colors.primary, letterSpacing: 1, textTransform: 'uppercase' },
  wasteValue: { fontFamily: FontFamily.display, fontSize: FontSizes.base, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  wasteStat: { fontFamily: FontFamily.body, fontSize: FontSizes.xs, color: Colors.textSecondary },
});
