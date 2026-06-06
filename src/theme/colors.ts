// NutriScan Color Theme — Bioluminescent Glass
export const Colors = {
  // Bioluminescent Primary Gradients
  primary: '#0EA5E9', // Cyan
  primaryLight: '#38BDF8',
  primaryDark: '#0284C7',
  primaryMuted: 'rgba(14, 165, 233, 0.1)', // Glow shadow

  // Emerald Accent
  accent: '#10B981', // Neon Emerald
  accentLight: '#34D399',
  accentDark: '#059669',

  // Backgrounds (Zinc)
  background: '#09090B',
  surface: '#18181B',
  surfaceElevated: '#27272A',
  card: 'rgba(24, 24, 27, 0.6)', // Glassmorphism

  // Text
  textPrimary: '#FAFAFA',
  textSecondary: '#A1A1AA',
  textMuted: '#52525B',
  textInverse: '#09090B',

  // Semantic
  success: '#10B981', // Safe
  successLight: 'rgba(16, 185, 129, 0.15)',
  warning: '#F59E0B', // Caution
  warningLight: 'rgba(245, 158, 11, 0.15)',
  danger: '#EF4444', // Avoid
  dangerLight: 'rgba(239, 68, 68, 0.15)',
  info: '#3B82F6',
  infoLight: 'rgba(59, 130, 246, 0.15)',

  // Macros (Distinct layered colors for SVG rings)
  protein: '#8B5CF6', // Violet
  carbs: '#F97316', // Sunset Orange
  fat: '#F43F5E', // Rose

  // Gradients (start, end)
  gradientPrimary: ['#0EA5E9', '#10B981'] as [string, string],
  gradientSoft: ['#18181B', '#09090B'] as [string, string],
  gradientCard: ['rgba(24, 24, 27, 0.8)', 'rgba(9, 9, 11, 0.8)'] as [string, string],
  gradientHero: ['#0EA5E9', '#10B981', '#34D399'] as [string, string, string],

  // Tab bar
  tabActive: '#10B981',
  tabInactive: '#52525B',
  tabBackground: '#09090B',
  tabBorder: '#27272A',

  // Divider
  divider: '#27272A',
  border: 'rgba(255, 255, 255, 0.05)',

  // Overlay
  overlay: 'rgba(0,0,0,0.7)',
  overlayLight: 'rgba(24, 24, 27, 0.6)',

  // Meal status
  mealLogged: '#10B981',
  mealUpcoming: '#52525B',
  mealSkipped: '#EF4444',

  // Water
  waterFilled: '#38BDF8',
  waterEmpty: '#18181B',

  // Transparent
  transparent: 'transparent',
};

export type ColorKey = keyof typeof Colors;
