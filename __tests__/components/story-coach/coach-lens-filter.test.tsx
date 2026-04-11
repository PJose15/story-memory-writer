import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';

// Mock lucide-react with explicit named exports. Vitest 4 validates mock exports against
// ownKeys, so a Proxy-based catch-all mock ({} target) crashes the worker during module init.
vi.mock('lucide-react', () => ({
  Zap: (props: any) => <span data-testid="icon-zap" {...props} />,
  Eye: (props: any) => <span data-testid="icon-eye" {...props} />,
  Heart: (props: any) => <span data-testid="icon-heart" {...props} />,
  Clock: (props: any) => <span data-testid="icon-clock" {...props} />,
  Sparkles: (props: any) => <span data-testid="icon-sparkles" {...props} />,
  MessageSquare: (props: any) => <span data-testid="icon-messagesquare" {...props} />,
}));

import { CoachLensFilter } from '@/components/story-coach/coach-lens-filter';

describe('CoachLensFilter', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "All" button plus 6 lens buttons', () => {
    const onChange = vi.fn();
    render(<CoachLensFilter activeLens="all" onChange={onChange} />);

    expect(screen.getByText('All')).toBeDefined();
    expect(screen.getByText('Tension')).toBeDefined();
    expect(screen.getByText('Sensory Detail')).toBeDefined();
    expect(screen.getByText('Character Motivation')).toBeDefined();
    expect(screen.getByText('Pacing')).toBeDefined();
    expect(screen.getByText('Foreshadowing')).toBeDefined();
    expect(screen.getByText('Dialogue')).toBeDefined();
  });

  it('highlights active lens', () => {
    const onChange = vi.fn();
    render(<CoachLensFilter activeLens="tension" onChange={onChange} />);

    const tensionBtn = screen.getByText('Tension').closest('button')!;
    expect(tensionBtn.className).toContain('bg-brass-500');

    const allBtn = screen.getByText('All');
    expect(allBtn.className).not.toContain('bg-brass-500');
  });

  it('highlights All when activeLens is "all"', () => {
    const onChange = vi.fn();
    render(<CoachLensFilter activeLens="all" onChange={onChange} />);

    const allBtn = screen.getByText('All');
    expect(allBtn.className).toContain('bg-brass-500');
  });

  it('calls onChange with correct lens on click', () => {
    const onChange = vi.fn();
    render(<CoachLensFilter activeLens="all" onChange={onChange} />);

    fireEvent.click(screen.getByText('Tension'));
    expect(onChange).toHaveBeenCalledWith('tension');

    fireEvent.click(screen.getByText('Sensory Detail'));
    expect(onChange).toHaveBeenCalledWith('sensory');

    fireEvent.click(screen.getByText('Character Motivation'));
    expect(onChange).toHaveBeenCalledWith('motivation');

    fireEvent.click(screen.getByText('Pacing'));
    expect(onChange).toHaveBeenCalledWith('pacing');

    fireEvent.click(screen.getByText('Foreshadowing'));
    expect(onChange).toHaveBeenCalledWith('foreshadowing');

    fireEvent.click(screen.getByText('Dialogue'));
    expect(onChange).toHaveBeenCalledWith('dialogue');
  });

  it('calls onChange("all") when All clicked', () => {
    const onChange = vi.fn();
    render(<CoachLensFilter activeLens="tension" onChange={onChange} />);

    fireEvent.click(screen.getByText('All'));
    expect(onChange).toHaveBeenCalledWith('all');
  });

  it('renders icons for each lens', () => {
    const onChange = vi.fn();
    render(<CoachLensFilter activeLens="all" onChange={onChange} />);

    // Each lens has an icon
    expect(screen.getByTestId('icon-zap')).toBeDefined();       // tension
    expect(screen.getByTestId('icon-eye')).toBeDefined();       // sensory
    expect(screen.getByTestId('icon-heart')).toBeDefined();     // motivation
    expect(screen.getByTestId('icon-clock')).toBeDefined();     // pacing
    expect(screen.getByTestId('icon-sparkles')).toBeDefined();  // foreshadowing
    expect(screen.getByTestId('icon-messagesquare')).toBeDefined(); // dialogue
  });
});
