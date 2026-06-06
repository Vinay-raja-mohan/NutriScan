import { UserProfile, Recipe, DetectedIngredient } from '../types';
import { callGeminiJSON } from './geminiApi';
import { MOCK_RECIPES } from '../data/mockRecipes';

export async function generateRecipes(
  ingredients: DetectedIngredient[],
  profile: UserProfile,
): Promise<Recipe[]> {
  const ingredientNames = ingredients.map(i => i.name).join(', ');
  const expiringNames = ingredients.filter(i => i.expiringSoon).map(i => i.name).join(', ');
  const conditions = profile.conditions.filter(c => c !== 'none').join(', ') || 'none';
  const allergies = profile.allergies.filter(a => a !== 'none').join(', ') || 'none';

  const prompt = `
Generate 4 Indian recipes using ONLY these available ingredients: ${ingredientNames}.
Expiring soon (PRIORITIZE these): ${expiringNames || 'none'}

User constraints:
- Diet: ${profile.dietType}
- Allergies (avoid): ${allergies}
- Medical conditions: ${conditions}

Return a JSON array of 4 Recipe objects, each with:
- id: string
- name: string
- emoji: string (relevant food emoji)
- prepTimeMin: number
- macros: { calories, protein, carbs, fat }
- ingredients: string[] (subset of provided + basics like salt/oil)
- missingIngredients: string[] (optional items not in the list)
- steps: string[] (4-6 cooking steps)
- matchesDietPlan: boolean
- usesExpiringItems: number (count of expiring items used)
- cuisineTag: string
- dietTags: string[] (e.g. ["vegetarian", "high-protein"])
`;

  try {
    return await callGeminiJSON<Recipe[]>(prompt);
  } catch (err) {
    console.warn('Recipe generation failed, using mocks:', err);
    return MOCK_RECIPES;
  }
}
