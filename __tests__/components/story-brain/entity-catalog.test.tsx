import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import type { EntityCatalogEntry, EntityType } from '@/lib/story-brain/types';

// Mock antiquarian
vi.mock('@/components/antiquarian', () => ({
  ParchmentCard: ({ children, onClick, ...props }: any) => (
    <div data-testid="parchment-card" onClick={onClick} {...props}>{children}</div>
  ),
}));

// Mock motion/react
vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: any) => children,
  motion: {
    div: ({ children, ...p }: any) => {
      const { initial, animate, exit, transition, ...rest } = p;
      return <div {...rest}>{children}</div>;
    },
  },
}));

// Mock lucide-react with explicit named exports. Vitest 4 validates mock exports against
// ownKeys, so a Proxy-based catch-all mock ({} target) crashes the worker during module init.
vi.mock('lucide-react', () => ({
  Search: (props: any) => <span data-testid="icon-search" {...props} />,
  Users: (props: any) => <span data-testid="icon-users" {...props} />,
  MapPin: (props: any) => <span data-testid="icon-mappin" {...props} />,
  CalendarDays: (props: any) => <span data-testid="icon-calendardays" {...props} />,
  Swords: (props: any) => <span data-testid="icon-swords" {...props} />,
}));

// Mock animations
vi.mock('@/lib/animations', () => ({
  stagger: { cards: () => ({}) },
  stampSlam: {},
}));

import { EntityCatalog } from '@/components/story-brain/entity-catalog';

function makeEntity(overrides: Partial<EntityCatalogEntry> = {}): EntityCatalogEntry {
  return {
    id: 'e-1',
    name: 'Alice',
    type: 'character',
    mentionCount: 10,
    firstAppearanceChapter: 0,
    lastAppearanceChapter: 3,
    sceneIds: ['s-1'],
    relationshipCount: 2,
    ...overrides,
  };
}

describe('EntityCatalog', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders entities grouped by type', () => {
    const entities = [
      makeEntity({ id: 'c-1', name: 'Alice', type: 'character' }),
      makeEntity({ id: 'l-1', name: 'Castle', type: 'location', mentionCount: 5 }),
    ];
    render(<EntityCatalog entities={entities} />);
    expect(screen.getByText('Alice')).toBeDefined();
    expect(screen.getByText('Castle')).toBeDefined();
    // Group headers (h3) — disambiguate from filter button with same label
    expect(screen.getByRole('heading', { name: /Characters/ })).toBeDefined();
    expect(screen.getByRole('heading', { name: /Locations/ })).toBeDefined();
  });

  it('filters by search text', () => {
    const entities = [
      makeEntity({ id: 'c-1', name: 'Alice', type: 'character' }),
      makeEntity({ id: 'c-2', name: 'Bob', type: 'character', mentionCount: 5 }),
    ];
    render(<EntityCatalog entities={entities} />);

    const searchInput = screen.getByLabelText('Search entities');
    fireEvent.change(searchInput, { target: { value: 'alice' } });

    expect(screen.getByText('Alice')).toBeDefined();
    expect(screen.queryByText('Bob')).toBeNull();
  });

  it('filters by type buttons using aria-pressed', () => {
    const entities = [
      makeEntity({ id: 'c-1', name: 'Alice', type: 'character' }),
      makeEntity({ id: 'l-1', name: 'Castle', type: 'location', mentionCount: 5 }),
    ];
    render(<EntityCatalog entities={entities} />);

    // Find the Locations filter button and click it
    const locationBtn = screen.getByText('Locations');
    fireEvent.click(locationBtn);

    // Location button should be pressed
    expect(locationBtn.closest('button')!.getAttribute('aria-pressed')).toBe('true');

    // Castle should be visible, Alice should not
    expect(screen.getByText('Castle')).toBeDefined();
    expect(screen.queryByText('Alice')).toBeNull();
  });

  it('shows "No entities found" for empty results', () => {
    render(<EntityCatalog entities={[]} />);
    expect(screen.getByText(/No entities found/)).toBeDefined();
  });

  it('shows "No entities found" when filter yields no results', () => {
    const entities = [
      makeEntity({ id: 'c-1', name: 'Alice', type: 'character' }),
    ];
    render(<EntityCatalog entities={entities} />);

    const searchInput = screen.getByLabelText('Search entities');
    fireEvent.change(searchInput, { target: { value: 'zzzzz' } });

    expect(screen.getByText(/No entities found/)).toBeDefined();
  });

  it('calls onSelect when entity clicked', () => {
    const onSelect = vi.fn();
    const entity = makeEntity({ id: 'c-1', name: 'Alice' });
    render(<EntityCatalog entities={[entity]} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('Alice'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(entity);
  });

  it('sorts by mentionCount descending', () => {
    const entities = [
      makeEntity({ id: 'c-1', name: 'Low', type: 'character', mentionCount: 2 }),
      makeEntity({ id: 'c-2', name: 'High', type: 'character', mentionCount: 20 }),
      makeEntity({ id: 'c-3', name: 'Mid', type: 'character', mentionCount: 10 }),
    ];
    const { container } = render(<EntityCatalog entities={entities} />);

    const names = Array.from(container.querySelectorAll('.truncate'))
      .map(el => el.textContent)
      .filter(t => ['Low', 'High', 'Mid'].includes(t!));

    expect(names[0]).toBe('High');
    expect(names[1]).toBe('Mid');
    expect(names[2]).toBe('Low');
  });

  it('shows All button as pressed by default', () => {
    render(<EntityCatalog entities={[]} />);
    const allBtn = screen.getByText('All');
    expect(allBtn.closest('button')!.getAttribute('aria-pressed')).toBe('true');
  });

  it('shows mention count for each entity', () => {
    const entities = [
      makeEntity({ id: 'c-1', name: 'Alice', mentionCount: 7 }),
    ];
    render(<EntityCatalog entities={entities} />);
    expect(screen.getByText('7 mentions')).toBeDefined();
  });

  it('shows chapter number for entity with valid firstAppearanceChapter', () => {
    const entities = [
      makeEntity({ id: 'c-1', name: 'Alice', firstAppearanceChapter: 2 }),
    ];
    render(<EntityCatalog entities={entities} />);
    // 0-based index 2 => Ch.3
    expect(screen.getByText('Ch.3')).toBeDefined();
  });
});
