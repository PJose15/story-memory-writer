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

// Per-endpoint temperature and token configuration
export const AI_CONFIG = {
  chat: {
    temperature: 0.3,       // Grounded, precise responses
    maxOutputTokens: 4096,
  },
  chatBlocked: {
    temperature: 0.5,       // Slightly more creative for unblocking
    maxOutputTokens: 4096,
  },
  audit: {
    temperature: 0.1,       // Analytical precision
    maxOutputTokens: 2048,
  },
  microPrompt: {
    temperature: 0.7,       // Creative nudges
    maxOutputTokens: 1024,
  },
  storyCoach: {
    temperature: 0.3,       // Analytical coaching
    maxOutputTokens: 4096,
  },
  characterChat: {
    temperature: 0.6,       // In-character creative responses
    maxOutputTokens: 2048,
  },
} as const;
