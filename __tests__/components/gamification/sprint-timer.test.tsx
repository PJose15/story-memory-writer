import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import type { WritingSprint } from '@/lib/types/gamification';

vi.mock('@/components/antiquarian', () => ({
  ProgressRing: ({ children, ...props }: any) => <div data-testid="progress-ring" {...props}>{children}</div>,
  InkStampButton: ({ children, onClick, ...props }: any) => <button onClick={onClick} {...props}>{children}</button>,
}));

vi.mock('@/lib/gamification/sprints', () => ({
  getThemeConfig: vi.fn(() => ({
    theme: 'quick-focus',
    name: 'Quick Focus',
    durationMinutes: 15,
    targetWords: 250,
    prompt: 'Write without stopping.',
  })),
}));

import { SprintTimer } from '@/components/gamification/sprint-timer';

const NOW = new Date('2026-03-30T12:00:00Z').getTime();

const makeSprint = (overrides: Partial<WritingSprint> = {}): WritingSprint => {
  // Set start time 5 minutes ago so there is 10 minutes remaining
  const startTime = new Date(NOW - 5 * 60_000).toISOString();
  return {
    id: 'sprint-1',
    theme: 'quick-focus',
    prompt: 'Write without stopping.',
    durationMinutes: 15,
    startTime,
    endTime: null,
    wordsStart: 100,
    wordsEnd: null,
    wordsWritten: null,
    status: 'active',
    targetWords: 250,
    ...overrides,
  };
};

describe('SprintTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('renders time display in MM:SS format', () => {
    render(
      <SprintTimer
        sprint={makeSprint()}
        currentWords={120}
        onEnd={vi.fn()}
        onAbandon={vi.fn()}
      />
    );

    const timer = screen.getByRole('timer');
    expect(timer).toBeDefined();
    // 10 minutes remaining: "10:00"
    expect(timer.textContent).toBe('10:00');
  });

  it('shows words written count', () => {
    render(
      <SprintTimer
        sprint={makeSprint({ wordsStart: 100 })}
        currentWords={180}
        onEnd={vi.fn()}
        onAbandon={vi.fn()}
      />
    );

    // Words written = 180 - 100 = 80
    expect(screen.getByText('80')).toBeDefined();
    expect(screen.getByLabelText(/80 words written/)).toBeDefined();
  });

  it('shows target words', () => {
    render(
      <SprintTimer
        sprint={makeSprint({ targetWords: 250 })}
        currentWords={100}
        onEnd={vi.fn()}
        onAbandon={vi.fn()}
      />
    );

    expect(screen.getByText('250')).toBeDefined();
    expect(screen.getByLabelText(/250 word target/)).toBeDefined();
  });

  it('calls onEnd when Finish Early clicked', () => {
    const onEnd = vi.fn();
    render(
      <SprintTimer
        sprint={makeSprint()}
        currentWords={150}
        onEnd={onEnd}
        onAbandon={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Finish Early'));
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('calls onAbandon when Abandon clicked', () => {
    const onAbandon = vi.fn();
    render(
      <SprintTimer
        sprint={makeSprint()}
        currentWords={150}
        onEnd={vi.fn()}
        onAbandon={onAbandon}
      />
    );

    fireEvent.click(screen.getByText('Abandon'));
    expect(onAbandon).toHaveBeenCalledTimes(1);
  });

  it('has accessible timer role', () => {
    render(
      <SprintTimer
        sprint={makeSprint()}
        currentWords={100}
        onEnd={vi.fn()}
        onAbandon={vi.fn()}
      />
    );

    expect(screen.getByRole('timer')).toBeDefined();
  });
});
