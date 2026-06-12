// NutriScan Color Theme — Obsidian & Amber
export const Colors = {
  // Amber Primary
  primary: '#F59E0B',
  primaryLight: '#FBBF24',
  primaryDark: '#D97706',
  primaryMuted: 'rgba(245, 158, 11, 0.12)',

  // Indigo Accent
  accent: '#6366F1',
  accentLight: '#818CF8',
  accentDark: '#4F46E5',

  // Backgrounds (Deep Obsidian)
  background: '#050505',
  surface: '#111111',
  surfaceElevated: '#1A1A1A',
  card: 'rgba(17, 17, 17, 0.75)',

  // Text
  textPrimary: '#F5F5F5',
  textSecondary: '#9CA3AF',
  textMuted: '#4B5563',
  textInverse: '#050505',

  // Semantic
  success: '#22C55E',
  successLight: 'rgba(34, 197, 94, 0.12)',
  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.12)',
  danger: '#EF4444',
  dangerLight: 'rgba(239, 68, 68, 0.12)',
  info: '#3B82F6',
  infoLight: 'rgba(59, 130, 246, 0.12)',

  // Macros
  protein: '#8B5CF6',
  carbs: '#F97316',
  fat: '#EC4899',

  // Gradients
  gradientPrimary: ['#F59E0B', '#D97706'] as [string, string],
  gradientSoft: ['#111111', '#050505'] as [string, string],
  gradientCard: ['rgba(17, 17, 17, 0.85)', 'rgba(5, 5, 5, 0.85)'] as [string, string],
  gradientHero: ['#111111', '#0A0A0A', '#050505'] as [string, string, string],

  // Tab bar
  tabActive: '#F59E0B',
  tabInactive: '#4B5563',
  tabBackground: '#0A0A0A',
  tabBorder: '#1A1A1A',

  // Divider
  divider: '#1F1F1F',
  border: 'rgba(255, 255, 255, 0.06)',

  // Overlay
  overlay: 'rgba(0,0,0,0.8)',
  overlayLight: 'rgba(17, 17, 17, 0.7)',

  // Meal status
  mealLogged: '#22C55E',
  mealUpcoming: '#4B5563',
  mealSkipped: '#EF4444',

  // Water
  waterFilled: '#FBBF24',
  waterEmpty: '#111111',

  // Transparent
  transparent: 'transparent',
};

export type ColorKey = keyof typeof Colors;
