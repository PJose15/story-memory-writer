import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getResolutions,
  resolveInconsistency,
  unresolveInconsistency,
  isResolved,
  getResolution,
  clearAllResolutions,
} from '@/lib/story-brain/resolutions';

const STORAGE_KEY = 'zagafy_brain_resolutions';

describe('resolutions (localStorage CRUD)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns empty array when nothing is stored', () => {
    expect(getResolutions()).toEqual([]);
  });

  it('resolves an inconsistency and persists to localStorage', () => {
    const res = resolveInconsistency('inc_1', 'ignore');
    expect(res.inconsistencyId).toBe('inc_1');
    expect(res.action).toBe('ignore');
    expect(res.resolvedAt).toBeTruthy();

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).toHaveLength(1);
    expect(stored[0].inconsistencyId).toBe('inc_1');
  });

  it('updates an existing resolution instead of duplicating', () => {
    resolveInconsistency('inc_1', 'ignore');
    resolveInconsistency('inc_1', 'correct');

    const all = getResolutions();
    expect(all).toHaveLength(1);
    expect(all[0].action).toBe('correct');
  });

  it('stores multiple resolutions for different IDs', () => {
    resolveInconsistency('inc_1', 'ignore');
    resolveInconsistency('inc_2', 'intentional');
    resolveInconsistency('inc_3', 'correct');

    expect(getResolutions()).toHaveLength(3);
  });

  it('unresolves by removing from storage', () => {
    resolveInconsistency('inc_1', 'ignore');
    resolveInconsistency('inc_2', 'correct');

    unresolveInconsistency('inc_1');

    const all = getResolutions();
    expect(all).toHaveLength(1);
    expect(all[0].inconsistencyId).toBe('inc_2');
  });

  it('unresolve is no-op for non-existent ID', () => {
    resolveInconsistency('inc_1', 'ignore');
    unresolveInconsistency('non-existent');
    expect(getResolutions()).toHaveLength(1);
  });

  it('isResolved returns true for resolved items', () => {
    resolveInconsistency('inc_1', 'ignore');
    expect(isResolved('inc_1')).toBe(true);
    expect(isResolved('inc_2')).toBe(false);
  });

  it('getResolution returns the specific resolution or undefined', () => {
    resolveInconsistency('inc_1', 'intentional');

    const found = getResolution('inc_1');
    expect(found).toBeDefined();
    expect(found!.action).toBe('intentional');

    expect(getResolution('missing')).toBeUndefined();
  });

  it('clearAllResolutions removes all data', () => {
    resolveInconsistency('inc_1', 'ignore');
    resolveInconsistency('inc_2', 'correct');

    clearAllResolutions();

    expect(getResolutions()).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json!!!');
    expect(getResolutions()).toEqual([]);
  });

  it('handles non-array JSON in localStorage gracefully', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ bad: true }));
    expect(getResolutions()).toEqual([]);
  });

  it('filters out invalid entries from localStorage', () => {
    const entries = [
      { inconsistencyId: 'inc_1', action: 'ignore', resolvedAt: new Date().toISOString() },
      { bad: 'entry' },
      { inconsistencyId: 'inc_2', action: 'invalid-action', resolvedAt: new Date().toISOString() },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));

    const result = getResolutions();
    expect(result).toHaveLength(1);
    expect(result[0].inconsistencyId).toBe('inc_1');
  });

  it('resolvedAt is a valid ISO timestamp', () => {
    const res = resolveInconsistency('inc_1', 'correct');
    const date = new Date(res.resolvedAt);
    expect(date.getTime()).not.toBeNaN();
  });

  it('survives localStorage.setItem throwing (quota exceeded)', () => {
    const originalSetItem = localStorage.setItem.bind(localStorage);
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    // Should not throw
    expect(() => resolveInconsistency('inc_1', 'ignore')).not.toThrow();

    vi.restoreAllMocks();
  });
});
