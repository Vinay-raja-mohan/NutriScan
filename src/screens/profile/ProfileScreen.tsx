import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, StatusBar, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../store/userStore';
import { Card } from '../../components/ui/Card';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import { getInitials, formatINR, calculateTDEE } from '../../utils/helpers';

export const ProfileScreen: React.FC = () => {
  const { profile, clearProfile } = useUserStore();

  if (!profile) return (
    <SafeAreaView style={styles.safe}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: FontSizes.lg, color: Colors.textMuted }}>No profile found</Text>
      </View>
    </SafeAreaView>
  );

  const tdee = calculateTDEE(profile);
  const goalLabels: Record<string, string> = {
    lose_weight: 'Lose Weight', gain_muscle: 'Gain Muscle', maintain_weight: 'Maintain Weight',
    improve_gut: 'Improve Gut Health', manage_condition: 'Manage Condition', eat_healthier: 'Eat Healthier',
  };
  const activityLabels: Record<string, string> = {
    sedentary: 'Sedentary', lightly_active: 'Lightly Active',
    moderately_active: 'Moderately Active', very_active: 'Very Active',
  };

  const settings: { icon: React.ReactNode; label: string; action: () => void }[] = [
    { icon: <Ionicons name="trash-outline" size={20} color={Colors.danger} />, label: 'Reset Profile', action: () => Alert.alert('Reset', 'This will delete all your data. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: clearProfile },
    ]) },
  ];

  return (
    <>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <LinearGradient colors={['#111111', '#050505']} style={styles.hero}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{getInitials(profile.name)}</Text>
            </View>
            <Text style={styles.heroName}>{profile.name}</Text>
            <Text style={styles.heroStats}>{profile.age} yrs  {profile.weightKg}kg  {profile.heightCm}cm</Text>
            <View style={styles.goalBadge}>
              <View style={styles.goalBadgeContent}>
                <Ionicons name="flag" size={14} color={Colors.primary} />
                <Text style={styles.goalBadgeText}>{goalLabels[profile.goal] ?? profile.goal}</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.body}>
            <Card>
              <View style={styles.targetRow}>
                <View style={styles.targetItem}>
                  <Text style={styles.targetValue}>{tdee}</Text>
                  <Text style={styles.targetLabel}>Daily kcal Target</Text>
                </View>
                <View style={styles.targetDivider} />
                <View style={styles.targetItem}>
                  <Text style={[styles.targetValue, { fontSize: FontSizes.sm }]}>{activityLabels[profile.activityLevel]}</Text>
                  <Text style={styles.targetLabel}>Activity</Text>
                </View>
                <View style={styles.targetDivider} />
                <View style={styles.targetItem}>
                  <Text style={styles.targetValue}>{formatINR(profile.weeklyBudget)}</Text>
                  <Text style={styles.targetLabel}>Weekly Budget</Text>
                </View>
              </View>
            </Card>

            <Card>
              <Text style={styles.sectionTitle}>HEALTH SUMMARY</Text>
              <ProfileRow icon={<Ionicons name="nutrition-outline" size={18} color={Colors.primary} />} label="Diet" value={profile.dietType.replace(/_/g, ' ')} />
              {profile.conditions[0] !== 'none' && (
                <ProfileRow icon={<Ionicons name="medkit-outline" size={18} color={Colors.danger} />} label="Conditions" value={profile.conditions.map(c => c.replace(/_/g, ' ')).join(', ')} />
              )}
              {profile.allergies[0] !== 'none' && (
                <ProfileRow icon={<Ionicons name="alert-circle-outline" size={18} color={Colors.warning} />} label="Allergies" value={profile.allergies.join(', ')} />
              )}
              <ProfileRow icon={<Ionicons name="restaurant-outline" size={18} color={Colors.primary} />} label="Meals/day" value={`${profile.mealFrequency} meals`} />
              <ProfileRow icon={<Ionicons name="people-outline" size={18} color={Colors.primary} />} label="Household" value={profile.householdSize.replace(/_/g, ' ')} />
            </Card>

            <Card>
              <Text style={styles.sectionTitle}>SETTINGS</Text>
              {settings.map((s, i) => (
                <TouchableOpacity key={i} style={[styles.settingRow, i < settings.length - 1 && styles.settingBorder]} onPress={s.action} activeOpacity={0.7}>
                  <View style={styles.settingIconContainer}>{s.icon}</View>
                  <Text style={styles.settingLabel}>{s.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              ))}
            </Card>

            <Text style={styles.version}>NutriScan v1.0.0</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const ProfileRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <View style={styles.profileRow}>
    <View style={styles.profileRowIconContainer}>{icon}</View>
    <Text style={styles.profileRowLabel}>{label}</Text>
    <Text style={styles.profileRowValue} numberOfLines={1}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 120 },
  hero: { padding: Spacing[6], paddingTop: Spacing[8], alignItems: 'center', gap: Spacing[2], paddingBottom: Spacing[8] },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[2], borderWidth: 3, borderColor: Colors.primary },
  avatarText: { fontSize: FontSizes['3xl'], fontWeight: FontWeights.bold, color: '#FFFFFF' },
  heroName: { fontSize: FontSizes['2xl'], fontWeight: FontWeights.bold, color: '#FFFFFF' },
  heroStats: { fontSize: FontSizes.sm, color: 'rgba(255,255,255,0.8)' },
  goalBadge: { backgroundColor: Colors.primaryMuted, borderRadius: Radius.full, paddingHorizontal: Spacing[4], paddingVertical: Spacing[2] },
  goalBadgeContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  goalBadgeText: { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold, color: Colors.primary },
  body: { padding: Spacing[4], marginTop: -Spacing[4], gap: Spacing[3] },
  sectionTitle: { fontSize: FontSizes.xs, fontWeight: FontWeights.semibold, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: Spacing[3] },
  targetRow: { flexDirection: 'row' },
  targetItem: { flex: 1, alignItems: 'center', gap: 4 },
  targetValue: { fontSize: FontSizes.base, fontWeight: FontWeights.bold, color: Colors.primary, textAlign: 'center' },
  targetLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, textAlign: 'center' },
  targetDivider: { width: 1, backgroundColor: Colors.divider },
  profileRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing[2], gap: Spacing[3] },
  profileRowIconContainer: { width: 28, alignItems: 'center', justifyContent: 'center' },
  profileRowLabel: { fontSize: FontSizes.sm, color: Colors.textSecondary, width: 80 },
  profileRowValue: { flex: 1, fontSize: FontSizes.sm, fontWeight: FontWeights.semibold, color: Colors.textPrimary, textTransform: 'capitalize' },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing[4], gap: Spacing[3] },
  settingBorder: { borderBottomWidth: 1, borderBottomColor: Colors.divider },
  settingIconContainer: { width: 28, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { flex: 1, fontSize: FontSizes.base, color: Colors.textPrimary },
  version: { fontSize: FontSizes.xs, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing[4] },
});
