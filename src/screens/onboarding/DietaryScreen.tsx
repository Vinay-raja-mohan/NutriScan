import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import { OnboardingStackParamList } from '../../navigation/types';
import { useUserStore } from '../../store/userStore';
import { DietType, MealFrequency } from '../../types';

type Props = { navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Dietary'> };

const DIET_TYPES: { label: string; value: DietType; emoji: string }[] = [
  { label: 'No Restriction', value: 'no_restriction', emoji: '🍽️' },
  { label: 'Vegetarian', value: 'vegetarian', emoji: '🥦' },
  { label: 'Vegan', value: 'vegan', emoji: '🌱' },
  { label: 'Keto', value: 'keto', emoji: '🥑' },
  { label: 'Paleo', value: 'paleo', emoji: '🍖' },
  { label: 'Mediterranean', value: 'mediterranean', emoji: '🫒' },
  { label: 'Halal', value: 'halal', emoji: '🌙' },
  { label: 'Jain', value: 'jain', emoji: '✋' },
  { label: 'Intermittent Fasting', value: 'intermittent_fasting', emoji: '⏰' },
];

const CUISINES = [
  { label: 'Indian', emoji: '🇮🇳' }, { label: 'Chinese', emoji: '🥢' },
  { label: 'Italian', emoji: '🍝' }, { label: 'Mexican', emoji: '🌮' },
  { label: 'Japanese', emoji: '🍱' }, { label: 'Middle Eastern', emoji: '🧆' },
  { label: 'American', emoji: '🍔' }, { label: 'Thai', emoji: '🍜' },
];

const MEAL_FREQ: { label: string; value: MealFrequency }[] = [
  { label: '2 meals/day', value: 2 },
  { label: '3 meals/day', value: 3 },
  { label: '5 small meals', value: 5 },
];

export const DietaryScreen: React.FC<Props> = ({ navigation }) => {
  const { updateProfile, profile } = useUserStore();
  const [dietType, setDietType] = useState<DietType>(profile?.dietType ?? 'vegetarian');
  const [cuisines, setCuisines] = useState<string[]>(profile?.cuisinePrefs ?? ['Indian']);
  const [mealFreq, setMealFreq] = useState<MealFrequency>(profile?.mealFrequency ?? 3);

  const toggleCuisine = (c: string) =>
    setCuisines(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const handleNext = async () => {
    await updateProfile({ dietType, cuisinePrefs: cuisines, mealFrequency: mealFreq });
    navigation.navigate('Goals');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.progressRow}>
          {[1,2,3,4,5].map(s => (
            <View key={s} style={[styles.progressDot, s <= 3 && styles.progressDotActive]} />
          ))}
        </View>
        <Text style={styles.step}>Step 3 of 5</Text>
        <Text style={styles.heading}>Dietary Preferences 🥗</Text>
        <Text style={styles.sub}>Your diet type shapes every meal suggestion</Text>

        <Text style={styles.sectionLabel}>Diet Type</Text>
        <View style={styles.chips}>
          {DIET_TYPES.map(d => (
            <Chip key={d.value} label={d.label} emoji={d.emoji} selected={dietType === d.value} onPress={() => setDietType(d.value)} />
          ))}
        </View>

        <Text style={styles.sectionLabel}>Cuisine Preference</Text>
        <View style={styles.chips}>
          {CUISINES.map(c => (
            <Chip key={c.label} label={c.label} emoji={c.emoji} selected={cuisines.includes(c.label)} onPress={() => toggleCuisine(c.label)} />
          ))}
        </View>

        <Text style={styles.sectionLabel}>Meal Frequency</Text>
        <View style={styles.chips}>
          {MEAL_FREQ.map(f => (
            <Chip key={f.value} label={f.label} selected={mealFreq === f.value} onPress={() => setMealFreq(f.value)} />
          ))}
        </View>

        <Button label="Next →" onPress={handleNext} size="lg" fullWidth style={{ marginTop: Spacing[5] }} />
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
});
