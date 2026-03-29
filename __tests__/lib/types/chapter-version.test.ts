import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  readAllVersions,
  readVersions,
  addVersion,
  setCanonical,
  deleteVersion,
  renameVersion,
  ensureInitialVersion,
  getCanonicalVersion,
} from '@/lib/types/chapter-version';
import type { ChapterVersion } from '@/lib/types/chapter-version';

const VERSIONS_KEY = 'zagafy_chapter_versions';

describe('chapter-version', () => {
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = {};

    const localStorageMock: Storage = {
      getItem: vi.fn((key: string) => storage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete storage[key];
      }),
      clear: vi.fn(() => {
        storage = {};
      }),
      get length() {
        return Object.keys(storage).length;
      },
      key: vi.fn((index: number) => Object.keys(storage)[index] ?? null),
    };

    vi.stubGlobal('localStorage', localStorageMock);
    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => `uuid-${Date.now()}-${Math.random()}`) });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('readAllVersions', () => {
    it('returns empty array when no data', () => {
      expect(readAllVersions()).toEqual([]);
    });

    it('returns valid versions from storage', () => {
      const version: ChapterVersion = {
        id: 'v1',
        chapterId: 'ch1',
        label: 'Version A',
        content: 'Hello world',
        createdAt: '2026-03-10T10:00:00Z',
        isCanonical: true,
        source: 'manual',
        wordCount: 2,
      };
      storage[VERSIONS_KEY] = JSON.stringify([version]);
      expect(readAllVersions()).toEqual([version]);
    });

    it('filters out invalid entries', () => {
      const valid: ChapterVersion = {
        id: 'v1',
        chapterId: 'ch1',
        label: 'A',
        content: 'text',
        createdAt: '2026-01-01T00:00:00Z',
        isCanonical: false,
        source: 'manual',
        wordCount: 1,
      };
      const invalid = { id: 'bad' };
      storage[VERSIONS_KEY] = JSON.stringify([valid, invalid]);
      expect(readAllVersions()).toEqual([valid]);
    });

    it('handles corrupt JSON', () => {
      storage[VERSIONS_KEY] = 'not-json';
      expect(readAllVersions()).toEqual([]);
    });

    it('handles non-array JSON', () => {
      storage[VERSIONS_KEY] = JSON.stringify({ not: 'array' });
      expect(readAllVersions()).toEqual([]);
    });

    it('rejects entries with invalid source', () => {
      const bad = {
        id: 'v1', chapterId: 'ch1', label: 'A', content: 'x',
        createdAt: '2026-01-01T00:00:00Z', isCanonical: false,
        source: 'invalid', wordCount: 1,
      };
      storage[VERSIONS_KEY] = JSON.stringify([bad]);
      expect(readAllVersions()).toEqual([]);
    });
  });

  describe('readVersions', () => {
    it('filters by chapterId', () => {
      const v1: ChapterVersion = {
        id: 'v1', chapterId: 'ch1', label: 'A', content: 'text1',
        createdAt: '2026-01-01T00:00:00Z', isCanonical: true, source: 'manual', wordCount: 1,
      };
      const v2: ChapterVersion = {
        id: 'v2', chapterId: 'ch2', label: 'B', content: 'text2',
        createdAt: '2026-01-01T00:00:00Z', isCanonical: true, source: 'manual', wordCount: 1,
      };
      storage[VERSIONS_KEY] = JSON.stringify([v1, v2]);
      expect(readVersions('ch1')).toEqual([v1]);
      expect(readVersions('ch2')).toEqual([v2]);
    });

    it('returns empty for unknown chapter', () => {
      expect(readVersions('nonexistent')).toEqual([]);
    });
  });

  describe('addVersion', () => {
    it('creates a new version', () => {
      const v = addVersion('ch1', 'Hello world content', 'Draft 1', 'manual');
      expect(v.chapterId).toBe('ch1');
      expect(v.label).toBe('Draft 1');
      expect(v.content).toBe('Hello world content');
      expect(v.source).toBe('manual');
      expect(v.isCanonical).toBe(false);
      expect(v.wordCount).toBe(3);
      expect(v.id).toBeTruthy();
    });

    it('persists to storage', () => {
      addVersion('ch1', 'text', 'A', 'manual');
      const stored = JSON.parse(storage[VERSIONS_KEY]);
      expect(stored).toHaveLength(1);
    });

    it('creates canonical version and unmarks existing', () => {
      addVersion('ch1', 'first', 'A', 'manual', true);
      addVersion('ch1', 'second', 'B', 'manual', true);
      const versions = readVersions('ch1');
      const canonicals = versions.filter(v => v.isCanonical);
      expect(canonicals).toHaveLength(1);
      expect(canonicals[0].label).toBe('B');
    });

    it('handles scene-change source', () => {
      const v = addVersion('ch1', 'scene text', 'Scene Change — Mar 10', 'scene-change');
      expect(v.source).toBe('scene-change');
    });

    it('computes word count correctly', () => {
      const v = addVersion('ch1', 'one two three four five', 'Test', 'manual');
      expect(v.wordCount).toBe(5);
    });

    it('computes word count for empty content as 0', () => {
      const v = addVersion('ch1', '', 'Empty', 'manual');
      expect(v.wordCount).toBe(0);
    });
  });

  describe('setCanonical', () => {
    it('marks version as canonical', () => {
      const v1 = addVersion('ch1', 'a', 'A', 'manual', true);
      const v2 = addVersion('ch1', 'b', 'B', 'manual', false);
      setCanonical(v2.id);
      const versions = readVersions('ch1');
      expect(versions.find(v => v.id === v1.id)?.isCanonical).toBe(false);
      expect(versions.find(v => v.id === v2.id)?.isCanonical).toBe(true);
    });

    it('does nothing for nonexistent version', () => {
      addVersion('ch1', 'a', 'A', 'manual', true);
      setCanonical('nonexistent');
      const versions = readVersions('ch1');
      expect(versions[0].isCanonical).toBe(true);
    });
  });

  describe('deleteVersion', () => {
    it('removes a version', () => {
      const v = addVersion('ch1', 'text', 'A', 'manual');
      expect(readVersions('ch1')).toHaveLength(1);
      deleteVersion(v.id);
      expect(readVersions('ch1')).toHaveLength(0);
    });

    it('does nothing for nonexistent version', () => {
      addVersion('ch1', 'text', 'A', 'manual');
      deleteVersion('nonexistent');
      expect(readVersions('ch1')).toHaveLength(1);
    });
  });

  describe('renameVersion', () => {
    it('renames a version', () => {
      const v = addVersion('ch1', 'text', 'Old Name', 'manual');
      renameVersion(v.id, 'New Name');
      const versions = readVersions('ch1');
      expect(versions[0].label).toBe('New Name');
    });

    it('does nothing for nonexistent version', () => {
      const v = addVersion('ch1', 'text', 'A', 'manual');
      renameVersion('nonexistent', 'B');
      expect(readVersions('ch1')[0].label).toBe('A');
    });
  });

  describe('ensureInitialVersion', () => {
    it('creates initial version if none exist', () => {
      const versions = ensureInitialVersion('ch1', 'Some chapter content');
      expect(versions).toHaveLength(1);
      expect(versions[0].label).toBe('Version A');
      expect(versions[0].isCanonical).toBe(true);
      expect(versions[0].source).toBe('auto-snapshot');
    });

    it('returns existing versions without creating new', () => {
      addVersion('ch1', 'existing', 'Existing', 'manual', true);
      const versions = ensureInitialVersion('ch1', 'Some content');
      expect(versions).toHaveLength(1);
      expect(versions[0].label).toBe('Existing');
    });

    it('returns empty array for empty content', () => {
      const versions = ensureInitialVersion('ch1', '');
      expect(versions).toEqual([]);
    });

    it('returns empty array for whitespace-only content', () => {
      const versions = ensureInitialVersion('ch1', '   \n\t  ');
      expect(versions).toEqual([]);
    });
  });

  describe('getCanonicalVersion', () => {
    it('returns canonical version', () => {
      addVersion('ch1', 'a', 'A', 'manual', true);
      addVersion('ch1', 'b', 'B', 'manual', false);
      const canonical = getCanonicalVersion('ch1');
      expect(canonical?.label).toBe('A');
    });

    it('returns null when no versions', () => {
      expect(getCanonicalVersion('ch1')).toBeNull();
    });

    it('returns null when no canonical version', () => {
      addVersion('ch1', 'a', 'A', 'manual', false);
      expect(getCanonicalVersion('ch1')).toBeNull();
    });
  });
});
