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

  try {
    const res = await axios.post(`${BASE_URL}?key=${GEMINI_API_KEY}`, {
      contents: [{ role: 'user', parts: [{ text: prompt + '\n\nRespond ONLY with valid JSON, no markdown code blocks, no extra text.' }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
    }, { timeout: 120000 });
    
    const raw = res.data.candidates[0].content.parts[0].text;
    console.log("=== RAW START ===");
    console.log(raw);
    console.log("=== RAW END ===");
    
    // Strip potential markdown code fences
    const cleaned = raw.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
    
    try {
        const parsed = JSON.parse(cleaned);
        console.log("PARSED SUCCESSFULLY!", Object.keys(parsed));
    } catch(e) {
        console.error("JSON PARSE ERROR!", e.message);
        console.log("CLEANED STRING:", cleaned);
    }
  } catch (err) {
    if (err.response) {
       console.error("API Error:", err.response.data);
    } else {
       console.error("Error:", err.message);
    }
  }
}

test();
