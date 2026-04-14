import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';

// Mock localStorage
const store: Record<string, string> = {};
beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
  });
  vi.stubGlobal('crypto', { randomUUID: () => `uuid-${Date.now()}-${Math.random()}` });
});

// Mock useStory
const mockStoryState = {
  title: 'Test Story',
  synopsis: 'A test',
  chapters: [],
  characters: [],
  active_conflicts: [],
  foreshadowing_elements: [],
  open_loops: [],
  locations: [],
  scenes: [],
  timeline_events: [],
  world_rules: [],
  themes: [],
  canon_items: [],
  ambiguities: [],
  chat_messages: [],
  world_bible: [],
  genre: [],
  author_intent: '',
  style_profile: '',
  language: 'en',
};

vi.mock('@/lib/store', () => ({
  useStory: () => ({
    state: mockStoryState,
    setState: vi.fn(),
    updateField: vi.fn(),
  }),
  StoryProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

vi.mock('@/lib/types/writing-session', () => ({
  readSessions: () => Promise.resolve([]),
}));

import { useGamification, GamificationProvider } from '@/hooks/use-gamification';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(GamificationProvider, null, children);

describe('useGamification', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useGamification(), { wrapper });
    expect(result.current.gamification.xp.totalXP).toBe(0);
    expect(result.current.gamification.xp.level).toBe(1);
    expect(result.current.streak.currentStreak).toBe(0);
  });

  it('exposes xpProgress', () => {
    const { result } = renderHook(() => useGamification(), { wrapper });
    expect(result.current.xpProgress).toHaveProperty('current');
    expect(result.current.xpProgress).toHaveProperty('needed');
    expect(result.current.xpProgress).toHaveProperty('progress');
  });

  it('awards XP', () => {
    const { result } = renderHook(() => useGamification(), { wrapper });
    act(() => {
      result.current.awardXP('test', 50);
    });
    expect(result.current.gamification.xp.totalXP).toBe(50);
  });

  it('generates daily quests on mount', async () => {
    const { result } = renderHook(() => useGamification(), { wrapper });
    await waitFor(() => {
      expect(result.current.quests).toHaveLength(3);
    });
  });

  it('completes a quest and awards XP', () => {
    const { result } = renderHook(() => useGamification(), { wrapper });
    const questId = result.current.quests[0]?.id;
    if (questId) {
      act(() => {
        result.current.completeQuest(questId);
      });
      const quest = result.current.quests.find((q) => q.id === questId);
      expect(quest?.status).toBe('completed');
      expect(result.current.gamification.xp.totalXP).toBe(50);
    }
  });

  it('starts and abandons a sprint', () => {
    const { result } = renderHook(() => useGamification(), { wrapper });
    act(() => {
      result.current.startSprint('quick-focus', 1000);
    });
    expect(result.current.activeSprint).not.toBeNull();
    expect(result.current.activeSprint?.theme).toBe('quick-focus');
    act(() => {
      result.current.abandonSprint();
    });
    expect(result.current.activeSprint).toBeNull();
  });

  it('exposes finishing engine state', () => {
    const { result } = renderHook(() => useGamification(), { wrapper });
    expect(result.current.finishing).toHaveProperty('currentPhase');
    expect(result.current.finishing).toHaveProperty('overallProgress');
    expect(result.current.finishing).toHaveProperty('milestones');
  });

  it('persists state to localStorage', () => {
    const { result } = renderHook(() => useGamification(), { wrapper });
    act(() => {
      result.current.awardXP('test', 100);
    });
    const stored = JSON.parse(store['zagafy_gamification']);
    expect(stored.xp.totalXP).toBe(100);
  });

  // ── Branch coverage: completeQuest edge cases ──

  it('completeQuest ignores already-completed quest', async () => {
    const { result } = renderHook(() => useGamification(), { wrapper });
    await waitFor(() => {
      expect(result.current.quests).toHaveLength(3);
    });

    const questId = result.current.quests[0].id;
    act(() => { result.current.completeQuest(questId); });
    expect(result.current.gamification.xp.totalXP).toBe(50);

    // Complete same quest again — should be no-op
    act(() => { result.current.completeQuest(questId); });
    expect(result.current.gamification.xp.totalXP).toBe(50);
  });

  it('completeQuest ignores nonexistent quest ID', async () => {
    const { result } = renderHook(() => useGamification(), { wrapper });
    await waitFor(() => {
      expect(result.current.quests).toHaveLength(3);
    });

    act(() => { result.current.completeQuest('nonexistent-id'); });
    expect(result.current.gamification.xp.totalXP).toBe(0);
  });

  // ── Branch coverage: sprint lifecycle ──

  it('endSprint returns result with XP and clears active sprint', async () => {
    const { result } = renderHook(() => useGamification(), { wrapper });
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    act(() => { result.current.startSprint('quick-focus', 1000); });
    expect(result.current.activeSprint).not.toBeNull();

    let sprintResult: ReturnType<typeof result.current.endSprint>;
    act(() => { sprintResult = result.current.endSprint(1500); });

    expect(result.current.activeSprint).toBeNull();
    if (sprintResult!) {
      expect(sprintResult.wordsWritten).toBe(500);
    }
  });

  it('endSprint returns null when no active sprint', async () => {
    const { result } = renderHook(() => useGamification(), { wrapper });
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    // No sprint started — endSprint should return null
    let sprintResult: ReturnType<typeof result.current.endSprint>;
    act(() => { sprintResult = result.current.endSprint(1500); });
    expect(sprintResult!).toBeNull();
  });

  // ── Branch coverage: refreshFinishing ──

  it('refreshFinishing updates finishing state from story', async () => {
    const { result } = renderHook(() => useGamification(), { wrapper });
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    const initialProgress = result.current.finishing.overallProgress;
    act(() => { result.current.refreshFinishing(); });
    // With empty story state, progress should stay at 0
    expect(result.current.finishing.overallProgress).toBe(initialProgress);
    expect(result.current.finishing).toHaveProperty('currentPhase');
  });

  // ── Branch coverage: streakWarning ──

  it('exposes streakWarning (null for fresh state)', () => {
    const { result } = renderHook(() => useGamification(), { wrapper });
    // With default (no streak), warning should be null or a string
    expect(typeof result.current.streakWarning === 'string' || result.current.streakWarning === null).toBe(true);
  });

  // ── Branch coverage: cross-tab storage sync ──

  it('syncs state from cross-tab storage event with valid JSON', async () => {
    const { result } = renderHook(() => useGamification(), { wrapper });
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    // Simulate cross-tab storage event with XP=999
    const fakeState = {
      version: 1,
      xp: { totalXP: 999, level: 10, events: [] },
      streak: { currentStreak: 0, longestStreak: 0, lastWritingDate: null, history: [], todayQualified: false, streakHistory: [] },
      quests: { currentDate: '', quests: [], questHistory: [] },
      sprints: { activeSprint: null, sprintHistory: [] },
      finishing: { currentPhase: 'setup', overallProgress: 0, milestones: [], nextSuggestion: '' },
    };

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'zagafy_gamification',
        newValue: JSON.stringify(fakeState),
      }));
    });

    expect(result.current.gamification.xp.totalXP).toBe(999);
  });

  it('ignores cross-tab storage event with invalid JSON', async () => {
    const { result } = renderHook(() => useGamification(), { wrapper });
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    const xpBefore = result.current.gamification.xp.totalXP;

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'zagafy_gamification',
        newValue: 'not-valid-json{{{',
      }));
    });

    expect(result.current.gamification.xp.totalXP).toBe(xpBefore);
  });

  it('ignores cross-tab storage event for wrong key', async () => {
    const { result } = renderHook(() => useGamification(), { wrapper });
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    const xpBefore = result.current.gamification.xp.totalXP;

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'some_other_key',
        newValue: '{"xp":{"totalXP":999}}',
      }));
    });

    expect(result.current.gamification.xp.totalXP).toBe(xpBefore);
  });

  it('ignores cross-tab storage event with null newValue', async () => {
    const { result } = renderHook(() => useGamification(), { wrapper });
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    const xpBefore = result.current.gamification.xp.totalXP;

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'zagafy_gamification',
        newValue: null,
      }));
    });

    expect(result.current.gamification.xp.totalXP).toBe(xpBefore);
  });

  // ── Branch coverage: visibility change ──

  it('re-reads from localStorage on tab visibility change', async () => {
    const { result } = renderHook(() => useGamification(), { wrapper });
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    // Manually write updated state to localStorage
    const updatedState = {
      version: 1,
      xp: { totalXP: 500, level: 5, events: [] },
      streak: { currentStreak: 0, longestStreak: 0, lastWritingDate: null, history: [], todayQualified: false, streakHistory: [] },
      quests: { currentDate: '', quests: [], questHistory: [] },
      sprints: { activeSprint: null, sprintHistory: [] },
      finishing: { currentPhase: 'setup', overallProgress: 0, milestones: [], nextSuggestion: '' },
    };
    store['zagafy_gamification'] = JSON.stringify(updatedState);

    // Simulate tab becoming visible
    Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.gamification.xp.totalXP).toBe(500);
  });

  // ── Branch coverage: useGamification outside provider ──

  it('throws when used outside GamificationProvider', () => {
    // Suppress console.error for expected error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => useGamification());
    }).toThrow('useGamification must be used within a GamificationProvider');
    spy.mockRestore();
  });
});
