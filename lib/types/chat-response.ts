import { Type } from '@google/genai';

// ── TypeScript types ──

export interface ChatResponseNormal {
  contextUsed: string[];
  informationGaps: string[];
  conflictsDetected: string[];
  recommendation: string;
  alternatives: string[];
  generatedText: string;
  confidenceNotes: string[];
}

export interface BlockedNextPath {
  label: string;
  description: string;
}

export interface ChatResponseBlocked {
  currentState: string;
  diagnosis: string;
  nextPaths: BlockedNextPath[];
  bestRecommendation: string;
  sceneStarter: string;
}

export type ChatResponse = ChatResponseNormal | ChatResponseBlocked;

export function isBlockedResponse(r: ChatResponse): r is ChatResponseBlocked {
  return 'diagnosis' in r;
}

export function isNormalResponse(r: ChatResponse): r is ChatResponseNormal {
  return 'recommendation' in r && !('diagnosis' in r);
}

// ── Gemini JSON schemas ──

export const NORMAL_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    contextUsed: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Specific story elements referenced (character names, chapter titles, conflicts, etc.)',
    },
    informationGaps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'What information is missing from the context. Use ["None"] if everything is available.',
    },
    conflictsDetected: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Canon contradictions found. Use ["None"] if no conflicts.',
    },
    recommendation: {
      type: Type.STRING,
      description: 'Main response with narrative recommendations. Use markdown formatting.',
    },
    alternatives: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Optional alternative suggestions. Can be empty array.',
    },
    generatedText: {
      type: Type.STRING,
      description: 'Generated prose/scene/dialogue ONLY if the user explicitly asked for it. Empty string otherwise.',
    },
    confidenceNotes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Distinguish which parts are facts from context vs. your suggestions. Tag each note.',
    },
  },
};

export const BLOCKED_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    currentState: {
      type: Type.STRING,
      description: 'Where the story currently stands based on latest chapter and active conflicts.',
    },
    diagnosis: {
      type: Type.STRING,
      description: 'Why the writer is likely blocked (plot block, scene transition, emotional clarity, pacing, character motivation).',
    },
    nextPaths: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING, description: 'Short label (e.g., "Safe continuation", "Escalation", "Character depth")' },
          description: { type: Type.STRING, description: 'Detailed explanation of this path and why it fits the canon.' },
        },
      },
      description: '3-5 possible next moves with labels.',
    },
    bestRecommendation: {
      type: Type.STRING,
      description: 'Your top recommendation for regaining momentum.',
    },
    sceneStarter: {
      type: Type.STRING,
      description: 'A scene starter paragraph. Only provide if the user asked for one. Empty string otherwise.',
    },
  },
};
