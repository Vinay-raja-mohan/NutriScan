import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import { OnboardingStackParamList } from '../../navigation/types';
import { useUserStore } from '../../store/userStore';
import { PrimaryGoal, ActivityLevel, HouseholdSize } from '../../types';
import { formatINR } from '../../utils/helpers';

type Props = { navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Goals'> };

const GOALS: { label: string; value: PrimaryGoal; emoji: string }[] = [
  { label: 'Lose Weight', value: 'lose_weight', emoji: '⚖️' },
  { label: 'Gain Muscle', value: 'gain_muscle', emoji: '💪' },
  { label: 'Maintain Weight', value: 'maintain_weight', emoji: '🎯' },
  { label: 'Improve Gut Health', value: 'improve_gut', emoji: '🌿' },
  { label: 'Manage Condition', value: 'manage_condition', emoji: '🏥' },
  { label: 'Eat Healthier', value: 'eat_healthier', emoji: '🥗' },
];

const ACTIVITY: { label: string; value: ActivityLevel; emoji: string }[] = [
  { label: 'Sedentary', value: 'sedentary', emoji: '🛋️' },
  { label: 'Lightly Active', value: 'lightly_active', emoji: '🚶' },
  { label: 'Moderately Active', value: 'moderately_active', emoji: '🏃' },
  { label: 'Very Active', value: 'very_active', emoji: '🏋️' },
];

const HOUSEHOLD: { label: string; value: HouseholdSize; emoji: string }[] = [
  { label: 'Just me', value: 'just_me', emoji: '👤' },
  { label: '2 people', value: 'two', emoji: '👫' },
  { label: 'Family (3-5)', value: 'family', emoji: '👨👩👧' },
  { label: 'Large (6+)', value: 'large_family', emoji: '🏘️' },
];

export const GoalsScreen: React.FC<Props> = ({ navigation }) => {
  const { updateProfile, profile } = useUserStore();
  const [goal, setGoal] = useState<PrimaryGoal>(profile?.goal ?? 'eat_healthier');
  const [budget, setBudget] = useState(profile?.weeklyBudget ?? 1500);
  const [household, setHousehold] = useState<HouseholdSize>(profile?.householdSize ?? 'just_me');
  const [activity, setActivity] = useState<ActivityLevel>(profile?.activityLevel ?? 'moderately_active');

  const handleNext = async () => {
    await updateProfile({ goal, weeklyBudget: budget, householdSize: household, activityLevel: activity });
    navigation.navigate('SetupComplete');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.progressRow}>
          {[1,2,3,4,5].map(s => (
            <View key={s} style={[styles.progressDot, s <= 4 && styles.progressDotActive]} />
          ))}
        </View>
        <Text style={styles.step}>Step 4 of 5</Text>
        <Text style={styles.heading}>Your Goals 🎯</Text>
        <Text style={styles.sub}>Tell us what you're working towards</Text>

        <Text style={styles.sectionLabel}>Primary Goal</Text>
        <View style={styles.chips}>
          {GOALS.map(g => (
            <Chip key={g.value} label={g.label} emoji={g.emoji} selected={goal === g.value} onPress={() => setGoal(g.value)} />
          ))}
        </View>

        <Text style={styles.sectionLabel}>Activity Level</Text>
        <View style={styles.chips}>
          {ACTIVITY.map(a => (
            <Chip key={a.value} label={a.label} emoji={a.emoji} selected={activity === a.value} onPress={() => setActivity(a.value)} />
          ))}
        </View>

        <Text style={styles.sectionLabel}>Household Size</Text>
        <View style={styles.chips}>
          {HOUSEHOLD.map(h => (
            <Chip key={h.value} label={h.label} emoji={h.emoji} selected={household === h.value} onPress={() => setHousehold(h.value)} />
          ))}
        </View>

        <Text style={styles.sectionLabel}>
          Weekly Grocery Budget: <Text style={styles.budgetValue}>{formatINR(Math.round(budget))}</Text>
        </Text>
        <View style={styles.budgetRow}>
          <TouchableOpacity style={styles.budgetBtn} onPress={() => setBudget(b => Math.max(500, b - 100))}>
            <Text style={styles.budgetBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.budgetDisplay}>{formatINR(budget)}</Text>
          <TouchableOpacity style={styles.budgetBtn} onPress={() => setBudget(b => Math.min(5000, b + 100))}>
            <Text style={styles.budgetBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.budgetHint}>₹500 – ₹5,000 per week</Text>

        <Button label="Almost Done →" onPress={handleNext} size="lg" fullWidth style={{ marginTop: Spacing[5] }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing[5], paddingBottom: Spacing[12] },
  progressRow: { flexDirection: 'row', gap: Spacing[2], marginBottom: Spacing[4] },
  progressDot: { flex: 1, height: 4, borderRadius: Radius.full, backgroundColor: Colors.border },
  progressDotActive: { backgroundColor: Colors.primary },
  step: { fontSize: FontSizes.sm, color: Colors.textMuted, marginBottom: Spacing[1] },
  heading: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.textPrimary, marginBottom: Spacing[1] },
  sub: { fontSize: FontSizes.base, color: Colors.textSecondary, marginBottom: Spacing[5] },
  sectionLabel: { fontSize: FontSizes.base, fontWeight: FontWeights.semibold, color: Colors.textPrimary, marginTop: Spacing[5], marginBottom: Spacing[2] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginLeft: -4 },
  budgetValue: { color: Colors.primary, fontWeight: FontWeights.bold },
  budgetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing[4], marginTop: Spacing[2] },
  budgetBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  budgetBtnText: { fontSize: FontSizes.xl, color: '#FFFFFF', fontWeight: FontWeights.bold },
  budgetDisplay: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: Colors.textPrimary, minWidth: 120, textAlign: 'center' },
  budgetHint: { fontSize: FontSizes.xs, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing[1] },
});
