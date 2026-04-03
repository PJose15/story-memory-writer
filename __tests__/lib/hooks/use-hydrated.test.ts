import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHydrated } from '@/lib/hooks/use-hydrated';

describe('useHydrated', () => {
  it('should return true after initial render', () => {
    const { result } = renderHook(() => useHydrated());
    expect(result.current).toBe(true);
  });
});
