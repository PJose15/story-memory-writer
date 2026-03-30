import type { Inconsistency, InconsistencySeverity } from './types';

export type PlotHoleType =
  | 'character_disappearance'
  | 'conflict_unresolved'
  | 'late_introduction'
  | 'foreshadowing_unfulfilled'
  | 'stale_open_loop';

export interface PlotHole extends Inconsistency {
  plotHoleType: PlotHoleType;
  /** Chapter index where the issue should be addressed */
  suggestedChapterIndex: number | null;
  /** 0-100 scale of impact on overall narrative */
  narrativeImpact: number;
}

export function isPlotHole(item: Inconsistency): item is PlotHole {
  return 'plotHoleType' in item && 'narrativeImpact' in item;
}

/** Map plot hole types to default severity */
export const PLOT_HOLE_SEVERITY: Record<PlotHoleType, InconsistencySeverity> = {
  character_disappearance: 'medium',
  conflict_unresolved: 'high',
  late_introduction: 'medium',
  foreshadowing_unfulfilled: 'high',
  stale_open_loop: 'low',
};
