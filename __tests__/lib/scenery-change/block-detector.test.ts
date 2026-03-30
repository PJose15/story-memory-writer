import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectWritersBlock } from '@/lib/scenery-change/block-detector';
import type { KeystrokeMetrics } from '@/lib/flow-metrics';

function makeMetrics(overrides: Partial<KeystrokeMetrics> = {}): KeystrokeMetrics {
  return {
    avgWPM: 40,
    peakWPM: 60,
    totalPauses: 1,
    avgPauseDuration: 2000,
    deletionAttempts: 2,
    deletionRatio: 0.05,
    totalKeystrokes: 100,
    ...overrides,
  };
}

describe('detectWritersBlock', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(1000000);
  });

  it('returns null when all metrics are healthy', () => {
    const metrics = makeMetrics();
    const result = detectWritersBlock(metrics, 120_000, 5_000);
    expect(result).toBeNull();
  });

  it('detects low_wpm when avgWPM < 10 and session > 60s', () => {
    const metrics = makeMetrics({ avgWPM: 5 });
    const result = detectWritersBlock(metrics, 90_000, 5_000);
    expect(result).not.toBeNull();
    expect(result!.indicators).toContain('low_wpm');
    expect(result!.metrics.wpm).toBe(5);
  });

  it('ignores low_wpm when session is too short (< 60s)', () => {
    const metrics = makeMetrics({ avgWPM: 5 });
    const result = detectWritersBlock(metrics, 30_000, 5_000);
    expect(result).toBeNull();
  });

  it('ignores low_wpm when avgWPM is exactly 0 (no typing)', () => {
    const metrics = makeMetrics({ avgWPM: 0 });
    const result = detectWritersBlock(metrics, 120_000, 5_000);
    // avgWPM === 0 fails the > 0 check, so low_wpm not triggered
    expect(result).toBeNull();
  });

  it('detects high_deletion when ratio > 0.3 and keystrokes > 20', () => {
    const metrics = makeMetrics({ deletionRatio: 0.5, totalKeystrokes: 50 });
    const result = detectWritersBlock(metrics, 120_000, 5_000);
    expect(result).not.toBeNull();
    expect(result!.indicators).toContain('high_deletion');
    expect(result!.metrics.deletionRatio).toBe(0.5);
  });

  it('ignores high_deletion when keystrokes <= 20', () => {
    const metrics = makeMetrics({ deletionRatio: 0.5, totalKeystrokes: 15 });
    const result = detectWritersBlock(metrics, 120_000, 5_000);
    expect(result).toBeNull();
  });

  it('detects frequent_pauses when >= 5 pauses within window', () => {
    const metrics = makeMetrics({ totalPauses: 6 });
    // sessionDuration must be < FREQUENT_PAUSES_WINDOW_MS * 2 = 240_000
    const result = detectWritersBlock(metrics, 200_000, 5_000);
    expect(result).not.toBeNull();
    expect(result!.indicators).toContain('frequent_pauses');
    expect(result!.metrics.pauseCount).toBe(6);
  });

  it('ignores frequent_pauses when session is too long', () => {
    const metrics = makeMetrics({ totalPauses: 6 });
    // sessionDuration >= 240_000 => not triggered
    const result = detectWritersBlock(metrics, 300_000, 5_000);
    expect(result).toBeNull();
  });

  it('detects idle when lastKeystrokeAge > 45s', () => {
    const metrics = makeMetrics();
    const result = detectWritersBlock(metrics, 120_000, 50_000);
    expect(result).not.toBeNull();
    expect(result!.indicators).toContain('idle');
    expect(result!.metrics.idleSeconds).toBe(50);
  });

  it('does not detect idle at exactly 45s', () => {
    const metrics = makeMetrics();
    const result = detectWritersBlock(metrics, 120_000, 45_000);
    expect(result).toBeNull();
  });

  it('returns severity "mild" for a single indicator', () => {
    const metrics = makeMetrics();
    const result = detectWritersBlock(metrics, 120_000, 50_000);
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('mild');
    expect(result!.indicators).toHaveLength(1);
  });

  it('returns severity "moderate" for two indicators', () => {
    const metrics = makeMetrics({ avgWPM: 5, deletionRatio: 0.5, totalKeystrokes: 50 });
    const result = detectWritersBlock(metrics, 90_000, 5_000);
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('moderate');
    expect(result!.indicators).toHaveLength(2);
  });

  it('returns severity "severe" for three or more indicators', () => {
    const metrics = makeMetrics({
      avgWPM: 5,
      deletionRatio: 0.5,
      totalKeystrokes: 50,
      totalPauses: 7,
    });
    const result = detectWritersBlock(metrics, 90_000, 50_000);
    expect(result).not.toBeNull();
    expect(result!.severity).toBe('severe');
    expect(result!.indicators.length).toBeGreaterThanOrEqual(3);
  });

  it('includes detectedAt timestamp in the signal', () => {
    const metrics = makeMetrics();
    const result = detectWritersBlock(metrics, 120_000, 50_000);
    expect(result).not.toBeNull();
    expect(result!.detectedAt).toBe(1000000);
  });

  it('computes idleSeconds as rounded lastKeystrokeAgeMs / 1000', () => {
    const metrics = makeMetrics();
    const result = detectWritersBlock(metrics, 120_000, 47_500);
    expect(result).not.toBeNull();
    expect(result!.metrics.idleSeconds).toBe(48);
  });
});
