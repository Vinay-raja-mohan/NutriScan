import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import Animated, {
  useSharedValue, withSpring, withTiming, withDelay, useAnimatedStyle,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { OnboardingStackParamList } from '../../navigation/types';
import { useUserStore } from '../../store/userStore';
import { usePlanStore } from '../../store/planStore';
import { useWasteStore } from '../../store/wasteStore';
import { calculateTDEE } from '../../utils/helpers';
import { MOCK_DIET_PLAN } from '../../data/mockDietPlan';

type Props = { navigation: NativeStackNavigationProp<OnboardingStackParamList, 'SetupComplete'> };

export const SetupCompleteScreen: React.FC<Props> = ({ navigation }) => {
  const { profile, updateProfile } = useUserStore();
  const { setPlan } = usePlanStore();
  const { resetWeek } = useWasteStore();

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const cardY = useSharedValue(40);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12 });
    opacity.value = withTiming(1, { duration: 600 });
    cardY.value = withDelay(400, withSpring(0, { damping: 14 }));
  }, []);

  const checkAnim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));
  const cardAnim = useAnimatedStyle(() => ({ transform: [{ translateY: cardY.value }], opacity: opacity.value }));

  if (!profile) return null;
  const tdee = calculateTDEE(profile);

  const handleStart = async () => {
    await updateProfile({ onboardingComplete: true });
    await setPlan(MOCK_DIET_PLAN(profile.id));
    await resetWeek(profile.id);
  };

  const goalLabels: Record<string, string> = {
    lose_weight: 'Lose Weight', gain_muscle: 'Gain Muscle', maintain_weight: 'Maintain Weight',
    improve_gut: 'Improve Gut Health', manage_condition: 'Manage Condition', eat_healthier: 'Eat Healthier',
  };

  return (
    <LinearGradient colors={Colors.gradientPrimary} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Animated.View style={[styles.checkCircle, checkAnim]}>
            <Text style={styles.checkEmoji}>✅</Text>
          </Animated.View>
          <Text style={styles.title}>You're all set!</Text>
          <Text style={styles.subtitle}>Here's your personalized nutrition summary</Text>

          <Animated.View style={[{ width: '100%' }, cardAnim]}>
            <Card style={styles.summaryCard} shadow="lg">
              <Text style={styles.cardName}>👋 {profile.name}</Text>
              <View style={styles.row}>
                <SummaryItem label="Age" value={`${profile.age} yrs`} />
                <SummaryItem label="Weight" value={`${profile.weightKg} kg`} />
                <SummaryItem label="Height" value={`${profile.heightCm} cm`} />
              </View>
              <View style={styles.divider} />
              <View style={styles.row}>
                <SummaryItem label="Daily Target" value={`${tdee} kcal`} accent />
                <SummaryItem label="Goal" value={goalLabels[profile.goal] ?? profile.goal} />
              </View>
              <View style={styles.divider} />
              <SummaryItem label="Diet" value={profile.dietType.replace(/_/g, ' ')} />
              {profile.allergies[0] !== 'none' && (
                <SummaryItem label="Allergies" value={profile.allergies.join(', ')} />
              )}
            </Card>
          </Animated.View>

          <Button
            label="Go to my Dashboard 🏠"
            onPress={handleStart}
            size="lg"
            fullWidth
            style={{ marginTop: Spacing[6] }}
            variant="secondary"
          />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const SummaryItem: React.FC<{ label: string; value: string; accent?: boolean }> = ({ label, value, accent }) => (
  <View style={{ marginVertical: Spacing[1], flex: 1 }}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={[styles.summaryValue, accent && { color: Colors.primary, fontSize: FontSizes.lg }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: Spacing[5], paddingBottom: Spacing[12], alignItems: 'center' },
  checkCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginTop: Spacing[8], marginBottom: Spacing[4] },
  checkEmoji: { fontSize: 52 },
  title: { fontSize: FontSizes['3xl'], fontWeight: FontWeights.extrabold, color: Colors.textInverse, textAlign: 'center' },
  subtitle: { fontSize: FontSizes.base, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: Spacing[2], marginBottom: Spacing[6] },
  summaryCard: { width: '100%', gap: Spacing[2] },
  cardName: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.textPrimary, marginBottom: Spacing[2] },
  row: { flexDirection: 'row', gap: Spacing[2] },
  divider: { height: 1, backgroundColor: Colors.divider, marginVertical: Spacing[2] },
  summaryLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryValue: { fontSize: FontSizes.base, fontWeight: FontWeights.semibold, color: Colors.textPrimary, textTransform: 'capitalize', marginTop: 2 },
});
