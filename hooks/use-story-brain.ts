'use client';

import { useMemo, useState, useCallback } from 'react';
import { useStory } from '@/lib/store';
import { analyzeStoryState } from '@/lib/story-brain/analyzer';
import { detectInconsistencies } from '@/lib/story-brain/inconsistency-detector';
import { detectPlotHoles } from '@/lib/story-brain/plot-hole-detector';
import {
  getResolutions,
  resolveInconsistency,
  unresolveInconsistency,
} from '@/lib/story-brain/resolutions';
import type { StoryBrainAnalysis, Inconsistency, InconsistencyResolution, ResolutionAction } from '@/lib/story-brain/types';
import type { PlotHole } from '@/lib/story-brain/plot-hole-types';

interface UseStoryBrainReturn {
  analysis: StoryBrainAnalysis;
  inconsistencies: Inconsistency[];
  plotHoles: PlotHole[];
  resolutions: InconsistencyResolution[];
  unresolvedCount: number;
  unresolvedPlotHoleCount: number;
  resolve: (inconsistencyId: string, action: ResolutionAction) => void;
  unresolve: (inconsistencyId: string) => void;
}

export function useStoryBrain(): UseStoryBrainReturn {
  const { state } = useStory();
  const [resolutions, setResolutions] = useState(() => getResolutions());

  // Memoize analysis — only recompute when story state changes
  const analysis = useMemo(() => analyzeStoryState(state), [state]);

  // Memoize inconsistencies — IDs are now deterministic from data
  const inconsistencies = useMemo(() => detectInconsistencies(state, analysis), [state, analysis]);

  // Memoize plot holes — IDs are now deterministic from data
  const plotHoles = useMemo(() => detectPlotHoles(state, analysis), [state, analysis]);

  // Filter out resolved items
  const resolvedIds = useMemo(
    () => new Set(resolutions.map(r => r.inconsistencyId)),
    [resolutions]
  );

  const unresolvedCount = useMemo(
    () => inconsistencies.filter(i => !resolvedIds.has(i.id)).length,
    [inconsistencies, resolvedIds]
  );

  const unresolvedPlotHoleCount = useMemo(
    () => plotHoles.filter(ph => !resolvedIds.has(ph.id)).length,
    [plotHoles, resolvedIds]
  );

  const resolve = useCallback((inconsistencyId: string, action: ResolutionAction) => {
    resolveInconsistency(inconsistencyId, action);
    setResolutions(getResolutions());
  }, []);

  const unresolve = useCallback((inconsistencyId: string) => {
    unresolveInconsistency(inconsistencyId);
    setResolutions(getResolutions());
  }, []);

  return {
    analysis,
    inconsistencies,
    plotHoles,
    resolutions,
    unresolvedCount,
    unresolvedPlotHoleCount,
    resolve,
    unresolve,
  };
}
