import { describe, it, expect } from 'vitest';
import { createMetricsCollector } from '@/lib/flow-metrics';
import type { KeystrokeMetrics, FlowMoment } from '@/lib/flow-metrics';

function simulateTyping(
  collector: ReturnType<typeof createMetricsCollector>,
  count: number,
  intervalMs: number,
  startTime = 1000000
) {
  for (let i = 0; i < count; i++) {
    collector.recordKeystroke(startTime + i * intervalMs);
  }
  return startTime + (count - 1) * intervalMs;
}

describe('flow-metrics', () => {
  describe('createMetricsCollector', () => {
    it('returns a collector with all required methods', () => {
      const collector = createMetricsCollector();
      expect(typeof collector.recordKeystroke).toBe('function');
      expect(typeof collector.recordPause).toBe('function');
      expect(typeof collector.recordDeletionAttempt).toBe('function');
      expect(typeof collector.getSnapshot).toBe('function');
      expect(typeof collector.detectFlowMoments).toBe('function');
      expect(typeof collector.computeAutoFlowScore).toBe('function');
    });
  });

  describe('getSnapshot', () => {
    it('returns zeroed metrics for empty collector', () => {
      const collector = createMetricsCollector();
      const snap = collector.getSnapshot();
      expect(snap.avgWPM).toBe(0);
      expect(snap.peakWPM).toBe(0);
      expect(snap.totalPauses).toBe(0);
      expect(snap.avgPauseDuration).toBe(0);
      expect(snap.deletionAttempts).toBe(0);
      expect(snap.deletionRatio).toBe(0);
      expect(snap.totalKeystrokes).toBe(0);
    });

    it('returns zeroed metrics with only one keystroke', () => {
      const collector = createMetricsCollector();
      collector.recordKeystroke(1000000);
      const snap = collector.getSnapshot();
      expect(snap.avgWPM).toBe(0);
      expect(snap.totalKeystrokes).toBe(1);
    });

    it('computes avgWPM from evenly spaced keystrokes', () => {
      const collector = createMetricsCollector();
      // 300 keystrokes over 60 seconds = 300 chars/min = 60 WPM (at 5 chars/word)
      simulateTyping(collector, 300, 200, 1000000);
      const snap = collector.getSnapshot();
      expect(snap.avgWPM).toBeGreaterThan(55);
      expect(snap.avgWPM).toBeLessThan(65);
    });

    it('tracks deletion attempts', () => {
      const collector = createMetricsCollector();
      simulateTyping(collector, 50, 100);
      collector.recordDeletionAttempt();
      collector.recordDeletionAttempt();
      collector.recordDeletionAttempt();
      const snap = collector.getSnapshot();
      expect(snap.deletionAttempts).toBe(3);
      expect(snap.deletionRatio).toBeGreaterThan(0);
    });

    it('computes deletion ratio correctly', () => {
      const collector = createMetricsCollector();
      simulateTyping(collector, 100, 100);
      for (let i = 0; i < 10; i++) collector.recordDeletionAttempt();
      const snap = collector.getSnapshot();
      // 10 deletions / 100 keystrokes = 0.1
      expect(snap.deletionRatio).toBeCloseTo(0.1, 1);
    });

    it('tracks pauses from keystroke gaps', () => {
      const collector = createMetricsCollector();
      collector.recordKeystroke(1000000);
      collector.recordKeystroke(1000100); // 100ms gap - not a pause
      collector.recordKeystroke(1003100); // 3s gap - pause
      collector.recordKeystroke(1003200);
      const snap = collector.getSnapshot();
      expect(snap.totalPauses).toBe(1);
      expect(snap.avgPauseDuration).toBe(3000);
    });

    it('tracks manually recorded pauses', () => {
      const collector = createMetricsCollector();
      collector.recordPause(5000);
      collector.recordPause(3000);
      const snap = collector.getSnapshot();
      expect(snap.totalPauses).toBe(2);
      expect(snap.avgPauseDuration).toBe(4000);
    });

    it('ignores pauses shorter than threshold', () => {
      const collector = createMetricsCollector();
      collector.recordPause(500); // too short
      collector.recordPause(1000); // too short
      const snap = collector.getSnapshot();
      expect(snap.totalPauses).toBe(0);
    });

    it('computes peakWPM at least as high as avgWPM', () => {
      const collector = createMetricsCollector();
      // Fast typing then slow
      simulateTyping(collector, 200, 100, 1000000); // fast
      simulateTyping(collector, 200, 500, 1020000); // slow
      const snap = collector.getSnapshot();
      expect(snap.peakWPM).toBeGreaterThanOrEqual(snap.avgWPM);
    });

    it('prunes keystrokes older than 300s window', () => {
      const collector = createMetricsCollector();
      const start = 1000000;
      // Type for 400 seconds (beyond 300s window)
      simulateTyping(collector, 400, 1000, start);
      const snap = collector.getSnapshot();
      // Should still work, just pruned old entries
      expect(snap.totalKeystrokes).toBe(400);
    });
  });

  describe('detectFlowMoments', () => {
    it('returns empty array with too few keystrokes', () => {
      const collector = createMetricsCollector();
      simulateTyping(collector, 5, 200);
      expect(collector.detectFlowMoments()).toEqual([]);
    });

    it('returns empty array for session shorter than 60s window', () => {
      const collector = createMetricsCollector();
      // 50 keystrokes over 5 seconds
      simulateTyping(collector, 50, 100);
      expect(collector.detectFlowMoments()).toEqual([]);
    });

    it('detects flow moment in sustained fast typing', () => {
      const collector = createMetricsCollector();
      // 500 keystrokes at 100ms apart = ~50s of fast typing at ~120 WPM
      // Need >60s of data for flow detection, so do more
      simulateTyping(collector, 800, 100, 1000000);
      const moments = collector.detectFlowMoments();
      expect(moments.length).toBeGreaterThan(0);
      expect(moments[0].avgWPM).toBeGreaterThanOrEqual(30);
    });

    it('does not detect flow when typing is too slow', () => {
      const collector = createMetricsCollector();
      // Very slow typing: 1 keystroke per 2 seconds for 2+ minutes
      simulateTyping(collector, 100, 2000, 1000000);
      const moments = collector.detectFlowMoments();
      // At 1 keystroke/2s = 0.5 chars/s = 6 WPM, well below 30 WPM threshold
      expect(moments).toEqual([]);
    });

    it('does not detect flow when there are long gaps', () => {
      const collector = createMetricsCollector();
      const start = 1000000;
      // Type 30 keystrokes fast, then 5s gap, then 30 more fast
      // Each burst < 60s so no single 60s window qualifies without the gap
      for (let i = 0; i < 30; i++) {
        collector.recordKeystroke(start + i * 100);
      }
      for (let i = 0; i < 30; i++) {
        collector.recordKeystroke(start + 3000 + 5000 + i * 100); // 5s gap
      }
      const moments = collector.detectFlowMoments();
      // The total span is only ~8s, way less than 60s window
      expect(moments).toEqual([]);
    });

    it('merges overlapping flow windows into single moment', () => {
      const collector = createMetricsCollector();
      // Sustained fast typing for 90 seconds
      simulateTyping(collector, 900, 100, 1000000);
      const moments = collector.detectFlowMoments();
      // Should merge into one or few moments rather than many
      expect(moments.length).toBeLessThanOrEqual(3);
      if (moments.length > 0) {
        expect(moments[0].endTime - moments[0].startTime).toBeGreaterThan(60000);
      }
    });

    it('flow moments have valid structure', () => {
      const collector = createMetricsCollector();
      simulateTyping(collector, 800, 100, 1000000);
      const moments = collector.detectFlowMoments();
      for (const m of moments) {
        expect(m.startTime).toBeLessThan(m.endTime);
        expect(m.avgWPM).toBeGreaterThan(0);
        expect(m.peakWPM).toBeGreaterThanOrEqual(m.avgWPM);
      }
    });
  });

  describe('computeAutoFlowScore', () => {
    it('returns 0 for empty collector', () => {
      const collector = createMetricsCollector();
      expect(collector.computeAutoFlowScore()).toBe(0);
    });

    it('returns 0 for very few keystrokes', () => {
      const collector = createMetricsCollector();
      simulateTyping(collector, 5, 200);
      expect(collector.computeAutoFlowScore()).toBe(0);
    });

    it('returns high score for sustained fast typing', () => {
      const collector = createMetricsCollector();
      // Fast typing for 2 minutes, no pauses, no deletions
      simulateTyping(collector, 1200, 100, 1000000);
      const score = collector.computeAutoFlowScore();
      expect(score).toBeGreaterThan(50);
    });

    it('returns lower score with many deletion attempts', () => {
      const collector = createMetricsCollector();
      simulateTyping(collector, 500, 100, 1000000);
      // Many deletions
      for (let i = 0; i < 50; i++) collector.recordDeletionAttempt();
      const scoreWithDeletions = collector.computeAutoFlowScore();

      const collector2 = createMetricsCollector();
      simulateTyping(collector2, 500, 100, 1000000);
      const scoreClean = collector2.computeAutoFlowScore();

      expect(scoreWithDeletions).toBeLessThan(scoreClean);
    });

    it('returns lower score with many pauses', () => {
      const collector = createMetricsCollector();
      const start = 1000000;
      // Type with frequent 3-second pauses
      for (let i = 0; i < 100; i++) {
        collector.recordKeystroke(start + i * 3000);
      }
      const score = collector.computeAutoFlowScore();
      // Slow typing with gaps = low flow
      expect(score).toBeLessThan(50);
    });

    it('score is bounded 0-100', () => {
      const collector = createMetricsCollector();
      simulateTyping(collector, 2000, 50, 1000000);
      const score = collector.computeAutoFlowScore();
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('returns a whole number', () => {
      const collector = createMetricsCollector();
      simulateTyping(collector, 300, 150, 1000000);
      const score = collector.computeAutoFlowScore();
      expect(Number.isInteger(score)).toBe(true);
    });
  });
});
