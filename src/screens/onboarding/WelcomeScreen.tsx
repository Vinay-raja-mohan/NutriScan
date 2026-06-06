import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue, withRepeat, withTiming, useAnimatedStyle, Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights } from '../../theme/typography';
import { Spacing, Shadow } from '../../theme/spacing';
import { OnboardingStackParamList } from '../../navigation/types';

type Props = { navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Welcome'> };

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.12, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      -1, true
    );
  }, []);

  const logoAnim = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const features = [
    { icon: '🔍', text: 'Smart food label scanner' },
    { icon: '🤖', text: 'AI-powered nutrition chat' },
    { icon: '📅', text: 'Personalized diet plans' },
    { icon: '♻️', text: 'Zero waste kitchen' },
  ];

  return (
    <>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={Colors.gradientHero} style={styles.gradient}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.top}>
            <Animated.Text style={[styles.logoEmoji, logoAnim]}>🌿</Animated.Text>
            <Text style={styles.appName}>NutriScan</Text>
            <Text style={styles.tagline}>
              Your kitchen's personal nutritionist —{"\n"}reducing waste, protecting your health.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Everything you need to eat well</Text>
            <View style={styles.features}>
              {features.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Text style={styles.featureIcon}>{f.icon}</Text>
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>
            <Button
              label="Get Started →"
              onPress={() => navigation.navigate('PersonalInfo')}
              size="lg"
              fullWidth
            />
            <Text style={styles.loginHint}>Your data is saved locally — private & secure.</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1, justifyContent: 'space-between' },
  top: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing[6] },
  logoEmoji: { fontSize: 80, marginBottom: Spacing[4] },
  appName: { fontSize: FontSizes['5xl'], fontWeight: FontWeights.extrabold, color: '#FFFFFF', letterSpacing: -1 },
  tagline: { fontSize: FontSizes.base, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: Spacing[3], lineHeight: 24 },
  card: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: Spacing[6],
    paddingBottom: Spacing[8],
    ...Shadow.lg,
  },
  cardTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.textPrimary, marginBottom: Spacing[4], textAlign: 'center' },
  features: { gap: Spacing[3], marginBottom: Spacing[5] },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  featureIcon: { fontSize: 22, width: 32 },
  featureText: { fontSize: FontSizes.base, color: Colors.textSecondary, flex: 1 },
  loginHint: { fontSize: FontSizes.xs, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing[3] },
});
