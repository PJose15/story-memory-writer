import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { SceneChangeRecoveryModal } from '@/components/flow/scene-change-recovery-modal';

describe('SceneChangeRecoveryModal', () => {
  const defaultProps = {
    originalChapterTitle: 'Chapter One',
    onReturn: vi.fn(),
    onStayHere: vi.fn(),
  };

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders title and message', () => {
    render(<SceneChangeRecoveryModal {...defaultProps} />);
    expect(screen.getByText('Scene Change Expired')).toBeDefined();
    expect(screen.getByText('Chapter One')).toBeDefined();
  });

  it('calls onReturn when "Return to original" is clicked', () => {
    render(<SceneChangeRecoveryModal {...defaultProps} />);
    screen.getByText('Return to original').click();
    expect(defaultProps.onReturn).toHaveBeenCalledTimes(1);
  });

  it('calls onStayHere when "Stay here" is clicked', () => {
    render(<SceneChangeRecoveryModal {...defaultProps} />);
    screen.getByText('Stay here').click();
    expect(defaultProps.onStayHere).toHaveBeenCalledTimes(1);
  });

  it('has correct ARIA attributes', () => {
    render(<SceneChangeRecoveryModal {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('recovery-title');
    expect(dialog.getAttribute('aria-describedby')).toBe('recovery-message');
  });

  it('renders the chapter title in the message', () => {
    render(<SceneChangeRecoveryModal {...defaultProps} originalChapterTitle="My Great Chapter" />);
    expect(screen.getByText('My Great Chapter')).toBeDefined();
  });
});
