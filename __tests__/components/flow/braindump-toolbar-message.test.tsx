import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { BraindumpToolbarMessage } from '@/components/flow/braindump-toolbar-message';

describe('BraindumpToolbarMessage', () => {
  beforeEach(() => {
    cleanup();
  });

  it('shows unsupported browser message', () => {
    render(<BraindumpToolbarMessage type="unsupported" onDismiss={vi.fn()} />);
    expect(screen.getByText(/Chrome/)).toBeDefined();
    expect(screen.getByText(/Edge/)).toBeDefined();
  });

  it('shows denied permission message with link', () => {
    render(<BraindumpToolbarMessage type="denied" onDismiss={vi.fn()} />);
    expect(screen.getByText(/denied/i)).toBeDefined();
    const link = screen.getByText(/Allow mic access/i);
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toContain('support.google.com');
  });

  it('calls onDismiss when X clicked', () => {
    const onDismiss = vi.fn();
    render(<BraindumpToolbarMessage type="unsupported" onDismiss={onDismiss} />);
    fireEvent.click(screen.getByLabelText('Dismiss message'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders dismiss button with aria-label', () => {
    render(<BraindumpToolbarMessage type="unsupported" onDismiss={vi.fn()} />);
    expect(screen.getByLabelText('Dismiss message')).toBeDefined();
  });
});
