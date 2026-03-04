import { describe, it, expect } from 'vitest';
import {
  buildCharacterAnalysisSystemPrompt,
  buildCharacterAnalysisPrompt,
} from '@/lib/prompts/character-analysis';

describe('buildCharacterAnalysisSystemPrompt', () => {
  it('contains the language parameter', () => {
    const result = buildCharacterAnalysisSystemPrompt('Portuguese');
    expect(result).toContain('Portuguese');
  });

  it('contains expected section headings', () => {
    const result = buildCharacterAnalysisSystemPrompt('English');
    expect(result).toContain('Character State Snapshot');
    expect(result).toContain('Current Emotional Logic');
    expect(result).toContain('What They Likely Want Right Now');
    expect(result).toContain('What They Are Likely to Avoid');
    expect(result).toContain('Risks of Out-of-Character Behavior');
    expect(result).toContain('Recommended Behavioral Direction');
  });
});

describe('buildCharacterAnalysisPrompt', () => {
  const baseParams = {
    language: 'English',
    name: 'Elena',
    role: 'Protagonist',
    coreIdentity: 'Determined scholar with a hidden past',
    stateHistory: [],
    relationships: [],
  };

  it('contains character name, role, and coreIdentity', () => {
    const result = buildCharacterAnalysisPrompt(baseParams);
    expect(result).toContain('Elena');
    expect(result).toContain('Protagonist');
    expect(result).toContain('Determined scholar with a hidden past');
  });

  it('renders currentState fields', () => {
    const result = buildCharacterAnalysisPrompt({
      ...baseParams,
      currentState: {
        emotionalState: 'Anxious',
        visibleGoal: 'Find the artifact',
        hiddenNeed: 'Acceptance',
        currentFear: 'Abandonment',
        dominantBelief: 'Trust no one',
        emotionalWound: 'Betrayed by mentor',
        pressureLevel: 'High',
        currentKnowledge: 'Knows the map location',
      },
    });
    expect(result).toContain('Anxious');
    expect(result).toContain('Find the artifact');
    expect(result).toContain('Acceptance');
    expect(result).toContain('Abandonment');
    expect(result).toContain('Trust no one');
    expect(result).toContain('Betrayed by mentor');
    expect(result).toContain('High');
    expect(result).toContain('Knows the map location');
  });

  it('defaults missing currentState fields to "Unknown"', () => {
    const result = buildCharacterAnalysisPrompt(baseParams);
    expect(result).toContain('Emotional State: Unknown');
    expect(result).toContain('Visible Goal: Unknown');
    expect(result).toContain('Hidden Need: Unknown');
    expect(result).toContain('Current Fear: Unknown');
    expect(result).toContain('Dominant Belief: Unknown');
    expect(result).toContain('Emotional Wound: Unknown');
    expect(result).toContain('Pressure Level: Unknown');
    expect(result).toContain('What they know right now: Unknown');
  });

  it('renders "No history recorded." for empty stateHistory', () => {
    const result = buildCharacterAnalysisPrompt(baseParams);
    expect(result).toContain('No history recorded.');
  });

  it('renders "No relationships recorded." for empty relationships', () => {
    const result = buildCharacterAnalysisPrompt(baseParams);
    expect(result).toContain('No relationships recorded.');
  });

  it('renders populated stateHistory correctly', () => {
    const result = buildCharacterAnalysisPrompt({
      ...baseParams,
      stateHistory: [
        { context: 'Chapter 1', changes: 'Became suspicious' },
        { context: 'Chapter 3', changes: 'Opened up to ally' },
      ],
    });
    expect(result).toContain('Chapter 1: Became suspicious');
    expect(result).toContain('Chapter 3: Opened up to ally');
  });

  it('renders populated relationships correctly', () => {
    const result = buildCharacterAnalysisPrompt({
      ...baseParams,
      relationships: [
        { targetName: 'Marcus', trustLevel: 70, tensionLevel: 30, dynamics: 'Reluctant allies' },
      ],
    });
    expect(result).toContain('With Marcus: Trust 70%, Tension 30%. Dynamics: Reluctant allies');
  });
});
