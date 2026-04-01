import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/heteronym-voice', () => ({
  injectVoiceIntoSystemPrompt: vi.fn((base: string, het: unknown) =>
    base + (het ? '\n## Voice' : '')
  ),
}));

import { buildStoryCoachPrompt, buildStoryCoachContent } from '@/lib/prompts/story-coach';
import { injectVoiceIntoSystemPrompt } from '@/lib/heteronym-voice';

describe('buildStoryCoachPrompt', () => {
  it('returns a string containing story coach system instructions', () => {
    const result = buildStoryCoachPrompt('en');
    expect(result).toContain('story coach');
  });

  it('contains all 6 coaching lenses', () => {
    const result = buildStoryCoachPrompt('en');
    expect(result).toContain('Tension');
    expect(result).toContain('Sensory');
    expect(result).toContain('Motivation');
    expect(result).toContain('Pacing');
    expect(result).toContain('Foreshadowing');
    expect(result).toContain('Dialogue');
  });

  it('contains JSON response format instructions', () => {
    const result = buildStoryCoachPrompt('en');
    expect(result).toContain('JSON');
    expect(result).toContain('lens');
    expect(result).toContain('observation');
    expect(result).toContain('suggestion');
    expect(result).toContain('priority');
  });

  it('contains example output', () => {
    const result = buildStoryCoachPrompt('en');
    expect(result).toContain('Example Output');
    expect(result).toContain('Elena');
  });

  it('passes heteronym to injectVoiceIntoSystemPrompt', () => {
    const fakeHeteronym = { name: 'Poet', styleNote: 'lyrical' } as any;
    buildStoryCoachPrompt('en', fakeHeteronym);
    expect(injectVoiceIntoSystemPrompt).toHaveBeenCalledWith(
      expect.any(String),
      fakeHeteronym
    );
  });

  it('calls with null heteronym when none provided', () => {
    buildStoryCoachPrompt('en', null);
    expect(injectVoiceIntoSystemPrompt).toHaveBeenCalledWith(
      expect.any(String),
      null
    );
  });
});

describe('buildStoryCoachContent', () => {
  it('includes chapter content', () => {
    const result = buildStoryCoachContent({
      chapterContent: 'The rain fell hard on the cobblestones.',
    });
    expect(result).toContain('The rain fell hard on the cobblestones.');
  });

  it('includes storyContext wrapped in === markers', () => {
    const result = buildStoryCoachContent({
      chapterContent: 'Chapter text',
      storyContext: 'A fantasy tale of redemption.',
    });
    expect(result).toContain('=== STORY CONTEXT ===');
    expect(result).toContain('A fantasy tale of redemption.');
    expect(result).toContain('=== END CONTEXT ===');
  });

  it('includes chapterTitle when provided', () => {
    const result = buildStoryCoachContent({
      chapterContent: 'Chapter text',
      chapterTitle: 'The Beginning',
    });
    expect(result).toContain('Chapter: "The Beginning"');
  });

  it('includes focusLens instruction when provided', () => {
    const result = buildStoryCoachContent({
      chapterContent: 'Chapter text',
      focusLens: 'tension',
    });
    expect(result).toContain('Focus lens: tension');
    expect(result).toContain('prioritize insights through this lens');
  });

  it('handles minimal call with only chapterContent', () => {
    const result = buildStoryCoachContent({
      chapterContent: 'Minimal chapter.',
    });
    expect(result).toContain('Minimal chapter.');
    expect(result).not.toContain('=== STORY CONTEXT ===');
    expect(result).not.toContain('Chapter: "');
    expect(result).not.toContain('Focus lens:');
  });
});
