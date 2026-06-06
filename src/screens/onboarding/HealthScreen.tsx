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
import { Allergen, MedicalCondition } from '../../types';

type Props = { navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Health'> };

const ALLERGENS: { label: string; value: Allergen; emoji: string }[] = [
  { label: 'Gluten', value: 'gluten', emoji: '🌾' },
  { label: 'Dairy', value: 'dairy', emoji: '🥛' },
  { label: 'Nuts', value: 'nuts', emoji: '🥜' },
  { label: 'Soy', value: 'soy', emoji: '🫘' },
  { label: 'Eggs', value: 'eggs', emoji: '🥚' },
  { label: 'Shellfish', value: 'shellfish', emoji: '🦐' },
  { label: 'Fish', value: 'fish', emoji: '🐟' },
  { label: 'Sesame', value: 'sesame', emoji: '🌰' },
  { label: 'None', value: 'none', emoji: '✅' },
];

const CONDITIONS: { label: string; value: MedicalCondition; emoji: string }[] = [
  { label: 'Diabetes Type 1', value: 'diabetes_type1', emoji: '💉' },
  { label: 'Diabetes Type 2', value: 'diabetes_type2', emoji: '🩺' },
  { label: 'Hypertension', value: 'hypertension', emoji: '🫀' },
  { label: 'High Cholesterol', value: 'high_cholesterol', emoji: '🧪' },
  { label: 'PCOS', value: 'pcos', emoji: '🌸' },
  { label: 'Thyroid', value: 'thyroid', emoji: '🦋' },
  { label: 'Kidney Disease', value: 'kidney_disease', emoji: '🫘' },
  { label: 'Lactose Intolerance', value: 'lactose_intolerance', emoji: '🥛' },
  { label: 'IBS / Gut Issues', value: 'ibs', emoji: '🌿' },
  { label: 'None', value: 'none', emoji: '✅' },
];

export const HealthScreen: React.FC<Props> = ({ navigation }) => {
  const { updateProfile, profile } = useUserStore();
  const [allergies, setAllergies] = useState<Allergen[]>(profile?.allergies ?? ['none']);
  const [conditions, setConditions] = useState<MedicalCondition[]>(profile?.conditions ?? ['none']);

  const toggleAllergen = (val: Allergen) => {
    if (val === 'none') { setAllergies(['none']); return; }
    const without = allergies.filter(a => a !== 'none');
    setAllergies(without.includes(val) ? without.filter(a => a !== val) : [...without, val]);
  };

  const toggleCondition = (val: MedicalCondition) => {
    if (val === 'none') { setConditions(['none']); return; }
    const without = conditions.filter(c => c !== 'none');
    setConditions(without.includes(val) ? without.filter(c => c !== val) : [...without, val]);
  };

  const handleNext = async () => {
    await updateProfile({ allergies: allergies.length ? allergies : ['none'], conditions: conditions.length ? conditions : ['none'] });
    navigation.navigate('Dietary');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.progressRow}>
          {[1,2,3,4,5].map(s => (
            <View key={s} style={[styles.progressDot, s <= 2 && styles.progressDotActive]} />
          ))}
        </View>
        <Text style={styles.step}>Step 2 of 5</Text>
        <Text style={styles.heading}>Health & Allergies 🏥</Text>
        <Text style={styles.sub}>We'll make sure your plan never includes anything harmful</Text>

        <Text style={styles.sectionLabel}>Food Allergies</Text>
        <View style={styles.chips}>
          {ALLERGENS.map(a => (
            <Chip key={a.value} label={a.label} emoji={a.emoji} selected={allergies.includes(a.value)} onPress={() => toggleAllergen(a.value)} />
          ))}
        </View>

        <Text style={styles.sectionLabel}>Medical Conditions</Text>
        <View style={styles.chips}>
          {CONDITIONS.map(c => (
            <Chip key={c.value} label={c.label} emoji={c.emoji} selected={conditions.includes(c.value)} onPress={() => toggleCondition(c.value)} />
          ))}
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeText}>🔒 Your health data stays private on your device — never shared.</Text>
        </View>

        <Button label="Next →" onPress={handleNext} size="lg" fullWidth style={{ marginTop: Spacing[4] }} />
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
  notice: { backgroundColor: Colors.infoLight, borderRadius: Radius.lg, padding: Spacing[4], marginTop: Spacing[5] },
  noticeText: { fontSize: FontSizes.sm, color: Colors.info, textAlign: 'center' },
});
