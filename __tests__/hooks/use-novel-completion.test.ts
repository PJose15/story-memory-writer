import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';

// ── Mock localStorage ──
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { Object.keys(store).forEach((k) => delete store[k]); }),
};

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  localStorageMock.getItem.mockImplementation((key: string) => store[key] ?? null);
  localStorageMock.setItem.mockImplementation((key: string, value: string) => { store[key] = value; });
  vi.stubGlobal('localStorage', localStorageMock);
});

// ── Mock store ──
const mockStoryState = {
  title: 'Test Novel',
  chapters: [
    { id: 'ch1', title: 'Chapter 1', content: 'Some content here for testing', summary: '' },
  ],
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
  synopsis: '',
  language: 'en',
};

vi.mock('@/lib/store', () => ({
  useStory: () => ({
    state: mockStoryState,
    setState: vi.fn(),
    updateField: vi.fn(),
  }),
}));

// ── Mock finishing-engine ──
const mockCheckNovelCompletion = vi.fn().mockReturnValue(false);
const mockGenerateNovelStats = vi.fn().mockReturnValue({
  title: 'Test Novel',
  totalWords: 50000,
  totalChapters: 20,
  totalSessions: 100,
  totalDays: 45,
  totalHoursWriting: 120.5,
  completedAt: '2026-01-01T00:00:00.000Z',
});

vi.mock('@/lib/gamification/finishing-engine', () => ({
  checkNovelCompletion: (...args: unknown[]) => mockCheckNovelCompletion(...args),
  generateNovelStats: (...args: unknown[]) => mockGenerateNovelStats(...args),
}));

// ── Mock readSessions ──
const mockReadSessions = vi.fn().mockResolvedValue([]);
vi.mock('@/lib/types/writing-session', () => ({
  readSessions: () => mockReadSessions(),
}));

import { useNovelCompletion } from '@/hooks/use-novel-completion';
import type { FinishingEngineState } from '@/lib/types/gamification';

function makeFinishing(overallProgress: number): FinishingEngineState {
  return {
    currentPhase: 'resolution',
    overallProgress,
    milestones: [],
    nextSuggestion: '',
  };
}

