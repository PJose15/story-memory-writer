import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';

describe('useUnsavedChanges', () => {
  let addSpy: ReturnType<typeof vi.spyOn>;
  let removeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addSpy = vi.spyOn(window, 'addEventListener');
    removeSpy = vi.spyOn(window, 'removeEventListener');
  });

  it('adds beforeunload listener when true', () => {
    renderHook(() => useUnsavedChanges(true));
    expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });

  it('does not add beforeunload listener when false', () => {
    addSpy.mockClear();
    renderHook(() => useUnsavedChanges(false));
    const beforeunloadCalls = addSpy.mock.calls.filter(
      (call: unknown[]) => call[0] === 'beforeunload'
    );
    expect(beforeunloadCalls).toHaveLength(0);
  });

  it('removes listener on unmount', () => {
    const { unmount } = renderHook(() => useUnsavedChanges(true));
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });

  it('removes listener when switching from true to false', () => {
    const { rerender } = renderHook(
      ({ hasChanges }) => useUnsavedChanges(hasChanges),
      { initialProps: { hasChanges: true } }
    );

    removeSpy.mockClear();
    rerender({ hasChanges: false });

    expect(removeSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });
});
