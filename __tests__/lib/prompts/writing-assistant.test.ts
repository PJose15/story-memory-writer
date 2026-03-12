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
  });

  it('contains the Canon Hierarchy section', () => {
    const result = buildWritingAssistantPrompt('English');
    expect(result).toContain('Canon Hierarchy');
    expect(result).toContain('Confirmed canon');
    expect(result).toContain('Flexible canon');
    expect(result).toContain('Draft ideas');
    expect(result).toContain('Discarded');
  });

  it('contains Character Logic section', () => {
    const result = buildWritingAssistantPrompt('English');
    expect(result).toContain('Character Logic');
  });

  it('contains few-shot example', () => {
    const result = buildWritingAssistantPrompt('English');
    expect(result).toContain('Few-Shot Example');
    expect(result).toContain('contextUsed');
    expect(result).toContain('[From context]');
    expect(result).toContain('[My suggestion]');
  });

  it('contains anti-pattern example', () => {
    const result = buildWritingAssistantPrompt('English');
    expect(result).toContain('Anti-Pattern Example');
    expect(result).toContain('TOO VAGUE');
  });

  it('does not include writer state block when blockType is null', () => {
    const result = buildWritingAssistantPrompt('English', null);
    expect(result).not.toContain('Writer Emotional State');
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

  it('is significantly shorter than the old prompt (~100 lines vs 359)', () => {
    const result = buildWritingAssistantPrompt('English');
    const lineCount = result.split('\n').length;
    expect(lineCount).toBeLessThan(150);
  });
});
