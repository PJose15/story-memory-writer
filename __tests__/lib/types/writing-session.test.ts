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
  getProjectId,
  saveWipSession,
  readWipSession,
  clearWipSession,
} from '@/lib/types/writing-session';
import type { WritingSession } from '@/lib/types/writing-session';

const SESSIONS_KEY = 'zagafy_sessions';
const WIP_KEY = 'zagafy_session_wip';
const PROJECT_ID_KEY = 'zagafy_project_id';

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

describe('writing-session', () => {
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
    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'test-uuid-1234') });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('readSessions', () => {
    it('returns empty array when no data', async () => {
      expect(await readSessions()).toEqual([]);
    });

    it('returns valid sessions from storage', async () => {
      const sessions = [makeSession()];
      storage[SESSIONS_KEY] = JSON.stringify(sessions);
      expect(await readSessions()).toEqual(sessions);
    });

    it('filters out invalid entries', async () => {
      const valid = makeSession();
      const invalid = { id: 'bad', wordsStart: 'not-a-number' };
      storage[SESSIONS_KEY] = JSON.stringify([valid, invalid]);
      expect(await readSessions()).toEqual([valid]);
    });

    it('handles corrupt JSON gracefully', async () => {
      storage[SESSIONS_KEY] = 'not-json{{{';
      expect(await readSessions()).toEqual([]);
    });

    it('handles non-array JSON gracefully', async () => {
      storage[SESSIONS_KEY] = JSON.stringify({ not: 'array' });
      expect(await readSessions()).toEqual([]);
    });

    it('rejects sessions with invalid flowScore', async () => {
      const bad = makeSession({ flowScore: 6 as never });
      storage[SESSIONS_KEY] = JSON.stringify([bad]);
      expect(await readSessions()).toEqual([]);
    });

    it('accepts sessions with null flowScore', async () => {
      const sess = makeSession({ flowScore: null });
      storage[SESSIONS_KEY] = JSON.stringify([sess]);
      expect(await readSessions()).toEqual([sess]);
    });

    it('accepts sessions with heteronym fields', async () => {
      const sess = makeSession({ heteronymId: 'het-1', heteronymName: 'Dark Poet' });
      storage[SESSIONS_KEY] = JSON.stringify([sess]);
      expect(await readSessions()).toEqual([sess]);
    });

    it('accepts legacy sessions without heteronym fields (backward compat)', async () => {
      const legacy = {
        id: 'sess-1',
        projectId: 'proj-1',
        projectName: 'My Novel',
        startedAt: '2026-03-10T10:00:00Z',
        endedAt: '2026-03-10T10:30:00Z',
        wordsStart: 100,
        wordsEnd: 250,
        wordsAdded: 150,
        flowScore: 4,
      };
      storage[SESSIONS_KEY] = JSON.stringify([legacy]);
      const result = await readSessions();
      expect(result).toHaveLength(1);
      expect(result[0].heteronymId).toBeNull();
      expect(result[0].heteronymName).toBeNull();
    });

    it('rejects sessions with invalid heteronymId type', async () => {
      const bad = { ...makeSession(), heteronymId: 123 };
      storage[SESSIONS_KEY] = JSON.stringify([bad]);
      expect(await readSessions()).toEqual([]);
    });

    it('accepts sessions with keystroke metrics', async () => {
      const sess = makeSession({
        keystrokeMetrics: {
          avgWPM: 45.2,
          peakWPM: 62.1,
          totalPauses: 3,
          avgPauseDuration: 4000,
          deletionAttempts: 5,
          deletionRatio: 0.02,
          totalKeystrokes: 250,
        },
        autoFlowScore: 72,
        flowMoments: [{ startTime: 1000, endTime: 61000, avgWPM: 50.0, peakWPM: 55.0 }],
      });
      storage[SESSIONS_KEY] = JSON.stringify([sess]);
      expect(await readSessions()).toEqual([sess]);
    });

    it('accepts legacy sessions without metrics fields (backward compat)', async () => {
      const legacy = {
        id: 'sess-1',
        projectId: 'proj-1',
        projectName: 'My Novel',
        startedAt: '2026-03-10T10:00:00Z',
        endedAt: '2026-03-10T10:30:00Z',
        wordsStart: 100,
        wordsEnd: 250,
        wordsAdded: 150,
        flowScore: 4,
      };
      storage[SESSIONS_KEY] = JSON.stringify([legacy]);
      const result = await readSessions();
      expect(result).toHaveLength(1);
      expect(result[0].keystrokeMetrics).toBeNull();
      expect(result[0].autoFlowScore).toBeNull();
      expect(result[0].flowMoments).toBeNull();
    });

    it('accepts sessions with null metrics fields', async () => {
      const sess = makeSession({
        keystrokeMetrics: null,
        autoFlowScore: null,
        flowMoments: null,
      });
      storage[SESSIONS_KEY] = JSON.stringify([sess]);
      expect(await readSessions()).toEqual([sess]);
    });

    it('rejects sessions with invalid keystrokeMetrics type', async () => {
      const bad = { ...makeSession(), keystrokeMetrics: 'not-an-object' };
      storage[SESSIONS_KEY] = JSON.stringify([bad]);
      expect(await readSessions()).toEqual([]);
    });

    it('rejects sessions with invalid autoFlowScore type', async () => {
      const bad = { ...makeSession(), autoFlowScore: 'not-a-number' };
      storage[SESSIONS_KEY] = JSON.stringify([bad]);
      expect(await readSessions()).toEqual([]);
    });

    it('rejects sessions with invalid flowMoments type', async () => {
      const bad = { ...makeSession(), flowMoments: 'not-an-array' };
      storage[SESSIONS_KEY] = JSON.stringify([bad]);
      expect(await readSessions()).toEqual([]);
    });

    it('normalizes missing metrics fields to null on legacy data', async () => {
      const legacy = {
        id: 'sess-old',
        projectId: 'proj-1',
        projectName: 'Old Novel',
        startedAt: '2025-01-01T10:00:00Z',
        endedAt: '2025-01-01T10:30:00Z',
        wordsStart: 0,
        wordsEnd: 100,
        wordsAdded: 100,
        flowScore: 3,
        heteronymId: null,
        heteronymName: null,
        // no keystrokeMetrics, autoFlowScore, or flowMoments
      };
      storage[SESSIONS_KEY] = JSON.stringify([legacy]);
      const result = await readSessions();
      expect(result).toHaveLength(1);
      expect(result[0].keystrokeMetrics).toBeNull();
      expect(result[0].autoFlowScore).toBeNull();
      expect(result[0].flowMoments).toBeNull();
    });
  });

  describe('writeSessions', () => {
    it('writes sessions to localStorage', async () => {
      const sessions = [makeSession()];
      await writeSessions(sessions);
      expect(storage[SESSIONS_KEY]).toBe(JSON.stringify(sessions));
    });

    it('handles quota exceeded gracefully', async () => {
      vi.stubGlobal('localStorage', {
        ...localStorage,
        getItem: vi.fn(() => null),
        setItem: vi.fn(() => {
          throw new DOMException('QuotaExceededError');
        }),
      });
      await expect(writeSessions([makeSession()])).resolves.not.toThrow();
    });
  });

  describe('addSession', () => {
    it('appends a session', async () => {
      const existing = makeSession({ id: 'sess-1' });
      storage[SESSIONS_KEY] = JSON.stringify([existing]);
      const newSess = makeSession({ id: 'sess-2' });
      await addSession(newSess);
      const result = JSON.parse(storage[SESSIONS_KEY]);
      expect(result).toHaveLength(2);
      expect(result[1].id).toBe('sess-2');
    });

    it('creates list when empty', async () => {
      await addSession(makeSession());
      const result = JSON.parse(storage[SESSIONS_KEY]);
      expect(result).toHaveLength(1);
    });
  });

  describe('updateSessionFlowScore', () => {
    it('updates the flow score of an existing session', async () => {
      const sess = makeSession({ id: 'sess-1', flowScore: null });
      storage[SESSIONS_KEY] = JSON.stringify([sess]);
      await updateSessionFlowScore('sess-1', 5);
      const result = JSON.parse(storage[SESSIONS_KEY]);
      expect(result[0].flowScore).toBe(5);
    });

    it('does nothing if session not found', async () => {
      storage[SESSIONS_KEY] = JSON.stringify([makeSession({ id: 'sess-1' })]);
      await updateSessionFlowScore('nonexistent', 3);
      const result = JSON.parse(storage[SESSIONS_KEY]);
      expect(result[0].flowScore).toBe(4); // unchanged
    });
  });

  describe('getProjectId', () => {
    it('returns existing project ID from localStorage', () => {
      storage[PROJECT_ID_KEY] = 'existing-id';
      expect(getProjectId()).toBe('existing-id');
    });

    it('generates and stores new ID when none exists', () => {
      const id = getProjectId();
      expect(id).toBe('test-uuid-1234');
      expect(storage[PROJECT_ID_KEY]).toBe('test-uuid-1234');
    });
  });

  describe('WIP session', () => {
    const wip = {
      id: 'wip-1',
      projectId: 'proj-1',
      projectName: 'My Novel',
      startedAt: '2026-03-10T10:00:00Z',
      wordsStart: 100,
      currentWords: 150,
      heteronymId: null as string | null,
      heteronymName: null as string | null,
    };

    it('saves and reads WIP session', () => {
      saveWipSession(wip);
      expect(readWipSession()).toEqual(wip);
    });

    it('returns null when no WIP', () => {
      expect(readWipSession()).toBeNull();
    });

    it('returns null for corrupt WIP data', () => {
      storage[WIP_KEY] = 'bad-json';
      expect(readWipSession()).toBeNull();
    });

    it('clears WIP session', () => {
      saveWipSession(wip);
      clearWipSession();
      expect(readWipSession()).toBeNull();
    });
  });
});
