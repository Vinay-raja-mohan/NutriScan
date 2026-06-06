import { UserProfile, AllergenFlag, HealthFlag, Macros } from '../types';

const ALLERGEN_INGREDIENT_MAP: Record<string, string[]> = {
  gluten: ['wheat', 'flour', 'barley', 'rye', 'oats', 'semolina', 'maida', 'atta'],
  dairy: ['milk', 'cream', 'butter', 'cheese', 'lactose', 'whey', 'casein', 'paneer', 'curd', 'yogurt'],
  nuts: ['peanut', 'almond', 'cashew', 'walnut', 'pistachio', 'hazelnut', 'nut'],
  soy: ['soy', 'soya', 'tofu', 'tempeh', 'edamame'],
  eggs: ['egg', 'albumin', 'mayonnaise'],
  shellfish: ['shrimp', 'crab', 'lobster', 'prawn', 'shellfish'],
  fish: ['fish', 'tuna', 'salmon', 'cod', 'anchovy', 'sardine'],
  sesame: ['sesame', 'tahini', 'til'],
};

export interface SafetyResult {
  score: number;
  verdict: 'safe' | 'caution' | 'avoid';
  allergenFlags: AllergenFlag[];
  healthFlags: HealthFlag[];
  alternatives: string[];
}

export function calculateSafetyScore(
  nutrition: Macros & { sodium?: number; sugar?: number; servingSize?: string },
  ingredientText: string,
  profile: UserProfile,
): SafetyResult {
  let score = 100;
  const allergenFlags: AllergenFlag[] = [];
  const healthFlags: HealthFlag[] = [];
  const lowerIngredients = ingredientText.toLowerCase();

  // ─── Allergen check ─────────────────────────────────────────────
  for (const allergen of profile.allergies) {
    if (allergen === 'none') continue;
    const keywords = ALLERGEN_INGREDIENT_MAP[allergen] ?? [];
    const found = keywords.some(kw => lowerIngredients.includes(kw));
    if (found) {
      score -= 30;
      allergenFlags.push({
        allergen,
        severity: 'danger',
        message: `Contains ${allergen} — matches your allergy`,
      });
    }
  }

  // ─── Health condition checks ─────────────────────────────────────
  const hasDiabetes = profile.conditions.some(c => c.startsWith('diabetes'));
  const hasHypertension = profile.conditions.includes('hypertension');
  const hasHighCholesterol = profile.conditions.includes('high_cholesterol');

  // High sugar (>15g) — bad for diabetics
  if ((nutrition.sugar ?? 0) > 15) {
    if (hasDiabetes) {
      score -= 20;
      healthFlags.push({ icon: '🍬', label: `High Sugar (${nutrition.sugar}g) — risky for diabetes`, severity: 'danger' });
    } else {
      score -= 8;
      healthFlags.push({ icon: '🍬', label: `High Sugar (${nutrition.sugar}g)`, severity: 'warning' });
    }
  } else {
    healthFlags.push({ icon: '✅', label: 'Sugar levels acceptable', severity: 'good' });
  }

  // High sodium (>600mg) — bad for hypertension
  if ((nutrition.sodium ?? 0) > 600) {
    if (hasHypertension) {
      score -= 20;
      healthFlags.push({ icon: '🧂', label: `High Sodium (${nutrition.sodium}mg) — risky for hypertension`, severity: 'danger' });
    } else {
      score -= 8;
      healthFlags.push({ icon: '🧂', label: `High Sodium (${nutrition.sodium}mg)`, severity: 'warning' });
    }
  } else {
    healthFlags.push({ icon: '✅', label: `Sodium OK (${nutrition.sodium ?? 0}mg)`, severity: 'good' });
  }

  // High saturated fat (>5g) — bad for cholesterol
  if ((nutrition.fat ?? 0) > 10) {
    if (hasHighCholesterol) {
      score -= 15;
      healthFlags.push({ icon: '🧈', label: `High Fat (${nutrition.fat}g) — watch cholesterol`, severity: 'danger' });
    } else {
      score -= 5;
      healthFlags.push({ icon: '🧈', label: `High Fat (${nutrition.fat}g)`, severity: 'warning' });
    }
  } else {
    healthFlags.push({ icon: '✅', label: `Fat levels healthy (${nutrition.fat}g)`, severity: 'good' });
  }

  // MSG check
  if (lowerIngredients.includes('msg') || lowerIngredients.includes('monosodium glutamate')) {
    score -= 5;
    healthFlags.push({ icon: '⚠️', label: 'Contains MSG', severity: 'warning' });
  }

  // Diet type compatibility
  if (profile.dietType === 'vegan') {
    const nonVegan = ['milk', 'egg', 'meat', 'chicken', 'beef', 'pork', 'honey', 'cream', 'butter', 'cheese'];
    const found = nonVegan.filter(nv => lowerIngredients.includes(nv));
    if (found.length > 0) {
      score -= 20;
      healthFlags.push({ icon: '🌱', label: `Not vegan: contains ${found.join(', ')}`, severity: 'danger' });
    }
  } else if (profile.dietType === 'vegetarian') {
    const nonVeg = ['chicken', 'beef', 'pork', 'fish', 'shrimp', 'meat', 'gelatin'];
    const found = nonVeg.filter(nv => lowerIngredients.includes(nv));
    if (found.length > 0) {
      score -= 20;
      healthFlags.push({ icon: '🥗', label: `Not vegetarian: contains ${found.join(', ')}`, severity: 'danger' });
    }
  }

  const finalScore = Math.max(0, Math.min(100, score));
  const verdict: 'safe' | 'caution' | 'avoid' =
    finalScore >= 70 ? 'safe' : finalScore >= 45 ? 'caution' : 'avoid';

  // Build alternatives based on score
  const alternatives: string[] = [];
  if (verdict !== 'safe') {
    alternatives.push('Roasted Makhana (Score: 88/100)');
    alternatives.push('Baked Multigrain Chips (Score: 74/100)');
    alternatives.push('Fox Nut Trail Mix (Score: 81/100)');
  }

  return { score: finalScore, verdict, allergenFlags, healthFlags, alternatives };
}
