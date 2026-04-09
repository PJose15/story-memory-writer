import { describe, it, expect } from 'vitest';
import {
  WORLD_BIBLE_CATEGORIES,
  isWorldBibleSection,
  CATEGORY_META,
  type WorldBibleCategory,
} from '@/lib/types/world-bible';

describe('world-bible types', () => {
  it('has 8 categories', () => {
    expect(WORLD_BIBLE_CATEGORIES).toHaveLength(8);
  });

  it('CATEGORY_META covers all categories', () => {
    for (const cat of WORLD_BIBLE_CATEGORIES) {
      expect(CATEGORY_META[cat]).toBeDefined();
      expect(CATEGORY_META[cat].label).toBeTruthy();
      expect(CATEGORY_META[cat].icon).toBeTruthy();
    }
  });

  describe('isWorldBibleSection', () => {
    const valid = {
      id: 'abc',
      category: 'geography' as WorldBibleCategory,
      title: 'Mountains',
      content: 'Tall peaks',
      source: 'ai-extracted',
      lastUpdated: '2026-04-07T00:00:00Z',
      canonStatus: 'draft',
    };

    it('returns true for valid section', () => {
      expect(isWorldBibleSection(valid)).toBe(true);
    });

    it('returns false for null', () => {
      expect(isWorldBibleSection(null)).toBe(false);
    });

    it('returns false for missing fields', () => {
      const { title, ...missing } = valid;
      void title;
      expect(isWorldBibleSection(missing)).toBe(false);
    });

    it('returns false for invalid category', () => {
      expect(isWorldBibleSection({ ...valid, category: 'bogus' })).toBe(false);
    });

    it('returns false for invalid source', () => {
      expect(isWorldBibleSection({ ...valid, source: 'unknown' })).toBe(false);
    });
  });
});
