import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  startSprint,
  endSprint,
  abandonSprint,
  getSprintStats,
  getThemeConfig,
  SPRINT_THEMES,
} from '@/lib/gamification/sprints';
import type { SprintsState, WritingSprint } from '@/lib/types/gamification';

vi.stubGlobal('crypto', { randomUUID: () => 'sprint-uuid' });

const emptyState: SprintsState = { activeSprint: null, sprintHistory: [] };

describe('SPRINT_THEMES', () => {
  it('has 5 themes', () => {
    expect(SPRINT_THEMES).toHaveLength(5);
  });

  it('all themes have required fields', () => {
    for (const t of SPRINT_THEMES) {
      expect(t.theme).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.durationMinutes).toBeGreaterThan(0);
      expect(t.targetWords).toBeGreaterThan(0);
      expect(t.prompt).toBeTruthy();
    }
  });
});

describe('getThemeConfig', () => {
  it('returns config for known theme', () => {
    const config = getThemeConfig('quick-focus');
    expect(config.name).toBe('Quick Focus');
    expect(config.durationMinutes).toBe(15);
    expect(config.targetWords).toBe(250);
  });

  it('returns fallback for unknown theme', () => {
    const config = getThemeConfig('unknown' as any);
    expect(config).toBeDefined();
    expect(config.name).toBeTruthy();
  });
});

describe('startSprint', () => {
  it('creates an active sprint', () => {
    const result = startSprint(emptyState, 'quick-focus', 1000);
    expect(result.activeSprint).not.toBeNull();
    expect(result.activeSprint!.status).toBe('active');
    expect(result.activeSprint!.theme).toBe('quick-focus');
    expect(result.activeSprint!.wordsStart).toBe(1000);
    expect(result.activeSprint!.targetWords).toBe(250);
  });

  it('does not start if sprint already active', () => {
    const withActive = startSprint(emptyState, 'quick-focus', 1000);
    const result = startSprint(withActive, 'deep-dive', 1500);
    expect(result.activeSprint!.theme).toBe('quick-focus'); // unchanged
  });
});

describe('endSprint', () => {
  it('completes sprint and returns result', () => {
    const withActive = startSprint(emptyState, 'quick-focus', 1000);
    const { newState, result } = endSprint(withActive, 1300);
    expect(newState.activeSprint).toBeNull();
    expect(newState.sprintHistory).toHaveLength(1);
    expect(result).not.toBeNull();
    expect(result!.wordsWritten).toBe(300);
    expect(result!.targetMet).toBe(true); // 300 >= 250
    expect(result!.percentOfTarget).toBe(120);
  });

  it('returns null result when no active sprint', () => {
    const { newState, result } = endSprint(emptyState, 1000);
    expect(result).toBeNull();
    expect(newState).toBe(emptyState);
  });

  it('handles words less than target', () => {
    const withActive = startSprint(emptyState, 'marathon-push', 1000);
    const { result } = endSprint(withActive, 1100);
    expect(result!.wordsWritten).toBe(100);
    expect(result!.targetMet).toBe(false); // 100 < 600
    expect(result!.percentOfTarget).toBe(17); // Math.round(100/600*100)
  });

  it('clamps wordsWritten to 0 minimum', () => {
    const withActive = startSprint(emptyState, 'quick-focus', 1000);
    const { result } = endSprint(withActive, 900);
    expect(result!.wordsWritten).toBe(0);
  });
});

describe('abandonSprint', () => {
  it('clears active sprint and adds to history', () => {
    const withActive = startSprint(emptyState, 'quick-focus', 1000);
    const result = abandonSprint(withActive);
    expect(result.activeSprint).toBeNull();
    expect(result.sprintHistory).toHaveLength(1);
    expect(result.sprintHistory[0].status).toBe('abandoned');
  });

  it('no-ops when no active sprint', () => {
    const result = abandonSprint(emptyState);
    expect(result).toBe(emptyState);
  });
});

