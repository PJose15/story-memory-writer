import type { BlockType } from '@/lib/session';

export interface AdaptiveConfig {
  noRetreat: boolean;
  timerMinutes: number | null;
  guidedPrompts: boolean;
  preparationMessage: string;
}

const defaultConfig: AdaptiveConfig = {
  noRetreat: false,
  timerMinutes: null,
  guidedPrompts: false,
  preparationMessage: 'Take a deep breath. You are here to write.',
};

export function getAdaptiveConfig(blockType: BlockType): AdaptiveConfig {
  if (!blockType) return defaultConfig;

  switch (blockType) {
    case 'fear':
      return { noRetreat: false, timerMinutes: null, guidedPrompts: false, preparationMessage: 'Write freely. No one is watching.' };
    case 'perfectionism':
      return { noRetreat: true, timerMinutes: null, guidedPrompts: false, preparationMessage: 'Your inner editor is off duty.' };
    case 'direction':
      return { noRetreat: false, timerMinutes: null, guidedPrompts: true, preparationMessage: 'Follow the prompts.' };
    case 'exhaustion':
      return { noRetreat: false, timerMinutes: 15, guidedPrompts: false, preparationMessage: 'Just 15 minutes. That\'s all.' };
    default:
      return defaultConfig;
  }
}
