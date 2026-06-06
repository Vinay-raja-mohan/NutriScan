import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const MODEL = 'gemini-3.5-flash';
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export async function callGemini(prompt: string, systemInstruction?: string): Promise<string> {
  const body: any = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    ...(systemInstruction && {
      systemInstruction: { parts: [{ text: systemInstruction }] },
    }),
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  };

  const res = await axios.post(`${BASE_URL}?key=${GEMINI_API_KEY}`, body, { timeout: 120000 });
  return res.data.candidates[0].content.parts[0].text as string;
}

export async function callGeminiJSON<T>(prompt: string, systemInstruction?: string): Promise<T> {
  const raw = await callGemini(
    prompt + '\n\nRespond ONLY with valid JSON, no markdown code blocks, no extra text.',
    systemInstruction,
  );
  // Strip potential markdown code fences
  const cleaned = raw.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as T;
}

/**
 * Send an image (base64-encoded) + text prompt to Gemini Vision.
 * Returns the raw text response from the model.
 */
export async function callGeminiVision(
  base64Image: string,
  prompt: string,
  systemInstruction?: string,
): Promise<string> {
  const body: any = {
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
          { text: prompt },
        ],
      },
    ],
    ...(systemInstruction && {
      systemInstruction: { parts: [{ text: systemInstruction }] },
    }),
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 8192,
    },
  };

  const res = await axios.post(`${BASE_URL}?key=${GEMINI_API_KEY}`, body, { timeout: 120000 });
  return res.data.candidates[0].content.parts[0].text as string;
}

/**
 * Send an image to Gemini Vision and parse the result as JSON.
 */
export async function callGeminiVisionJSON<T>(
  base64Image: string,
  prompt: string,
  systemInstruction?: string,
): Promise<T> {
  const raw = await callGeminiVision(
    base64Image,
    prompt + '\n\nRespond ONLY with valid JSON, no markdown code blocks, no extra text.',
    systemInstruction,
  );
  const cleaned = raw.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as T;
}
