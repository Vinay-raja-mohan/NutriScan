import { StyleSheet } from 'react-native';

export const FontSizes = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
};

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const FontFamily = {
  display: 'SpaceGrotesk_700Bold',
  body: 'Inter_400Regular',
};

export const LineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};

export const Typography = StyleSheet.create({
  hero: {
    fontFamily: FontFamily.display,
    fontSize: FontSizes['4xl'],
    fontWeight: FontWeights.extrabold,
    letterSpacing: -0.5,
  },
  h1: {
    fontFamily: FontFamily.display,
    fontSize: FontSizes['3xl'],
    fontWeight: FontWeights.bold,
    letterSpacing: -0.3,
  },
  h2: {
    fontFamily: FontFamily.display,
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
  },
  h3: {
    fontFamily: FontFamily.display,
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semibold,
  },
  h4: {
    fontFamily: FontFamily.display,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
  },
  bodyLarge: {
    fontFamily: FontFamily.body,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.regular,
    lineHeight: FontSizes.md * 1.5,
  },
  body: {
    fontFamily: FontFamily.body,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.regular,
    lineHeight: FontSizes.base * 1.5,
  },
  bodySmall: {
    fontFamily: FontFamily.body,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.regular,
    lineHeight: FontSizes.sm * 1.5,
  },
  label: {
    fontFamily: FontFamily.body,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  caption: {
    fontFamily: FontFamily.body,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.regular,
    lineHeight: FontSizes.xs * 1.5,
  },
  button: {
    fontFamily: FontFamily.body,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    letterSpacing: 0.3,
  },
  buttonSmall: {
    fontFamily: FontFamily.body,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
});
