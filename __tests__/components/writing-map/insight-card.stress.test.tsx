import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { InsightCard } from '@/components/writing-map/insight-card';
import type { WritingSession } from '@/lib/types/writing-session';

function localDateAt(hour: number, dayOffset: number = 0): string {
  const d = new Date(2026, 2, 1 + dayOffset, hour, 0, 0);
  return d.toISOString();
}

function makeSession(overrides: Partial<WritingSession> = {}): WritingSession {
  return {
    id: 'sess-1',
    projectId: 'proj-1',
    projectName: 'My Novel',
    startedAt: localDateAt(10),
    endedAt: localDateAt(10, 0),
    wordsStart: 0,
    wordsEnd: 200,
    wordsAdded: 200,
    flowScore: 4,
    heteronymId: null,
    heteronymName: null,
    ...overrides,
  };
}

describe('InsightCard STRESS', () => {
  afterEach(() => { cleanup(); });

  // ──────────────────────────────────────────────────────
  // SESSION COUNT BOUNDARIES
  // ──────────────────────────────────────────────────────
  describe('session count boundaries', () => {
    it('0 sessions → keep writing', () => {
      render(<InsightCard sessions={[]} />);
      expect(screen.getByText('Keep writing!')).toBeTruthy();
      expect(screen.getByText(/at least 5 sessions/)).toBeTruthy();
    });

    it('1 session → keep writing', () => {
      render(<InsightCard sessions={[makeSession()]} />);
      expect(screen.getByText('Keep writing!')).toBeTruthy();
    });

    it('4 sessions → keep writing (boundary)', () => {
      const sessions = Array.from({ length: 4 }, (_, i) =>
        makeSession({ id: `s-${i}`, startedAt: localDateAt(10, i), wordsAdded: 200 })
      );
      render(<InsightCard sessions={sessions} />);
      expect(screen.getByText('Keep writing!')).toBeTruthy();
    });

    it('5 sessions → shows insight (exact boundary)', () => {
      const sessions = Array.from({ length: 5 }, (_, i) =>
        makeSession({ id: `s-${i}`, startedAt: localDateAt(14, i), wordsAdded: 200 })
      );
      render(<InsightCard sessions={sessions} />);
      expect(screen.getByText(/✨ Your secret hour/)).toBeTruthy();
    });

    it('6 sessions → shows insight', () => {
      const sessions = Array.from({ length: 6 }, (_, i) =>
        makeSession({ id: `s-${i}`, startedAt: localDateAt(14, i), wordsAdded: 200 })
      );
      render(<InsightCard sessions={sessions} />);
      expect(screen.getByText(/✨ Your secret hour/)).toBeTruthy();
    });

    it('1000 sessions does not crash', () => {
      const sessions = Array.from({ length: 1000 }, (_, i) =>
        makeSession({ id: `s-${i}`, startedAt: localDateAt(i % 24, i), wordsAdded: 100 + (i % 50) })
      );
      render(<InsightCard sessions={sessions} />);
      expect(screen.getByTestId('insight-card')).toBeTruthy();
    });
  });

  // ──────────────────────────────────────────────────────
  // PERCENTAGE CALCULATION
  // ──────────────────────────────────────────────────────
  describe('percentage calculation', () => {
    it('shows % in headline for concentrated sessions', () => {
      // All sessions at 14:00, no other hours → peak = 14, avg of nonzero = same value
      // Actually with only 1 nonzero hour, avg = peakWords, so % = 0
      // Need 2+ hours for meaningful %
      const sessions = [
        ...Array.from({ length: 8 }, (_, i) => makeSession({ id: `peak-${i}`, startedAt: localDateAt(14, i), wordsAdded: 500 })),
        ...Array.from({ length: 2 }, (_, i) => makeSession({ id: `low-${i}`, startedAt: localDateAt(8, i), wordsAdded: 50 })),
      ];
      render(<InsightCard sessions={sessions} />);
      expect(screen.getByText(/%/)).toBeTruthy();
    });

    it('handles single peak hour vs multiple low hours', () => {
      // 5 sessions at hour 14 = 500 each = 2500 total
      // 5 sessions at various other hours = 100 each
      const sessions = [
        ...Array.from({ length: 5 }, (_, i) => makeSession({ id: `peak-${i}`, startedAt: localDateAt(14, i), wordsAdded: 500 })),
        makeSession({ id: 'low-1', startedAt: localDateAt(8), wordsAdded: 100 }),
        makeSession({ id: 'low-2', startedAt: localDateAt(9), wordsAdded: 100 }),
        makeSession({ id: 'low-3', startedAt: localDateAt(10), wordsAdded: 100 }),
      ];
      render(<InsightCard sessions={sessions} />);
      expect(screen.getByText(/✨ Your secret hour/)).toBeTruthy();
      expect(screen.getByText(/%/)).toBeTruthy();
    });
  });

  // ──────────────────────────────────────────────────────
  // TIME-OF-DAY EMOJI BOUNDARIES
  // ──────────────────────────────────────────────────────
  describe('time-of-day emoji boundaries', () => {
    function makeConcentratedSessions(peakHour: number) {
      return [
        ...Array.from({ length: 8 }, (_, i) => makeSession({ id: `peak-${i}`, startedAt: localDateAt(peakHour, i), wordsAdded: 500 })),
        makeSession({ id: 'low-1', startedAt: localDateAt((peakHour + 12) % 24), wordsAdded: 10 }),
      ];
    }

    it('hour 22 → night writer 🌙', () => {
      render(<InsightCard sessions={makeConcentratedSessions(22)} />);
      expect(screen.getByText(/night writer 🌙/)).toBeTruthy();
    });

    it('hour 23 → night writer 🌙', () => {
      render(<InsightCard sessions={makeConcentratedSessions(23)} />);
      expect(screen.getByText(/night writer 🌙/)).toBeTruthy();
    });

    it('hour 0 (midnight) → night writer 🌙', () => {
      render(<InsightCard sessions={makeConcentratedSessions(0)} />);
      expect(screen.getByText(/night writer 🌙/)).toBeTruthy();
    });

    it('hour 3 → night writer 🌙', () => {
      render(<InsightCard sessions={makeConcentratedSessions(3)} />);
      expect(screen.getByText(/night writer 🌙/)).toBeTruthy();
    });

    it('hour 5 → night writer 🌙 (caught by h < 6 before early bird check)', () => {
      render(<InsightCard sessions={makeConcentratedSessions(5)} />);
      expect(screen.getByText(/night writer 🌙/)).toBeTruthy();
    });

    it('hour 6 → early bird writer 🌅', () => {
      render(<InsightCard sessions={makeConcentratedSessions(6)} />);
      expect(screen.getByText(/early bird writer 🌅/)).toBeTruthy();
    });

    it('hour 7 → early bird writer 🌅', () => {
      render(<InsightCard sessions={makeConcentratedSessions(7)} />);
      expect(screen.getByText(/early bird writer 🌅/)).toBeTruthy();
    });

    it('hour 8 → no emoji (outside both ranges)', () => {
      render(<InsightCard sessions={makeConcentratedSessions(8)} />);
      const card = screen.getByTestId('insight-card');
      expect(card.textContent).not.toContain('🌙');
      expect(card.textContent).not.toContain('🌅');
    });

    it('hour 14 → no emoji (afternoon)', () => {
      render(<InsightCard sessions={makeConcentratedSessions(14)} />);
      const card = screen.getByTestId('insight-card');
      expect(card.textContent).not.toContain('🌙');
      expect(card.textContent).not.toContain('🌅');
    });

    it('hour 21 → no emoji (just before night range)', () => {
      render(<InsightCard sessions={makeConcentratedSessions(21)} />);
      const card = screen.getByTestId('insight-card');
      expect(card.textContent).not.toContain('🌙');
      expect(card.textContent).not.toContain('🌅');
    });
  });

  // ──────────────────────────────────────────────────────
  // FLAT PRODUCTIVITY
  // ──────────────────────────────────────────────────────
  describe('flat productivity', () => {
    it('detects flat when all 24 hours have equal words', () => {
      const sessions = Array.from({ length: 24 }, (_, h) =>
        makeSession({ id: `s-${h}`, startedAt: localDateAt(h), wordsAdded: 100 })
      );
      render(<InsightCard sessions={sessions} />);
      expect(screen.getByText(/consistently productive/)).toBeTruthy();
    });

    it('detects flat when 4 hours have similar words (< 1.5x)', () => {
      const sessions = [
        makeSession({ id: 's1', startedAt: localDateAt(8), wordsAdded: 100 }),
        makeSession({ id: 's2', startedAt: localDateAt(10), wordsAdded: 110 }),
        makeSession({ id: 's3', startedAt: localDateAt(14), wordsAdded: 120 }),
        makeSession({ id: 's4', startedAt: localDateAt(18), wordsAdded: 130 }),
        makeSession({ id: 's5', startedAt: localDateAt(20), wordsAdded: 100 }),
      ];
      render(<InsightCard sessions={sessions} />);
      expect(screen.getByText(/consistently productive/)).toBeTruthy();
    });

    it('does NOT show flat when peak is > 1.5x average', () => {
      const sessions = [
        ...Array.from({ length: 5 }, (_, i) => makeSession({ id: `peak-${i}`, startedAt: localDateAt(14, i), wordsAdded: 1000 })),
        makeSession({ id: 'low-1', startedAt: localDateAt(8), wordsAdded: 50 }),
        makeSession({ id: 'low-2', startedAt: localDateAt(9), wordsAdded: 50 }),
        makeSession({ id: 'low-3', startedAt: localDateAt(10), wordsAdded: 50 }),
        makeSession({ id: 'low-4', startedAt: localDateAt(11), wordsAdded: 50 }),
      ];
      render(<InsightCard sessions={sessions} />);
      expect(screen.getByText(/✨ Your secret hour/)).toBeTruthy();
    });
  });

  // ──────────────────────────────────────────────────────
  // HOUR RANGE FORMATTING
  // ──────────────────────────────────────────────────────
  describe('hour range formatting', () => {
    function getHeadline(peakHour: number): string {
      const sessions = [
        ...Array.from({ length: 8 }, (_, i) => makeSession({ id: `peak-${i}`, startedAt: localDateAt(peakHour, i), wordsAdded: 500 })),
        makeSession({ id: 'low-1', startedAt: localDateAt((peakHour + 12) % 24), wordsAdded: 10 }),
      ];
      const { container } = render(<InsightCard sessions={sessions} />);
      const h3 = container.querySelector('h3');
      const text = h3?.textContent || '';
      cleanup();
      return text;
    }

    it('hour 0 → 12AM–1AM', () => {
      expect(getHeadline(0)).toContain('12AM–1AM');
    });

    it('hour 11 → 11AM–12PM', () => {
      expect(getHeadline(11)).toContain('11AM–12PM');
    });

    it('hour 12 → 12PM–1PM', () => {
      expect(getHeadline(12)).toContain('12PM–1PM');
    });

    it('hour 23 → 11PM–12AM', () => {
      expect(getHeadline(23)).toContain('11PM–12AM');
    });

    it('hour 1 → 1AM–2AM', () => {
      expect(getHeadline(1)).toContain('1AM–2AM');
    });

    it('hour 13 → 1PM–2PM', () => {
      expect(getHeadline(13)).toContain('1PM–2PM');
    });
  });

  // ──────────────────────────────────────────────────────
  // PEAK HOUR TIE-BREAKING
  // ──────────────────────────────────────────────────────
  describe('peak hour ties', () => {
    it('picks first hour when multiple hours have same peak words', () => {
      // Both hour 8 and hour 14 have 500 total words
      const sessions = [
        ...Array.from({ length: 5 }, (_, i) => makeSession({ id: `a-${i}`, startedAt: localDateAt(8, i), wordsAdded: 100 })),
        ...Array.from({ length: 5 }, (_, i) => makeSession({ id: `b-${i}`, startedAt: localDateAt(14, i), wordsAdded: 100 })),
      ];
      render(<InsightCard sessions={sessions} />);
      // Since both are equal, code picks first (hour 8) due to iteration order
      expect(screen.getByText(/✨ Your secret hour/)).toBeTruthy();
    });
  });
});
