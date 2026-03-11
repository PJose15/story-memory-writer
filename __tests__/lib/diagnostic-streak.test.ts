import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { incrementStreak, getStreak, resetStreak } from '@/lib/diagnostic-streak';

const STORAGE_KEY = 'zagafy_diagnostic_streak';

describe('diagnostic-streak', () => {
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = {};

    const localStorageMock: Storage = {
      getItem: vi.fn((key: string) => storage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete storage[key];
      }),
      clear: vi.fn(() => {
        storage = {};
      }),
      get length() {
        return Object.keys(storage).length;
      },
      key: vi.fn((index: number) => Object.keys(storage)[index] ?? null),
    };

    vi.stubGlobal('localStorage', localStorageMock);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe('incrementStreak', () => {
    it('returns 1 on first call', () => {
      vi.setSystemTime(new Date('2026-03-09T12:00:00Z'));
      const result = incrementStreak();
      expect(result).toBe(1);
    });

    it('returns same count if called twice on same day', () => {
      vi.setSystemTime(new Date('2026-03-09T08:00:00Z'));
      const first = incrementStreak();
      expect(first).toBe(1);

      vi.setSystemTime(new Date('2026-03-09T20:00:00Z'));
      const second = incrementStreak();
      expect(second).toBe(1);
    });

    it('returns count+1 on consecutive day', () => {
      vi.setSystemTime(new Date('2026-03-09T12:00:00Z'));
      const day1 = incrementStreak();
      expect(day1).toBe(1);

      vi.setSystemTime(new Date('2026-03-10T12:00:00Z'));
      const day2 = incrementStreak();
      expect(day2).toBe(2);

      vi.setSystemTime(new Date('2026-03-11T12:00:00Z'));
      const day3 = incrementStreak();
      expect(day3).toBe(3);
    });

    it('resets to 1 after gap in days', () => {
      vi.setSystemTime(new Date('2026-03-09T12:00:00Z'));
      const day1 = incrementStreak();
      expect(day1).toBe(1);

      vi.setSystemTime(new Date('2026-03-10T12:00:00Z'));
      const day2 = incrementStreak();
      expect(day2).toBe(2);

      // Skip a day (March 11) and go to March 12
      vi.setSystemTime(new Date('2026-03-12T12:00:00Z'));
      const day4 = incrementStreak();
      expect(day4).toBe(1);
    });
  });

  describe('getStreak', () => {
    it('returns 0 when no data', () => {
      vi.setSystemTime(new Date('2026-03-09T12:00:00Z'));
      expect(getStreak()).toBe(0);
    });

    it('returns current count on same day', () => {
      vi.setSystemTime(new Date('2026-03-09T12:00:00Z'));
      incrementStreak();
      expect(getStreak()).toBe(1);

      vi.setSystemTime(new Date('2026-03-10T12:00:00Z'));
      incrementStreak();
      expect(getStreak()).toBe(2);
    });

    it('returns count when checked the next day (consecutive)', () => {
      vi.setSystemTime(new Date('2026-03-09T12:00:00Z'));
      incrementStreak(); // count = 1

      // Check the next day without incrementing
      vi.setSystemTime(new Date('2026-03-10T12:00:00Z'));
      expect(getStreak()).toBe(1);
    });

    it('returns 0 after gap', () => {
      vi.setSystemTime(new Date('2026-03-09T12:00:00Z'));
      incrementStreak(); // count = 1

      // Skip to 2 days later
      vi.setSystemTime(new Date('2026-03-11T12:00:00Z'));
      expect(getStreak()).toBe(0);
    });
  });

  describe('resetStreak', () => {
    it('clears data', () => {
      vi.setSystemTime(new Date('2026-03-09T12:00:00Z'));
      incrementStreak();
      expect(getStreak()).toBe(1);

      resetStreak();
      expect(getStreak()).toBe(0);
      expect(localStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
    });
  });

  describe('corrupt localStorage data', () => {
    it('handles corrupt JSON gracefully and returns 0', () => {
      vi.setSystemTime(new Date('2026-03-09T12:00:00Z'));
      storage[STORAGE_KEY] = 'not-json{{{';
      expect(getStreak()).toBe(0);
    });

    it('handles missing count field gracefully', () => {
      vi.setSystemTime(new Date('2026-03-09T12:00:00Z'));
      storage[STORAGE_KEY] = JSON.stringify({ lastDate: '2026-03-09' });
      expect(getStreak()).toBe(0);
    });

    it('handles missing lastDate field gracefully', () => {
      vi.setSystemTime(new Date('2026-03-09T12:00:00Z'));
      storage[STORAGE_KEY] = JSON.stringify({ count: 5 });
      expect(getStreak()).toBe(0);
    });

    it('handles negative count gracefully', () => {
      vi.setSystemTime(new Date('2026-03-09T12:00:00Z'));
      storage[STORAGE_KEY] = JSON.stringify({ count: -1, lastDate: '2026-03-09' });
      expect(getStreak()).toBe(0);
    });

    it('handles null stored value gracefully', () => {
      vi.setSystemTime(new Date('2026-03-09T12:00:00Z'));
      storage[STORAGE_KEY] = 'null';
      expect(getStreak()).toBe(0);
    });
  });
});
