import type { BlockType } from '@/lib/session';
import type { WriterQuote } from '@/lib/types/quotes';
import quotesData from '@/data/quotes.json';

const quotes: WriterQuote[] = quotesData as WriterQuote[];
const usedIds = new Set<string>();

export function getQuoteForBlock(blockType: Exclude<BlockType, null>): WriterQuote {
  const matching = quotes.filter(
    q => q.blockTypes.includes(blockType) && !usedIds.has(q.id)
  );

  // If all matching quotes used, reset and try again
  if (matching.length === 0) {
    usedIds.clear();
    const fresh = quotes.filter(q => q.blockTypes.includes(blockType));
    if (fresh.length === 0) {
      return getRandomQuote();
    }
    const picked = fresh[Math.floor(Math.random() * fresh.length)];
    usedIds.add(picked.id);
    return picked;
  }

  const picked = matching[Math.floor(Math.random() * matching.length)];
  usedIds.add(picked.id);
  return picked;
}

export function getRandomQuote(): WriterQuote {
  const available = quotes.filter(q => !usedIds.has(q.id));

  if (available.length === 0) {
    usedIds.clear();
    const picked = quotes[Math.floor(Math.random() * quotes.length)];
    usedIds.add(picked.id);
    return picked;
  }

  const picked = available[Math.floor(Math.random() * available.length)];
  usedIds.add(picked.id);
  return picked;
}

export function resetUsedQuotes(): void {
  usedIds.clear();
}
