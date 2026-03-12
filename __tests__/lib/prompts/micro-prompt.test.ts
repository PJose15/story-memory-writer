import { describe, it, expect } from 'vitest';
import { buildMicroPromptSystemPrompt, buildMicroPromptContent, validateMicroPromptResponse } from '@/lib/prompts/micro-prompt';

describe('buildMicroPromptSystemPrompt', () => {
  it('returns a string containing "ONE question"', () => {
    const result = buildMicroPromptSystemPrompt();
    expect(typeof result).toBe('string');
    expect(result).toContain('ONE question');
  });

  it('contains "Zagafy"', () => {
    const result = buildMicroPromptSystemPrompt();
    expect(result).toContain('Zagafy');
  });

  it('contains "25 words"', () => {
    const result = buildMicroPromptSystemPrompt();
    expect(result).toContain('25 words');
  });

  it('mentions knowing the entire story', () => {
    const result = buildMicroPromptSystemPrompt();
    expect(result).toContain('ENTIRE story');
  });

  it('requires responding in the same language as the writer', () => {
    const result = buildMicroPromptSystemPrompt();
    expect(result).toContain('SAME LANGUAGE');
  });

  it('forbids inventing character names', () => {
    const result = buildMicroPromptSystemPrompt();
    expect(result).toContain('NEVER invent');
  });

  it('contains strategic depth prompts', () => {
    const result = buildMicroPromptSystemPrompt();
    expect(result).toContain('denying to themselves');
    expect(result).toContain('visceral');
    expect(result).toContain('tension hiding');
  });
});

describe('buildMicroPromptContent', () => {
  it('includes recent text', () => {
    const result = buildMicroPromptContent({ recentText: 'She opened the door slowly.' });
    expect(result).toContain('She opened the door slowly.');
  });

  it('includes genre when provided', () => {
    const result = buildMicroPromptContent({
      recentText: 'She opened the door slowly.',
      genre: 'Fantasy',
    });
    expect(result).toContain('GENRE: Fantasy');
  });

  it('includes protagonist name when provided', () => {
    const result = buildMicroPromptContent({
      recentText: 'She opened the door slowly.',
      protagonistName: 'Elena',
    });
    expect(result).toContain('PROTAGONIST: Elena');
  });

  it('includes block type when provided', () => {
    const result = buildMicroPromptContent({
      recentText: 'She opened the door slowly.',
      blockType: 'fear',
    });
    expect(result).toContain('WRITER STATE: fear');
  });

  it('omits optional fields when not provided', () => {
    const result = buildMicroPromptContent({ recentText: 'She opened the door slowly.' });
    expect(result).not.toContain('PROTAGONIST:');
    expect(result).not.toContain('WRITER STATE:');
  });

  it('includes story context when provided', () => {
    const result = buildMicroPromptContent({
      recentText: 'She opened the door slowly.',
      storyContext: {
        title: 'The Lost Garden',
        synopsis: 'A woman returns to her childhood home.',
        characters: '- Elena (protagonist): A painter returning home',
        characterNames: ['Elena', 'Marcus'],
        chapterSummaries: '- Ch1: "Arrival": Elena arrives at the old house',
        activeConflicts: '- Elena vs her memories of the fire',
        openLoops: '- Who sent the anonymous letter?',
        currentChapterTitle: 'The Garden',
      },
    });
    expect(result).toContain('TITLE: The Lost Garden');
    expect(result).toContain('SYNOPSIS: A woman returns');
    expect(result).toContain('CHARACTER DETAILS:');
    expect(result).toContain('Elena (protagonist)');
    expect(result).toContain('STORY SO FAR');
    expect(result).toContain('ACTIVE CONFLICTS:');
    expect(result).toContain('UNRESOLVED THREADS:');
    expect(result).toContain('CURRENTLY WRITING: "The Garden"');
  });

  it('includes known character names list for grounding', () => {
    const result = buildMicroPromptContent({
      recentText: 'She walked through the gate.',
      storyContext: {
        title: 'Test',
        characterNames: ['Elena', 'Marcus', 'Sofia'],
      },
    });
    expect(result).toContain('KNOWN CHARACTER NAMES');
    expect(result).toContain('Elena, Marcus, Sofia');
    expect(result).toContain('do NOT invent');
  });

  it('includes story knowledge section header when context provided', () => {
    const result = buildMicroPromptContent({
      recentText: 'She walked through the gate.',
      storyContext: { title: 'Test' },
    });
    expect(result).toContain('STORY KNOWLEDGE');
  });

  it('instructs to respond in the same language', () => {
    const result = buildMicroPromptContent({ recentText: 'Ella abrió la puerta lentamente.' });
    expect(result).toContain('SAME LANGUAGE');
  });
});

describe('validateMicroPromptResponse', () => {
  it('accepts a valid question', () => {
    expect(validateMicroPromptResponse('What does Elena feel when she sees Marcus?'))
      .toBe('What does Elena feel when she sees Marcus?');
  });

  it('accepts a valid Spanish question', () => {
    expect(validateMicroPromptResponse('¿Qué siente Elena cuando ve a Marcus en la puerta?'))
      .toBe('¿Qué siente Elena cuando ve a Marcus en la puerta?');
  });

  it('rejects empty string', () => {
    expect(validateMicroPromptResponse('')).toBeNull();
  });

  it('rejects too-short responses like "What?"', () => {
    expect(validateMicroPromptResponse('What?')).toBeNull();
    expect(validateMicroPromptResponse('¿Qué?')).toBeNull();
  });

  it('rejects 5-word questions (below minimum 6 words)', () => {
    expect(validateMicroPromptResponse('What happens to her now?')).toBeNull();
  });

  it('rejects responses without question mark (short)', () => {
    expect(validateMicroPromptResponse('Hello there')).toBeNull();
  });

  it('strips quote marks', () => {
    expect(validateMicroPromptResponse('"What does Elena feel right now in this moment?"'))
      .toBe('What does Elena feel right now in this moment?');
  });

  it('strips prefixes like "Zagafy:" or "Question:"', () => {
    expect(validateMicroPromptResponse('Zagafy: What does Elena feel in this very moment?'))
      .toBe('What does Elena feel in this very moment?');
  });

  it('adds question mark to long near-questions', () => {
    expect(validateMicroPromptResponse('What does Elena feel when she sees Marcus at the door'))
      .toBe('What does Elena feel when she sees Marcus at the door?');
  });

  it('rejects extremely long responses', () => {
    const long = 'word '.repeat(45) + '?';
    expect(validateMicroPromptResponse(long)).toBeNull();
  });
});
