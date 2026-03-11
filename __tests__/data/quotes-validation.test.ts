import { describe, it, expect } from 'vitest';
import quotesData from '@/data/quotes.json';

const VALID_BLOCK_TYPES = ['fear', 'perfectionism', 'direction', 'exhaustion'] as const;

describe('quotes.json validation', () => {
  it('every quote has an id, text, author, and source', () => {
    for (const quote of quotesData) {
      expect(quote.id, `Quote missing id`).toBeDefined();
      expect(typeof quote.id).toBe('string');
      expect(quote.id.length).toBeGreaterThan(0);

      expect(quote.text, `Quote ${quote.id} missing text`).toBeDefined();
      expect(typeof quote.text).toBe('string');
      expect(quote.text.length).toBeGreaterThan(0);

      expect(quote.author, `Quote ${quote.id} missing author`).toBeDefined();
      expect(typeof quote.author).toBe('string');
      expect(quote.author.length).toBeGreaterThan(0);

      expect(quote.source, `Quote ${quote.id} missing source`).toBeDefined();
      expect(typeof quote.source).toBe('string');
      expect(quote.source.length).toBeGreaterThan(0);
    }
  });

  it('has no duplicate IDs', () => {
    const ids = quotesData.map(q => q.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all blockTypes are valid', () => {
    for (const quote of quotesData) {
      for (const bt of quote.blockTypes) {
        expect(
          (VALID_BLOCK_TYPES as readonly string[]).includes(bt),
          `Quote ${quote.id} has invalid blockType "${bt}"`
        ).toBe(true);
      }
    }
  });

  it('every quote has a zagafyPhrase', () => {
    for (const quote of quotesData) {
      expect(quote.zagafyPhrase, `Quote ${quote.id} missing zagafyPhrase`).toBeDefined();
      expect(typeof quote.zagafyPhrase).toBe('string');
      expect(quote.zagafyPhrase.length).toBeGreaterThan(0);
    }
  });

  it('every quote has at least one blockType', () => {
    for (const quote of quotesData) {
      expect(
        quote.blockTypes.length,
        `Quote ${quote.id} has no blockTypes`
      ).toBeGreaterThanOrEqual(1);
    }
  });

  it('all block types have at least 5 quotes each', () => {
    for (const blockType of VALID_BLOCK_TYPES) {
      const matching = quotesData.filter(q => q.blockTypes.includes(blockType));
      expect(
        matching.length,
        `Block type "${blockType}" has only ${matching.length} quotes (need at least 5)`
      ).toBeGreaterThanOrEqual(5);
    }
  });
});
