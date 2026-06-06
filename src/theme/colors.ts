// NutriScan Color Theme — Dark Forest Green
export const Colors = {
  // Primary — Neon Lime Green
  primary: '#A8E063',
  primaryLight: '#C5F085',
  primaryDark: '#7ED321',
  primaryMuted: 'rgba(168, 224, 99, 0.12)',

  // Backgrounds — Deep Forest Green
  background: '#0D1F0F',
  surface: '#1E2D1E',
  surfaceElevated: '#243024',
  card: 'rgba(30, 45, 30, 0.85)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A8A0',
  textMuted: '#5A6B5A',
  textInverse: '#0D1F0F',

  // Macro accent colors
  calories: '#FF6B35',       // Orange-red
  caloriesMuted: 'rgba(255, 107, 53, 0.15)',
  protein: '#4ECDC4',        // Teal
  proteinMuted: 'rgba(78, 205, 196, 0.15)',
  carbs: '#FF8C69',          // Coral
  carbsMuted: 'rgba(255, 140, 105, 0.15)',
  fat: '#A78BFA',            // Soft purple
  fatMuted: 'rgba(167, 139, 250, 0.15)',
  water: '#60A5FA',          // Blue
  waterMuted: 'rgba(96, 165, 250, 0.15)',

  // Semantic
  success: '#A8E063',
  successLight: 'rgba(168, 224, 99, 0.15)',
  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.15)',
  danger: '#EF4444',
  dangerLight: 'rgba(239, 68, 68, 0.15)',
  info: '#4ECDC4',
  infoLight: 'rgba(78, 205, 196, 0.15)',

  // Gradients
  gradientPrimary: ['#A8E063', '#7ED321'] as [string, string],
  gradientBackground: ['#0D1F0F', '#1A2E1A'] as [string, string],
  gradientCard: ['#1E2D1E', '#243024'] as [string, string],
  gradientHero: ['#1A2E1A', '#0D1F0F'] as [string, string],

  // Tab bar
  tabActive: '#A8E063',
  tabInactive: '#5A6B5A',
  tabBackground: '#0D1F0F',
  tabBorder: '#1E2D1E',

  // Borders / Dividers
  divider: '#1E2D1E',
  border: 'rgba(168, 224, 99, 0.08)',
  borderActive: 'rgba(168, 224, 99, 0.4)',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(13, 31, 15, 0.7)',

  // Meal status
  mealLogged: '#A8E063',
  mealUpcoming: '#5A6B5A',
  mealSkipped: '#EF4444',

  // Water tracker
  waterFilled: '#60A5FA',
  waterEmpty: '#1E2D1E',

  transparent: 'transparent',
};

export type ColorKey = keyof typeof Colors;
