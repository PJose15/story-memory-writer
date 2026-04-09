import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dexie-db to force localStorage fallback in all tests
vi.mock('@/lib/storage/dexie-db', () => ({
  getAllVersions: vi.fn().mockRejectedValue(new Error('Dexie unavailable')),
  putAllVersions: vi.fn().mockRejectedValue(new Error('Dexie unavailable')),
  putVersion: vi.fn().mockRejectedValue(new Error('Dexie unavailable')),
  deleteVersionById: vi.fn().mockRejectedValue(new Error('Dexie unavailable')),
}));

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
    it('returns empty array when no data', async () => {
      expect(await readAllVersions()).toEqual([]);
    });

    it('returns valid versions from storage', async () => {
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
      expect(await readAllVersions()).toEqual([version]);
    });

    it('filters out invalid entries', async () => {
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
      expect(await readAllVersions()).toEqual([valid]);
    });

    it('handles corrupt JSON', async () => {
      storage[VERSIONS_KEY] = 'not-json';
      expect(await readAllVersions()).toEqual([]);
    });

    it('handles non-array JSON', async () => {
      storage[VERSIONS_KEY] = JSON.stringify({ not: 'array' });
      expect(await readAllVersions()).toEqual([]);
    });

    it('rejects entries with invalid source', async () => {
      const bad = {
        id: 'v1', chapterId: 'ch1', label: 'A', content: 'x',
        createdAt: '2026-01-01T00:00:00Z', isCanonical: false,
        source: 'invalid', wordCount: 1,
      };
      storage[VERSIONS_KEY] = JSON.stringify([bad]);
      expect(await readAllVersions()).toEqual([]);
    });
  });

  describe('readVersions', () => {
    it('filters by chapterId', async () => {
      const v1: ChapterVersion = {
        id: 'v1', chapterId: 'ch1', label: 'A', content: 'text1',
        createdAt: '2026-01-01T00:00:00Z', isCanonical: true, source: 'manual', wordCount: 1,
      };
      const v2: ChapterVersion = {
        id: 'v2', chapterId: 'ch2', label: 'B', content: 'text2',
        createdAt: '2026-01-01T00:00:00Z', isCanonical: true, source: 'manual', wordCount: 1,
      };
      storage[VERSIONS_KEY] = JSON.stringify([v1, v2]);
      expect(await readVersions('ch1')).toEqual([v1]);
      expect(await readVersions('ch2')).toEqual([v2]);
    });

    it('returns empty for unknown chapter', async () => {
      expect(await readVersions('nonexistent')).toEqual([]);
    });
  });

  describe('addVersion', () => {
    it('creates a new version', async () => {
      const v = await addVersion('ch1', 'Hello world content', 'Draft 1', 'manual');
      expect(v.chapterId).toBe('ch1');
      expect(v.label).toBe('Draft 1');
      expect(v.content).toBe('Hello world content');
      expect(v.source).toBe('manual');
      expect(v.isCanonical).toBe(false);
      expect(v.wordCount).toBe(3);
      expect(v.id).toBeTruthy();
    });

    it('persists to storage', async () => {
      await addVersion('ch1', 'text', 'A', 'manual');
      const stored = JSON.parse(storage[VERSIONS_KEY]);
      expect(stored).toHaveLength(1);
    });

    it('creates canonical version and unmarks existing', async () => {
      await addVersion('ch1', 'first', 'A', 'manual', true);
      await addVersion('ch1', 'second', 'B', 'manual', true);
      const versions = await readVersions('ch1');
      const canonicals = versions.filter(v => v.isCanonical);
      expect(canonicals).toHaveLength(1);
      expect(canonicals[0].label).toBe('B');
    });

    it('handles scene-change source', async () => {
      const v = await addVersion('ch1', 'scene text', 'Scene Change — Mar 10', 'scene-change');
      expect(v.source).toBe('scene-change');
    });

    it('computes word count correctly', async () => {
      const v = await addVersion('ch1', 'one two three four five', 'Test', 'manual');
      expect(v.wordCount).toBe(5);
    });

    it('computes word count for empty content as 0', async () => {
      const v = await addVersion('ch1', '', 'Empty', 'manual');
      expect(v.wordCount).toBe(0);
    });
  });

  describe('setCanonical', () => {
    it('marks version as canonical', async () => {
      const v1 = await addVersion('ch1', 'a', 'A', 'manual', true);
      const v2 = await addVersion('ch1', 'b', 'B', 'manual', false);
      await setCanonical(v2.id);
      const versions = await readVersions('ch1');
      expect(versions.find(v => v.id === v1.id)?.isCanonical).toBe(false);
      expect(versions.find(v => v.id === v2.id)?.isCanonical).toBe(true);
    });

    it('does nothing for nonexistent version', async () => {
      await addVersion('ch1', 'a', 'A', 'manual', true);
      await setCanonical('nonexistent');
      const versions = await readVersions('ch1');
      expect(versions[0].isCanonical).toBe(true);
    });
  });

  describe('deleteVersion', () => {
    it('removes a version', async () => {
      const v = await addVersion('ch1', 'text', 'A', 'manual');
      expect(await readVersions('ch1')).toHaveLength(1);
      await deleteVersion(v.id);
      expect(await readVersions('ch1')).toHaveLength(0);
    });

    it('does nothing for nonexistent version', async () => {
      await addVersion('ch1', 'text', 'A', 'manual');
      await deleteVersion('nonexistent');
      expect(await readVersions('ch1')).toHaveLength(1);
    });
  });

  describe('renameVersion', () => {
    it('renames a version', async () => {
      const v = await addVersion('ch1', 'text', 'Old Name', 'manual');
      await renameVersion(v.id, 'New Name');
      const versions = await readVersions('ch1');
      expect(versions[0].label).toBe('New Name');
    });

    it('does nothing for nonexistent version', async () => {
      await addVersion('ch1', 'text', 'A', 'manual');
      await renameVersion('nonexistent', 'B');
      expect((await readVersions('ch1'))[0].label).toBe('A');
    });
  });

  describe('ensureInitialVersion', () => {
    it('creates initial version if none exist', async () => {
      const versions = await ensureInitialVersion('ch1', 'Some chapter content');
      expect(versions).toHaveLength(1);
      expect(versions[0].label).toBe('Version A');
      expect(versions[0].isCanonical).toBe(true);
      expect(versions[0].source).toBe('auto-snapshot');
    });

    it('returns existing versions without creating new', async () => {
      await addVersion('ch1', 'existing', 'Existing', 'manual', true);
      const versions = await ensureInitialVersion('ch1', 'Some content');
      expect(versions).toHaveLength(1);
      expect(versions[0].label).toBe('Existing');
    });

    it('returns empty array for empty content', async () => {
      const versions = await ensureInitialVersion('ch1', '');
      expect(versions).toEqual([]);
    });

    it('returns empty array for whitespace-only content', async () => {
      const versions = await ensureInitialVersion('ch1', '   \n\t  ');
      expect(versions).toEqual([]);
    });
  });

  describe('getCanonicalVersion', () => {
    it('returns canonical version', async () => {
      await addVersion('ch1', 'a', 'A', 'manual', true);
      await addVersion('ch1', 'b', 'B', 'manual', false);
      const canonical = await getCanonicalVersion('ch1');
      expect(canonical?.label).toBe('A');
    });

    it('returns null when no versions', async () => {
      expect(await getCanonicalVersion('ch1')).toBeNull();
    });

    it('returns null when no canonical version', async () => {
      await addVersion('ch1', 'a', 'A', 'manual', false);
      expect(await getCanonicalVersion('ch1')).toBeNull();
    });
  });
});
