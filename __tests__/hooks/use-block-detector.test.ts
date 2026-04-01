import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBlockDetector } from '@/hooks/use-block-detector';
import type { KeystrokeMetrics, MetricsCollector } from '@/lib/flow-metrics';
import type { DetourSuggestion } from '@/lib/scenery-change/types';

vi.mock('@/lib/scenery-change/detour-history', () => ({
  saveDetourSession: vi.fn(),
}));

const healthyMetrics: KeystrokeMetrics = {
  avgWPM: 40,
  peakWPM: 60,
  totalPauses: 1,
  avgPauseDuration: 2000,
  deletionAttempts: 2,
  deletionRatio: 0.05,
  totalKeystrokes: 100,
};

const blockedMetrics: KeystrokeMetrics = {
  avgWPM: 3,
  peakWPM: 5,
  totalPauses: 6,
  avgPauseDuration: 5000,
  deletionAttempts: 30,
  deletionRatio: 0.5,
  totalKeystrokes: 60,
};

function makeCollector(metrics: KeystrokeMetrics): MetricsCollector {
  return {
    recordKeystroke: vi.fn(),
    recordPause: vi.fn(),
    recordDeletionAttempt: vi.fn(),
    getSnapshot: () => metrics,
    getRecentMetrics: () => metrics,
    detectFlowMoments: () => [],
    computeAutoFlowScore: () => 0,
  };
}

function createRefs(metrics: KeystrokeMetrics) {
  const collectorRef = { current: makeCollector(metrics) };
  const lastKeystrokeRef = { current: Date.now() };
  return { collectorRef, lastKeystrokeRef };
}

const storyContext = {
  characterNames: ['Alice'],
  currentChapterTitle: 'Chapter 1',
  genre: 'fantasy',
};

