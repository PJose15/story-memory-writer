import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSceneChange } from '@/hooks/use-scene-change';
import type { SceneChangeState } from '@/lib/types/scene-change';
import type { Chapter } from '@/lib/store';

const SCENE_CHANGE_KEY = 'zagafy_scene_change_state';
const SCENE_CHANGE_RETURN_KEY = 'zagafy_scene_change_return';

function makeChapter(id: string, content = 'some words here'): Chapter {
  return { id, title: `Chapter ${id}`, content, summary: '', canonStatus: 'canon' };
}

function makeState(overrides: Partial<SceneChangeState> = {}): SceneChangeState {
  return {
    active: true,
    originalChapterId: 'ch-1',
    originalChapterTitle: 'Chapter One',
    originalCursorPosition: 42,
    wordCountAtDeparture: 500,
    alternateChapterId: 'ch-2',
    wordCountAtArrivalAlternate: 300,
    departureTimestamp: '2026-03-10T10:00:00Z',
    returnAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    extraTimeGranted: 0,
    ...overrides,
  };
}

describe('useSceneChange', () => {
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = {};
    vi.useFakeTimers();

    const localStorageMock: Storage = {
      getItem: vi.fn((key: string) => storage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete storage[key];
      }),
      clear: vi.fn(() => { storage = {}; }),
      get length() { return Object.keys(storage).length; },
      key: vi.fn((index: number) => Object.keys(storage)[index] ?? null),
    };

    vi.stubGlobal('localStorage', localStorageMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('is inactive with no stored state', () => {
    const { result } = renderHook(() => useSceneChange(3));
    expect(result.current.isActive).toBe(false);
    expect(result.current.sceneState).toBeNull();
  });

  it('canActivate when 2+ chapters and not active', () => {
    const { result } = renderHook(() => useSceneChange(2));
    expect(result.current.canActivate).toBe(true);
  });

  it('cannot activate when only 1 chapter', () => {
    const { result } = renderHook(() => useSceneChange(1));
    expect(result.current.canActivate).toBe(false);
  });

  it('cannot activate during active scene change', () => {
    storage[SCENE_CHANGE_KEY] = JSON.stringify(makeState());
    const { result } = renderHook(() => useSceneChange(3));
    expect(result.current.canActivate).toBe(false);
  });

  describe('depart', () => {
    it('returns alternate chapter id and writes state', () => {
      const chapters = [makeChapter('ch-1'), makeChapter('ch-2'), makeChapter('ch-3')];
      const { result } = renderHook(() => useSceneChange(3));

      let alternateId: string | null = null;
      act(() => {
        alternateId = result.current.depart('ch-1', 'Chapter One', 42, 500, chapters);
      });

      expect(alternateId).not.toBeNull();
      expect(alternateId).not.toBe('ch-1');
      expect(result.current.isActive).toBe(true);
      expect(storage[SCENE_CHANGE_KEY]).toBeDefined();
    });

    it('returns null when no eligible chapters', () => {
      const chapters = [makeChapter('ch-1')];
      const { result } = renderHook(() => useSceneChange(1));

      let alternateId: string | null = 'should-be-null';
      act(() => {
        alternateId = result.current.depart('ch-1', 'Chapter One', 0, 0, chapters);
      });

      expect(alternateId).toBeNull();
      expect(result.current.isActive).toBe(false);
    });

    it('excludes discarded chapters', () => {
      const chapters = [
        makeChapter('ch-1'),
        { ...makeChapter('ch-2'), canonStatus: 'discarded' as const },
        makeChapter('ch-3'),
      ];
      const { result } = renderHook(() => useSceneChange(2));

      let alternateId: string | null = null;
      act(() => {
        alternateId = result.current.depart('ch-1', 'Chapter One', 0, 0, chapters);
      });

      expect(alternateId).toBe('ch-3');
    });

    it('selects only available chapter when just one other exists', () => {
      const chapters = [makeChapter('ch-1'), makeChapter('ch-2')];
      const { result } = renderHook(() => useSceneChange(2));

      let alternateId: string | null = null;
      act(() => {
        alternateId = result.current.depart('ch-1', 'Chapter One', 0, 0, chapters);
      });

      expect(alternateId).toBe('ch-2');
    });
  });

  describe('countdown', () => {
    it('ticks down remaining seconds', () => {
      const returnAt = new Date(Date.now() + 5000).toISOString();
      storage[SCENE_CHANGE_KEY] = JSON.stringify(makeState({ returnAt }));

      const { result } = renderHook(() => useSceneChange(3));
      expect(result.current.remainingSeconds).toBeGreaterThan(0);

      act(() => { vi.advanceTimersByTime(2000); });
      expect(result.current.remainingSeconds).toBeLessThanOrEqual(3);
    });

    it('sets isExpired when timer reaches 0', () => {
      const returnAt = new Date(Date.now() + 1000).toISOString();
      storage[SCENE_CHANGE_KEY] = JSON.stringify(makeState({ returnAt }));

      const { result } = renderHook(() => useSceneChange(3));
      act(() => { vi.advanceTimersByTime(2000); });

      expect(result.current.isExpired).toBe(true);
      expect(result.current.remainingSeconds).toBe(0);
    });
  });

  describe('grantExtension', () => {
    it('adds 10 minutes to returnAt', () => {
      const returnAt = new Date(Date.now() + 60000).toISOString();
      storage[SCENE_CHANGE_KEY] = JSON.stringify(makeState({ returnAt, extraTimeGranted: 0 }));

      const { result } = renderHook(() => useSceneChange(3));
      const beforeSeconds = result.current.remainingSeconds;

      act(() => { result.current.grantExtension(); });

      expect(result.current.remainingSeconds).toBeGreaterThan(beforeSeconds);
      expect(result.current.extensionsLeft).toBe(2);
    });

    it('does nothing at max extensions', () => {
      const returnAt = new Date(Date.now() + 60000).toISOString();
      storage[SCENE_CHANGE_KEY] = JSON.stringify(makeState({ returnAt, extraTimeGranted: 3 }));

      const { result } = renderHook(() => useSceneChange(3));
      const before = result.current.remainingSeconds;

      act(() => { result.current.grantExtension(); });

      expect(result.current.remainingSeconds).toBe(before);
      expect(result.current.extensionsLeft).toBe(0);
    });
  });

  describe('returnToOriginal', () => {
    it('computes words written and clears state', () => {
      storage[SCENE_CHANGE_KEY] = JSON.stringify(makeState({ wordCountAtArrivalAlternate: 100 }));

      const { result } = renderHook(() => useSceneChange(3));

      let ret: { cursorPosition: number; wordsWritten: number } | undefined;
      act(() => {
        ret = result.current.returnToOriginal(125);
      });

      expect(ret!.wordsWritten).toBe(25);
      expect(ret!.cursorPosition).toBe(42);
      expect(result.current.isActive).toBe(false);
      expect(storage[SCENE_CHANGE_KEY]).toBeUndefined();
      expect(storage[SCENE_CHANGE_RETURN_KEY]).toBeDefined();
    });

    it('clamps words written to 0 when negative', () => {
      storage[SCENE_CHANGE_KEY] = JSON.stringify(makeState({ wordCountAtArrivalAlternate: 200 }));

      const { result } = renderHook(() => useSceneChange(3));

      let ret: { wordsWritten: number } | undefined;
      act(() => {
        ret = result.current.returnToOriginal(100);
      });

      expect(ret!.wordsWritten).toBe(0);
    });
  });

  describe('cancelSceneChange', () => {
    it('clears state without writing return data', () => {
      storage[SCENE_CHANGE_KEY] = JSON.stringify(makeState());

      const { result } = renderHook(() => useSceneChange(3));
      expect(result.current.isActive).toBe(true);

      act(() => { result.current.cancelSceneChange(); });

      expect(result.current.isActive).toBe(false);
      expect(storage[SCENE_CHANGE_KEY]).toBeUndefined();
      expect(storage[SCENE_CHANGE_RETURN_KEY]).toBeUndefined();
    });
  });

  describe('recovery on mount', () => {
    it('resumes active scene change from localStorage', () => {
      const returnAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      storage[SCENE_CHANGE_KEY] = JSON.stringify(makeState({ returnAt }));

      const { result } = renderHook(() => useSceneChange(3));

      expect(result.current.isActive).toBe(true);
      expect(result.current.remainingSeconds).toBeGreaterThan(0);
    });

    it('detects expired state on mount', () => {
      const returnAt = new Date(Date.now() - 1000).toISOString();
      storage[SCENE_CHANGE_KEY] = JSON.stringify(makeState({ returnAt }));

      const { result } = renderHook(() => useSceneChange(3));

      expect(result.current.isActive).toBe(true);
      expect(result.current.isExpired).toBe(true);
    });
  });
});
