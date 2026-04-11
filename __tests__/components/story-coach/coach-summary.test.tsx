import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import type { CoachingInsight } from '@/lib/story-coach/types';

// Mock antiquarian
vi.mock('@/components/antiquarian', () => ({
  ParchmentCard: ({ children, onClick, ...props }: any) => (
    <div data-testid="parchment-card" onClick={onClick} {...props}>{children}</div>
  ),
}));

// Mock lucide-react with explicit named exports. Vitest 4 validates mock exports against
// ownKeys, so a Proxy-based catch-all mock ({} target) crashes the worker during module init.
vi.mock('lucide-react', () => ({
  Lightbulb: (props: any) => <span data-testid="icon-lightbulb" {...props} />,
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import { CoachSummary } from '@/components/story-coach/coach-summary';

function makeInsight(overrides: Partial<CoachingInsight> = {}): CoachingInsight {
  return {
    id: 'i-1',
    lens: 'tension',
    observation: 'Low tension in middle section',
    suggestion: 'Add a conflict element',
    priority: 'high',
    ...overrides,
  };
}

describe('CoachSummary', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when insights is empty', () => {
    const { container } = render(<CoachSummary insights={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows high-priority count when present', () => {
    const insights = [
      makeInsight({ id: 'i-1', priority: 'high' }),
      makeInsight({ id: 'i-2', priority: 'high' }),
      makeInsight({ id: 'i-3', priority: 'low' }),
    ];
    render(<CoachSummary insights={insights} />);
    expect(screen.getByText(/2 high-priority insights/)).toBeDefined();
  });

  it('shows single high-priority without plural', () => {
    const insights = [
      makeInsight({ id: 'i-1', priority: 'high' }),
      makeInsight({ id: 'i-2', priority: 'low' }),
    ];
    render(<CoachSummary insights={insights} />);
    expect(screen.getByText(/1 high-priority insight(?!s)/)).toBeDefined();
  });

  it('shows total insight count when no high-priority', () => {
    const insights = [
      makeInsight({ id: 'i-1', priority: 'medium' }),
      makeInsight({ id: 'i-2', priority: 'low' }),
      makeInsight({ id: 'i-3', priority: 'low' }),
    ];
    render(<CoachSummary insights={insights} />);
    expect(screen.getByText(/3 coaching insights/)).toBeDefined();
  });

  it('shows total count singular when only one non-high insight', () => {
    const insights = [
      makeInsight({ id: 'i-1', priority: 'medium' }),
    ];
    render(<CoachSummary insights={insights} />);
    expect(screen.getByText(/1 coaching insight(?!s)/)).toBeDefined();
  });

  it('shows chapter title when provided', () => {
    const insights = [makeInsight()];
    render(<CoachSummary insights={insights} chapterTitle="The Dark Forest" />);
    expect(screen.getByText(/for "The Dark Forest"/)).toBeDefined();
  });

  it('does not show chapter title when not provided', () => {
    const insights = [makeInsight()];
    render(<CoachSummary insights={insights} />);
    expect(screen.queryByText(/for "/)).toBeNull();
  });

  it('links to /flow', () => {
    const insights = [makeInsight()];
    render(<CoachSummary insights={insights} />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/flow');
  });

  it('shows helper text to open Flow Mode', () => {
    const insights = [makeInsight()];
    render(<CoachSummary insights={insights} />);
    expect(screen.getByText('Open Flow Mode to review')).toBeDefined();
  });

  it('renders Lightbulb icon', () => {
    const insights = [makeInsight()];
    render(<CoachSummary insights={insights} />);
    expect(screen.getByTestId('icon-lightbulb')).toBeDefined();
  });
});
