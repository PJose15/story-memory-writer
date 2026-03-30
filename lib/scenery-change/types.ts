export type BlockSeverity = 'mild' | 'moderate' | 'severe';

export type BlockIndicator =
  | 'low_wpm'
  | 'high_deletion'
  | 'frequent_pauses'
  | 'idle';

export interface BlockSignal {
  severity: BlockSeverity;
  indicators: BlockIndicator[];
  metrics: {
    wpm: number;
    deletionRatio: number;
    pauseCount: number;
    idleSeconds: number;
  };
  detectedAt: number; // epoch ms
}

export type DetourType =
  | 'dialogue_sprint'
  | 'alternate_pov'
  | 'sensory_snapshot'
  | 'villains_diary'
  | 'flash_forward'
  | 'character_interview';

export interface DetourSuggestion {
  type: DetourType;
  title: string;
  prompt: string;
  durationMinutes: number;
}

export interface DetourSession {
  id: string;
  type: DetourType;
  startedAt: string;    // ISO timestamp
  endedAt: string | null;
  prompt: string;
  content: string;
  wordCount: number;
}
