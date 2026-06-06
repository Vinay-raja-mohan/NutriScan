const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const MODEL = 'gemini-3.5-flash';
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

async function test() {
  const prompt = `
Generate a 7-day personalized Indian diet plan as a JSON object.

User Profile:
- Name: Vinay, Age: 25, Weight: 70kg, Height: 175cm
- Goal: eat_healthier, Activity: moderately_active
- Diet type: vegetarian
- Medical conditions: none
- Allergies (NEVER include these): none
- Cuisine preferences: Indian
- Daily calorie target: 2000 kcal
- Weekly budget: ₹1000
- Household size: just_me

Return a JSON object with this exact structure:
{
  "monday": { "targetCalories": 2000, "breakfast": MealSlot, "lunch": MealSlot, "dinner": MealSlot, "snack": MealSlot },
  "tuesday": { ... },
  "wednesday": { ... },
  "thursday": { ... },
  "friday": { ... },
  "saturday": { ... },
  "sunday": { ... }
}

Each MealSlot must have:
- id: string (e.g. "mon_breakfast")
- name: string (Indian meal name)
- description: string (1 sentence)
- macros: { calories, protein, carbs, fat } (all numbers)
- ingredients: string[] (list of 4-8 ingredients)
- prepTimeMin: number
- recipeSteps: string[] (3-6 steps)
- status: "upcoming"
- cuisineTag: string
- wasteReduction: boolean

MAKE SURE: No allergens (none), fits diet type (vegetarian), varied across days, realistic Indian meals.

Respond ONLY with valid JSON, no markdown code blocks, no extra text.
`;

  try {
    const res = await axios.post(`${BASE_URL}?key=${GEMINI_API_KEY}`, {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192 } // increased tokens because diet plan is huge
    }, { timeout: 120000 });
    
    const raw = res.data.candidates[0].content.parts[0].text;
    console.log("RAW RESPONSE LENGTH:", raw.length);
    console.log("RAW RESPONSE SNIPPET:", raw.substring(0, 100));
    console.log("RAW RESPONSE END:", raw.substring(raw.length - 100));
    
    // Test parsing
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    console.log("PARSED SUCCESSFULLY!", Object.keys(parsed));
  } catch (err) {
    if (err.response) {
       console.error("API Error:", err.response.data);
    } else {
       console.error("Error:", err.message);
    }
  }
}

test();
