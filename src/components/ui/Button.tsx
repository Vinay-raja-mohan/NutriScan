import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights, FontFamily } from '../../theme/typography';
import { Radius, Spacing, Shadow } from '../../theme/spacing';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.96, { stiffness: 300 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { stiffness: 300 });
  };

  const sizeStyles = sizes[size];
  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <Animated.View style={[animStyle, fullWidth && { width: '100%' }, Shadow.primaryGlow]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isDisabled}
          activeOpacity={1}
          style={[{ borderRadius: Radius.lg, overflow: 'hidden' }, style]}
        >
          <LinearGradient
            colors={isDisabled ? ['#374151', '#1F2937'] : Colors.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.base, sizeStyles.container]}
          >
            {loading ? (
              <ActivityIndicator color={Colors.textInverse} size="small" />
            ) : (
              <View style={styles.inner}>
                {leftIcon}
                <Text style={[styles.primaryText, sizeStyles.text, textStyle]}>{label}</Text>
                {rightIcon}
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      activeOpacity={1}
      style={[
        styles.base,
        sizeStyles.container,
        variantStyles[variant],
        isDisabled && styles.disabled,
        fullWidth && { width: '100%' },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'ghost' ? Colors.primary : Colors.primary}
          size="small"
        />
      ) : (
        <View style={styles.inner}>
          {leftIcon}
          <Text
            style={[
              styles.text,
              sizeStyles.text,
              variant === 'ghost' && { color: Colors.primary },
              variant === 'danger' && { color: Colors.danger },
              textStyle,
            ]}
          >
            {label}
          </Text>
          {rightIcon}
        </View>
      )}
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  primaryText: {
    fontFamily: FontFamily.body,
    color: Colors.textInverse,
    fontWeight: FontWeights.semibold,
  },
  text: {
    fontFamily: FontFamily.body,
    color: Colors.primary,
    fontWeight: FontWeights.semibold,
  },
  disabled: {
    opacity: 0.5,
  },
});

const variantStyles = StyleSheet.create({
  secondary: {
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
  },
  ghost: {
    backgroundColor: Colors.transparent,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  danger: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1.5,
    borderColor: Colors.danger,
  },
});

const sizes = {
  sm: {
    container: { paddingVertical: Spacing[2], paddingHorizontal: Spacing[4] },
    text: { fontSize: FontSizes.sm } as TextStyle,
  },
  md: {
    container: { paddingVertical: Spacing[3], paddingHorizontal: Spacing[6] },
    text: { fontSize: FontSizes.base } as TextStyle,
  },
  lg: {
    container: { paddingVertical: Spacing[4], paddingHorizontal: Spacing[8] },
    text: { fontSize: FontSizes.md } as TextStyle,
  },
};
