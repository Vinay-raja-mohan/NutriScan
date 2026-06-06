import { UserProfile, WeeklyDietPlan, DayKey, MealSlot, DayPlan } from '../types';
import { callGeminiJSON } from './geminiApi';
import { MOCK_DIET_PLAN } from '../data/mockDietPlan';

function buildDietPlanPrompt(profile: UserProfile): string {
  const conditions = profile.conditions.filter(c => c !== 'none').join(', ') || 'none';
  const allergies = profile.allergies.filter(a => a !== 'none').join(', ') || 'none';
  const bmr = Math.round(10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + 5);
  const activityMultipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
  };
  const tdee = Math.round(bmr * activityMultipliers[profile.activityLevel]);
  const targetCals = profile.goal === 'lose_weight' ? tdee - 300 : profile.goal === 'gain_muscle' ? tdee + 300 : tdee;

  return `
Generate a 7-day personalized Indian diet plan as a JSON object.

User Profile:
- Name: ${profile.name}, Age: ${profile.age}, Weight: ${profile.weightKg}kg, Height: ${profile.heightCm}cm
- Goal: ${profile.goal}, Activity: ${profile.activityLevel}
- Diet type: ${profile.dietType}
- Medical conditions: ${conditions}
- Allergies (NEVER include these): ${allergies}
- Cuisine preferences: ${profile.cuisinePrefs.join(', ') || 'Indian'}
- Daily calorie target: ${targetCals} kcal
- Weekly budget: ₹${profile.weeklyBudget}
- Household size: ${profile.householdSize}

Return a JSON object with this exact structure:
{
  "monday": { "targetCalories": number, "breakfast": MealSlot, "lunch": MealSlot, "dinner": MealSlot, "snack": MealSlot },
  "tuesday": { ... },
  "wednesday": { ... },
  "thursday": { ... },
  "friday": { ... },
  "saturday": { ... },
  "sunday": { ... }
}

Each MealSlot must have:
- id: string
- name: string (Short meal name)
- description: string (Max 5 words)
- macros: { calories, protein, carbs, fat }
- ingredients: string[] (Max 3 main ingredients)
- prepTimeMin: number
- recipeSteps: string[] (Max 2 short steps)
- status: "upcoming"
- cuisineTag: string
- wasteReduction: boolean

CRITICAL: Keep ALL text extremely short to save tokens. Respond ONLY with valid JSON. No markdown. No extra text.
`;
}

export async function generateDietPlan(profile: UserProfile): Promise<WeeklyDietPlan> {
  try {
    let rawDays: any = await callGeminiJSON<any>(buildDietPlanPrompt(profile));
    
    // 1. Unwrap if the AI wrapped it in { "dietPlan": { "monday": ... } }
    if (rawDays && !rawDays.monday && !rawDays.Monday) {
      if (rawDays.dietPlan) rawDays = rawDays.dietPlan;
      else if (rawDays.days) rawDays = rawDays.days;
      else if (rawDays.plan) rawDays = rawDays.plan;
    }

    // 2. Normalize keys to lowercase just in case the AI capitalized "Monday"
    const normalizedDays: any = {};
    for (const key of Object.keys(rawDays)) {
      normalizedDays[key.toLowerCase()] = rawDays[key];
    }

    const plan: WeeklyDietPlan = {
      userId: profile.id,
      weekStartDate: new Date().toISOString().split('T')[0],
      days: normalizedDays as Record<DayKey, DayPlan>,
    };
    return plan;
  } catch (err) {
    console.warn('Gemini diet plan generation failed, using mock data:', err);
    return MOCK_DIET_PLAN(profile.id);
  }
}