describe('getSprintStats', () => {
  it('returns zeros for empty history', () => {
    const stats = getSprintStats([]);
    expect(stats.totalSprints).toBe(0);
    expect(stats.completedSprints).toBe(0);
    expect(stats.totalWordsWritten).toBe(0);
  });

  it('calculates stats correctly', () => {
    const history: WritingSprint[] = [
      {
        id: '1',
        theme: 'quick-focus',
        prompt: 'Go',
        durationMinutes: 15,
        startTime: '2025-01-01T10:00:00Z',
        endTime: '2025-01-01T10:15:00Z',
        wordsStart: 1000,
        wordsEnd: 1300,
        wordsWritten: 300,
        status: 'completed',
        targetWords: 250,
      },
      {
        id: '2',
        theme: 'deep-dive',
        prompt: 'Go',
        durationMinutes: 20,
        startTime: '2025-01-02T10:00:00Z',
        endTime: '2025-01-02T10:20:00Z',
        wordsStart: 1300,
        wordsEnd: 1500,
        wordsWritten: 200,
        status: 'completed',
        targetWords: 400,
      },
      {
        id: '3',
        theme: 'quick-focus',
        prompt: 'Go',
        durationMinutes: 15,
        startTime: '2025-01-03T10:00:00Z',
        endTime: '2025-01-03T10:05:00Z',
        wordsStart: 1500,
        wordsEnd: null,
        wordsWritten: null,
        status: 'abandoned',
        targetWords: 250,
      },
    ];

    const stats = getSprintStats(history);
    expect(stats.totalSprints).toBe(3);
    expect(stats.completedSprints).toBe(2);
    expect(stats.totalWordsWritten).toBe(500);
    expect(stats.avgWordsPerSprint).toBe(250);
    expect(stats.targetsMetCount).toBe(1); // Only first met target
    expect(stats.targetMetRate).toBe(50);
  });
});

describe('startSprint edge cases', () => {
  it('clamps NaN wordsStart to 0', () => {
    const result = startSprint(emptyState, 'quick-focus', NaN);
    expect(result.activeSprint!.wordsStart).toBe(0);
  });
  it('clamps negative wordsStart to 0', () => {
    const result = startSprint(emptyState, 'quick-focus', -100);
    expect(result.activeSprint!.wordsStart).toBe(0);
  });
  it('clamps Infinity wordsStart to 0', () => {
    const result = startSprint(emptyState, 'quick-focus', Infinity);
    expect(result.activeSprint!.wordsStart).toBe(0);
  });
});

describe('endSprint edge cases', () => {
  it('clamps NaN wordsEnd to 0', () => {
    const withActive = startSprint(emptyState, 'quick-focus', 1000);
    const { result } = endSprint(withActive, NaN);
    expect(result!.wordsWritten).toBe(0);
  });
  it('clamps negative wordsEnd to 0', () => {
    const withActive = startSprint(emptyState, 'quick-focus', 1000);
    const { result } = endSprint(withActive, -500);
    expect(result!.wordsWritten).toBe(0);
  });
  it('trims history to MAX_HISTORY (50)', () => {
    let state: SprintsState = { activeSprint: null, sprintHistory: Array(50).fill(null).map((_, i) => ({
      id: `old-${i}`, theme: 'quick-focus' as const, prompt: '', durationMinutes: 15,
      startTime: '2025-01-01T00:00:00Z', endTime: '2025-01-01T00:15:00Z',
      wordsStart: 0, wordsEnd: 100, wordsWritten: 100, status: 'completed' as const, targetWords: 250,
    })) };
    state = startSprint(state, 'quick-focus', 0);
    const { newState } = endSprint(state, 100);
    expect(newState.sprintHistory).toHaveLength(50);
  });
});

describe('abandonSprint edge cases', () => {
  it('sets wordsEnd and wordsWritten to null', () => {
    const withActive = startSprint(emptyState, 'quick-focus', 1000);
    const result = abandonSprint(withActive);
    expect(result.sprintHistory[0].wordsEnd).toBeNull();
    expect(result.sprintHistory[0].wordsWritten).toBeNull();
  });
});

describe('getSprintStats edge cases', () => {
  it('handles sprint with invalid dates', () => {
    const history: WritingSprint[] = [{
      id: '1', theme: 'quick-focus', prompt: '', durationMinutes: 15,
      startTime: 'invalid', endTime: 'also-invalid',
      wordsStart: 0, wordsEnd: 100, wordsWritten: 100, status: 'completed', targetWords: 250,
    }];
    const stats = getSprintStats(history);
    expect(stats.totalMinutes).toBe(0);
    expect(stats.totalWordsWritten).toBe(100);
  });
  it('handles sprint with null endTime (totalMinutes finite)', () => {
    const history: WritingSprint[] = [{
      id: '1', theme: 'quick-focus', prompt: '', durationMinutes: 15,
      startTime: '2025-01-01T10:00:00Z', endTime: null,
      wordsStart: 0, wordsEnd: 100, wordsWritten: 100, status: 'completed', targetWords: 250,
    }];
    const stats = getSprintStats(history);
    expect(Number.isFinite(stats.totalMinutes)).toBe(true);
    expect(stats.totalMinutes).toBe(0);
  });
  it('handles sprint with null wordsWritten', () => {
    const history: WritingSprint[] = [{
      id: '1', theme: 'quick-focus', prompt: '', durationMinutes: 15,
      startTime: '2025-01-01T10:00:00Z', endTime: '2025-01-01T10:15:00Z',
      wordsStart: 0, wordsEnd: null, wordsWritten: null, status: 'completed', targetWords: 250,
    }];
    const stats = getSprintStats(history);
    expect(stats.totalWordsWritten).toBe(0);
  });
});
