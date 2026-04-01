import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import type { RelationshipPair } from '@/lib/story-brain/types';

import { RelationshipMatrix } from '@/components/story-brain/relationship-matrix';

function makeRelationship(overrides: Partial<RelationshipPair> = {}): RelationshipPair {
  return {
    sourceId: 'e-1',
    sourceName: 'Alice',
    targetId: 'e-2',
    targetName: 'Bob',
    trustLevel: 80,
    tensionLevel: 20,
    dynamics: 'allies',
    ...overrides,
  };
}

describe('RelationshipMatrix', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows "No character relationships" when empty', () => {
    render(<RelationshipMatrix relationships={[]} />);
    expect(screen.getByText(/No character relationships/)).toBeDefined();
  });

  it('renders table with character names as headers', () => {
    const relationships = [
      makeRelationship(),
    ];
    render(<RelationshipMatrix relationships={relationships} />);

    // Names should appear in header cells
    const headers = screen.getAllByRole('columnheader');
    const headerTexts = headers.map(h => h.textContent);
    expect(headerTexts).toContain('Alice');
    expect(headerTexts).toContain('Bob');
  });

  it('shows dash for self-relationships (diagonal)', () => {
    const relationships = [
      makeRelationship({ sourceName: 'Alice', targetName: 'Bob' }),
    ];
    const { container } = render(<RelationshipMatrix relationships={relationships} />);

    // Diagonal cells should contain em dashes
    const cells = container.querySelectorAll('td');
    const dashCells = Array.from(cells).filter(td => td.textContent === '\u2014');
    // 2 characters => 2 diagonal cells
    expect(dashCells.length).toBe(2);
  });

  it('shows trust/tension values for existing relationships', () => {
    const relationships = [
      makeRelationship({ trustLevel: 80, tensionLevel: 20 }),
    ];
    render(<RelationshipMatrix relationships={relationships} />);

    // The cell should show trust/tension like "80/20"
    expect(screen.getAllByText('80/20').length).toBeGreaterThan(0);
  });

  it('has accessible grid role and label', () => {
    const relationships = [makeRelationship()];
    render(<RelationshipMatrix relationships={relationships} />);
    const table = screen.getByRole('grid');
    expect(table).toBeDefined();
    expect(table.getAttribute('aria-label')).toBe('Character relationship matrix');
  });

  it('renders correctly with multiple relationships', () => {
    const relationships = [
      makeRelationship({ sourceName: 'Alice', targetName: 'Bob', trustLevel: 70, tensionLevel: 30 }),
      makeRelationship({ sourceId: 'e-1', sourceName: 'Alice', targetId: 'e-3', targetName: 'Carol', trustLevel: 50, tensionLevel: 50 }),
      makeRelationship({ sourceId: 'e-2', sourceName: 'Bob', targetId: 'e-3', targetName: 'Carol', trustLevel: 90, tensionLevel: 10 }),
    ];
    render(<RelationshipMatrix relationships={relationships} />);

    // 3 characters should appear in sorted order
    const headers = screen.getAllByRole('columnheader');
    const headerTexts = headers.map(h => h.textContent).filter(Boolean);
    expect(headerTexts).toContain('Alice');
    expect(headerTexts).toContain('Bob');
    expect(headerTexts).toContain('Carol');
  });

  it('shows names as row headers', () => {
    const relationships = [makeRelationship()];
    const { container } = render(<RelationshipMatrix relationships={relationships} />);

    const rows = container.querySelectorAll('tbody tr');
    const rowNames = Array.from(rows).map(r => r.querySelector('td')?.textContent);
    expect(rowNames).toContain('Alice');
    expect(rowNames).toContain('Bob');
  });

  it('renders bidirectionally for same relationship pair', () => {
    const relationships = [
      makeRelationship({ sourceName: 'Alice', targetName: 'Bob', trustLevel: 60, tensionLevel: 40 }),
    ];
    render(<RelationshipMatrix relationships={relationships} />);

    // Both Alice->Bob and Bob->Alice cells should show the same values
    const valueCells = screen.getAllByText('60/40');
    expect(valueCells.length).toBe(2);
  });
});
