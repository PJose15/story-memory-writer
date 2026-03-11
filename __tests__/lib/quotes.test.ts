import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/data/quotes.json', () => ({
  default: [
    { id: 'q1', text: 'Quote 1', author: 'Author 1', source: 'Source 1', blockTypes: ['fear'], zagafyPhrase: 'Phrase 1' },
    { id: 'q2', text: 'Quote 2', author: 'Author 2', source: 'Source 2', blockTypes: ['perfectionism'], zagafyPhrase: 'Phrase 2' },
    { id: 'q3', text: 'Quote 3', author: 'Author 3', source: 'Source 3', blockTypes: ['fear', 'direction'], zagafyPhrase: 'Phrase 3' },
  ],
}));

import { getQuoteForBlock, getRandomQuote, resetUsedQuotes } from '@/lib/quotes';

beforeEach(() => {
  resetUsedQuotes();
});

describe('getQuoteForBlock', () => {
  it('returns a quote matching the block type', () => {
    const quote = getQuoteForBlock('fear');
    expect(quote.blockTypes).toContain('fear');
  });

  it('returns a quote with all required fields', () => {
    const quote = getQuoteForBlock('perfectionism');
    expect(quote).toHaveProperty('id');
    expect(quote).toHaveProperty('text');
    expect(quote).toHaveProperty('author');
    expect(quote).toHaveProperty('source');
    expect(quote).toHaveProperty('blockTypes');
    expect(quote).toHaveProperty('zagafyPhrase');
    expect(typeof quote.id).toBe('string');
    expect(typeof quote.text).toBe('string');
    expect(typeof quote.author).toBe('string');
    expect(typeof quote.source).toBe('string');
    expect(Array.isArray(quote.blockTypes)).toBe(true);
    expect(typeof quote.zagafyPhrase).toBe('string');
  });

  it('does not repeat quotes until all matching quotes are used', () => {
    // There are 2 fear quotes: q1 and q3
    const first = getQuoteForBlock('fear');
    const second = getQuoteForBlock('fear');
    expect(first.id).not.toBe(second.id);
  });

  it('resets and recycles after all matching quotes are used', () => {
    // Use both fear quotes (q1, q3)
    getQuoteForBlock('fear');
    getQuoteForBlock('fear');
    // Third call should reset and still return a fear quote
    const third = getQuoteForBlock('fear');
    expect(third.blockTypes).toContain('fear');
  });

  it('falls back to a random quote when no quotes match the block type', () => {
    // 'exhaustion' has no matching quotes in the mock data
    const quote = getQuoteForBlock('exhaustion');
    expect(quote).toBeDefined();
    expect(quote.id).toBeDefined();
  });
});

describe('getRandomQuote', () => {
  it('returns a valid quote', () => {
    const quote = getRandomQuote();
    expect(quote).toHaveProperty('id');
    expect(quote).toHaveProperty('text');
    expect(quote).toHaveProperty('author');
    expect(quote).toHaveProperty('source');
    expect(quote).toHaveProperty('blockTypes');
    expect(quote).toHaveProperty('zagafyPhrase');
  });

  it('does not repeat until all quotes are used', () => {
    const ids = new Set<string>();
    // 3 quotes in mock data — all 3 should be unique
    ids.add(getRandomQuote().id);
    ids.add(getRandomQuote().id);
    ids.add(getRandomQuote().id);
    expect(ids.size).toBe(3);
  });

  it('resets and recycles after all quotes are used', () => {
    getRandomQuote();
    getRandomQuote();
    getRandomQuote();
    // 4th call should reset and return a valid quote
    const quote = getRandomQuote();
    expect(quote).toBeDefined();
    expect(quote.id).toBeDefined();
  });
});

describe('resetUsedQuotes', () => {
  it('clears the used set so quotes can be reused', () => {
    const first = getRandomQuote();
    const second = getRandomQuote();
    const third = getRandomQuote();
    // All 3 used — collect IDs
    const usedIds = new Set([first.id, second.id, third.id]);
    expect(usedIds.size).toBe(3);

    resetUsedQuotes();

    // After reset, the next call should return one of the existing quotes
    const afterReset = getRandomQuote();
    expect(usedIds).toContain(afterReset.id);
  });
});