describe('useNovelCompletion', () => {
  beforeEach(() => {
    mockCheckNovelCompletion.mockClear().mockReturnValue(false);
    mockGenerateNovelStats.mockClear().mockReturnValue({
      title: 'Test Novel',
      totalWords: 50000,
      totalChapters: 20,
      totalSessions: 100,
      totalDays: 45,
      totalHoursWriting: 120.5,
      completedAt: '2026-01-01T00:00:00.000Z',
    });
    mockReadSessions.mockClear().mockResolvedValue([]);
  });

  it('returns initial state: not completed, no stats', () => {
    const { result } = renderHook(() =>
      useNovelCompletion(makeFinishing(50), true),
    );
    expect(result.current.novelJustCompleted).toBe(false);
    expect(result.current.completionStats).toBeNull();
  });

  it('does not trigger when isLoaded is false', () => {
    mockCheckNovelCompletion.mockReturnValue(true);
    renderHook(() => useNovelCompletion(makeFinishing(100), false));
    expect(mockCheckNovelCompletion).not.toHaveBeenCalled();
  });

  it('detects novel completion and generates stats', async () => {
    mockCheckNovelCompletion.mockReturnValue(true);
    mockReadSessions.mockResolvedValue([
      { id: 's1', startedAt: '2026-01-01T10:00:00Z', endedAt: '2026-01-01T12:00:00Z', wordsAdded: 1000 },
    ]);

    const { result } = renderHook(() =>
      useNovelCompletion(makeFinishing(100), true),
    );

    await waitFor(() => {
      expect(result.current.novelJustCompleted).toBe(true);
    });
    expect(result.current.completionStats).not.toBeNull();
    expect(result.current.completionStats?.title).toBe('Test Novel');
    expect(mockGenerateNovelStats).toHaveBeenCalled();
  });

  it('persists stats to localStorage on completion', async () => {
    mockCheckNovelCompletion.mockReturnValue(true);

    const { result } = renderHook(() =>
      useNovelCompletion(makeFinishing(100), true),
    );

    await waitFor(() => {
      expect(result.current.novelJustCompleted).toBe(true);
    });
    expect(store['zagafy_completion_stats']).toBeDefined();
    const persisted = JSON.parse(store['zagafy_completion_stats']);
    expect(persisted.title).toBe('Test Novel');
  });

  it('does not trigger when already dismissed (localStorage flag)', () => {
    store['zagafy_novel_completed'] = 'true';
    mockCheckNovelCompletion.mockReturnValue(true);

    const { result } = renderHook(() =>
      useNovelCompletion(makeFinishing(100), true),
    );

    // checkNovelCompletion should not even be called because localStorage short-circuits
    expect(result.current.novelJustCompleted).toBe(false);
  });

  it('dismissCompletion sets flag and clears state', async () => {
    mockCheckNovelCompletion.mockReturnValue(true);

    const { result } = renderHook(() =>
      useNovelCompletion(makeFinishing(100), true),
    );

    await waitFor(() => {
      expect(result.current.novelJustCompleted).toBe(true);
    });

    act(() => {
      result.current.dismissCompletion();
    });

    expect(result.current.novelJustCompleted).toBe(false);
    expect(store['zagafy_novel_completed']).toBe('true');
  });

  it('handles localStorage.getItem error gracefully', () => {
    localStorageMock.getItem.mockImplementation(() => { throw new Error('Storage error'); });

    mockCheckNovelCompletion.mockReturnValue(false);
    const { result } = renderHook(() =>
      useNovelCompletion(makeFinishing(50), true),
    );

    // Should not throw — catch block swallows the error
    expect(result.current.novelJustCompleted).toBe(false);
  });

  it('handles localStorage.setItem error during stats persist', async () => {
    mockCheckNovelCompletion.mockReturnValue(true);
    localStorageMock.setItem.mockImplementation(() => { throw new Error('Quota exceeded'); });

    const { result } = renderHook(() =>
      useNovelCompletion(makeFinishing(100), true),
    );

    // Should still set state despite localStorage error
    await waitFor(() => {
      expect(result.current.novelJustCompleted).toBe(true);
    });
    expect(result.current.completionStats).not.toBeNull();
  });

  it('handles localStorage.setItem error in dismissCompletion', async () => {
    mockCheckNovelCompletion.mockReturnValue(true);

    const { result } = renderHook(() =>
      useNovelCompletion(makeFinishing(100), true),
    );

    await waitFor(() => {
      expect(result.current.novelJustCompleted).toBe(true);
    });

    // Make setItem throw only now
    localStorageMock.setItem.mockImplementation(() => { throw new Error('Quota exceeded'); });

    act(() => {
      result.current.dismissCompletion();
    });

    // Should still update state despite localStorage error
    expect(result.current.novelJustCompleted).toBe(false);
  });

  it('does not re-trigger completion on subsequent renders', async () => {
    mockCheckNovelCompletion.mockReturnValue(true);

    const { result, rerender } = renderHook(
      ({ finishing, loaded }: { finishing: FinishingEngineState; loaded: boolean }) =>
        useNovelCompletion(finishing, loaded),
      { initialProps: { finishing: makeFinishing(100), loaded: true } },
    );

    await waitFor(() => {
      expect(result.current.novelJustCompleted).toBe(true);
    });

    // On next render with same props, checkNovelCompletion gets both current and previous
    mockCheckNovelCompletion.mockReturnValue(false);
    rerender({ finishing: makeFinishing(100), loaded: true });

    // Still shows completed from the first trigger
    expect(result.current.novelJustCompleted).toBe(true);
  });

  it('does not trigger when checkNovelCompletion returns false', () => {
    mockCheckNovelCompletion.mockReturnValue(false);
    mockGenerateNovelStats.mockClear();

    const { result } = renderHook(() =>
      useNovelCompletion(makeFinishing(80), true),
    );

    expect(result.current.novelJustCompleted).toBe(false);
    expect(mockGenerateNovelStats).not.toHaveBeenCalled();
  });
});
