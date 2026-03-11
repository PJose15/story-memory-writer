import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
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
  localStorage.setItem('story_memory_state', JSON.stringify(state));
}

describe('useFlowAutosave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial content for the given chapter', () => {
    setupLocalStorage([testChapter]);

    const { result } = renderHook(() => useFlowAutosave('ch-1'), { wrapper });
    expect(result.current.initialContent).toBe('Once upon a time...');
  });

  it('returns empty string for unknown chapter ID', () => {
    setupLocalStorage([testChapter]);

    const { result } = renderHook(() => useFlowAutosave('unknown-id'), { wrapper });
    expect(result.current.initialContent).toBe('');
  });

  it('scheduleAutosave debounces saves', () => {
    setupLocalStorage([testChapter]);

    const { result } = renderHook(
      () => {
        const autosave = useFlowAutosave('ch-1');
        const story = useStory();
        return { autosave, story };
      },
      { wrapper }
    );

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
