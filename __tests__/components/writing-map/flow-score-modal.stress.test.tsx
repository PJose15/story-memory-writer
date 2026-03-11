import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import React from 'react';
import { FlowScoreModal } from '@/components/writing-map/flow-score-modal';

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

vi.mock('lucide-react', () => ({
  X: (props: Record<string, unknown>) => <svg data-testid="x-icon" {...props} />,
}));

describe('FlowScoreModal STRESS', () => {
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

  function renderModal(sessionId = 'sess-1') {
    return render(
      <FlowScoreModal sessionId={sessionId} onSubmit={onSubmit} onDismiss={onDismiss} />
    );
  }

  // ──────────────────────────────────────────────────────
  // KEYBOARD INPUT EDGE CASES
  // ──────────────────────────────────────────────────────
  describe('keyboard input edge cases', () => {
    it('key "0" does not submit', () => {
      renderModal();
      fireEvent.keyDown(screen.getByRole('dialog'), { key: '0' });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('key "6" does not submit', () => {
      renderModal();
      fireEvent.keyDown(screen.getByRole('dialog'), { key: '6' });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('key "7" does not submit', () => {
      renderModal();
      fireEvent.keyDown(screen.getByRole('dialog'), { key: '7' });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('key "9" does not submit', () => {
      renderModal();
      fireEvent.keyDown(screen.getByRole('dialog'), { key: '9' });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('key "-1" does not submit', () => {
      renderModal();
      fireEvent.keyDown(screen.getByRole('dialog'), { key: '-' });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('letter keys do not submit', () => {
      renderModal();
      for (const key of ['a', 'b', 'z', 'A', 'Z']) {
        fireEvent.keyDown(screen.getByRole('dialog'), { key });
      }
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('Enter key does not submit', () => {
      renderModal();
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Enter' });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('Tab key does not submit or dismiss', () => {
      renderModal();
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab' });
      expect(onSubmit).not.toHaveBeenCalled();
      expect(onDismiss).not.toHaveBeenCalled();
    });

    it('Space key does not submit', () => {
      renderModal();
      fireEvent.keyDown(screen.getByRole('dialog'), { key: ' ' });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('all valid keys 1-5 submit correct scores', () => {
      for (let i = 1; i <= 5; i++) {
        onSubmit.mockClear();
        const { unmount } = renderModal();
        fireEvent.keyDown(screen.getByRole('dialog'), { key: String(i) });
        expect(onSubmit).toHaveBeenCalledWith('sess-1', i);
        unmount();
      }
    });
  });

  // ──────────────────────────────────────────────────────
  // AUTO-DISMISS TIMING BOUNDARIES
  // ──────────────────────────────────────────────────────
  describe('auto-dismiss timing', () => {
    it('does not dismiss at 29,999ms', () => {
      renderModal();
      act(() => { vi.advanceTimersByTime(29_999); });
      expect(onDismiss).not.toHaveBeenCalled();
    });

    it('dismisses at exactly 30,000ms', () => {
      renderModal();
      act(() => { vi.advanceTimersByTime(30_000); });
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('dismisses at 30,001ms', () => {
      renderModal();
      act(() => { vi.advanceTimersByTime(30_001); });
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('does not double-dismiss after 60s', () => {
      renderModal();
      act(() => { vi.advanceTimersByTime(60_000); });
      // setTimeout fires once, not repeatedly
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  // ──────────────────────────────────────────────────────
  // BUTTON CLICK INTERACTIONS
  // ──────────────────────────────────────────────────────
  describe('button clicks', () => {
    it('clicking each of 5 buttons submits correct score', () => {
      const labels = [/Struggled/, /Slow/, /Okay/, /Good/, /On fire/];
      for (let i = 0; i < labels.length; i++) {
        onSubmit.mockClear();
        const { unmount } = renderModal();
        fireEvent.click(screen.getByLabelText(labels[i]));
        expect(onSubmit).toHaveBeenCalledWith('sess-1', i + 1);
        unmount();
      }
    });

    it('rapid double-click on same button fires twice', () => {
      renderModal();
      const btn = screen.getByLabelText(/Good/);
      fireEvent.click(btn);
      fireEvent.click(btn);
      expect(onSubmit).toHaveBeenCalledTimes(2);
    });

    it('X button click dismisses', () => {
      renderModal();
      fireEvent.click(screen.getByLabelText('Close'));
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('Escape then X button: both fire', () => {
      renderModal();
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      fireEvent.click(screen.getByLabelText('Close'));
      expect(onDismiss).toHaveBeenCalledTimes(2);
    });
  });

  // ──────────────────────────────────────────────────────
  // ARIA & ACCESSIBILITY
  // ──────────────────────────────────────────────────────
  describe('accessibility', () => {
    it('has dialog role', () => {
      renderModal();
      expect(screen.getByRole('dialog')).toBeTruthy();
    });

    it('has radiogroup for score options', () => {
      renderModal();
      expect(screen.getByRole('radiogroup')).toBeTruthy();
    });

    it('each button has descriptive aria-label with score', () => {
      renderModal();
      for (let i = 1; i <= 5; i++) {
        expect(screen.getByLabelText(new RegExp(`${i} out of 5`))).toBeTruthy();
      }
    });

    it('X button has Close aria-label', () => {
      renderModal();
      expect(screen.getByLabelText('Close')).toBeTruthy();
    });

    it('dialog is focusable (tabIndex=-1)', () => {
      renderModal();
      const dialog = screen.getByRole('dialog');
      expect(dialog.getAttribute('tabindex')).toBe('-1');
    });
  });

  // ──────────────────────────────────────────────────────
  // DIFFERENT SESSION IDS
  // ──────────────────────────────────────────────────────
  describe('session id handling', () => {
    it('passes through empty sessionId', () => {
      render(<FlowScoreModal sessionId="" onSubmit={onSubmit} onDismiss={onDismiss} />);
      fireEvent.click(screen.getByLabelText(/Good/));
      expect(onSubmit).toHaveBeenCalledWith('', 4);
    });

    it('passes through long sessionId', () => {
      const longId = 'x'.repeat(200);
      render(<FlowScoreModal sessionId={longId} onSubmit={onSubmit} onDismiss={onDismiss} />);
      fireEvent.click(screen.getByLabelText(/Okay/));
      expect(onSubmit).toHaveBeenCalledWith(longId, 3);
    });

    it('passes through unicode sessionId', () => {
      render(<FlowScoreModal sessionId="🔥-sess-日本" onSubmit={onSubmit} onDismiss={onDismiss} />);
      fireEvent.click(screen.getByLabelText(/Struggled/));
      expect(onSubmit).toHaveBeenCalledWith('🔥-sess-日本', 1);
    });
  });

  // ──────────────────────────────────────────────────────
  // CONTENT VERIFICATION
  // ──────────────────────────────────────────────────────
  describe('content', () => {
    it('shows "How did this session flow?" (not old text)', () => {
      renderModal();
      expect(screen.getByText('How did this session flow?')).toBeTruthy();
    });

    it('does NOT show "Skip" text', () => {
      renderModal();
      expect(screen.queryByText('Skip')).toBeNull();
    });

    it('does NOT show "How was that writing session?"', () => {
      renderModal();
      expect(screen.queryByText('How was that writing session?')).toBeNull();
    });

    it('does NOT show old emojis (Meh, In the zone)', () => {
      renderModal();
      expect(screen.queryByLabelText(/Meh/)).toBeNull();
      expect(screen.queryByLabelText(/In the zone/)).toBeNull();
    });

    it('shows new emojis (Slow, On fire)', () => {
      renderModal();
      expect(screen.getByLabelText(/Slow/)).toBeTruthy();
      expect(screen.getByLabelText(/On fire/)).toBeTruthy();
    });
  });
});
