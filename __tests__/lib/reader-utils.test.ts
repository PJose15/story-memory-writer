import { describe, it, expect } from 'vitest';
import { paginateText, estimateReadingTime, formatChapterForReading, countWords } from '@/lib/reader-utils';

describe('reader-utils', () => {
  describe('paginateText', () => {
    it('returns empty for empty text', () => {
      expect(paginateText('')).toEqual([]);
      expect(paginateText('   ')).toEqual([]);
    });
    it('returns single page for short text', () => {
      expect(paginateText('hello world')).toHaveLength(1);
    });
    it('paginates long text', () => {
      const text = Array(600).fill('word').join(' ');
      const pages = paginateText(text, 250);
      expect(pages).toHaveLength(3);
    });
    it('respects custom wordsPerPage', () => {
      const text = Array(20).fill('word').join(' ');
      expect(paginateText(text, 10)).toHaveLength(2);
    });
  });
  describe('estimateReadingTime', () => {
    it('returns 1 min minimum', () => {
      expect(estimateReadingTime('hello').minutes).toBe(1);
    });
    it('estimates correctly for 400 words', () => {
      const text = Array(400).fill('word').join(' ');
      expect(estimateReadingTime(text).minutes).toBe(2);
    });
    it('formats hours for long text', () => {
      const text = Array(15000).fill('word').join(' ');
      expect(estimateReadingTime(text).display).toContain('h');
    });
  });
  describe('formatChapterForReading', () => {
    it('prepends title', () => {
      expect(formatChapterForReading('Ch 1', 'body')).toBe('Ch 1\n\nbody');
    });
  });
  describe('countWords', () => {
    it('counts words', () => {
      expect(countWords('one two three')).toBe(3);
    });
    it('returns 0 for empty', () => {
      expect(countWords('')).toBe(0);
    });
  });
});
