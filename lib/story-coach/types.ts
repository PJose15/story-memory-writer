export type CoachingLens =
  | 'tension'
  | 'sensory'
  | 'motivation'
  | 'pacing'
  | 'foreshadowing'
  | 'dialogue';

export type CoachingPriority = 'low' | 'medium' | 'high';

export interface CoachingInsight {
  id: string;
  lens: CoachingLens;
  observation: string;
  suggestion: string;
  priority: CoachingPriority;
}

export interface CoachingSession {
  chapterId: string;
  insights: CoachingInsight[];
  fetchedAt: string; // ISO timestamp
}

export const LENS_LABELS: Record<CoachingLens, string> = {
  tension: 'Tension',
  sensory: 'Sensory Detail',
  motivation: 'Character Motivation',
  pacing: 'Pacing',
  foreshadowing: 'Foreshadowing',
  dialogue: 'Dialogue',
};