export async function generateMealSwaps(mealName: string, profile: UserProfile): Promise<MealSlot[]> {
  const prompt = `
Suggest 3 nutritionally equivalent Indian meal alternatives to "${mealName}" for:
- Diet type: ${profile.dietType}
- Conditions: ${profile.conditions.join(', ')}
- Allergies: ${profile.allergies.join(', ')}

Return JSON array of 3 MealSlot objects, each with: id, name, description, macros ({calories, protein, carbs, fat}), ingredients, prepTimeMin, status: "upcoming", cuisineTag, wasteReduction: false.
`;
  try {
    return await callGeminiJSON<MealSlot[]>(prompt);
  } catch {
    return [];
  }
}

export async function generateSingleDayPlan(profile: UserProfile, day: DayKey): Promise<DayPlan> {
  const bmr = Math.round(10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + 5);
  const activityMultipliers: Record<string, number> = { sedentary: 1.2, lightly_active: 1.375, moderately_active: 1.55, very_active: 1.725 };
  const tdee = Math.round(bmr * (activityMultipliers[profile.activityLevel] || 1.2));
  const targetCals = profile.goal === 'lose_weight' ? tdee - 300 : profile.goal === 'gain_muscle' ? tdee + 300 : tdee;

  const prompt = `
Generate a 1-day personalized Indian diet plan for ${day} as a JSON object.

User Profile:
- Goal: ${profile.goal}, Activity: ${profile.activityLevel}
- Diet type: ${profile.dietType}
- Medical conditions: ${profile.conditions.join(', ') || 'none'}
- Allergies: ${profile.allergies.join(', ') || 'none'}

Return a JSON object EXACTLY like this:
{
  "${day}": {
    "targetCalories": ${targetCals},
    "breakfast": { "id": "${day}_b", "name": "Short Name", "description": "Max 5 words", "macros": { "calories": 100, "protein": 10, "carbs": 10, "fat": 10 }, "ingredients": ["A", "B"], "prepTimeMin": 10, "recipeSteps": ["Step 1"], "status": "upcoming", "cuisineTag": "Indian", "wasteReduction": false },
    "lunch": { "id": "${day}_l", "name": "Short Name", "description": "Max 5 words", "macros": { "calories": 100, "protein": 10, "carbs": 10, "fat": 10 }, "ingredients": ["A", "B"], "prepTimeMin": 10, "recipeSteps": ["Step 1"], "status": "upcoming", "cuisineTag": "Indian", "wasteReduction": false },
    "dinner": { "id": "${day}_d", "name": "Short Name", "description": "Max 5 words", "macros": { "calories": 100, "protein": 10, "carbs": 10, "fat": 10 }, "ingredients": ["A", "B"], "prepTimeMin": 10, "recipeSteps": ["Step 1"], "status": "upcoming", "cuisineTag": "Indian", "wasteReduction": false },
    "snack": { "id": "${day}_s", "name": "Short Name", "description": "Max 5 words", "macros": { "calories": 100, "protein": 10, "carbs": 10, "fat": 10 }, "ingredients": ["A", "B"], "prepTimeMin": 10, "recipeSteps": ["Step 1"], "status": "upcoming", "cuisineTag": "Indian", "wasteReduction": false }
  }
}
CRITICAL: Keep ALL text extremely short. Respond ONLY with valid JSON.
`;

  try {
    let rawDays: any = await callGeminiJSON<any>(prompt);
    if (rawDays && !rawDays[day] && !rawDays[day.charAt(0).toUpperCase() + day.slice(1)]) {
      if (rawDays.dietPlan) rawDays = rawDays.dietPlan;
      else if (rawDays.days) rawDays = rawDays.days;
      else if (rawDays.plan) rawDays = rawDays.plan;
    }
    const dayData = rawDays[day] || rawDays[day.charAt(0).toUpperCase() + day.slice(1)];
    if (!dayData) throw new Error("Day data missing in AI response");
    return dayData as DayPlan;
  } catch (err) {
    console.warn('Gemini daily plan generation failed, using mock data:', err);
    return MOCK_DIET_PLAN(profile.id).days[day];
  }
}
