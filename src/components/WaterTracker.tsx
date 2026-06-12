import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { FontSizes, FontWeights, FontFamily } from '../theme/typography';
import { Radius, Spacing } from '../theme/spacing';

interface WaterTrackerProps {
  glasses: number;
  total?: number;
  onGlassPress: (glasses: number) => void;
}

export const WaterTracker: React.FC<WaterTrackerProps> = ({
  glasses,
  total = 8,
  onGlassPress,
}) => {
  const fillProgress = useSharedValue(0);

  useEffect(() => {
    fillProgress.value = withSpring(glasses / total, { damping: 15, stiffness: 90 });
  }, [glasses, total]);

  const fillStyle = useAnimatedStyle(() => ({
    height: `${Math.min(fillProgress.value, 1) * 100}%`,
  }));

  const handleAdd = () => {
    if (glasses < total) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onGlassPress(glasses + 1);
    }
  };

  const handleSub = () => {
    if (glasses > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onGlassPress(glasses - 1);
    }
  };

  return (
    <View style={styles.container}>
      {/* Liquid Fill Background */}
      <Animated.View style={[styles.liquidFill, fillStyle]} />

      <View style={styles.content}>
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Ionicons name="water" size={18} color={Colors.primary} />
            <Text style={styles.title}>Hydration</Text>
          </View>
          <Text style={styles.count}>
            <Text style={styles.countFilled}>{glasses}</Text>
            <Text style={styles.countTotal}> / {total} glasses</Text>
          </Text>
          <Text style={styles.hint}>
            {glasses === 0
              ? 'Tap + to log water'
              : glasses < 4
              ? 'Stay hydrated'
              : glasses < total
              ? 'Almost there!'
              : 'Daily goal reached!'}
          </Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.btn} onPress={handleSub} activeOpacity={0.7}>
            <Text style={styles.btnText}>-</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnPrimary} onPress={handleAdd} activeOpacity={0.7}>
            <Text style={styles.btnTextPrimary}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 100,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  liquidFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(245, 158, 11, 0.15)', // Amber tint
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
  },
  textContainer: {
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  title: {
    fontFamily: FontFamily.display,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  count: {
    fontFamily: FontFamily.body,
    fontSize: FontSizes.base,
  },
  countFilled: {
    fontWeight: FontWeights.bold,
    color: Colors.primaryLight,
  },
  countTotal: {
    color: Colors.textMuted,
  },
  hint: {
    fontFamily: FontFamily.body,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  btnPrimary: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontFamily: FontFamily.display,
    fontSize: FontSizes['2xl'],
    color: Colors.textSecondary,
    marginTop: -2,
  },
  btnTextPrimary: {
    fontFamily: FontFamily.display,
    fontSize: FontSizes['2xl'],
    color: Colors.textInverse,
    marginTop: -2,
  },
});
