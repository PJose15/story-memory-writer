import { describe, it, expect } from 'vitest';
import { validateNormalResponse, validateBlockedResponse, type KnownEntities } from '@/lib/ai/chat-validation';
import type { ChatResponseNormal, ChatResponseBlocked } from '@/lib/types/chat-response';

const entities: KnownEntities = {
  characters: ['Elena', 'Marco', 'Professor García'],
  chapters: ['Chapter 1: The Discovery', 'Chapter 2: The Letter'],
  locations: ['The Castle', 'Village Square'],
};

describe('validateNormalResponse', () => {
  const baseResponse: ChatResponseNormal = {
    contextUsed: ['Elena (protagonist)', 'Chapter 1: The Discovery'],
    informationGaps: ['None'],
    conflictsDetected: ['None'],
    recommendation: 'Elena should talk to Marco about the letter.',
    alternatives: [],
    generatedText: '',
    confidenceNotes: ['[From context] Elena is the protagonist'],
  };

  it('passes valid response without adding warnings', () => {
    const result = validateNormalResponse(baseResponse, entities);
    const validationWarnings = result.confidenceNotes.filter(n => n.startsWith('[Validation]'));
    expect(validationWarnings).toHaveLength(0);
  });

  it('flags unknown references in contextUsed', () => {
    const response: ChatResponseNormal = {
      ...baseResponse,
      contextUsed: ['UnknownCharacter', 'Elena (protagonist)'],
    };
    const result = validateNormalResponse(response, entities);
    const validationWarnings = result.confidenceNotes.filter(n => n.startsWith('[Validation]'));
    expect(validationWarnings.length).toBeGreaterThan(0);
    expect(validationWarnings[0]).toContain('UnknownCharacter');
  });

  it('flags hallucinated character names in recommendation', () => {
    const response: ChatResponseNormal = {
      ...baseResponse,
      recommendation: 'Isabella should confront the dragon about the ancient prophecy.',
    };
    const result = validateNormalResponse(response, entities);
    const validationWarnings = result.confidenceNotes.filter(n => n.includes('[Validation]') && n.includes('Isabella'));
    expect(validationWarnings.length).toBeGreaterThan(0);
  });

  it('does not flag known character names in recommendation', () => {
    const response: ChatResponseNormal = {
      ...baseResponse,
      recommendation: 'Elena should meet Marco to discuss the letter.',
    };
    const result = validateNormalResponse(response, entities);
    const validationWarnings = result.confidenceNotes.filter(n => n.startsWith('[Validation]') && n.includes('known character'));
    expect(validationWarnings).toHaveLength(0);
  });

  it('flags ungrounded generatedText when no context cited', () => {
    const response: ChatResponseNormal = {
      ...baseResponse,
      contextUsed: [],
      generatedText: 'A'.repeat(300),
    };
    const result = validateNormalResponse(response, entities);
    const validationWarnings = result.confidenceNotes.filter(n => n.includes('ungrounded'));
    expect(validationWarnings.length).toBeGreaterThan(0);
  });

  it('preserves existing confidenceNotes', () => {
    const response: ChatResponseNormal = {
      ...baseResponse,
      confidenceNotes: ['[From context] existing note'],
    };
    const result = validateNormalResponse(response, entities);
    expect(result.confidenceNotes).toContain('[From context] existing note');
  });

  it('handles empty entities gracefully', () => {
    const emptyEntities: KnownEntities = { characters: [], chapters: [], locations: [] };
    const result = validateNormalResponse(baseResponse, emptyEntities);
    expect(result).toBeDefined();
  });

  it('does not match "Magdalena" when known character is "Elena" (word boundary)', () => {
    const response: ChatResponseNormal = {
      ...baseResponse,
      recommendation: 'Magdalena walked through the garden alone.',
    };
    const result = validateNormalResponse(response, entities);
    const nameWarnings = result.confidenceNotes.filter(n => n.includes('Magdalena') && n.includes('known character'));
    expect(nameWarnings.length).toBeGreaterThan(0);
  });

  it('does not flag "But" and "Perhaps" at start of sentences', () => {
    const response: ChatResponseNormal = {
      ...baseResponse,
      recommendation: 'But Elena hesitated. Perhaps Marco would understand.',
    };
    const result = validateNormalResponse(response, entities);
    const butWarning = result.confidenceNotes.filter(n => n.includes('"But"') || n.includes('"Perhaps"'));
    expect(butWarning).toHaveLength(0);
  });

  it('flags long recommendation with empty contextUsed as ungrounded', () => {
    const response: ChatResponseNormal = {
      ...baseResponse,
      contextUsed: [],
      recommendation: 'A'.repeat(301),
    };
    const result = validateNormalResponse(response, entities);
    const groundingWarnings = result.confidenceNotes.filter(n => n.includes('Long recommendation') && n.includes('ungrounded'));
    expect(groundingWarnings.length).toBeGreaterThan(0);
  });

  it('flags unknown names in alternatives', () => {
    const response: ChatResponseNormal = {
      ...baseResponse,
      alternatives: ['Fernando could betray the group instead.'],
    };
    const result = validateNormalResponse(response, entities);
    const altWarnings = result.confidenceNotes.filter(n => n.includes('Alternative') && n.includes('Fernando'));
    expect(altWarnings.length).toBeGreaterThan(0);
  });
});

describe('validateBlockedResponse', () => {
  const baseBlocked: ChatResponseBlocked = {
    currentState: 'The story is at a critical juncture after Elena found the letter.',
    diagnosis: 'Plot block — Elena has discovered the letter but the next step is unclear.',
    nextPaths: [
      { label: 'Safe continuation', description: 'Elena hides the letter and investigates alone.' },
      { label: 'Escalation', description: 'Elena confronts Marco directly.' },
    ],
    bestRecommendation: 'Elena should investigate alone first to build tension.',
    sceneStarter: '',
  };

  it('passes valid response without warnings', () => {
    const result = validateBlockedResponse(baseBlocked, entities);
    expect(result.validationWarnings).toHaveLength(0);
  });

  it('flags hallucinated character names in diagnosis', () => {
    const response: ChatResponseBlocked = {
      ...baseBlocked,
      diagnosis: 'Rodrigo is confused about what happened after the explosion.',
    };
    const result = validateBlockedResponse(response, entities);
    expect(result.validationWarnings.some(w => w.includes('Rodrigo'))).toBe(true);
  });

  it('flags hallucinated names in nextPaths descriptions', () => {
    const response: ChatResponseBlocked = {
      ...baseBlocked,
      nextPaths: [
        { label: 'Option A', description: 'Sebastian reveals his true identity to the council.' },
      ],
    };
    const result = validateBlockedResponse(response, entities);
    expect(result.validationWarnings.some(w => w.includes('Sebastian'))).toBe(true);
  });
});
