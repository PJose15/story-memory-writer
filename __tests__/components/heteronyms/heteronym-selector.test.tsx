import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { HeteronymSelector } from '@/components/heteronyms/heteronym-selector';
import type { Heteronym } from '@/lib/types/heteronym';

function makeHeteronym(overrides: Partial<Heteronym> = {}): Heteronym {
  return {
    id: 'het-1',
    name: 'Álvaro',
    bio: '',
    styleNote: 'Ecstatic',
    avatarColor: '#E74C3C',
    avatarEmoji: '⚡',
    createdAt: '2026-03-10T10:00:00Z',
    isDefault: false,
    ...overrides,
  };
}

const heteronyms = [
  makeHeteronym({ id: 'def', name: 'Myself', isDefault: true, styleNote: '' }),
  makeHeteronym({ id: 'h1', name: 'Álvaro', styleNote: 'Ecstatic' }),
  makeHeteronym({ id: 'h2', name: 'Ricardo', styleNote: 'Classical' }),
];

describe('HeteronymSelector', () => {
  const onSelect = vi.fn();

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the active heteronym name', () => {
    render(<HeteronymSelector heteronyms={heteronyms} activeId="h1" onSelect={onSelect} />);
    expect(screen.getByText('Álvaro')).toBeTruthy();
  });

  it('opens dropdown on click', () => {
    render(<HeteronymSelector heteronyms={heteronyms} activeId="def" onSelect={onSelect} />);
    fireEvent.click(screen.getByLabelText('Select writing voice'));
    expect(screen.getByRole('listbox')).toBeTruthy();
  });

  it('shows all heteronyms in dropdown', () => {
    render(<HeteronymSelector heteronyms={heteronyms} activeId="def" onSelect={onSelect} />);
    fireEvent.click(screen.getByLabelText('Select writing voice'));
    expect(screen.getByRole('option', { name: /Myself/ })).toBeTruthy();
    expect(screen.getByRole('option', { name: /Álvaro/ })).toBeTruthy();
    expect(screen.getByRole('option', { name: /Ricardo/ })).toBeTruthy();
  });

  it('calls onSelect when option clicked', () => {
    render(<HeteronymSelector heteronyms={heteronyms} activeId="def" onSelect={onSelect} />);
    fireEvent.click(screen.getByLabelText('Select writing voice'));
    fireEvent.click(screen.getByRole('option', { name: /Álvaro/ }));
    expect(onSelect).toHaveBeenCalledWith('h1');
  });

  it('closes dropdown after selection', () => {
    render(<HeteronymSelector heteronyms={heteronyms} activeId="def" onSelect={onSelect} />);
    fireEvent.click(screen.getByLabelText('Select writing voice'));
    fireEvent.click(screen.getByRole('option', { name: /Ricardo/ }));
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('closes on Escape key', () => {
    render(<HeteronymSelector heteronyms={heteronyms} activeId="def" onSelect={onSelect} />);
    fireEvent.click(screen.getByLabelText('Select writing voice'));
    expect(screen.getByRole('listbox')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('marks active option with aria-selected', () => {
    render(<HeteronymSelector heteronyms={heteronyms} activeId="h1" onSelect={onSelect} />);
    fireEvent.click(screen.getByLabelText('Select writing voice'));
    const activeOption = screen.getByRole('option', { name: /Álvaro/ });
    expect(activeOption.getAttribute('aria-selected')).toBe('true');
  });

  it('shows style notes in dropdown', () => {
    render(<HeteronymSelector heteronyms={heteronyms} activeId="def" onSelect={onSelect} />);
    fireEvent.click(screen.getByLabelText('Select writing voice'));
    expect(screen.getByText('Ecstatic')).toBeTruthy();
    expect(screen.getByText('Classical')).toBeTruthy();
  });

  it('returns null when no heteronyms', () => {
    const { container } = render(<HeteronymSelector heteronyms={[]} activeId={null} onSelect={onSelect} />);
    expect(container.innerHTML).toBe('');
  });
});
