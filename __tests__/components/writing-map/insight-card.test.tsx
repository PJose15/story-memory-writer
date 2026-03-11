import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { InsightCard } from '@/components/writing-map/insight-card';
import type { WritingSession } from '@/lib/types/writing-session';

// Create ISO timestamp for a specific local hour
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
    wordsStart: 100,
    wordsEnd: 250,
    wordsAdded: 150,
    flowScore: 4,
    heteronymId: null,
    heteronymName: null,
    ...overrides,
  };
}

describe('InsightCard', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows "keep writing" when fewer than 5 sessions', () => {
    const sessions = [makeSession(), makeSession({ id: 's2' })];
    render(<InsightCard sessions={sessions} />);
    expect(screen.getByText('Keep writing!')).toBeTruthy();
    expect(screen.getByText(/at least 5 sessions/)).toBeTruthy();
  });

  it('shows same message for 1 session', () => {
    render(<InsightCard sessions={[makeSession()]} />);
    expect(screen.getByText(/at least 5 sessions/)).toBeTruthy();
  });

  it('shows ✨ secret hour with % when 5+ sessions exist', () => {
    const sessions = Array.from({ length: 6 }, (_, i) =>
      makeSession({
        id: `s-${i}`,
        startedAt: localDateAt(14, i),
        wordsAdded: 200,
      })
    );
    render(<InsightCard sessions={sessions} />);
    expect(screen.getByText(/✨ Your secret hour/)).toBeTruthy();
    expect(screen.getByText(/%/)).toBeTruthy();
  });

  it('shows 🌙 for night writer sessions', () => {
    const sessions = Array.from({ length: 6 }, (_, i) =>
      makeSession({
        id: `s-${i}`,
        startedAt: localDateAt(23, i),
        wordsAdded: 300,
      })
    );
    render(<InsightCard sessions={sessions} />);
    expect(screen.getByText(/night writer 🌙/)).toBeTruthy();
  });

  it('shows 🌅 for early bird sessions', () => {
    const sessions = Array.from({ length: 6 }, (_, i) =>
      makeSession({
        id: `s-${i}`,
        startedAt: localDateAt(6, i),
        wordsAdded: 250,
      })
    );
    render(<InsightCard sessions={sessions} />);
    expect(screen.getByText(/early bird writer 🌅/)).toBeTruthy();
  });

  it('shows flat productivity message when hours are even', () => {
    const sessions = Array.from({ length: 24 }, (_, i) =>
      makeSession({
        id: `s-${i}`,
        startedAt: localDateAt(i),
        wordsAdded: 100,
      })
    );
    render(<InsightCard sessions={sessions} />);
    expect(screen.getByText(/consistently productive/)).toBeTruthy();
  });
});
