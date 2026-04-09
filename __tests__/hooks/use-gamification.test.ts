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
});
