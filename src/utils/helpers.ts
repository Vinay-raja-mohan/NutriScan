import { UserProfile } from '../types';

export function calculateTDEE(profile: UserProfile): number {
  // Mifflin-St Jeor formula
  const bmr = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + (profile.gender === 'male' ? 5 : -161);
  const multipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
  };
  const tdee = Math.round(bmr * multipliers[profile.activityLevel]);
  if (profile.goal === 'lose_weight') return tdee - 300;
  if (profile.goal === 'gain_muscle') return tdee + 300;
  return tdee;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function getDayKey(date: Date = new Date()): import('../types').DayKey {
  const days: import('../types').DayKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

export function getDayLabel(dayKey: import('../types').DayKey): string {
  return dayKey.charAt(0).toUpperCase() + dayKey.slice(1);
}

export function getTodayCaloriesConsumed(plan: import('../types').WeeklyDietPlan | null): number {
  if (!plan) return 0;
  const dayKey = getDayKey();
  const day = plan.days[dayKey];
  if (!day) return 0;
  return (['breakfast', 'lunch', 'dinner', 'snack'] as const)
    .filter(m => day[m].status === 'logged')
    .reduce((sum, m) => sum + day[m].macros.calories, 0);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function formatDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}
