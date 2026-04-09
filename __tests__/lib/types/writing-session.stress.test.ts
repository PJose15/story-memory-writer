import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dexie-db to force localStorage fallback in all tests
vi.mock('@/lib/storage/dexie-db', () => ({
  getSessions: vi.fn().mockRejectedValue(new Error('Dexie unavailable')),
  putSession: vi.fn().mockRejectedValue(new Error('Dexie unavailable')),
  putAllSessions: vi.fn().mockRejectedValue(new Error('Dexie unavailable')),
}));

import {
  readSessions,
  writeSessions,
  addSession,
  updateSessionFlowScore,
  saveWipSession,
  readWipSession,
  clearWipSession,
} from '@/lib/types/writing-session';
import type { WritingSession } from '@/lib/types/writing-session';

const SESSIONS_KEY = 'zagafy_sessions';
const WIP_KEY = 'zagafy_session_wip';

function makeSession(overrides: Partial<WritingSession> = {}): WritingSession {
  return {
    id: 'sess-1',
    projectId: 'proj-1',
    projectName: 'My Novel',
    startedAt: '2026-03-10T10:00:00Z',
    endedAt: '2026-03-10T10:30:00Z',
    wordsStart: 100,
    wordsEnd: 250,
    wordsAdded: 150,
    flowScore: 4,
    heteronymId: null,
    heteronymName: null,
    keystrokeMetrics: null,
    autoFlowScore: null,
    flowMoments: null,
    ...overrides,
  };
}

