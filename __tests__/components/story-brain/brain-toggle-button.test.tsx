import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock lucide-react
vi.mock('lucide-react', () => new Proxy({}, {
  get: (_, name) => (props: any) => <span data-testid={`icon-${String(name).toLowerCase()}`} {...props} />,
}));

import { BrainToggleButton } from '@/components/story-brain/brain-toggle-button';

describe('BrainToggleButton', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders "Story Brain" text', () => {
    render(<BrainToggleButton unresolvedCount={0} />);
    expect(screen.getByText('Story Brain')).toBeDefined();
  });

  it('shows count badge when unresolvedCount > 0', () => {
    render(<BrainToggleButton unresolvedCount={3} />);
    expect(screen.getByText('3')).toBeDefined();
  });

  it('shows "9+" when unresolvedCount > 9', () => {
    render(<BrainToggleButton unresolvedCount={15} />);
    expect(screen.getByText('9+')).toBeDefined();
  });

  it('does not show badge when unresolvedCount = 0', () => {
    const { container } = render(<BrainToggleButton unresolvedCount={0} />);
    // The badge span with the count class should not appear
    expect(screen.queryByText('0')).toBeNull();
    // Also ensure no badge element exists (badge uses rounded-full class)
    const badges = container.querySelectorAll('.rounded-full');
    expect(badges.length).toBe(0);
  });

  it('has accessible aria-label mentioning unresolved count', () => {
    render(<BrainToggleButton unresolvedCount={5} />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('aria-label')).toContain('5 unresolved');
  });

  it('has aria-label without count when unresolvedCount is 0', () => {
    render(<BrainToggleButton unresolvedCount={0} />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('aria-label')).toBe('Story Brain');
  });

  it('links to /story-brain', () => {
    render(<BrainToggleButton unresolvedCount={0} />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/story-brain');
  });

  it('renders BrainCircuit icon', () => {
    render(<BrainToggleButton unresolvedCount={0} />);
    expect(screen.getByTestId('icon-braincircuit')).toBeDefined();
  });

  it('shows exact count for values 1-9', () => {
    const { rerender } = render(<BrainToggleButton unresolvedCount={1} />);
    expect(screen.getByText('1')).toBeDefined();

    rerender(<BrainToggleButton unresolvedCount={9} />);
    expect(screen.getByText('9')).toBeDefined();
  });
});
