import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import type { Inconsistency, InconsistencyResolution } from '@/lib/story-brain/types';

// Mock antiquarian
vi.mock('@/components/antiquarian', () => ({
  ParchmentCard: ({ children, ...props }: any) => (
    <div data-testid="parchment-card" {...props}>{children}</div>
  ),
}));

// Mock lucide-react with explicit named exports. Vitest 4 validates mock exports against
// ownKeys, so a Proxy-based catch-all mock ({} target) crashes the worker during module init.
vi.mock('lucide-react', () => ({
  AlertTriangle: (props: any) => <span data-testid="icon-alerttriangle" {...props} />,
  Eye: (props: any) => <span data-testid="icon-eye" {...props} />,
  CheckCircle: (props: any) => <span data-testid="icon-checkcircle" {...props} />,
  Paintbrush: (props: any) => <span data-testid="icon-paintbrush" {...props} />,
}));

import { InconsistencyAlert } from '@/components/story-brain/inconsistency-alert';

function makeInconsistency(overrides: Partial<Inconsistency> = {}): Inconsistency {
  return {
    id: 'inc-1',
    type: 'timeline_conflict',
    severity: 'high',
    title: 'Timeline Conflict',
    description: 'Chapter 3 says morning but chapter 4 says the same event happened at night.',
    relatedEntityIds: ['e-1', 'e-2'],
    chapterIds: ['ch-3', 'ch-4'],
    ...overrides,
  };
}

function makeResolution(overrides: Partial<InconsistencyResolution> = {}): InconsistencyResolution {
  return {
    inconsistencyId: 'inc-1',
    action: 'correct',
    resolvedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('InconsistencyAlert', () => {
  const defaultProps = {
    inconsistency: makeInconsistency(),
    onResolve: vi.fn(),
    onUnresolve: vi.fn(),
  };

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title and description', () => {
    render(<InconsistencyAlert {...defaultProps} />);
    expect(screen.getByText('Timeline Conflict')).toBeDefined();
    expect(screen.getByText(/Chapter 3 says morning/)).toBeDefined();
  });

  it('shows severity badge', () => {
    render(<InconsistencyAlert {...defaultProps} />);
    expect(screen.getByText('high')).toBeDefined();
  });

  it('shows severity badge for different severities', () => {
    const inconsistency = makeInconsistency({ severity: 'critical' });
    render(<InconsistencyAlert {...defaultProps} inconsistency={inconsistency} />);
    expect(screen.getByText('critical')).toBeDefined();
  });

  it('shows action buttons (Ignore, Correct, Intentional) when unresolved', () => {
    render(<InconsistencyAlert {...defaultProps} />);
    expect(screen.getByText('Ignore')).toBeDefined();
    expect(screen.getByText('Correct')).toBeDefined();
    expect(screen.getByText('Intentional')).toBeDefined();
  });

  it('calls onResolve with "ignore" when Ignore clicked', () => {
    const onResolve = vi.fn();
    render(<InconsistencyAlert {...defaultProps} onResolve={onResolve} />);
    fireEvent.click(screen.getByText('Ignore'));
    expect(onResolve).toHaveBeenCalledWith('inc-1', 'ignore');
  });

  it('calls onResolve with "correct" when Correct clicked', () => {
    const onResolve = vi.fn();
    render(<InconsistencyAlert {...defaultProps} onResolve={onResolve} />);
    fireEvent.click(screen.getByText('Correct'));
    expect(onResolve).toHaveBeenCalledWith('inc-1', 'correct');
  });

  it('calls onResolve with "intentional" when Intentional clicked', () => {
    const onResolve = vi.fn();
    render(<InconsistencyAlert {...defaultProps} onResolve={onResolve} />);
    fireEvent.click(screen.getByText('Intentional'));
    expect(onResolve).toHaveBeenCalledWith('inc-1', 'intentional');
  });

  it('shows "Resolved" state with Undo button when resolution provided', () => {
    const resolution = makeResolution();
    render(<InconsistencyAlert {...defaultProps} resolution={resolution} />);
    expect(screen.getByText(/Resolved: correct/)).toBeDefined();
    expect(screen.getByText('Undo')).toBeDefined();
    // Action buttons should not be present
    expect(screen.queryByText('Ignore')).toBeNull();
    expect(screen.queryByText('Correct')).toBeNull();
    expect(screen.queryByText('Intentional')).toBeNull();
  });

  it('calls onUnresolve when Undo clicked', () => {
    const onUnresolve = vi.fn();
    const resolution = makeResolution();
    render(<InconsistencyAlert {...defaultProps} resolution={resolution} onUnresolve={onUnresolve} />);
    fireEvent.click(screen.getByText('Undo'));
    expect(onUnresolve).toHaveBeenCalledWith('inc-1');
  });

  it('renders AlertTriangle icon', () => {
    render(<InconsistencyAlert {...defaultProps} />);
    expect(screen.getByTestId('icon-alerttriangle')).toBeDefined();
  });
});
