import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('@/lib/storage/dexie-db', () => ({
  migrateFromLocalStorage: vi.fn().mockResolvedValue(undefined),
  getAllChapterContents: vi.fn().mockResolvedValue(new Map()),
  putChapterContent: vi.fn().mockResolvedValue(undefined),
  getChapterContent: vi.fn().mockResolvedValue(undefined),
  deleteChapterContent: vi.fn().mockResolvedValue(undefined),
}));

import { StoryProvider, useStory } from '@/lib/store';
import type { Chapter, StoryState } from '@/lib/store';
import { useFlowAutosave } from '@/hooks/use-flow-autosave';

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(StoryProvider, null, children);
}

const testChapter: Chapter = {
  id: 'ch-1',
  title: 'Chapter One',
  content: 'Once upon a time...',
  summary: 'The beginning',
};

function setupLocalStorage(chapters: Chapter[]) {
  const state: Partial<StoryState> = { chapters };
  localStorage.setItem('zagafy_state', JSON.stringify(state));
}

describe('useFlowAutosave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial content for the given chapter', async () => {
    setupLocalStorage([testChapter]);

    const { result } = renderHook(() => useFlowAutosave('ch-1'), { wrapper });
    // Wait for async StoryProvider load to complete
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(result.current.initialContent).toBe('Once upon a time...');
  });

  it('returns empty string for unknown chapter ID', async () => {
    setupLocalStorage([testChapter]);

    const { result } = renderHook(() => useFlowAutosave('unknown-id'), { wrapper });
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(result.current.initialContent).toBe('');
  });

  it('scheduleAutosave debounces saves', async () => {
    setupLocalStorage([testChapter]);

    const { result } = renderHook(
      () => {
        const autosave = useFlowAutosave('ch-1');
        const story = useStory();
        return { autosave, story };
      },
      { wrapper }
    );

    // Wait for async StoryProvider load
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // Schedule multiple saves quickly
    act(() => {
      result.current.autosave.scheduleAutosave('Updated once');
    });
    act(() => {
      result.current.autosave.scheduleAutosave('Updated twice');
    });
    act(() => {
      result.current.autosave.scheduleAutosave('Final update');
    });

    // Before timer fires, state should still have old content
    const chapterBefore = result.current.story.state.chapters.find(ch => ch.id === 'ch-1');
    expect(chapterBefore?.content).toBe('Once upon a time...');

    // Advance past the 5-second debounce
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // After timer fires, state should have the final content
    const chapterAfter = result.current.story.state.chapters.find(ch => ch.id === 'ch-1');
    expect(chapterAfter?.content).toBe('Final update');
  });
});
