import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import React from 'react';
import { FlowScoreModal } from '@/components/writing-map/flow-score-modal';

// Mock motion/react to avoid animation complexity in tests
vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: React.forwardRef(function MotionDiv(
      props: Record<string, unknown>,
      ref: React.Ref<HTMLDivElement>
    ) {
      const { initial, animate, exit, transition, ...rest } = props;
      return <div ref={ref} {...(rest as React.HTMLAttributes<HTMLDivElement>)} />;
    }),
  },
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  X: (props: Record<string, unknown>) => <svg data-testid="x-icon" {...props} />,
}));

describe('FlowScoreModal', () => {
  let onSubmit: ReturnType<typeof vi.fn>;
  let onDismiss: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    onSubmit = vi.fn();
    onDismiss = vi.fn();
    cleanup();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  function renderModal() {
    return render(
      <FlowScoreModal sessionId="sess-1" onSubmit={onSubmit} onDismiss={onDismiss} />
    );
  }

  it('renders with prompt text', () => {
    renderModal();
    expect(screen.getByText('How did this session flow?')).toBeTruthy();
  });

  it('renders 5 emoji buttons with correct labels', () => {
    renderModal();
    expect(screen.getByLabelText(/Struggled/)).toBeTruthy();
    expect(screen.getByLabelText(/Slow/)).toBeTruthy();
    expect(screen.getByLabelText(/Okay/)).toBeTruthy();
    expect(screen.getByLabelText(/Good/)).toBeTruthy();
    expect(screen.getByLabelText(/On fire/)).toBeTruthy();
  });

  it('calls onSubmit with correct score on emoji click', () => {
    renderModal();
    fireEvent.click(screen.getByLabelText(/Good/));
    expect(onSubmit).toHaveBeenCalledWith('sess-1', 4);
  });

  it('calls onDismiss on X button click', () => {
    renderModal();
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('renders X close button instead of Skip', () => {
    renderModal();
    expect(screen.queryByText('Skip')).toBeNull();
    expect(screen.getByLabelText('Close')).toBeTruthy();
  });

  it('auto-dismisses after 30 seconds', () => {
    renderModal();
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(30_000); });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('supports keyboard number keys 1-5', () => {
    renderModal();
    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: '3' });
    expect(onSubmit).toHaveBeenCalledWith('sess-1', 3);
  });

  it('supports Escape key to dismiss', () => {
    renderModal();
    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onDismiss).toHaveBeenCalled();
  });

  it('has proper ARIA roles', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByRole('radiogroup')).toBeTruthy();
  });
});