describe('useBlockDetector', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('crypto', { randomUUID: () => `uuid-${Math.random()}` });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initially returns no block signal and no suggestions', () => {
    const { collectorRef, lastKeystrokeRef } = createRefs(healthyMetrics);
    const { result } = renderHook(() =>
      useBlockDetector(collectorRef, Date.now(), lastKeystrokeRef, storyContext)
    );
    expect(result.current.blockSignal).toBeNull();
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.activeDetour).toBeNull();
  });

  it('detects block after periodic check interval (15s)', () => {
    const now = Date.now();
    const { collectorRef, lastKeystrokeRef } = createRefs(blockedMetrics);
    // Session started 2 minutes ago, last keystroke 50s ago (triggers idle + low_wpm)
    const sessionStart = now - 120_000;
    lastKeystrokeRef.current = now - 50_000;

    const { result } = renderHook(() =>
      useBlockDetector(collectorRef, sessionStart, lastKeystrokeRef, storyContext)
    );

    expect(result.current.blockSignal).toBeNull();

    act(() => {
      vi.advanceTimersByTime(15_000);
    });

    expect(result.current.blockSignal).not.toBeNull();
    expect(result.current.suggestions.length).toBeGreaterThan(0);
  });

  it('does not re-check while a signal is already showing', () => {
    const now = Date.now();
    const { collectorRef, lastKeystrokeRef } = createRefs(blockedMetrics);
    lastKeystrokeRef.current = now - 50_000;

    const { result } = renderHook(() =>
      useBlockDetector(collectorRef, now - 120_000, lastKeystrokeRef, storyContext)
    );

    act(() => { vi.advanceTimersByTime(15_000); });
    const firstSignal = result.current.blockSignal;
    expect(firstSignal).not.toBeNull();

    // Advance another interval -- signal should stay the same (not re-detected)
    act(() => { vi.advanceTimersByTime(15_000); });
    expect(result.current.blockSignal).toBe(firstSignal);
  });

  it('dismiss clears signal and suggestions', () => {
    const now = Date.now();
    const { collectorRef, lastKeystrokeRef } = createRefs(blockedMetrics);
    lastKeystrokeRef.current = now - 50_000;

    const { result } = renderHook(() =>
      useBlockDetector(collectorRef, now - 120_000, lastKeystrokeRef, storyContext)
    );

    act(() => { vi.advanceTimersByTime(15_000); });
    expect(result.current.blockSignal).not.toBeNull();

    act(() => { result.current.dismiss(); });
    expect(result.current.blockSignal).toBeNull();
    expect(result.current.suggestions).toEqual([]);
  });

  it('applies 10-minute cooldown after dismiss', () => {
    const now = Date.now();
    const { collectorRef, lastKeystrokeRef } = createRefs(blockedMetrics);
    lastKeystrokeRef.current = now - 50_000;

    const { result } = renderHook(() =>
      useBlockDetector(collectorRef, now - 120_000, lastKeystrokeRef, storyContext)
    );

    act(() => { vi.advanceTimersByTime(15_000); });
    act(() => { result.current.dismiss(); });

    // Advance 5 minutes -- still in cooldown
    act(() => { vi.advanceTimersByTime(300_000); });
    expect(result.current.blockSignal).toBeNull();

    // Advance past 10-minute cooldown total
    act(() => { vi.advanceTimersByTime(315_000); });
    expect(result.current.blockSignal).not.toBeNull();
  });

  it('startDetour sets activeDetour and clears signal', () => {
    const now = Date.now();
    const { collectorRef, lastKeystrokeRef } = createRefs(blockedMetrics);
    lastKeystrokeRef.current = now - 50_000;

    const { result } = renderHook(() =>
      useBlockDetector(collectorRef, now - 120_000, lastKeystrokeRef, storyContext)
    );

    act(() => { vi.advanceTimersByTime(15_000); });
    const suggestion = result.current.suggestions[0];
    expect(suggestion).toBeDefined();

    act(() => { result.current.startDetour(suggestion); });

    expect(result.current.activeDetour).not.toBeNull();
    expect(result.current.activeDetour!.type).toBe(suggestion.type);
    expect(result.current.activeDetour!.prompt).toBe(suggestion.prompt);
    expect(result.current.blockSignal).toBeNull();
    expect(result.current.suggestions).toEqual([]);
  });

  it('does not detect block while a detour is active', () => {
    const now = Date.now();
    const { collectorRef, lastKeystrokeRef } = createRefs(blockedMetrics);
    lastKeystrokeRef.current = now - 50_000;

    const { result } = renderHook(() =>
      useBlockDetector(collectorRef, now - 120_000, lastKeystrokeRef, storyContext)
    );

    act(() => { vi.advanceTimersByTime(15_000); });
    const suggestion = result.current.suggestions[0];
    act(() => { result.current.startDetour(suggestion); });

    // Advance multiple intervals while detour is active
    act(() => { vi.advanceTimersByTime(60_000); });
    expect(result.current.blockSignal).toBeNull();
  });

  it('endDetour saves session, clears activeDetour, sets cooldown', async () => {
    const { saveDetourSession } = await import('@/lib/scenery-change/detour-history') as any;
    const now = Date.now();
    const { collectorRef, lastKeystrokeRef } = createRefs(blockedMetrics);
    lastKeystrokeRef.current = now - 50_000;

    const { result } = renderHook(() =>
      useBlockDetector(collectorRef, now - 120_000, lastKeystrokeRef, storyContext)
    );

    act(() => { vi.advanceTimersByTime(15_000); });
    act(() => { result.current.startDetour(result.current.suggestions[0]); });

    act(() => { result.current.endDetour('Some written content here from the detour'); });

    expect(result.current.activeDetour).toBeNull();
    expect(saveDetourSession).toHaveBeenCalled();
    const saved = saveDetourSession.mock.calls[0][0];
    expect(saved.wordCount).toBe(7);
    expect(saved.content).toBe('Some written content here from the detour');
    expect(saved.endedAt).not.toBeNull();
  });

  it('endDetour with empty string produces wordCount 0', async () => {
    const { saveDetourSession } = await import('@/lib/scenery-change/detour-history') as any;
    const now = Date.now();
    const { collectorRef, lastKeystrokeRef } = createRefs(blockedMetrics);
    lastKeystrokeRef.current = now - 50_000;

    const { result } = renderHook(() =>
      useBlockDetector(collectorRef, now - 120_000, lastKeystrokeRef, storyContext)
    );

    act(() => { vi.advanceTimersByTime(15_000); });
    act(() => { result.current.startDetour(result.current.suggestions[0]); });

    act(() => { result.current.endDetour(''); });

    expect(result.current.activeDetour).toBeNull();
    const lastCall = saveDetourSession.mock.calls[saveDetourSession.mock.calls.length - 1][0];
    expect(lastCall.wordCount).toBe(0);
  });

  it('endDetour is a no-op when no active detour', () => {
    const { collectorRef, lastKeystrokeRef } = createRefs(healthyMetrics);

    const { result } = renderHook(() =>
      useBlockDetector(collectorRef, Date.now(), lastKeystrokeRef, storyContext)
    );

    // Should not throw
    act(() => { result.current.endDetour('some text'); });
    expect(result.current.activeDetour).toBeNull();
  });

  it('does not detect block when metricsCollectorRef is null', () => {
    const collectorRef = { current: null };
    const lastKeystrokeRef = { current: Date.now() };

    const { result } = renderHook(() =>
      useBlockDetector(collectorRef, Date.now() - 120_000, lastKeystrokeRef, storyContext)
    );

    act(() => { vi.advanceTimersByTime(15_000); });
    expect(result.current.blockSignal).toBeNull();
  });

  it('does not detect block when metrics are healthy', () => {
    const now = Date.now();
    const { collectorRef, lastKeystrokeRef } = createRefs(healthyMetrics);
    lastKeystrokeRef.current = now;

    const { result } = renderHook(() =>
      useBlockDetector(collectorRef, now - 120_000, lastKeystrokeRef, storyContext)
    );

    act(() => { vi.advanceTimersByTime(15_000); });
    expect(result.current.blockSignal).toBeNull();
    expect(result.current.suggestions).toEqual([]);
  });

  it('startDetour creates session with empty content and wordCount 0', () => {
    const now = Date.now();
    const { collectorRef, lastKeystrokeRef } = createRefs(blockedMetrics);
    lastKeystrokeRef.current = now - 50_000;

    const { result } = renderHook(() =>
      useBlockDetector(collectorRef, now - 120_000, lastKeystrokeRef, storyContext)
    );

    act(() => { vi.advanceTimersByTime(15_000); });
    act(() => { result.current.startDetour(result.current.suggestions[0]); });

    expect(result.current.activeDetour!.content).toBe('');
    expect(result.current.activeDetour!.wordCount).toBe(0);
    expect(result.current.activeDetour!.endedAt).toBeNull();
  });
});
