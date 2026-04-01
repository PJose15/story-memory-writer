import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import type { CoachingInsight } from '@/lib/story-coach/types';

// Mock antiquarian
vi.mock('@/components/antiquarian', () => ({
  ParchmentCard: ({ children, ...props }: any) => (
    <div data-testid="parchment-card" {...props}>{children}</div>
  ),
}));

// Mock lucide-react
vi.mock('lucide-react', () => new Proxy({}, {
  get: (_, name) => (props: any) => <span data-testid={`icon-${String(name).toLowerCase()}`} {...props} />,
}));

import { CoachingInsightCard } from '@/components/story-coach/coaching-insight-card';

function makeInsight(overrides: Partial<CoachingInsight> = {}): CoachingInsight {
  return {
    id: 'i-1',
    lens: 'tension',
    observation: 'The middle section lacks dramatic tension.',
    suggestion: 'Consider introducing a conflict or obstacle.',
    priority: 'high',
    ...overrides,
  };
}

describe('CoachingInsightCard', () => {
  const defaultProps = {
    insight: makeInsight(),
    onDismiss: vi.fn(),
  };

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders lens label', () => {
    render(<CoachingInsightCard {...defaultProps} />);
    expect(screen.getByText('tension')).toBeDefined();
  });

  it('renders priority badge', () => {
    render(<CoachingInsightCard {...defaultProps} />);
    expect(screen.getByText('high')).toBeDefined();
  });

  it('renders different priority badges', () => {
    const insight = makeInsight({ priority: 'low' });
    render(<CoachingInsightCard {...defaultProps} insight={insight} />);
    expect(screen.getByText('low')).toBeDefined();
  });

  it('shows observation text', () => {
    render(<CoachingInsightCard {...defaultProps} />);
    expect(screen.getByText('The middle section lacks dramatic tension.')).toBeDefined();
  });

  it('shows suggestion text', () => {
    render(<CoachingInsightCard {...defaultProps} />);
    expect(screen.getByText('Consider introducing a conflict or obstacle.')).toBeDefined();
  });

  it('calls onDismiss when dismiss button clicked', () => {
    const onDismiss = vi.fn();
    render(<CoachingInsightCard {...defaultProps} onDismiss={onDismiss} />);
    const dismissBtn = screen.getByLabelText('Dismiss insight');
    fireEvent.click(dismissBtn);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('has accessible dismiss button with aria-label', () => {
    render(<CoachingInsightCard {...defaultProps} />);
    const dismissBtn = screen.getByLabelText('Dismiss insight');
    expect(dismissBtn).toBeDefined();
    expect(dismissBtn.tagName.toLowerCase()).toBe('button');
  });

  it('renders the correct lens icon', () => {
    render(<CoachingInsightCard {...defaultProps} />);
    // tension lens uses Zap icon
    expect(screen.getByTestId('icon-zap')).toBeDefined();
  });

  it('renders different icons for different lenses', () => {
    const insight = makeInsight({ lens: 'sensory' });
    render(<CoachingInsightCard {...defaultProps} insight={insight} />);
    expect(screen.getByTestId('icon-eye')).toBeDefined();
  });

  it('applies priority-specific styling to badge', () => {
    const insight = makeInsight({ priority: 'medium' });
    render(<CoachingInsightCard {...defaultProps} insight={insight} />);
    const badge = screen.getByText('medium');
    expect(badge.className).toContain('text-brass-600');
  });

  it('renders X icon for dismiss button', () => {
    render(<CoachingInsightCard {...defaultProps} />);
    expect(screen.getByTestId('icon-x')).toBeDefined();
  });
});
