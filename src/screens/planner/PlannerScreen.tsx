import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, StatusBar, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { usePlanStore } from '../../store/planStore';
import { useUserStore } from '../../store/userStore';
import { useWasteStore } from '../../store/wasteStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights, FontFamily } from '../../theme/typography';
import { Spacing, Radius, Shadow } from '../../theme/spacing';
import { DayKey, MealType, MealStatus } from '../../types';
import { generateDietPlan, generateSingleDayPlan } from '../../services/dietPlanGenerator';
import { getDayKey, formatINR } from '../../utils/helpers';
import { MOCK_DIET_PLAN } from '../../data/mockDietPlan';

type PlannerTab = 'weekly' | 'daily' | 'waste' | 'shopping';

const DAYS: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<DayKey, string> = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };
const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const STATUS_COLOR: Record<MealStatus, string> = { logged: Colors.mealLogged, upcoming: Colors.mealUpcoming, skipped: Colors.mealSkipped };

// Colored badges for meals
const MEAL_BADGE: Record<MealType, { letter: string; color: string }> = {
  breakfast: { letter: 'B', color: '#F59E0B' },
  lunch:     { letter: 'L', color: '#22C55E' },
  dinner:    { letter: 'D', color: '#6366F1' },
  snack:     { letter: 'S', color: '#EC4899' },
};

const MealBadge: React.FC<{ meal: MealType; size?: number }> = ({ meal, size = 44 }) => {
  const { letter, color } = MEAL_BADGE[meal];
  return (
    <View style={[styles.mealBadge, { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '22' }]}>
      <Text style={[styles.mealBadgeLetter, { fontSize: size * 0.45, color }]}>{letter}</Text>
    </View>
  );
};

