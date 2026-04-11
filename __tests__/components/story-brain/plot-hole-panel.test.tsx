import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import type { PlotHole } from '@/lib/story-brain/plot-hole-types';
import type { InconsistencyResolution } from '@/lib/story-brain/types';

// Mock lucide-react with explicit named exports. Vitest 4 validates mock exports against
// ownKeys, so a Proxy-based catch-all mock ({} target) crashes the worker during module init.
vi.mock('lucide-react', () => ({
  ChevronDown: (props: any) => <span data-testid="icon-chevrondown" {...props} />,
  ChevronRight: (props: any) => <span data-testid="icon-chevronright" {...props} />,
}));

// Mock PlotHoleCard
vi.mock('@/components/story-brain/plot-hole-card', () => ({
  PlotHoleCard: ({ plotHole, resolution, onResolve, onUnresolve, onGoToChapter }: any) => (
    <div data-testid={`plot-hole-${plotHole.id}`}>
      <span>{plotHole.title}</span>
      {resolution && <span data-testid="resolved">Resolved</span>}
    </div>
  ),
}));

import { PlotHolePanel } from '@/components/story-brain/plot-hole-panel';

function makePlotHole(overrides: Partial<PlotHole> = {}): PlotHole {
  return {
    id: 'ph-1',
    type: 'plot_hole',
    severity: 'high',
    title: 'Missing Return',
    description: 'Character disappeared.',
    relatedEntityIds: ['e-1'],
    chapterIds: ['ch-3'],
    plotHoleType: 'character_disappearance',
    suggestedChapterIndex: null,
    narrativeImpact: 70,
    ...overrides,
  };
}

describe('PlotHolePanel', () => {
  const defaultProps = {
    plotHoles: [] as PlotHole[],
    resolutions: [] as InconsistencyResolution[],
    onResolve: vi.fn(),
    onUnresolve: vi.fn(),
  };

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows "No plot holes detected" when empty', () => {
    render(<PlotHolePanel {...defaultProps} />);
    expect(screen.getByText(/No plot holes detected/)).toBeDefined();
  });

  it('groups plot holes by type', () => {
    const plotHoles = [
      makePlotHole({ id: 'ph-1', plotHoleType: 'character_disappearance', title: 'Missing Alice' }),
      makePlotHole({ id: 'ph-2', plotHoleType: 'conflict_unresolved', title: 'Open Conflict' }),
      makePlotHole({ id: 'ph-3', plotHoleType: 'character_disappearance', title: 'Missing Bob' }),
    ];
    render(<PlotHolePanel {...defaultProps} plotHoles={plotHoles} />);

    expect(screen.getByText('Character Disappearances')).toBeDefined();
    expect(screen.getByText('Unresolved Conflicts')).toBeDefined();
  });

  it('expands/collapses groups on click', () => {
    const plotHoles = [
      makePlotHole({ id: 'ph-1', plotHoleType: 'character_disappearance', title: 'Missing Alice' }),
    ];
    render(<PlotHolePanel {...defaultProps} plotHoles={plotHoles} />);

    // Initially collapsed -- plot hole card should not be visible
    expect(screen.queryByTestId('plot-hole-ph-1')).toBeNull();

    // Click to expand
    fireEvent.click(screen.getByText('Character Disappearances'));
    expect(screen.getByTestId('plot-hole-ph-1')).toBeDefined();

    // Click to collapse
    fireEvent.click(screen.getByText('Character Disappearances'));
    expect(screen.queryByTestId('plot-hole-ph-1')).toBeNull();
  });

  it('shows unresolved count per group', () => {
    const plotHoles = [
      makePlotHole({ id: 'ph-1', plotHoleType: 'conflict_unresolved', title: 'Conflict 1' }),
      makePlotHole({ id: 'ph-2', plotHoleType: 'conflict_unresolved', title: 'Conflict 2' }),
      makePlotHole({ id: 'ph-3', plotHoleType: 'conflict_unresolved', title: 'Conflict 3' }),
    ];
    const resolutions: InconsistencyResolution[] = [
      { inconsistencyId: 'ph-2', action: 'ignore', resolvedAt: '2025-01-01T00:00:00Z' },
    ];
    render(<PlotHolePanel {...defaultProps} plotHoles={plotHoles} resolutions={resolutions} />);

    // 2 unresolved out of 3 total
    expect(screen.getByText('2/3')).toBeDefined();
  });

  it('does not render groups with no items', () => {
    const plotHoles = [
      makePlotHole({ id: 'ph-1', plotHoleType: 'conflict_unresolved', title: 'Conflict' }),
    ];
    render(<PlotHolePanel {...defaultProps} plotHoles={plotHoles} />);

    expect(screen.getByText('Unresolved Conflicts')).toBeDefined();
    expect(screen.queryByText('Character Disappearances')).toBeNull();
    expect(screen.queryByText('Late Introductions')).toBeNull();
    expect(screen.queryByText('Unfulfilled Foreshadowing')).toBeNull();
    expect(screen.queryByText('Stale Open Loops')).toBeNull();
  });

  it('renders all plot hole cards when group is expanded', () => {
    const plotHoles = [
      makePlotHole({ id: 'ph-1', plotHoleType: 'character_disappearance', title: 'Missing Alice' }),
      makePlotHole({ id: 'ph-2', plotHoleType: 'character_disappearance', title: 'Missing Bob' }),
    ];
    render(<PlotHolePanel {...defaultProps} plotHoles={plotHoles} />);

    // Expand
    fireEvent.click(screen.getByText('Character Disappearances'));
    expect(screen.getByTestId('plot-hole-ph-1')).toBeDefined();
    expect(screen.getByTestId('plot-hole-ph-2')).toBeDefined();
  });
});
