import { describe, it, expect } from 'vitest';
import { buildWritingAssistantPrompt } from '@/lib/prompts/writing-assistant';

describe('buildWritingAssistantPrompt', () => {
  it('is a non-empty string', () => {
    const result = buildWritingAssistantPrompt('English');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('contains the language parameter in the critical language rule', () => {
    const result = buildWritingAssistantPrompt('Korean');
    expect(result).toContain('The project language is Korean');
    expect(result).toContain('You MUST respond entirely in Korean');
  });

  it('contains the Anti-hallucination protocol section', () => {
    const result = buildWritingAssistantPrompt('English');
    expect(result).toContain('Anti-hallucination protocol');
  });

  it('contains Canon handling rules section', () => {
    const result = buildWritingAssistantPrompt('English');
    expect(result).toContain('Canon handling rules');
  });

  it('contains Blocked Mode section', () => {
    const result = buildWritingAssistantPrompt('English');
    expect(result).toContain('Blocked Mode');
  });

  it('contains Data provenance rules section', () => {
    const result = buildWritingAssistantPrompt('English');
    expect(result).toContain('Data provenance rules');
  });
});
