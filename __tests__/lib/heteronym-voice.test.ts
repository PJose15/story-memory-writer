import { describe, it, expect } from 'vitest';
import {
  buildVoiceDirective,
  injectVoiceIntoSystemPrompt,
  TONE_LABELS,
  VOCABULARY_LABELS,
  PACING_LABELS,
} from '@/lib/heteronym-voice';
import type { Heteronym } from '@/lib/types/heteronym';

function makeHeteronym(overrides: Partial<Heteronym> = {}): Heteronym {
  return {
    id: 'h-1',
    name: 'Bernardo Soares',
    bio: 'A bookkeeper',
    styleNote: '',
    avatarColor: '#6366f1',
    avatarEmoji: '✍️',
    createdAt: '2025-01-01T00:00:00Z',
    isDefault: false,
    ...overrides,
  };
}

describe('buildVoiceDirective', () => {
  it('returns empty string for null heteronym', () => {
    expect(buildVoiceDirective(null)).toBe('');
  });

  it('returns empty string for undefined heteronym', () => {
    expect(buildVoiceDirective(undefined)).toBe('');
  });

  it('returns empty string when heteronym has no voice and no styleNote', () => {
    const h = makeHeteronym({ styleNote: '' });
    expect(buildVoiceDirective(h)).toBe('');
  });

  it('returns directive with only styleNote when no voice data', () => {
    const h = makeHeteronym({ styleNote: 'Fragmented sentences' });
    const result = buildVoiceDirective(h);
    expect(result).toContain('Writing as "Bernardo Soares"');
    expect(result).toContain('Style note: Fragmented sentences');
    expect(result).not.toContain('Tone:');
  });

  it('returns full directive with voice data', () => {
    const h = makeHeteronym({
      voice: { tone: 'poetic', vocabulary: 'literary', pacing: 'flowing', freeformNote: '' },
    });
    const result = buildVoiceDirective(h);
    expect(result).toContain('Writing as "Bernardo Soares"');
    expect(result).toContain(`Tone: ${TONE_LABELS.poetic}`);
    expect(result).toContain(`Vocabulary: ${VOCABULARY_LABELS.literary}`);
    expect(result).toContain(`Pacing: ${PACING_LABELS.flowing}`);
    expect(result).not.toContain('Additional:');
  });

  it('includes freeformNote when present in voice', () => {
    const h = makeHeteronym({
      voice: { tone: 'raw', vocabulary: 'simple', pacing: 'staccato', freeformNote: 'Uses sea metaphors' },
    });
    const result = buildVoiceDirective(h);
    expect(result).toContain('Additional: Uses sea metaphors');
  });

  it('includes both voice data and styleNote', () => {
    const h = makeHeteronym({
      styleNote: 'Avoids contractions',
      voice: { tone: 'formal', vocabulary: 'technical', pacing: 'measured', freeformNote: '' },
    });
    const result = buildVoiceDirective(h);
    expect(result).toContain(`Tone: ${TONE_LABELS.formal}`);
    expect(result).toContain('Style note: Avoids contractions');
  });

  it('uses heteronym name in the directive', () => {
    const h = makeHeteronym({ name: 'Alvaro de Campos' });
    h.styleNote = 'Writes long, breathless sentences';
    const result = buildVoiceDirective(h);
    expect(result).toContain('Writing as "Alvaro de Campos"');
  });

  it('ends directive with a period', () => {
    const h = makeHeteronym({ styleNote: 'Dark and brooding' });
    const result = buildVoiceDirective(h);
    expect(result.endsWith('.')).toBe(true);
  });

  it('falls back to raw tone value for unknown tone', () => {
    const h = makeHeteronym({
      voice: { tone: 'mysterious' as any, vocabulary: 'simple', pacing: 'staccato', freeformNote: '' },
    });
    const result = buildVoiceDirective(h);
    expect(result).toContain('Tone: mysterious');
  });
});

describe('injectVoiceIntoSystemPrompt', () => {
  const basePrompt = 'You are a writing assistant.';

  it('returns base prompt unchanged for null heteronym', () => {
    expect(injectVoiceIntoSystemPrompt(basePrompt, null)).toBe(basePrompt);
  });

  it('returns base prompt unchanged for undefined heteronym', () => {
    expect(injectVoiceIntoSystemPrompt(basePrompt, undefined)).toBe(basePrompt);
  });

  it('returns base prompt unchanged when heteronym has no voice or styleNote', () => {
    const h = makeHeteronym({ styleNote: '' });
    expect(injectVoiceIntoSystemPrompt(basePrompt, h)).toBe(basePrompt);
  });

  it('appends Active Writing Voice section when heteronym has voice data', () => {
    const h = makeHeteronym({
      voice: { tone: 'poetic', vocabulary: 'literary', pacing: 'languid', freeformNote: '' },
    });
    const result = injectVoiceIntoSystemPrompt(basePrompt, h);
    expect(result).toContain(basePrompt);
    expect(result).toContain('## Active Writing Voice');
    expect(result).toContain('Writing as "Bernardo Soares"');
    expect(result).toContain('respect and reflect this voice profile');
  });

  it('appends voice section when heteronym has only styleNote', () => {
    const h = makeHeteronym({ styleNote: 'Stream of consciousness' });
    const result = injectVoiceIntoSystemPrompt(basePrompt, h);
    expect(result).toContain('## Active Writing Voice');
    expect(result).toContain('Style note: Stream of consciousness');
  });
});
