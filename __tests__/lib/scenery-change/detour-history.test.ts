import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  readDetourHistory,
  saveDetourSession,
  getDetourSession,
  getDetourStats,
  clearDetourHistory,
} from '@/lib/scenery-change/detour-history';
import type { DetourSession } from '@/lib/scenery-change/types';

const store: Record<string, string> = {};

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
  });
});

function makeSession(overrides: Partial<DetourSession> = {}): DetourSession {
  return {
    id: 'session-1',
    type: 'dialogue_sprint',
    startedAt: '2026-01-01T00:00:00.000Z',
    endedAt: '2026-01-01T00:05:00.000Z',
    prompt: 'Write a dialogue sprint',
    content: 'Hello said Alice',
    wordCount: 3,
    ...overrides,
  };
}

describe('readDetourHistory', () => {
  it('returns empty array when no history exists', () => {
    expect(readDetourHistory()).toEqual([]);
  });

  it('returns empty array for invalid JSON in storage', () => {
    store['zagafy_detour_history'] = 'not-json{{{';
    expect(readDetourHistory()).toEqual([]);
  });

  it('returns empty array when stored value is not an array', () => {
    store['zagafy_detour_history'] = JSON.stringify({ foo: 'bar' });
    expect(readDetourHistory()).toEqual([]);
  });

  it('filters out entries that do not match DetourSession shape', () => {
    store['zagafy_detour_history'] = JSON.stringify([
      makeSession(),
      { id: 'bad', missing: 'fields' },
      42,
      null,
    ]);
    const result = readDetourHistory();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('session-1');
  });
});

describe('saveDetourSession', () => {
  it('saves a session to empty history', () => {
    saveDetourSession(makeSession());
    const history = readDetourHistory();
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe('session-1');
  });

  it('appends a new session to existing history', () => {
    saveDetourSession(makeSession({ id: 'session-1' }));
    saveDetourSession(makeSession({ id: 'session-2' }));
    const history = readDetourHistory();
    expect(history).toHaveLength(2);
  });

  it('updates an existing session with the same id', () => {
    saveDetourSession(makeSession({ id: 'session-1', wordCount: 3 }));
    saveDetourSession(makeSession({ id: 'session-1', wordCount: 50 }));
    const history = readDetourHistory();
    expect(history).toHaveLength(1);
    expect(history[0].wordCount).toBe(50);
  });

  it('limits history to 50 entries', () => {
    for (let i = 0; i < 55; i++) {
      saveDetourSession(makeSession({ id: `session-${i}`, wordCount: i }));
    }
    const history = readDetourHistory();
    expect(history.length).toBeLessThanOrEqual(50);
    // Should keep the most recent (last 50)
    expect(history[history.length - 1].id).toBe('session-54');
  });

  it('handles localStorage.setItem throwing gracefully', () => {
    const throwingStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: () => { throw new Error('QuotaExceeded'); },
      removeItem: (key: string) => { delete store[key]; },
    };
    vi.stubGlobal('localStorage', throwingStorage);
    // Should not throw
    expect(() => saveDetourSession(makeSession())).not.toThrow();
  });
});

describe('getDetourSession', () => {
  it('returns the session matching the given id', () => {
    saveDetourSession(makeSession({ id: 'target' }));
    saveDetourSession(makeSession({ id: 'other' }));
    const found = getDetourSession('target');
    expect(found).toBeDefined();
    expect(found!.id).toBe('target');
  });

  it('returns undefined when no session matches', () => {
    saveDetourSession(makeSession({ id: 'only-one' }));
    expect(getDetourSession('nonexistent')).toBeUndefined();
  });

  it('returns undefined from empty history', () => {
    expect(getDetourSession('any')).toBeUndefined();
  });
});

describe('getDetourStats', () => {
  it('returns zeroed stats for empty history', () => {
    const stats = getDetourStats();
    expect(stats.totalDetours).toBe(0);
    expect(stats.totalWords).toBe(0);
    expect(stats.favoriteType).toBeNull();
  });

  it('computes totalDetours and totalWords correctly', () => {
    saveDetourSession(makeSession({ id: 's1', wordCount: 100 }));
    saveDetourSession(makeSession({ id: 's2', wordCount: 200 }));
    saveDetourSession(makeSession({ id: 's3', wordCount: 50 }));
    const stats = getDetourStats();
    expect(stats.totalDetours).toBe(3);
    expect(stats.totalWords).toBe(350);
  });

  it('identifies the most frequently used detour type as favorite', () => {
    saveDetourSession(makeSession({ id: 's1', type: 'dialogue_sprint' }));
    saveDetourSession(makeSession({ id: 's2', type: 'dialogue_sprint' }));
    saveDetourSession(makeSession({ id: 's3', type: 'alternate_pov' }));
    saveDetourSession(makeSession({ id: 's4', type: 'flash_forward' }));
    const stats = getDetourStats();
    expect(stats.favoriteType).toBe('dialogue_sprint');
  });

  it('returns a single session type as favorite when only one session', () => {
    saveDetourSession(makeSession({ id: 's1', type: 'sensory_snapshot' }));
    const stats = getDetourStats();
    expect(stats.favoriteType).toBe('sensory_snapshot');
  });
});

describe('clearDetourHistory', () => {
  it('removes all history from localStorage', () => {
    saveDetourSession(makeSession({ id: 's1' }));
    saveDetourSession(makeSession({ id: 's2' }));
    expect(readDetourHistory()).toHaveLength(2);

    clearDetourHistory();
    expect(readDetourHistory()).toEqual([]);
  });

  it('does not throw when localStorage.removeItem fails', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => { throw new Error('fail'); },
    });
    expect(() => clearDetourHistory()).not.toThrow();
  });
});
