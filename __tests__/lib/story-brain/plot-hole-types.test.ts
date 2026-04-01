import { describe, it, expect } from 'vitest';
import { isPlotHole, PLOT_HOLE_SEVERITY } from '@/lib/story-brain/plot-hole-types';
import type { Inconsistency } from '@/lib/story-brain/types';
import type { PlotHole } from '@/lib/story-brain/plot-hole-types';

describe('isPlotHole', () => {
  it('returns true for PlotHole objects', () => {
    const plotHole: PlotHole = {
      id: 'ph_1',
      type: 'plot_hole',
      severity: 'medium',
      title: 'Test',
      description: 'Test plot hole',
      relatedEntityIds: ['c1'],
      chapterIds: [],
      plotHoleType: 'character_disappearance',
      suggestedChapterIndex: 3,
      narrativeImpact: 50,
    };
    expect(isPlotHole(plotHole)).toBe(true);
  });

  it('returns false for regular Inconsistency without plotHoleType', () => {
    const inconsistency: Inconsistency = {
      id: 'inc_1',
      type: 'timeline_conflict',
      severity: 'high',
      title: 'Timeline conflict',
      description: 'Two events clash',
      relatedEntityIds: ['e1', 'e2'],
      chapterIds: [],
    };
    expect(isPlotHole(inconsistency)).toBe(false);
  });
});

describe('PLOT_HOLE_SEVERITY', () => {
  it('maps all plot hole types to severity levels', () => {
    expect(PLOT_HOLE_SEVERITY.character_disappearance).toBe('medium');
    expect(PLOT_HOLE_SEVERITY.conflict_unresolved).toBe('high');
    expect(PLOT_HOLE_SEVERITY.late_introduction).toBe('medium');
    expect(PLOT_HOLE_SEVERITY.foreshadowing_unfulfilled).toBe('high');
    expect(PLOT_HOLE_SEVERITY.stale_open_loop).toBe('low');
  });

  it('covers exactly 5 plot hole types', () => {
    expect(Object.keys(PLOT_HOLE_SEVERITY)).toHaveLength(5);
  });
});