describe('writing-session STRESS', () => {
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = {};
    const localStorageMock: Storage = {
      getItem: vi.fn((key: string) => storage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { storage[key] = value; }),
      removeItem: vi.fn((key: string) => { delete storage[key]; }),
      clear: vi.fn(() => { storage = {}; }),
      get length() { return Object.keys(storage).length; },
      key: vi.fn((index: number) => Object.keys(storage)[index] ?? null),
    };
    vi.stubGlobal('localStorage', localStorageMock);
    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'test-uuid-1234') });
  });

  afterEach(() => { vi.unstubAllGlobals(); });

  describe('type guard — flowScore edge cases', () => {
    it('rejects flowScore = 0', async () => {
      const bad = { ...makeSession(), flowScore: 0 };
      storage[SESSIONS_KEY] = JSON.stringify([bad]);
      expect(await readSessions()).toEqual([]);
    });

    it('rejects flowScore = 0.5 (non-integer)', async () => {
      const bad = { ...makeSession(), flowScore: 0.5 };
      storage[SESSIONS_KEY] = JSON.stringify([bad]);
      expect(await readSessions()).toEqual([]);
    });

    it('rejects flowScore = 1.5', async () => {
      const bad = { ...makeSession(), flowScore: 1.5 };
      storage[SESSIONS_KEY] = JSON.stringify([bad]);
      expect(await readSessions()).toEqual([]);
    });

    it('rejects flowScore = -1', async () => {
      const bad = { ...makeSession(), flowScore: -1 };
      storage[SESSIONS_KEY] = JSON.stringify([bad]);
      expect(await readSessions()).toEqual([]);
    });

    it('rejects flowScore = 6', async () => {
      const bad = { ...makeSession(), flowScore: 6 };
      storage[SESSIONS_KEY] = JSON.stringify([bad]);
      expect(await readSessions()).toEqual([]);
    });

    it('NaN flowScore becomes null after JSON serialization, accepted as null', async () => {
      const bad = { ...makeSession(), flowScore: NaN };
      storage[SESSIONS_KEY] = JSON.stringify([bad]);
      const result = await readSessions();
      expect(result).toHaveLength(1);
      expect(result[0].flowScore).toBeNull();
    });

    it('rejects flowScore = Infinity', async () => {
      const raw = JSON.stringify([makeSession()]).replace('"flowScore":4', '"flowScore":999999');
      storage[SESSIONS_KEY] = raw;
      expect(await readSessions()).toEqual([]);
    });

    it('accepts flowScore = 1 (min)', async () => {
      const sess = makeSession({ flowScore: 1 });
      storage[SESSIONS_KEY] = JSON.stringify([sess]);
      expect(await readSessions()).toHaveLength(1);
    });

    it('accepts flowScore = 5 (max)', async () => {
      const sess = makeSession({ flowScore: 5 });
      storage[SESSIONS_KEY] = JSON.stringify([sess]);
      expect(await readSessions()).toHaveLength(1);
    });

    it('rejects flowScore = "3" (string)', async () => {
      const bad = { ...makeSession(), flowScore: '3' };
      storage[SESSIONS_KEY] = JSON.stringify([bad]);
      expect(await readSessions()).toEqual([]);
    });

    it('rejects flowScore = true', async () => {
      const bad = { ...makeSession(), flowScore: true };
      storage[SESSIONS_KEY] = JSON.stringify([bad]);
      expect(await readSessions()).toEqual([]);
    });
  });

  describe('type guard — heteronym field combinations', () => {
    it('accepts heteronymId present, heteronymName null', async () => {
      const sess = makeSession({ heteronymId: 'het-1', heteronymName: null });
      storage[SESSIONS_KEY] = JSON.stringify([sess]);
      expect(await readSessions()).toHaveLength(1);
    });

    it('accepts heteronymId null, heteronymName present', async () => {
      const sess = makeSession({ heteronymId: null, heteronymName: 'Dark Poet' });
      storage[SESSIONS_KEY] = JSON.stringify([sess]);
      expect(await readSessions()).toHaveLength(1);
    });

    it('accepts both heteronym fields as empty strings', async () => {
      const sess = makeSession({ heteronymId: '', heteronymName: '' });
      storage[SESSIONS_KEY] = JSON.stringify([sess]);
      expect(await readSessions()).toHaveLength(1);
    });

    it('accepts both heteronym fields present', async () => {
      const sess = makeSession({ heteronymId: 'het-1', heteronymName: 'Dark Poet' });
      storage[SESSIONS_KEY] = JSON.stringify([sess]);
      const result = await readSessions();
      expect(result).toHaveLength(1);
      expect(result[0].heteronymId).toBe('het-1');
      expect(result[0].heteronymName).toBe('Dark Poet');
    });

    it('rejects heteronymId = 123 (number)', async () => {
      const bad = { ...makeSession(), heteronymId: 123 };
      storage[SESSIONS_KEY] = JSON.stringify([bad]);
      expect(await readSessions()).toEqual([]);
    });

    it('rejects heteronymName = true (boolean)', async () => {
      const bad = { ...makeSession(), heteronymName: true };
      storage[SESSIONS_KEY] = JSON.stringify([bad]);
      expect(await readSessions()).toEqual([]);
    });

    it('rejects heteronymId = [] (array)', async () => {
      const bad = { ...makeSession(), heteronymId: [] };
      storage[SESSIONS_KEY] = JSON.stringify([bad]);
      expect(await readSessions()).toEqual([]);
    });

    it('rejects heteronymName = {} (object)', async () => {
      const bad = { ...makeSession(), heteronymName: {} };
      storage[SESSIONS_KEY] = JSON.stringify([bad]);
      expect(await readSessions()).toEqual([]);
    });

    it('normalizes undefined heteronymId to null (backward compat)', async () => {
      const legacy = {
        id: 'x', projectId: 'p', projectName: 'n',
        startedAt: '2026-01-01T00:00:00Z', endedAt: '2026-01-01T01:00:00Z',
        wordsStart: 0, wordsEnd: 10, wordsAdded: 10, flowScore: 3,
      };
      storage[SESSIONS_KEY] = JSON.stringify([legacy]);
      const result = await readSessions();
      expect(result).toHaveLength(1);
      expect(result[0].heteronymId).toBeNull();
      expect(result[0].heteronymName).toBeNull();
    });

    it('normalizes explicit undefined heteronymId to null', async () => {
      const data = { ...makeSession(), heteronymId: undefined, heteronymName: undefined };
      storage[SESSIONS_KEY] = JSON.stringify([data]);
      const result = await readSessions();
      expect(result).toHaveLength(1);
      expect(result[0].heteronymId).toBeNull();
    });
  });

  describe('type guard — field type rejection', () => {
    const required = ['id', 'projectId', 'projectName', 'startedAt', 'endedAt'];
    for (const field of required) {
      it(`rejects ${field} = null`, async () => {
        const bad = { ...makeSession(), [field]: null };
        storage[SESSIONS_KEY] = JSON.stringify([bad]);
        expect(await readSessions()).toEqual([]);
      });

      it(`rejects ${field} = 123 (number)`, async () => {
        const bad = { ...makeSession(), [field]: 123 };
        storage[SESSIONS_KEY] = JSON.stringify([bad]);
        expect(await readSessions()).toEqual([]);
      });
    }

    const numeric = ['wordsStart', 'wordsEnd', 'wordsAdded'];
    for (const field of numeric) {
      it(`rejects ${field} = "100" (string)`, async () => {
        const bad = { ...makeSession(), [field]: '100' };
        storage[SESSIONS_KEY] = JSON.stringify([bad]);
        expect(await readSessions()).toEqual([]);
      });

      it(`rejects ${field} = null`, async () => {
        const bad = { ...makeSession(), [field]: null };
        storage[SESSIONS_KEY] = JSON.stringify([bad]);
        expect(await readSessions()).toEqual([]);
      });
    }

    it('rejects primitive instead of object', async () => {
      storage[SESSIONS_KEY] = JSON.stringify([42]);
      expect(await readSessions()).toEqual([]);
    });

    it('rejects nested arrays', async () => {
      storage[SESSIONS_KEY] = JSON.stringify([[]]);
      expect(await readSessions()).toEqual([]);
    });
  });

  describe('extreme values', () => {
    it('accepts wordsAdded = 0', async () => {
      const sess = makeSession({ wordsAdded: 0, wordsEnd: 100 });
      storage[SESSIONS_KEY] = JSON.stringify([sess]);
      expect(await readSessions()).toHaveLength(1);
    });

    it('accepts negative wordsAdded (no validation beyond type)', async () => {
      const sess = makeSession({ wordsAdded: -50 });
      storage[SESSIONS_KEY] = JSON.stringify([sess]);
      expect(await readSessions()).toHaveLength(1);
    });

    it('accepts very large wordsAdded', async () => {
      const sess = makeSession({ wordsAdded: 999_999 });
      storage[SESSIONS_KEY] = JSON.stringify([sess]);
      expect(await readSessions()).toHaveLength(1);
    });

    it('accepts empty string projectName', async () => {
      const sess = makeSession({ projectName: '' });
      storage[SESSIONS_KEY] = JSON.stringify([sess]);
      expect(await readSessions()).toHaveLength(1);
    });

    it('accepts unicode emoji in projectName', async () => {
      const sess = makeSession({ projectName: '🔥📖 My Épic Növel 日本語' });
      storage[SESSIONS_KEY] = JSON.stringify([sess]);
      const result = await readSessions();
      expect(result).toHaveLength(1);
      expect(result[0].projectName).toBe('🔥📖 My Épic Növel 日本語');
    });

    it('accepts 10000-char projectName', async () => {
      const longName = 'x'.repeat(10_000);
      const sess = makeSession({ projectName: longName });
      storage[SESSIONS_KEY] = JSON.stringify([sess]);
      const result = await readSessions();
      expect(result).toHaveLength(1);
      expect(result[0].projectName).toHaveLength(10_000);
    });
  });

  describe('mass data', () => {
    it('reads 1000 sessions without error', async () => {
      const sessions = Array.from({ length: 1000 }, (_, i) =>
        makeSession({ id: `s-${i}`, wordsAdded: i })
      );
      storage[SESSIONS_KEY] = JSON.stringify(sessions);
      const result = await readSessions();
      expect(result).toHaveLength(1000);
    });

    it('writes and re-reads 500 sessions', async () => {
      const sessions = Array.from({ length: 500 }, (_, i) =>
        makeSession({ id: `s-${i}` })
      );
      await writeSessions(sessions);
      expect(await readSessions()).toHaveLength(500);
    });

    it('addSession to 999 existing sessions', async () => {
      const sessions = Array.from({ length: 999 }, (_, i) =>
        makeSession({ id: `s-${i}` })
      );
      storage[SESSIONS_KEY] = JSON.stringify(sessions);
      await addSession(makeSession({ id: 's-999' }));
      expect(await readSessions()).toHaveLength(1000);
    });

    it('updateSessionFlowScore among 500 sessions', async () => {
      const sessions = Array.from({ length: 500 }, (_, i) =>
        makeSession({ id: `s-${i}`, flowScore: null })
      );
      storage[SESSIONS_KEY] = JSON.stringify(sessions);
      await updateSessionFlowScore('s-250', 5);
      const result = await readSessions();
      expect(result.find(s => s.id === 's-250')?.flowScore).toBe(5);
      expect(result.find(s => s.id === 's-0')?.flowScore).toBeNull();
    });

    it('filters 50 invalid out of 200 mixed entries', async () => {
      const valid = Array.from({ length: 150 }, (_, i) => makeSession({ id: `v-${i}` }));
      const invalid = Array.from({ length: 50 }, (_, i) => ({
        id: `bad-${i}`, wordsStart: 'not-a-number',
      }));
      const mixed = [...valid, ...invalid];
      storage[SESSIONS_KEY] = JSON.stringify(mixed);
      expect(await readSessions()).toHaveLength(150);
    });
  });

  describe('storage edge cases', () => {
    it('handles localStorage.getItem returning empty string', async () => {
      storage[SESSIONS_KEY] = '';
      expect(await readSessions()).toEqual([]);
    });

    it('handles localStorage with "null" string', async () => {
      storage[SESSIONS_KEY] = 'null';
      expect(await readSessions()).toEqual([]);
    });

    it('handles localStorage with "undefined" string', async () => {
      storage[SESSIONS_KEY] = 'undefined';
      expect(await readSessions()).toEqual([]);
    });

    it('handles localStorage with "[]" (empty array)', async () => {
      storage[SESSIONS_KEY] = '[]';
      expect(await readSessions()).toEqual([]);
    });

    it('handles localStorage with number string', async () => {
      storage[SESSIONS_KEY] = '42';
      expect(await readSessions()).toEqual([]);
    });
  });

  describe('WIP session stress', () => {
    it('handles WIP with heteronym fields', () => {
      saveWipSession({
        id: 'wip-1', projectId: 'p', projectName: 'n',
        startedAt: '2026-01-01T00:00:00Z', wordsStart: 0, currentWords: 100,
        heteronymId: 'het-1', heteronymName: 'Dark Poet',
      });
      const result = readWipSession();
      expect(result?.heteronymId).toBe('het-1');
      expect(result?.heteronymName).toBe('Dark Poet');
    });

    it('normalizes WIP without heteronym fields to null', () => {
      const legacy = {
        id: 'wip-1', projectId: 'p', projectName: 'n',
        startedAt: '2026-01-01T00:00:00Z', wordsStart: 0, currentWords: 100,
      };
      storage[WIP_KEY] = JSON.stringify(legacy);
      const result = readWipSession();
      expect(result).not.toBeNull();
      expect(result!.heteronymId).toBeNull();
      expect(result!.heteronymName).toBeNull();
    });

    it('rejects WIP missing required fields', () => {
      storage[WIP_KEY] = JSON.stringify({ id: 'wip-1' });
      expect(readWipSession()).toBeNull();
    });

    it('rejects WIP with non-numeric currentWords', () => {
      storage[WIP_KEY] = JSON.stringify({
        id: 'x', projectId: 'p', projectName: 'n',
        startedAt: '2026-01-01T00:00:00Z', wordsStart: 0, currentWords: 'many',
      });
      expect(readWipSession()).toBeNull();
    });

    it('handles WIP with currentWords < wordsStart', () => {
      saveWipSession({
        id: 'wip-1', projectId: 'p', projectName: 'n',
        startedAt: '2026-01-01T00:00:00Z', wordsStart: 100, currentWords: 50,
        heteronymId: null, heteronymName: null,
      });
      const result = readWipSession();
      expect(result!.currentWords).toBe(50);
      expect(result!.wordsStart).toBe(100);
    });

    it('clearWipSession then readWipSession returns null', () => {
      saveWipSession({
        id: 'wip-1', projectId: 'p', projectName: 'n',
        startedAt: '2026-01-01T00:00:00Z', wordsStart: 0, currentWords: 100,
        heteronymId: null, heteronymName: null,
      });
      clearWipSession();
      expect(readWipSession()).toBeNull();
    });
  });
});
