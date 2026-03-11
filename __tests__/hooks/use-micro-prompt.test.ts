import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMicroPrompt } from '@/hooks/use-micro-prompt';

const mockFetch = vi.fn();

describe('useMicroPrompt', () => {
  beforeEach(() => {
    globalThis.fetch = mockFetch;
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initial state: prompt is null and isLoading is false', () => {
    const { result } = renderHook(() => useMicroPrompt());
    expect(result.current.prompt).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('fetchPrompt triggers fetch and sets prompt', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ prompt: 'What does she want?' }),
    });

    const { result } = renderHook(() => useMicroPrompt());

    await act(async () => {
      result.current.fetchPrompt({
        recentText: 'She opened the ancient door, feeling the cold rush of air.',
      });
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/micro-prompt',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
    expect(result.current.prompt).toBe('What does she want?');
    expect(result.current.isLoading).toBe(false);
  });

  it('clearPrompt sets prompt to null', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ prompt: 'A question?' }),
    });

    const { result } = renderHook(() => useMicroPrompt());

    await act(async () => {
      result.current.fetchPrompt({
        recentText: 'She opened the ancient door, feeling the cold rush of air.',
      });
    });

    expect(result.current.prompt).toBe('A question?');

    act(() => {
      result.current.clearPrompt();
    });

    expect(result.current.prompt).toBeNull();
  });

  it('handles fetch errors gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useMicroPrompt());

    await act(async () => {
      result.current.fetchPrompt({
        recentText: 'She opened the ancient door, feeling the cold rush of air.',
      });
    });

    expect(result.current.prompt).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});