export const PlannerScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PlannerTab>('daily');
  const [selectedDay, setSelectedDay] = useState<DayKey>(getDayKey());
  const { weeklyPlan, setPlan, loadPlan, updateMealStatus, isGenerating, setGenerating, shoppingList } = usePlanStore();
  const { profile } = useUserStore();
  const { tracker } = useWasteStore();

  useEffect(() => { loadPlan(); }, []);

  const generatePlan = async () => {
    if (!profile) return;
    setGenerating(true);
    try {
      if (weeklyPlan) {
        const singleDayPlan = await generateSingleDayPlan(profile, selectedDay);
        const mergedDays = { ...weeklyPlan.days };
        mergedDays[selectedDay] = singleDayPlan;
        await setPlan({ ...weeklyPlan, days: mergedDays });
        Alert.alert('Plan Updated!', `Meals for ${DAY_LABELS[selectedDay]} have been regenerated.`);
      } else {
        const plan = await generateDietPlan(profile);
        await setPlan(plan);
        Alert.alert('Plan Generated!', 'Your personalized 7-day diet plan is ready!');
      }
    } catch {
      const mock = MOCK_DIET_PLAN(profile.id);
      await setPlan(mock);
    } finally {
      setGenerating(false);
    }
  };

  const tabs: { key: PlannerTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'daily', label: 'Daily', icon: 'calendar-outline' },
    { key: 'waste', label: 'Waste', icon: 'leaf-outline' },
    { key: 'shopping', label: 'Shop', icon: 'cart-outline' },
  ];

  const todayPlan = weeklyPlan?.days[selectedDay];
  const consumedCals = todayPlan ? MEALS.filter(m => todayPlan[m].status === 'logged').reduce((s, m) => s + todayPlan[m].macros.calories, 0) : 0;

  const SHOPPING_ITEMS = [
    { category: 'Produce', items: ['Spinach — 200g', 'Tomatoes — 4 pcs', 'Onions — 3 pcs', 'Garlic — 1 bulb'] },
    { category: 'Dairy', items: ['Paneer — 250g', 'Curd — 500ml', 'Greek Yogurt — 200g'] },
    { category: 'Grains', items: ['Brown Rice — 1kg', 'Oats — 500g', 'Whole Wheat Flour — 1kg'] },
    { category: 'Protein', items: ['Toor Dal — 500g', 'Moong Dal — 500g', 'Rajma — 500g'] },
  ];

  return (
    <>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safe}>
        <View style={[styles.header, { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.divider }]}>
          <Text style={styles.title}>Diet Planner</Text>
          <Text style={styles.subtitle}>Your personalized weekly meal plan</Text>
          <View style={styles.tabRow}>
            {tabs.map(t => (
              <TouchableOpacity key={t.key} style={[styles.tab, activeTab === t.key && styles.tabActive]} onPress={() => setActiveTab(t.key)}>
                <Ionicons name={t.icon} size={18} color={activeTab === t.key ? Colors.primary : 'rgba(255,255,255,0.7)'} />
                <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {!weeklyPlan && (
            <Card style={styles.generateCard}>
              <Ionicons name="sparkles" size={48} color={Colors.primary} />
              <Text style={styles.generateTitle}>No Plan Yet</Text>
              <Text style={styles.generateSubtitle}>Let AI generate a personalized 7-day plan based on your health profile</Text>
              <Button label="Generate My Plan" onPress={generatePlan} loading={isGenerating} size="lg" fullWidth />
            </Card>
          )}

          {/* DAILY VIEW */}
          {activeTab === 'daily' && (
            <View style={{ gap: Spacing[3] }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daySelectorScroll}>
                {DAYS.map(day => (
                  <TouchableOpacity key={day} style={[styles.daySelectorItem, selectedDay === day && styles.daySelectorActive]} onPress={() => setSelectedDay(day)}>
                    <Text style={[styles.daySelectorText, selectedDay === day && styles.daySelectorTextActive]}>{DAY_LABELS[day]}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {weeklyPlan && (
                <Button label={`Regenerate ${DAY_LABELS[selectedDay]}`} onPress={generatePlan} loading={isGenerating} variant="secondary" size="md" fullWidth />
              )}

              {todayPlan ? (
                <View style={{ gap: Spacing[3] }}>
                  <View style={styles.calorieBar}>
                    <Text style={styles.calorieText}>{consumedCals} / {todayPlan.targetCalories} kcal consumed</Text>
                    <View style={styles.calorieTrack}>
                      <View style={[styles.calorieFill, { width: `${Math.min((consumedCals / todayPlan.targetCalories) * 100, 100)}%` }]} />
                    </View>
                  </View>

                  {MEALS.map(meal => {
                    const slot = todayPlan[meal];
                    return (
                      <Card key={meal} style={styles.mealCard}>
                        <View style={styles.mealHeader}>
                          <MealBadge meal={meal} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.mealType}>{meal.toUpperCase()}</Text>
                            <Text style={styles.mealName}>{slot.name}</Text>
                            <Text style={styles.mealCals}>{slot.macros.calories} kcal • P: {slot.macros.protein}g • C: {slot.macros.carbs}g • F: {slot.macros.fat}g</Text>
                          </View>
                          <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[slot.status] }]} />
                        </View>
                        {slot.wasteReduction && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                            <Ionicons name="leaf" size={12} color={Colors.warning} />
                            <Text style={styles.wasteTag}>Uses pantry items</Text>
                          </View>
                        )}
                        <View style={styles.mealActions}>
                          <TouchableOpacity style={styles.actionBtn} onPress={() => updateMealStatus(selectedDay, meal, slot.status === 'logged' ? 'upcoming' : 'logged')}>
                            <Text style={styles.actionBtnText}>{slot.status === 'logged' ? 'Logged' : 'Log Meal'}</Text>
                          </TouchableOpacity>

                          <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert(slot.name, slot.recipeSteps?.join('\n\n') ?? 'No recipe available')}>
                            <Text style={styles.actionBtnText}>Recipe</Text>
                          </TouchableOpacity>
                        </View>
                      </Card>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.emptyText}>Generate a plan to see meals for this day</Text>
              )}
            </View>
          )}

          {/* WASTE TAB */}
          {activeTab === 'waste' && (
            <View style={{ gap: Spacing[3] }}>
              <Card style={[styles.wasteCard, { backgroundColor: Colors.successLight }]}>
                <Text style={styles.wasteTitle}>WASTE SAVED THIS WEEK</Text>
                <View style={styles.wasteGrid}>
                  <WasteStat icon="restaurant-outline" label="Meals from pantry" value={`${tracker?.mealsFromPantry ?? 0} meals`} />
                  <WasteStat icon="scale-outline" label="Food saved" value={`${tracker?.weightSavedGrams ?? 0}g`} />
                  <WasteStat icon="wallet-outline" label="Money saved" value={formatINR(tracker?.moneySavedINR ?? 0)} />
                  <WasteStat icon="globe-outline" label="CO₂ avoided" value={`${(tracker?.co2AvoidedKg ?? 0).toFixed(1)}kg`} />
                </View>
              </Card>

              <Card>
                <Text style={styles.wasteTitle}>USE WHAT YOU HAVE</Text>
                <Text style={styles.wasteSubtitle}>Scan your fridge to map pantry items to this week's plan</Text>
                <View style={styles.pantryGrid}>
                  {[
                    { text: 'Palak Paneer — ready now', icon: 'checkmark-circle', color: Colors.success },
                    { text: 'Dal Tadka — ready now', icon: 'checkmark-circle', color: Colors.success },
                    { text: 'Rajma needs rajma from store', icon: 'refresh-circle', color: Colors.warning },
                    { text: 'Biryani needs full shop', icon: 'close-circle', color: Colors.danger }
                  ].map((item, i) => (
                    <View key={i} style={styles.pantryItem}>
                      <Ionicons name={item.icon as any} size={18} color={item.color} />
                      <Text style={styles.pantryText}>{item.text}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            </View>
          )}

          {/* SHOPPING TAB */}
          {activeTab === 'shopping' && (
            <View style={{ gap: Spacing[3] }}>
              <View style={styles.shopHeader}>
                <Text style={styles.shopTitle}>Smart Shopping List</Text>
                <Text style={styles.shopBudget}>Est. Total: {formatINR(680)}</Text>
              </View>
              {SHOPPING_ITEMS.map((section, si) => (
                <Card key={si}>
                  <Text style={styles.shopCategory}>{section.category}</Text>
                  {section.items.map((item, i) => (
                    <View key={i} style={styles.shopItem}>
                      <Ionicons name="square-outline" size={18} color={Colors.textMuted} />
                      <Text style={styles.shopItemText}>{item}</Text>
                    </View>
                  ))}
                </Card>
              ))}
              <Button label="Share List" onPress={() => Alert.alert('Share', 'Shopping list copied to clipboard!')} variant="secondary" size="md" fullWidth />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const WasteStat: React.FC<{ icon: keyof typeof Ionicons.glyphMap; label: string; value: string }> = ({ icon, label, value }) => (
  <View style={styles.wasteStat}>
    <Ionicons name={icon} size={24} color={Colors.success} />
    <Text style={styles.wasteStatValue}>{value}</Text>
    <Text style={styles.wasteStatLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing[5], paddingBottom: Spacing[4] },
  title: { fontFamily: FontFamily.display, fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: '#FFFFFF' },
  subtitle: { fontFamily: FontFamily.body, fontSize: FontSizes.sm, color: 'rgba(255,255,255,0.8)', marginBottom: Spacing[4] },
  tabRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.xl, padding: 4, gap: 2 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: Spacing[2], borderRadius: Radius.lg, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  tabActive: { backgroundColor: Colors.surface },
  tabText: { fontFamily: FontFamily.body, fontSize: FontSizes.xs, color: 'rgba(255,255,255,0.8)', fontWeight: FontWeights.medium },
  tabTextActive: { color: Colors.primary, fontWeight: FontWeights.semibold },
  body: { padding: Spacing[4], paddingBottom: 120, gap: Spacing[3] },
  generateCard: { alignItems: 'center', gap: Spacing[3], padding: Spacing[6] },
  generateTitle: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.textPrimary },
  generateSubtitle: { fontSize: FontSizes.base, color: Colors.textSecondary, textAlign: 'center' },
  daySelectorScroll: { gap: Spacing[2], paddingVertical: Spacing[1], paddingHorizontal: Spacing[1] },
  daySelectorItem: { paddingHorizontal: Spacing[4], paddingVertical: Spacing[2], borderRadius: Radius.lg, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  daySelectorActive: { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: Colors.primary, ...Shadow.primaryGlow },
  daySelectorText: { fontFamily: FontFamily.body, fontSize: FontSizes.sm, color: 'rgba(255,255,255,0.7)', fontWeight: FontWeights.medium },
  daySelectorTextActive: { color: Colors.primary, fontWeight: FontWeights.bold },
  calorieBar: { gap: Spacing[2] },
  calorieText: { fontFamily: FontFamily.display, fontSize: FontSizes.sm, color: Colors.textSecondary, fontWeight: FontWeights.medium },
  calorieTrack: { height: 8, backgroundColor: Colors.border, borderRadius: Radius.full, overflow: 'hidden' },
  calorieFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: Radius.full, ...Shadow.primaryGlow },
  mealCard: { gap: Spacing[2], backgroundColor: 'rgba(24,24,27,0.6)' },
  mealHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[3] },
  mealBadge: { alignItems: 'center', justifyContent: 'center' },
  mealBadgeLetter: { fontFamily: FontFamily.display, fontWeight: FontWeights.bold },
  mealType: { fontFamily: FontFamily.body, fontSize: FontSizes.xs, fontWeight: FontWeights.semibold, color: Colors.primaryLight, letterSpacing: 1 },
  mealName: { fontFamily: FontFamily.display, fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.textPrimary, marginTop: 2 },
  mealCals: { fontFamily: FontFamily.body, fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 4 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  wasteTag: { fontSize: FontSizes.xs, color: Colors.warning, fontWeight: FontWeights.medium },
  mealActions: { flexDirection: 'row', gap: Spacing[2], marginTop: Spacing[1] },
  actionBtn: { flex: 1, backgroundColor: Colors.primaryMuted, borderRadius: Radius.lg, padding: Spacing[2], alignItems: 'center' },
  actionBtnText: { fontSize: FontSizes.xs, fontWeight: FontWeights.semibold, color: Colors.primary },
  emptyText: { fontSize: FontSizes.base, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing[8] },
  wasteCard: { gap: Spacing[3] },
  wasteTitle: { fontSize: FontSizes.xs, fontWeight: FontWeights.semibold, color: Colors.textSecondary, letterSpacing: 1, textTransform: 'uppercase' },
  wasteSubtitle: { fontSize: FontSizes.sm, color: Colors.textMuted, marginBottom: Spacing[2] },
  wasteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },
  wasteStat: { width: '47%', backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing[3], alignItems: 'center', gap: 2 },
  wasteStatValue: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.success },
  wasteStatLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, textAlign: 'center' },
  pantryGrid: { gap: Spacing[2], marginTop: Spacing[2] },
  pantryItem: { backgroundColor: Colors.background, borderRadius: Radius.lg, padding: Spacing[3], flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  pantryText: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  shopHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shopTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  shopBudget: { fontSize: FontSizes.base, fontWeight: FontWeights.bold, color: Colors.primary },
  shopCategory: { fontSize: FontSizes.base, fontWeight: FontWeights.bold, color: Colors.textPrimary, marginBottom: Spacing[2] },
  shopItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], paddingVertical: Spacing[2] },
  shopItemText: { fontSize: FontSizes.base, color: Colors.textSecondary },
});
