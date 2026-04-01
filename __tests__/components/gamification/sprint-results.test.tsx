import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import type { SprintResult } from '@/lib/gamification/sprints';

vi.mock('motion/react', () => {
  const MockMotionDiv = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    function MockMotionDiv({ children, ...props }, ref) {
      return <div ref={ref} {...props}>{children}</div>;
    }
  );
  return {
    motion: { div: MockMotionDiv },
  };
});

vi.mock('@/lib/animations', () => ({
  stampSlam: {},
}));

vi.mock('lucide-react', () => ({
  Trophy: (props: any) => <span data-testid="icon-trophy" {...props} />,
  Target: (props: any) => <span data-testid="icon-target" {...props} />,
  Zap: (props: any) => <span data-testid="icon-zap" {...props} />,
}));

vi.mock('@/components/antiquarian', () => ({
  ParchmentCard: ({ children, ...props }: any) => <div data-testid="parchment-card" {...props}>{children}</div>,
  BrassButton: ({ children, onClick, disabled, ...props }: any) => <button onClick={onClick} disabled={disabled} {...props}>{children}</button>,
}));

import { SprintResults } from '@/components/gamification/sprint-results';

const makeResult = (overrides: Partial<SprintResult> = {}): SprintResult => ({
  wordsWritten: 300,
  targetMet: true,
  percentOfTarget: 120,
  durationMinutes: 15,
  ...overrides,
});

describe('SprintResults', () => {
  afterEach(cleanup);

  it('renders words written', () => {
    render(<SprintResults result={makeResult({ wordsWritten: 300 })} onDismiss={vi.fn()} />);

    expect(screen.getByText('300')).toBeDefined();
    expect(screen.getByText('Words Written')).toBeDefined();
  });

  it('shows "Target Smashed!" when targetMet', () => {
    render(<SprintResults result={makeResult({ targetMet: true })} onDismiss={vi.fn()} />);

    expect(screen.getByText('Target Smashed!')).toBeDefined();
  });

  it('shows "Sprint Complete" when target not met', () => {
    render(<SprintResults result={makeResult({ targetMet: false })} onDismiss={vi.fn()} />);

    expect(screen.getByText('Sprint Complete')).toBeDefined();
  });

  it('shows duration and percent', () => {
    render(<SprintResults result={makeResult({ durationMinutes: 15, percentOfTarget: 120 })} onDismiss={vi.fn()} />);

    expect(screen.getByText(/15 min/)).toBeDefined();
    expect(screen.getByText(/120%/)).toBeDefined();
  });

  it('calls onDismiss on Done button click', () => {
    const onDismiss = vi.fn();
    render(<SprintResults result={makeResult()} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByText('Done'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('has accessible img role on icon container', () => {
    render(<SprintResults result={makeResult({ targetMet: true })} onDismiss={vi.fn()} />);

    const img = screen.getByRole('img');
    expect(img).toBeDefined();
    expect(img.getAttribute('aria-label')).toContain('Target achieved');
  });
});
