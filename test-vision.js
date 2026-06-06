const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const MODEL = 'gemini-3.5-flash';
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

async function test() {
  const prompt = `Analyze this food product label/packaging image. Extract nutrition information and assess health safety.

Return a JSON object with:
- itemName: string
- safetyScore: number
`;

  // 1x1 pixel JPEG base64
  const base64Image = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
          { text: prompt + '\n\nRespond ONLY with valid JSON, no markdown code blocks, no extra text.' },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 8192,
    },
  };

  try {
    const res = await axios.post(`${BASE_URL}?key=${GEMINI_API_KEY}`, body, { timeout: 45000 });
    console.log("RESPONSE:", res.data.candidates[0].content.parts[0].text);
  } catch (err) {
    if (err.response) {
       console.error("API Error:", err.response.data);
    } else {
       console.error("Error:", err.message);
    }
  }
}

test();
