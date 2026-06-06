// ─── User Profile ────────────────────────────────────────────────────────────

export type Gender = 'male' | 'female' | 'prefer_not_to_say';
export type HeightUnit = 'cm' | 'ft';
export type WeightUnit = 'kg' | 'lbs';
export type DietType =
  | 'no_restriction'
  | 'vegetarian'
  | 'vegan'
  | 'keto'
  | 'paleo'
  | 'mediterranean'
  | 'halal'
  | 'jain'
  | 'intermittent_fasting';

export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
export type PrimaryGoal =
  | 'lose_weight'
  | 'gain_muscle'
  | 'maintain_weight'
  | 'improve_gut'
  | 'manage_condition'
  | 'eat_healthier';

export type HouseholdSize = 'just_me' | 'two' | 'family' | 'large_family';
export type MealFrequency = 2 | 3 | 5;

export type Allergen =
  | 'gluten'
  | 'dairy'
  | 'nuts'
  | 'soy'
  | 'eggs'
  | 'shellfish'
  | 'fish'
  | 'sesame'
  | 'none';

export type MedicalCondition =
  | 'diabetes_type1'
  | 'diabetes_type2'
  | 'hypertension'
  | 'high_cholesterol'
  | 'pcos'
  | 'thyroid'
  | 'kidney_disease'
  | 'lactose_intolerance'
  | 'ibs'
  | 'none';

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  country: string;
  allergies: Allergen[];
  conditions: MedicalCondition[];
  dietType: DietType;
  cuisinePrefs: string[];
  goal: PrimaryGoal;
  activityLevel: ActivityLevel;
  weeklyBudget: number; // in INR
  householdSize: HouseholdSize;
  mealFrequency: MealFrequency;
  onboardingComplete: boolean;
  createdAt: string;
}

// ─── Nutrition ────────────────────────────────────────────────────────────────

export interface Macros {
  calories: number;
  protein: number; // grams
  carbs: number;   // grams
  fat: number;     // grams
  fiber?: number;
  sugar?: number;
  sodium?: number; // mg
}

// ─── Meal & Diet Plan ─────────────────────────────────────────────────────────

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type MealStatus = 'upcoming' | 'logged' | 'skipped';

export interface MealSlot {
  id: string;
  name: string;
  description?: string;
  macros: Macros;
  recipeSteps?: string[];
  ingredients?: string[];
  prepTimeMin?: number;
  status: MealStatus;
  cuisineTag?: string;
  wasteReduction?: boolean; // uses expiring items
}

export interface DayPlan {
  breakfast: MealSlot;
  lunch: MealSlot;
  dinner: MealSlot;
  snack: MealSlot;
  targetCalories: number;
}

export type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface WeeklyDietPlan {
  userId: string;
  weekStartDate: string;
  days: Record<DayKey, DayPlan>;
}

// ─── Water Tracker ────────────────────────────────────────────────────────────

export interface WaterLog {
  date: string;
  glasses: number; // out of 8
}

// ─── Scanner / Scanned Items ─────────────────────────────────────────────────

export type ScannerType = 'label' | 'ingredient';

export interface AllergenFlag {
  allergen: string;
  severity: 'warning' | 'danger';
  message: string;
}

export interface HealthFlag {
  icon: string;
  label: string;
  severity: 'good' | 'warning' | 'danger';
}

export interface ScannedLabelItem {
  id: string;
  userId: string;
  timestamp: string;
  type: 'label';
  itemName: string;
  brand?: string;
  nutrition: Macros & { servingSize?: string };
  safetyScore: number; // 0-100
  allergenFlags: AllergenFlag[];
  healthFlags: HealthFlag[];
  verdict: 'safe' | 'caution' | 'avoid';
  alternatives?: string[];
  addedToLog: boolean;
}

export interface DetectedIngredient {
  name: string;
  confidence: number;
  expiringSoon?: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  prepTimeMin: number;
  macros: Macros;
  ingredients: string[];
  missingIngredients: string[];
  steps: string[];
  matchesDietPlan: boolean;
  usesExpiringItems: number;
  cuisineTag: string;
  dietTags: string[];
}

// ─── Waste Tracker ────────────────────────────────────────────────────────────

export interface WasteTracker {
  userId: string;
  weekOf: string;
  mealsFromPantry: number;
  weightSavedGrams: number;
  moneySavedINR: number;
  co2AvoidedKg: number;
}

// ─── Shopping List ────────────────────────────────────────────────────────────

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  category: 'produce' | 'dairy' | 'grains' | 'protein' | 'spices' | 'other';
  estimatedCostINR: number;
  checked: boolean;
}

// ─── AI Chat ──────────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  isPersonalized?: boolean;
  isLoading?: boolean;
}

// ─── Progress ────────────────────────────────────────────────────────────────

export interface WeeklyProgress {
  streak: number;
  weightChangKg: number;
  planAdherencePct: number;
  wasteReductionMeals: number;
}
