import { describe, it, expect, vi } from 'vitest';
import { xpForLevel, calculateLevel, xpToNextLevel, awardXP, XP_RATES } from '@/lib/gamification/xp';
import type { XPState } from '@/lib/types/gamification';

vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid' });

describe('xpForLevel', () => {
  it('returns 0 for level < 1', () => {
    expect(xpForLevel(0)).toBe(0);
    expect(xpForLevel(-1)).toBe(0);
  });

  it('returns 100 for level 1', () => {
    expect(xpForLevel(1)).toBe(100);
  });

  it('returns 300 for level 2', () => {
    expect(xpForLevel(2)).toBe(300);
  });

  it('returns 1500 for level 5', () => {
    expect(xpForLevel(5)).toBe(1500);
  });

  it('returns 5500 for level 10', () => {
    expect(xpForLevel(10)).toBe(5500);
  });
});

describe('calculateLevel', () => {
  it('returns level 1 for 0 XP', () => {
    expect(calculateLevel(0)).toBe(1);
  });

  it('returns level 1 for 99 XP', () => {
    expect(calculateLevel(99)).toBe(1);
  });

  it('returns level 1 for exactly 100 XP', () => {
    expect(calculateLevel(100)).toBe(1);
  });

  it('returns level 2 for 300 XP', () => {
    expect(calculateLevel(300)).toBe(2);
  });

  it('returns level 1 for negative XP', () => {
    expect(calculateLevel(-10)).toBe(1);
  });

  it('returns level 1 for Infinity', () => {
    expect(calculateLevel(Infinity)).toBe(1);
  });

  it('returns level 1 for NaN', () => {
    expect(calculateLevel(NaN)).toBe(1);
  });

  it('returns correct level for 5500 XP (level 10)', () => {
    expect(calculateLevel(5500)).toBe(10);
  });
});

describe('xpToNextLevel', () => {
  it('returns progress for 0 XP at level 1', () => {
    // Sub-threshold path: floor=0, ceiling=xpForLevel(1)=100
    const result = xpToNextLevel(0);
    expect(result.current).toBe(0);
    expect(result.needed).toBe(100);
    expect(result.progress).toBe(0);
  });

  it('returns correct progress mid-level 1 (sub-threshold)', () => {
    const result = xpToNextLevel(50);
    // Sub-threshold: floor=0, ceiling=100
    expect(result.current).toBe(50);
    expect(result.needed).toBe(100);
    expect(result.progress).toBe(50);
  });

  it('returns correct progress past level 1 threshold', () => {
    // 200 XP: calculateLevel=1, 200>=xpForLevel(1)=100 → normal path
    // current=200-100=100, needed=300-100=200, progress=50%
    const result = xpToNextLevel(200);
    expect(result.current).toBe(100);
    expect(result.needed).toBe(200);
    expect(result.progress).toBe(50);
  });

  it('returns 0% progress at exactly level 2 boundary', () => {
    // 300 XP: calculateLevel=2, xpForLevel(2)=300, xpForLevel(3)=600
    // current=300-300=0, needed=600-300=300, progress=0
    const result = xpToNextLevel(300);
    expect(result.current).toBe(0);
    expect(result.needed).toBe(300);
    expect(result.progress).toBe(0);
  });

  it('never returns negative current', () => {
    expect(xpToNextLevel(0).current).toBeGreaterThanOrEqual(0);
    expect(xpToNextLevel(-5).current).toBeGreaterThanOrEqual(0);
  });

  it('handles Infinity gracefully', () => {
    const result = xpToNextLevel(Infinity);
    expect(result.current).toBeGreaterThanOrEqual(0);
  });

  it('handles NaN gracefully', () => {
    const result = xpToNextLevel(NaN);
    expect(result.current).toBeGreaterThanOrEqual(0);
  });
});

describe('awardXP', () => {
  const baseState: XPState = { totalXP: 0, level: 1, events: [] };

  it('adds XP and creates event', () => {
    const result = awardXP(baseState, 'words', 10);
    expect(result.totalXP).toBe(10);
    expect(result.events).toHaveLength(1);
    expect(result.events[0].type).toBe('words');
    expect(result.events[0].amount).toBe(10);
  });

  it('does not change state for 0 amount', () => {
    const result = awardXP(baseState, 'words', 0);
    expect(result).toBe(baseState);
  });

  it('does not change state for negative amount', () => {
    const result = awardXP(baseState, 'words', -5);
    expect(result).toBe(baseState);
  });

  it('does not change state for NaN amount', () => {
    const result = awardXP(baseState, 'words', NaN);
    expect(result).toBe(baseState);
  });

  it('does not change state for Infinity amount', () => {
    const result = awardXP(baseState, 'words', Infinity);
    expect(result).toBe(baseState);
  });

  it('updates level when crossing threshold', () => {
    const state: XPState = { totalXP: 290, level: 1, events: [] };
    const result = awardXP(state, 'session', 25);
    expect(result.totalXP).toBe(315);
    expect(result.level).toBe(2); // xpForLevel(2) = 300
  });

  it('prunes events to 200', () => {
    const events = Array.from({ length: 200 }, (_, i) => ({
      id: `evt-${i}`,
      type: 'words',
      amount: 10,
      timestamp: new Date().toISOString(),
    }));
    const state: XPState = { totalXP: 2000, level: 5, events };
    const result = awardXP(state, 'session', 25);
    expect(result.events).toHaveLength(200);
    expect(result.events[result.events.length - 1].type).toBe('session');
  });

  it('stores metadata when provided', () => {
    const result = awardXP(baseState, 'chapter', 100, 'Chapter 5 completed');
    expect(result.events[0].metadata).toBe('Chapter 5 completed');
  });
});

describe('XP_RATES', () => {
  it('has expected rate values', () => {
    expect(XP_RATES.WORDS_100).toBe(10);
    expect(XP_RATES.SESSION_COMPLETE).toBe(25);
    expect(XP_RATES.CHAPTER_FINISHED).toBe(100);
    expect(XP_RATES.QUEST_COMPLETE).toBe(50);
    expect(XP_RATES.SPRINT_COMPLETE).toBe(75);
    expect(XP_RATES.STREAK_MILESTONE).toBe(200);
  });
});
