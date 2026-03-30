import type { Heteronym } from '@/lib/types/heteronym';

// ─── Voice Structure Types ───

export type VoiceTone = 'formal' | 'casual' | 'poetic' | 'raw' | 'clinical' | 'playful';
export type VoiceVocabulary = 'simple' | 'literary' | 'technical' | 'archaic' | 'slang' | 'mixed';
export type VoicePacing = 'staccato' | 'flowing' | 'measured' | 'breathless' | 'languid';

export interface HeteronymVoice {
  tone: VoiceTone;
  vocabulary: VoiceVocabulary;
  pacing: VoicePacing;
  freeformNote: string;
}

// ─── Voice Labels ───

export const TONE_LABELS: Record<VoiceTone, string> = {
  formal: 'Formal & precise',
  casual: 'Casual & conversational',
  poetic: 'Poetic & lyrical',
  raw: 'Raw & unfiltered',
  clinical: 'Clinical & detached',
  playful: 'Playful & witty',
};

export const VOCABULARY_LABELS: Record<VoiceVocabulary, string> = {
  simple: 'Simple & direct',
  literary: 'Literary & rich',
  technical: 'Technical & specialized',
  archaic: 'Archaic & period',
  slang: 'Slang & colloquial',
  mixed: 'Mixed register',
};

export const PACING_LABELS: Record<VoicePacing, string> = {
  staccato: 'Staccato — short, punchy',
  flowing: 'Flowing — long, connected',
  measured: 'Measured — balanced',
  breathless: 'Breathless — urgent',
  languid: 'Languid — slow, deliberate',
};

/**
 * Build a voice directive string from a heteronym's voice profile.
 * Returns empty string if no voice data.
 */
export function buildVoiceDirective(heteronym: Heteronym | null | undefined): string {
  if (!heteronym) return '';

  const voice = (heteronym as Heteronym & { voice?: HeteronymVoice }).voice;
  const styleNote = heteronym.styleNote;

  const parts: string[] = [];

  if (voice) {
    parts.push(`Tone: ${TONE_LABELS[voice.tone] || voice.tone}`);
    parts.push(`Vocabulary: ${VOCABULARY_LABELS[voice.vocabulary] || voice.vocabulary}`);
    parts.push(`Pacing: ${PACING_LABELS[voice.pacing] || voice.pacing}`);
    if (voice.freeformNote) {
      parts.push(`Additional: ${voice.freeformNote}`);
    }
  }

  if (styleNote) {
    parts.push(`Style note: ${styleNote}`);
  }

  if (parts.length === 0) return '';

  return `Writing as "${heteronym.name}": ${parts.join('. ')}.`;
}

/**
 * Inject voice directive into an AI system prompt.
 * Appends a ## Writing Voice section at the end.
 */
export function injectVoiceIntoSystemPrompt(
  basePrompt: string,
  heteronym: Heteronym | null | undefined
): string {
  const directive = buildVoiceDirective(heteronym);
  if (!directive) return basePrompt;

  return `${basePrompt}\n\n## Active Writing Voice\n\n${directive}\n\nAll suggestions, prose, and coaching should respect and reflect this voice profile. Frame feedback in terms that align with this writing persona.`;
}
