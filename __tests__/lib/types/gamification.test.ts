import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  defaultGamificationState,
  defaultXPState,
  defaultStreakState,
  defaultQuestsState,
  defaultSprintsState,
  defaultFinishingState,
  isGamificationState,
  readGamification,
  writeGamification,
} from '@/lib/types/gamification';

// Mock localStorage
const store: Record<string, string> = {};
beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
  });
});

describe('defaultGamificationState', () => {
  it('returns a valid state with version', () => {
    const state = defaultGamificationState();
    expect(state.version).toBe(1);
    expect(state.xp.totalXP).toBe(0);
    expect(state.xp.level).toBe(1);
    expect(state.streak.currentStreak).toBe(0);
    expect(state.quests.quests).toEqual([]);
    expect(state.sprints.activeSprint).toBeNull();
    expect(state.finishing.overallProgress).toBe(0);
  });
});

describe('defaultXPState', () => {
  it('returns fresh XP state', () => {
    const xp = defaultXPState();
    expect(xp.totalXP).toBe(0);
    expect(xp.level).toBe(1);
    expect(xp.events).toEqual([]);
  });
});

describe('defaultStreakState', () => {
  it('returns fresh streak state', () => {
    const s = defaultStreakState();
    expect(s.currentStreak).toBe(0);
    expect(s.longestStreak).toBe(0);
    expect(s.lastQualifyingDate).toBe('');
    expect(s.todayQualified).toBe(false);
    expect(s.streakHistory).toEqual([]);
  });
});

describe('defaultQuestsState', () => {
  it('returns fresh quests state', () => {
    const q = defaultQuestsState();
    expect(q.currentDate).toBe('');
    expect(q.quests).toEqual([]);
    expect(q.questHistory).toEqual([]);
  });
});

describe('defaultSprintsState', () => {
  it('returns fresh sprints state', () => {
    const sp = defaultSprintsState();
    expect(sp.activeSprint).toBeNull();
    expect(sp.sprintHistory).toEqual([]);
  });
});

describe('defaultFinishingState', () => {
  it('returns fresh finishing state', () => {
    const f = defaultFinishingState();
    expect(f.currentPhase).toBe('setup');
    expect(f.overallProgress).toBe(0);
    expect(f.milestones).toEqual([]);
    expect(f.nextSuggestion).toBe('');
  });
});

describe('isGamificationState', () => {
  it('validates a correct state', () => {
    expect(isGamificationState(defaultGamificationState())).toBe(true);
  });

  it('rejects null', () => {
    expect(isGamificationState(null)).toBe(false);
  });

  it('rejects primitive', () => {
    expect(isGamificationState(42)).toBe(false);
  });

  it('rejects object missing xp', () => {
    const state = defaultGamificationState();
    const { xp, ...rest } = state;
    expect(isGamificationState(rest)).toBe(false);
  });

  it('rejects object with invalid version', () => {
    const state = { ...defaultGamificationState(), version: 'abc' };
    expect(isGamificationState(state)).toBe(false);
  });

  it('rejects object with non-array events', () => {
    const state = defaultGamificationState();
    (state.xp as Record<string, unknown>).events = 'not-array';
    expect(isGamificationState(state)).toBe(false);
  });
});

describe('readGamification', () => {
  it('returns default when localStorage is empty', () => {
    const state = readGamification();
    expect(state.version).toBe(1);
    expect(state.xp.totalXP).toBe(0);
  });

  it('reads stored state', () => {
    const saved = defaultGamificationState();
    saved.xp.totalXP = 500;
    saved.xp.level = 3;
    store['zagafy_gamification'] = JSON.stringify(saved);
    const state = readGamification();
    expect(state.xp.totalXP).toBe(500);
    expect(state.xp.level).toBe(3);
  });

  it('returns default on corrupted JSON', () => {
    store['zagafy_gamification'] = '{bad json';
    const state = readGamification();
    expect(state.version).toBe(1);
  });

  it('returns default on invalid state', () => {
    store['zagafy_gamification'] = JSON.stringify({ foo: 'bar' });
    const state = readGamification();
    expect(state.version).toBe(1);
  });

  it('deep-merges missing nested keys with defaults', () => {
    // Simulate stored state missing 'finishing' sub-keys and 'streak.streakHistory'
    const partial = defaultGamificationState();
    const saved = JSON.parse(JSON.stringify(partial));
    // Remove a nested key
    delete saved.finishing.nextSuggestion;
    delete saved.streak.streakHistory;
    store['zagafy_gamification'] = JSON.stringify(saved);

    const state = readGamification();
    // Should have defaults filled in
    expect(state.finishing.nextSuggestion).toBe('');
    expect(state.streak.streakHistory).toEqual([]);
  });
});

describe('writeGamification', () => {
  it('writes state to localStorage', () => {
    const state = defaultGamificationState();
    state.xp.totalXP = 100;
    writeGamification(state);
    expect(store['zagafy_gamification']).toBeDefined();
    const parsed = JSON.parse(store['zagafy_gamification']);
    expect(parsed.xp.totalXP).toBe(100);
  });
});
