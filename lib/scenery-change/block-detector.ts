import type { KeystrokeMetrics } from '@/lib/flow-metrics';
import type { BlockSignal, BlockSeverity, BlockIndicator } from './types';

// ─── Thresholds ───
const LOW_WPM_THRESHOLD = 10;
const LOW_WPM_DURATION_MS = 60_000;
const HIGH_DELETION_RATIO = 0.3;
const FREQUENT_PAUSES_COUNT = 5;
const FREQUENT_PAUSES_WINDOW_MS = 120_000;
const IDLE_THRESHOLD_MS = 45_000;

/**
 * Detect writer's block from recent flow metrics.
 * Returns a BlockSignal if block is detected, null otherwise.
 */
export function detectWritersBlock(
  metrics: KeystrokeMetrics,
  sessionDurationMs: number,
  lastKeystrokeAgeMs: number
): BlockSignal | null {
  const indicators: BlockIndicator[] = [];

  // Check: WPM < 10 for sustained period
  if (metrics.avgWPM > 0 && metrics.avgWPM < LOW_WPM_THRESHOLD && sessionDurationMs > LOW_WPM_DURATION_MS) {
    indicators.push('low_wpm');
  }

  // Check: High deletion ratio (>30%)
  if (metrics.deletionRatio > HIGH_DELETION_RATIO && metrics.totalKeystrokes > 20) {
    indicators.push('high_deletion');
  }

  // Check: Frequent pauses
  if (metrics.totalPauses >= FREQUENT_PAUSES_COUNT && sessionDurationMs < FREQUENT_PAUSES_WINDOW_MS * 2) {
    indicators.push('frequent_pauses');
  }

  // Check: Idle for >45 seconds
  if (lastKeystrokeAgeMs > IDLE_THRESHOLD_MS) {
    indicators.push('idle');
  }

  if (indicators.length === 0) return null;

  const severity = computeSeverity(indicators);

  return {
    severity,
    indicators,
    metrics: {
      wpm: metrics.avgWPM,
      deletionRatio: metrics.deletionRatio,
      pauseCount: metrics.totalPauses,
      idleSeconds: Math.round(lastKeystrokeAgeMs / 1000),
    },
    detectedAt: Date.now(),
  };
}

function computeSeverity(indicators: BlockIndicator[]): BlockSeverity {
  if (indicators.length >= 3) return 'severe';
  if (indicators.length === 2) return 'moderate';
  return 'mild';
}
