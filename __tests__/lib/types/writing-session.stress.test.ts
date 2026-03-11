import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

  // ──────────────────────────────────────────────────────
  // TYPE GUARD — FLOW SCORE EDGE CASES
  // ──────────────────────────────────────────────────────
  describe('type guard — flowScore edge cases', () => {
    it('rejects flowScore = 0', () => {
      const bad = { ...makeSession(), flowScore: 0 };
      storage[SESSIONS_KEY] = JSON.stringify([bad]);
      expect(readSessions()).toEqual([]);
    });

    it('rejects flowScore = 0.5 (non-integer)', () => {
      const bad = { ...makeSession(), flowScore: 0.5 };
      storage[SESSIONS_KEY] = JSON.stringify([bad]);
      expect(readSessions()).toEqual([]);
    });

    it('rejects flowScore = 1.5', () => {
      const bad = { ...makeSession(), flowScore: 1.5 };
      storage[SESSIONS_KEY] = JSON.stringify([bad]);
      expect(readSessions()).toEqual([]);
    });

    it('rejects flowScore = -1', () => {
      const bad = { ...makeSession(), flowScore: -1 };
      storage[SESSIONS_KEY] = JSON.stringify([bad]);
      expect(readSessions()).toEqual([]);
    });

    it('rejects flowScore = 6', () => {
      const bad = { ...makeSession(), flowScore: 6 };
      storage[SESSIONS_KEY] = JSON.stringify([bad]);
      expect(readSessions()).toEqual([]);
    });

    it('NaN flowScore becomes null after JSON serialization, accepted as null', () => {
      // JSON.stringify(NaN) → null, so this is effectively flowScore: null
      const bad = { ...makeSession(), flowScore: NaN };
      storage[SESSIONS_KEY] = JSON.stringify([bad]);
      const result = readSessions();
      expect(result).toHaveLength(1);
      expect(result[0].flowScore).toBeNull();
    });

    it('rejects flowScore = Infinity', () => {
      // JSON.stringify(Infinity) → null
      const raw = JSON.stringify([makeSession()]).replace('"flowScore":4', '"flowScore":999999');
      storage[SESSIONS_KEY] = raw;
      expect(readSessions()).toEqual([]);
    });

    it('accepts flowScore = 1 (min)', () => {
      const sess = makeSession({ flowScore: 1 });
      storage[SESSIONS_KEY] = JSON.stringify([sess]);
      expect(readSessions()).toHaveLength(1);
    });

    it('accepts flowScore = 5 (max)', () => {
      const sess = makeSession({ flowScore: 5 });
      storage[SESSIONS_KEY] = JSON.stringify([sess]);
      expect(readSessions()).toHaveLength(1);
    });

    it('rejects flowScore = "3" (string)', () => {
      const bad = { ...makeSession(), flowScore: '3' };
      storage[SESSIONS_KEY] = JSON.stringify([bad]);
      expect(readSessions()).toEqual([]);
    });

    it('rejects flowScore = true', () => {
      const bad = { ...makeSession(), flowScore: true };
      storage[SESSIONS_KEY] = JSON.stringify([bad]);
      expect(readSessions()).toEqual([]);
    });
  });

  // ──────────────────────────────────────────────────────
  // TYPE GUARD — HETERONYM FIELD COMBINATIONS
  // ──────────────────────────────────────────────────────
  describe('type guard — heteronym field combinations', () => {
    it('accepts heteronymId present, heteronymName null', () => {
      const sess = makeSession({ heteronymId: 'het-1', heteronymName: null });
      storage[SESSIONS_KEY] = JSON.stringify([sess]);
      expect(readSessions()).toHaveLength(1);
    });

    it('accepts heteronymId null, heteronymName present', () => {
      const sess = makeSession({ heteronymId: null, heteronymName: 'Dark Poet' });
      storage[SESSIONS_KEY] = JSON.stringify([sess]);
      expect(readSessions()).toHaveLength(1);
    });

    it('accepts both heteronym fields as empty strings', () => {
      const sess = makeSession({ heteronymId: '', heteronymName: '' });
      storage[SESSIONS_KEY] = JSON.stringify([sess]);
      expect(readSessions()).toHaveLength(1);
    });

    it('accepts both heteronym fields present', () => {
      const sess = makeSession({ heteronymId: 'het-1', heteronymName: 'Dark Poet' });
      storage[SESSIONS_KEY] = JSON.stringify([sess]);
      const result = readSessions();
      expect(result).toHaveLength(1);
      expect(result[0].heteronymId).toBe('het-1');
      expect(result[0].heteronymName).toBe('Dark Poet');
    });

    it('rejects heteronymId = 123 (number)', () => {
      const bad = { ...makeSession(), heteronymId: 123 };
      storage[SESSIONS_KEY] = JSON.stringify([bad]);
      expect(readSessions()).toEqual([]);
    });

    it('rejects heteronymName = true (boolean)', () => {
      const bad = { ...makeSession(), heteronymName: true };
      storage[SESSIONS_KEY] = JSON.stringify([bad]);
      expect(readSessions()).toEqual([]);
    });

    it('rejects heteronymId = [] (array)', () => {
      const bad = { ...makeSession(), heteronymId: [] };
      storage[SESSIONS_KEY] = JSON.stringify([bad]);
      expect(readSessions()).toEqual([]);
    });

    it('rejects heteronymName = {} (object)', () => {
      const bad = { ...makeSession(), heteronymName: {} };
      storage[SESSIONS_KEY] = JSON.stringify([bad]);
      expect(readSessions()).toEqual([]);
    });

    it('normalizes undefined heteronymId to null (backward compat)', () => {
      const legacy = {
        id: 'x', projectId: 'p', projectName: 'n',
        startedAt: '2026-01-01T00:00:00Z', endedAt: '2026-01-01T01:00:00Z',
        wordsStart: 0, wordsEnd: 10, wordsAdded: 10, flowScore: 3,
        // heteronymId and heteronymName completely absent
      };
      storage[SESSIONS_KEY] = JSON.stringify([legacy]);
      const result = readSessions();
      expect(result).toHaveLength(1);
      expect(result[0].heteronymId).toBeNull();
      expect(result[0].heteronymName).toBeNull();
    });

    it('normalizes explicit undefined heteronymId to null', () => {
      // JSON.stringify drops undefined, so this is effectively absent
      const data = { ...makeSession(), heteronymId: undefined, heteronymName: undefined };
      storage[SESSIONS_KEY] = JSON.stringify([data]);
      const result = readSessions();
      expect(result).toHaveLength(1);
      expect(result[0].heteronymId).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────
  // TYPE GUARD — FIELD TYPE REJECTION
  // ──────────────────────────────────────────────────────
  describe('type guard — field type rejection', () => {
    const required = ['id', 'projectId', 'projectName', 'startedAt', 'endedAt'];
    for (const field of required) {
      it(`rejects ${field} = null`, () => {
        const bad = { ...makeSession(), [field]: null };
        storage[SESSIONS_KEY] = JSON.stringify([bad]);
        expect(readSessions()).toEqual([]);
      });

      it(`rejects ${field} = 123 (number)`, () => {
        const bad = { ...makeSession(), [field]: 123 };
        storage[SESSIONS_KEY] = JSON.stringify([bad]);
        expect(readSessions()).toEqual([]);
      });
    }

    const numeric = ['wordsStart', 'wordsEnd', 'wordsAdded'];
    for (const field of numeric) {
      it(`rejects ${field} = "100" (string)`, () => {
        const bad = { ...makeSession(), [field]: '100' };
        storage[SESSIONS_KEY] = JSON.stringify([bad]);
        expect(readSessions()).toEqual([]);
      });

      it(`rejects ${field} = null`, () => {
        const bad = { ...makeSession(), [field]: null };
        storage[SESSIONS_KEY] = JSON.stringify([bad]);
        expect(readSessions()).toEqual([]);
      });
    }

    it('rejects primitive instead of object', () => {
      storage[SESSIONS_KEY] = JSON.stringify([42]);
      expect(readSessions()).toEqual([]);
    });

    it('rejects nested arrays', () => {
      storage[SESSIONS_KEY] = JSON.stringify([[]]);
      expect(readSessions()).toEqual([]);
    });
  });

  // ──────────────────────────────────────────────────────
  // EXTREME VALUES
  // ──────────────────────────────────────────────────────
  describe('extreme values', () => {
    it('accepts wordsAdded = 0', () => {
      const sess = makeSession({ wordsAdded: 0, wordsEnd: 100 });
      storage[SESSIONS_KEY] = JSON.stringify([sess]);
      expect(readSessions()).toHaveLength(1);
    });

    it('accepts negative wordsAdded (no validation beyond type)', () => {
      const sess = makeSession({ wordsAdded: -50 });
      storage[SESSIONS_KEY] = JSON.stringify([sess]);
      expect(readSessions()).toHaveLength(1);
    });

    it('accepts very large wordsAdded', () => {
      const sess = makeSession({ wordsAdded: 999_999 });
      storage[SESSIONS_KEY] = JSON.stringify([sess]);
      expect(readSessions()).toHaveLength(1);
    });

    it('accepts empty string projectName', () => {
      const sess = makeSession({ projectName: '' });
      storage[SESSIONS_KEY] = JSON.stringify([sess]);
      expect(readSessions()).toHaveLength(1);
    });

    it('accepts unicode emoji in projectName', () => {
      const sess = makeSession({ projectName: '🔥📖 My Épic Növel 日本語' });
      storage[SESSIONS_KEY] = JSON.stringify([sess]);
      const result = readSessions();
      expect(result).toHaveLength(1);
      expect(result[0].projectName).toBe('🔥📖 My Épic Növel 日本語');
    });

    it('accepts 10000-char projectName', () => {
      const longName = 'x'.repeat(10_000);
      const sess = makeSession({ projectName: longName });
      storage[SESSIONS_KEY] = JSON.stringify([sess]);
      const result = readSessions();
      expect(result).toHaveLength(1);
      expect(result[0].projectName).toHaveLength(10_000);
    });
  });

  // ──────────────────────────────────────────────────────
  // MASS DATA (1000+ sessions)
  // ──────────────────────────────────────────────────────
  describe('mass data', () => {
    it('reads 1000 sessions without error', () => {
      const sessions = Array.from({ length: 1000 }, (_, i) =>
        makeSession({ id: `s-${i}`, wordsAdded: i })
      );
      storage[SESSIONS_KEY] = JSON.stringify(sessions);
      const result = readSessions();
      expect(result).toHaveLength(1000);
    });

    it('writes and re-reads 500 sessions', () => {
      const sessions = Array.from({ length: 500 }, (_, i) =>
        makeSession({ id: `s-${i}` })
      );
      writeSessions(sessions);
      expect(readSessions()).toHaveLength(500);
    });

    it('addSession to 999 existing sessions', () => {
      const sessions = Array.from({ length: 999 }, (_, i) =>
        makeSession({ id: `s-${i}` })
      );
      storage[SESSIONS_KEY] = JSON.stringify(sessions);
      addSession(makeSession({ id: 's-999' }));
      expect(readSessions()).toHaveLength(1000);
    });

    it('updateSessionFlowScore among 500 sessions', () => {
      const sessions = Array.from({ length: 500 }, (_, i) =>
        makeSession({ id: `s-${i}`, flowScore: null })
      );
      storage[SESSIONS_KEY] = JSON.stringify(sessions);
      updateSessionFlowScore('s-250', 5);
      const result = readSessions();
      expect(result.find(s => s.id === 's-250')?.flowScore).toBe(5);
      expect(result.find(s => s.id === 's-0')?.flowScore).toBeNull();
    });

    it('filters 50 invalid out of 200 mixed entries', () => {
      const valid = Array.from({ length: 150 }, (_, i) => makeSession({ id: `v-${i}` }));
      const invalid = Array.from({ length: 50 }, (_, i) => ({
        id: `bad-${i}`, wordsStart: 'not-a-number',
      }));
      const mixed = [...valid, ...invalid];
      storage[SESSIONS_KEY] = JSON.stringify(mixed);
      expect(readSessions()).toHaveLength(150);
    });
  });

  // ──────────────────────────────────────────────────────
  // STORAGE EDGE CASES
  // ──────────────────────────────────────────────────────
  describe('storage edge cases', () => {
    it('handles localStorage.getItem returning empty string', () => {
      storage[SESSIONS_KEY] = '';
      expect(readSessions()).toEqual([]);
    });

    it('handles localStorage with "null" string', () => {
      storage[SESSIONS_KEY] = 'null';
      expect(readSessions()).toEqual([]);
    });

    it('handles localStorage with "undefined" string', () => {
      storage[SESSIONS_KEY] = 'undefined';
      expect(readSessions()).toEqual([]);
    });

    it('handles localStorage with "[]" (empty array)', () => {
      storage[SESSIONS_KEY] = '[]';
      expect(readSessions()).toEqual([]);
    });

    it('handles localStorage with number string', () => {
      storage[SESSIONS_KEY] = '42';
      expect(readSessions()).toEqual([]);
    });
  });

  // ──────────────────────────────────────────────────────
  // WIP SESSION EDGE CASES
  // ──────────────────────────────────────────────────────
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
      // Simulate legacy WIP data
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
      // Negative delta — no validation in WIP
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
