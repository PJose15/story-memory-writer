import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import React from 'react';

vi.mock('motion/react', () => {
  const MockMotionDiv = React.forwardRef<HTMLDivElement, Record<string, unknown>>(
    function MockMotionDiv({ children, initial, animate, exit, transition, ...props }, ref) {
      return <div ref={ref as React.Ref<HTMLDivElement>} {...props as React.HTMLAttributes<HTMLDivElement>}>{children as React.ReactNode}</div>;
    }
  );
  const MockMotionP = React.forwardRef<HTMLParagraphElement, Record<string, unknown>>(
    function MockMotionP({ children, initial, animate, exit, transition, ...props }, ref) {
      return <p ref={ref as React.Ref<HTMLParagraphElement>} {...props as React.HTMLAttributes<HTMLParagraphElement>}>{children as React.ReactNode}</p>;
    }
  );
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      div: MockMotionDiv,
      p: MockMotionP,
    },
  };
});

import { BreathingGuide } from '@/components/ritual/breathing-guide';

describe('BreathingGuide', () => {
  beforeEach(() => {
    cleanup();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders with initial "Breathe in..." text', () => {
    const onComplete = vi.fn();
    render(<BreathingGuide onComplete={onComplete} />);
    expect(screen.getByText('Breathe in...')).toBeDefined();
  });

  it('shows cycle counter', () => {
    const onComplete = vi.fn();
    render(<BreathingGuide onComplete={onComplete} />);
    expect(screen.getByText(/Cycle 1 of 5/)).toBeDefined();
  });

  it('transitions through breath phases', () => {
    const onComplete = vi.fn();
    render(<BreathingGuide onComplete={onComplete} />);

    expect(screen.getByText('Breathe in...')).toBeDefined();

    act(() => { vi.advanceTimersByTime(4000); });
    expect(screen.getByText('Hold...')).toBeDefined();

    act(() => { vi.advanceTimersByTime(4000); });
    expect(screen.getByText('Breathe out...')).toBeDefined();
  });

  it('increments cycle counter after one full cycle', () => {
    const onComplete = vi.fn();
    render(<BreathingGuide onComplete={onComplete} />);

    act(() => { vi.advanceTimersByTime(4000); }); // inhale -> hold
    act(() => { vi.advanceTimersByTime(4000); }); // hold -> exhale
    act(() => { vi.advanceTimersByTime(4000); }); // exhale -> next cycle

    expect(screen.getByText(/Cycle 2 of 5/)).toBeDefined();
  });

  it('calls onComplete after all 5 cycles', () => {
    const onComplete = vi.fn();
    render(<BreathingGuide onComplete={onComplete} />);

    for (let cycle = 0; cycle < 5; cycle++) {
      for (let phase = 0; phase < 3; phase++) {
        act(() => { vi.advanceTimersByTime(4000); });
      }
    }

    expect(onComplete).toHaveBeenCalled();
  });

  it('does not call onComplete before all cycles finish', () => {
    const onComplete = vi.fn();
    render(<BreathingGuide onComplete={onComplete} />);

    for (let cycle = 0; cycle < 4; cycle++) {
      for (let phase = 0; phase < 3; phase++) {
        act(() => { vi.advanceTimersByTime(4000); });
      }
    }

    expect(onComplete).not.toHaveBeenCalled();
  });
});
