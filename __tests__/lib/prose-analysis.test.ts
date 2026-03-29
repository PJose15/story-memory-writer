import { describe, it, expect } from 'vitest';
import { analyzeText } from '@/lib/prose-analysis';

describe('prose-analysis', () => {
  it('returns empty array for empty text', () => {
    expect(analyzeText('')).toEqual([]);
    expect(analyzeText('   ')).toEqual([]);
  });

  it('detects "there was" weak phrase', () => {
    const issues = analyzeText('There was a big dog in the yard.');
    expect(issues.some(i => i.category === 'awkward-phrase' && i.text.toLowerCase() === 'there was')).toBe(true);
  });

  it('detects "started to" weak phrase', () => {
    const issues = analyzeText('She started to run.');
    expect(issues.some(i => i.category === 'awkward-phrase')).toBe(true);
  });

  it('detects overused word "very" (3+ times)', () => {
    const text = 'He was very tall. She was very fast. It was very cold. The day was very long.';
    const issues = analyzeText(text);
    expect(issues.some(i => i.category === 'repetition' && i.text === 'very')).toBe(true);
  });

  it('does not flag "very" used only twice', () => {
    const text = 'He was very tall. She was very fast.';
    const issues = analyzeText(text);
    expect(issues.filter(i => i.category === 'repetition' && i.text === 'very')).toHaveLength(0);
  });

  it('detects dense paragraphs (>200 words)', () => {
    const longPara = Array(210).fill('word').join(' ');
    const issues = analyzeText(longPara);
    expect(issues.some(i => i.category === 'pacing' && i.message.includes('dense'))).toBe(true);
  });

  it('detects 3+ consecutive short paragraphs', () => {
    const text = 'Short one.\n\nShort two.\n\nShort three.';
    const issues = analyzeText(text);
    expect(issues.some(i => i.category === 'pacing' && i.message.includes('choppy'))).toBe(true);
  });

  it('detects passive voice', () => {
    const issues = analyzeText('The ball was kicked by the boy.');
    expect(issues.some(i => i.category === 'passive-voice')).toBe(true);
  });

  it('detects "said" repetition (4+ times)', () => {
    const text = '"Hi," said John. "Hey," said Mary. "What?" said Bob. "Nothing," said Jane. "Ok," said Tom.';
    const issues = analyzeText(text);
    expect(issues.some(i => i.category === 'dialogue' && i.text === 'said')).toBe(true);
  });

  it('does not flag "said" used only 3 times', () => {
    const text = '"Hi," said John. "Hey," said Mary. "What?" said Bob.';
    const issues = analyzeText(text);
    expect(issues.filter(i => i.category === 'dialogue')).toHaveLength(0);
  });

  it('issues are sorted by position', () => {
    const text = 'There was a dog. There was a cat. She started to run.';
    const issues = analyzeText(text);
    for (let i = 1; i < issues.length; i++) {
      expect(issues[i].startIndex).toBeGreaterThanOrEqual(issues[i - 1].startIndex);
    }
  });

  it('issues have valid startIndex and endIndex', () => {
    const text = 'There was something very very very important happening here.';
    const issues = analyzeText(text);
    for (const issue of issues) {
      expect(issue.startIndex).toBeGreaterThanOrEqual(0);
      expect(issue.endIndex).toBeGreaterThan(issue.startIndex);
      expect(issue.endIndex).toBeLessThanOrEqual(text.length);
    }
  });

  it('handles text with no issues', () => {
    const text = 'The dog ran fast across the green field under the bright sun.';
    const issues = analyzeText(text);
    // May have some passive voice or weak phrases, but shouldn't crash
    expect(Array.isArray(issues)).toBe(true);
  });

  it('handles long text without error', () => {
    const text = Array(500).fill('The quick brown fox jumps over the lazy dog.').join(' ');
    const issues = analyzeText(text);
    expect(Array.isArray(issues)).toBe(true);
  });
});
