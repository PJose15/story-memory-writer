import { HarmCategory, HarmBlockThreshold } from '@google/genai';

export const AI_MODEL = 'gemini-2.5-flash';

// Creative writing requires full freedom — horror, thrillers, dark fiction,
// violence, emotional distress, and mature themes are all legitimate fiction.
// Only the absolute worst content gets blocked.
export const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];
