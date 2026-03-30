import { describe, it, expect } from 'vitest';
import { buildWritingAssistantPrompt } from '@/lib/prompts/writing-assistant';
import type { Heteronym } from '@/lib/types/heteronym';
import type { HeteronymVoice } from '@/lib/heteronym-voice';

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

  // ─── Heteronym Voice Injection (3rd parameter) ───

  describe('heteronym voice injection', () => {
    const baseHeteronym: Heteronym = {
      id: 'h-test',
      name: 'Ricardo Reis',
      bio: 'A classicist',
      styleNote: '',
      avatarColor: '#6366f1',
      avatarEmoji: '✍️',
      createdAt: '2025-01-01T00:00:00Z',
      isDefault: false,
    };

    const voice: HeteronymVoice = {
      tone: 'formal',
      vocabulary: 'literary',
      pacing: 'measured',
      freeformNote: 'Uses classical allusions',
    };

    it('returns prompt without voice section when heteronym is null', () => {
      const result = buildWritingAssistantPrompt('English', null, null);
      expect(result).not.toContain('Active Writing Voice');
    });

    it('returns prompt without voice section when heteronym is undefined', () => {
      const result = buildWritingAssistantPrompt('English', null, undefined);
      expect(result).not.toContain('Active Writing Voice');
    });

    it('returns prompt without voice section when heteronym has no voice or styleNote', () => {
      const result = buildWritingAssistantPrompt('English', null, baseHeteronym);
      expect(result).not.toContain('Active Writing Voice');
    });

    it('injects voice section when heteronym has voice data', () => {
      const h = { ...baseHeteronym, voice };
      const result = buildWritingAssistantPrompt('English', null, h);
      expect(result).toContain('## Active Writing Voice');
      expect(result).toContain('Writing as "Ricardo Reis"');
      expect(result).toContain('Formal & precise');
      expect(result).toContain('Literary & rich');
      expect(result).toContain('Measured');
      expect(result).toContain('Uses classical allusions');
    });

    it('injects voice section when heteronym has only styleNote', () => {
      const h = { ...baseHeteronym, styleNote: 'Writes in odes' };
      const result = buildWritingAssistantPrompt('English', null, h);
      expect(result).toContain('## Active Writing Voice');
      expect(result).toContain('Style note: Writes in odes');
    });

    it('combines writer state and voice injection', () => {
      const h = { ...baseHeteronym, voice };
      const result = buildWritingAssistantPrompt('English', 'fear', h);
      expect(result).toContain('WRITER STATE: FEAR');
      expect(result).toContain('## Active Writing Voice');
      expect(result).toContain('Writing as "Ricardo Reis"');
    });

    it('voice section appears after main prompt content', () => {
      const h = { ...baseHeteronym, voice };
      const result = buildWritingAssistantPrompt('English', null, h);
      const voiceIdx = result.indexOf('## Active Writing Voice');
      const finalRuleIdx = result.indexOf('Final Rule');
      // Voice section comes after the Final Rule section
      expect(voiceIdx).toBeGreaterThan(finalRuleIdx);
    });

    it('voice section includes coaching alignment instruction', () => {
      const h = { ...baseHeteronym, voice };
      const result = buildWritingAssistantPrompt('English', null, h);
      expect(result).toContain('respect and reflect this voice profile');
      expect(result).toContain('writing persona');
    });

    it('still contains all core sections when voice is injected', () => {
      const h = { ...baseHeteronym, voice };
      const result = buildWritingAssistantPrompt('English', null, h);
      expect(result).toContain('Grounding Rule');
      expect(result).toContain('Canon Hierarchy');
      expect(result).toContain('Character Logic');
      expect(result).toContain('Narrative Strategy Toolkit');
      expect(result).toContain('Confidence Calibration');
      expect(result).toContain('Final Rule');
    });
  });
});
