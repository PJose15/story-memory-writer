import { describe, it, expect } from 'vitest';
import { buildWritingAssistantPrompt } from '@/lib/prompts/writing-assistant';

describe('buildWritingAssistantPrompt', () => {
  it('is a non-empty string', () => {
    const result = buildWritingAssistantPrompt('English');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('contains the language parameter in the output', () => {
    const result = buildWritingAssistantPrompt('Korean');
    expect(result).toContain('Korean');
    expect(result).toContain('MUST be in Korean');
  });

  it('contains the Grounding Rule section', () => {
    const result = buildWritingAssistantPrompt('English');
    expect(result).toContain('Grounding Rule');
    expect(result).toContain('NEVER guess or invent');
    expect(result).toContain('flagged as invalid by the validation system');
  });

  it('contains the Canon Hierarchy section', () => {
    const result = buildWritingAssistantPrompt('English');
    expect(result).toContain('Canon Hierarchy');
    expect(result).toContain('Confirmed canon');
    expect(result).toContain('Flexible canon');
    expect(result).toContain('Draft ideas');
    expect(result).toContain('Discarded');
  });

  it('contains data-aware Character Logic section', () => {
    const result = buildWritingAssistantPrompt('English');
    expect(result).toContain('Character Logic');
    expect(result).toContain('Visible Goal');
    expect(result).toContain('Hidden Need');
    expect(result).toContain('Pressure Level');
    expect(result).toContain('trust%');
    expect(result).toContain('tension%');
    expect(result).toContain('State History');
  });

  it('contains Narrative Strategy Toolkit with 6 lenses', () => {
    const result = buildWritingAssistantPrompt('English');
    expect(result).toContain('Narrative Strategy Toolkit');
    expect(result).toContain('Arc Pacing');
    expect(result).toContain('Foreshadowing Payoff');
    expect(result).toContain('Tension Ratchet');
    expect(result).toContain('The Unasked Question');
    expect(result).toContain('Character Collision Points');
    expect(result).toContain('Thematic Echo');
  });

  it('contains Confidence Calibration section', () => {
    const result = buildWritingAssistantPrompt('English');
    expect(result).toContain('Confidence Calibration');
    expect(result).toContain('HIGH confidence');
    expect(result).toContain('MEDIUM confidence');
    expect(result).toContain('LOW confidence');
    expect(result).toContain('CONTEXT TRUNCATION MANIFEST');
  });

  it('contains normal-mode few-shot example', () => {
    const result = buildWritingAssistantPrompt('English');
    expect(result).toContain('Few-Shot Example (Good Response — Normal Mode)');
    expect(result).toContain('contextUsed');
    expect(result).toContain('[From context]');
    expect(result).toContain('[My suggestion]');
    expect(result).toContain('Narrative lens');
  });

  it('contains blocked-mode few-shot example', () => {
    const result = buildWritingAssistantPrompt('English');
    expect(result).toContain('Few-Shot Example (Good Response — Blocked Mode)');
    expect(result).toContain('diagnosis');
    expect(result).toContain('nextPaths');
    expect(result).toContain('bestRecommendation');
    expect(result).toContain('Locked Drawer');
  });

  it('contains anti-pattern example', () => {
    const result = buildWritingAssistantPrompt('English');
    expect(result).toContain('Anti-Pattern Example');
    expect(result).toContain('TOO VAGUE');
  });

  it('includes default NEUTRAL writer state when blockType is null', () => {
    const result = buildWritingAssistantPrompt('English', null);
    expect(result).toContain('Writer Emotional State');
    expect(result).toContain('WRITER STATE: NEUTRAL');
    expect(result).toContain('direct and collaborative');
  });

  it('includes default NEUTRAL writer state when blockType is undefined', () => {
    const result = buildWritingAssistantPrompt('English');
    expect(result).toContain('WRITER STATE: NEUTRAL');
  });

  it('includes FEAR writer state block', () => {
    const result = buildWritingAssistantPrompt('English', 'fear');
    expect(result).toContain('WRITER STATE: FEAR');
    expect(result).toContain('warm and reassuring');
  });

  it('includes EXHAUSTION writer state block', () => {
    const result = buildWritingAssistantPrompt('English', 'exhaustion');
    expect(result).toContain('WRITER STATE: EXHAUSTION');
    expect(result).toContain('minimal and gentle');
  });

  it('includes PERFECTIONISM writer state block', () => {
    const result = buildWritingAssistantPrompt('English', 'perfectionism');
    expect(result).toContain('WRITER STATE: PERFECTIONISM');
  });

  it('includes DIRECTION writer state block', () => {
    const result = buildWritingAssistantPrompt('English', 'direction');
    expect(result).toContain('WRITER STATE: DIRECTION');
    expect(result).toContain('concrete and specific');
  });

  it('stays within reasonable prompt size', () => {
    const result = buildWritingAssistantPrompt('English');
    const lineCount = result.split('\n').length;
    expect(lineCount).toBeLessThan(250);
    expect(lineCount).toBeGreaterThan(50);
  });
});
