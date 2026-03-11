import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useCountdown } from '@/hooks/use-countdown';

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('has correct initial state', () => {
    const { result } = renderHook(() => useCountdown(60));
    expect(result.current.remaining).toBe(60);
    expect(result.current.isComplete).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(typeof result.current.start).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  it('decrements remaining after start', () => {
    const { result } = renderHook(() => useCountdown(60));

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.remaining).toBe(59);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.remaining).toBe(58);
  });

  it('updates progress as time passes', () => {
    const { result } = renderHook(() => useCountdown(10));

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.remaining).toBe(5);
    expect(result.current.progress).toBeCloseTo(0.5);
  });

  it('completes when remaining reaches 0', () => {
    const { result } = renderHook(() => useCountdown(3));

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.remaining).toBe(0);
    expect(result.current.isComplete).toBe(true);
    expect(result.current.progress).toBe(1);
  });

  it('does not go below 0', () => {
    const { result } = renderHook(() => useCountdown(2));

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.remaining).toBe(0);
    expect(result.current.isComplete).toBe(true);
  });

  it('resets to initial state', () => {
    const { result } = renderHook(() => useCountdown(10));

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.remaining).toBe(5);

    act(() => {
      result.current.reset();
    });

    expect(result.current.remaining).toBe(10);
    expect(result.current.isComplete).toBe(false);
    expect(result.current.progress).toBe(0);
  });

  it('clears interval on unmount', () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    const { result, unmount } = renderHook(() => useCountdown(60));

    act(() => {
      result.current.start();
    });

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
});
