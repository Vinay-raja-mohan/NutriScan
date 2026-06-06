import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import { OnboardingStackParamList } from '../../navigation/types';
import { useUserStore } from '../../store/userStore';
import { generateId } from '../../utils/helpers';
import { Gender, HeightUnit, WeightUnit } from '../../types';

type Props = { navigation: NativeStackNavigationProp<OnboardingStackParamList, 'PersonalInfo'> };

export const PersonalInfoScreen: React.FC<Props> = ({ navigation }) => {
  const { setProfile, profile } = useUserStore();
  const [name, setName] = useState(profile?.name ?? '');
  const [age, setAge] = useState(profile?.age?.toString() ?? '');
  const [gender, setGender] = useState<Gender>(profile?.gender ?? 'male');
  const [heightUnit, setHeightUnit] = useState<HeightUnit>('cm');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [heightCm, setHeightCm] = useState(profile?.heightCm?.toString() ?? '');
  const [weightKg, setWeightKg] = useState(profile?.weightKg?.toString() ?? '');
  const [country, setCountry] = useState(profile?.country ?? 'India');
  const [error, setError] = useState('');

  const genders: { label: string; value: Gender }[] = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'prefer_not_to_say' },
  ];

  const handleNext = async () => {
    if (!name.trim()) { setError('Please enter your name'); return; }
    if (!age || isNaN(Number(age))) { setError('Please enter a valid age'); return; }
    if (!heightCm || isNaN(Number(heightCm))) { setError('Please enter your height'); return; }
    if (!weightKg || isNaN(Number(weightKg))) { setError('Please enter your weight'); return; }
    setError('');

    const base = profile ?? {
      id: generateId(),
      allergies: ['none'],
      conditions: ['none'],
      dietType: 'vegetarian' as const,
      cuisinePrefs: ['Indian'],
      goal: 'eat_healthier' as const,
      activityLevel: 'moderately_active' as const,
      weeklyBudget: 1500,
      householdSize: 'just_me' as const,
      mealFrequency: 3 as const,
      targetWeightKg: Number(weightKg),
      onboardingComplete: false,
      createdAt: new Date().toISOString(),
    };

    await setProfile({
      ...base,
      name: name.trim(),
      age: Number(age),
      gender,
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      country,
    });
    navigation.navigate('Health');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.progressRow}>
            {[1,2,3,4,5].map(s => (
              <View key={s} style={[styles.progressDot, s === 1 && styles.progressDotActive]} />
            ))}
          </View>

          <Text style={styles.step}>Step 1 of 5</Text>
          <Text style={styles.heading}>Tell us about yourself 👋</Text>
          <Text style={styles.sub}>This helps us personalize your nutrition plan</Text>

          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Ravi Kumar" placeholderTextColor={Colors.textMuted} />

          <Text style={styles.label}>Age</Text>
          <TextInput style={[styles.input, styles.inputSm]} value={age} onChangeText={setAge} placeholder="e.g. 24" placeholderTextColor={Colors.textMuted} keyboardType="numeric" />

          <Text style={styles.label}>Gender</Text>
          <View style={styles.chipRow}>
            {genders.map(g => (
              <Chip key={g.value} label={g.label} selected={gender === g.value} onPress={() => setGender(g.value)} />
            ))}
          </View>

          <View style={styles.rowHeader}>
            <Text style={styles.label}>Height</Text>
            <View style={styles.unitToggle}>
              {(['cm', 'ft'] as HeightUnit[]).map(u => (
                <TouchableOpacity key={u} onPress={() => setHeightUnit(u)} style={[styles.unitBtn, heightUnit === u && styles.unitBtnActive]}>
                  <Text style={[styles.unitText, heightUnit === u && styles.unitTextActive]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TextInput style={[styles.input, styles.inputSm]} value={heightCm} onChangeText={setHeightCm} placeholder={heightUnit === 'cm' ? 'e.g. 175' : 'e.g. 5.9'} placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" />

          <View style={styles.rowHeader}>
            <Text style={styles.label}>Weight</Text>
            <View style={styles.unitToggle}>
              {(['kg', 'lbs'] as WeightUnit[]).map(u => (
                <TouchableOpacity key={u} onPress={() => setWeightUnit(u)} style={[styles.unitBtn, weightUnit === u && styles.unitBtnActive]}>
                  <Text style={[styles.unitText, weightUnit === u && styles.unitTextActive]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TextInput style={[styles.input, styles.inputSm]} value={weightKg} onChangeText={setWeightKg} placeholder={weightUnit === 'kg' ? 'e.g. 72' : 'e.g. 158'} placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" />

          <Text style={styles.label}>Country / Region</Text>
          <TextInput style={styles.input} value={country} onChangeText={setCountry} placeholder="e.g. India" placeholderTextColor={Colors.textMuted} />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button label="Next →" onPress={handleNext} size="lg" fullWidth style={{ marginTop: Spacing[4] }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  label: { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold, color: Colors.textSecondary, marginBottom: Spacing[2], marginTop: Spacing[4] },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.lg,
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[3],
    fontSize: FontSizes.base, color: Colors.textPrimary, backgroundColor: Colors.surface,
  },
  inputSm: { width: '50%' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginLeft: -4 },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing[4], marginBottom: Spacing[2] },
  unitToggle: { flexDirection: 'row', borderRadius: Radius.md, overflow: 'hidden', borderWidth: 1.5, borderColor: Colors.border },
  unitBtn: { paddingHorizontal: Spacing[3], paddingVertical: Spacing[1] },
  unitBtnActive: { backgroundColor: Colors.primary },
  unitText: { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold, color: Colors.textSecondary },
  unitTextActive: { color: Colors.textInverse },
  error: { fontSize: FontSizes.sm, color: Colors.danger, marginTop: Spacing[3], textAlign: 'center' },
});
