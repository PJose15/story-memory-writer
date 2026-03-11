import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { VoiceSwitchModal } from '@/components/heteronyms/voice-switch-modal';
import type { Heteronym } from '@/lib/types/heteronym';

// Mock motion/react
vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
}));

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
  makeHeteronym({ id: 'def', name: 'Myself', isDefault: true }),
  makeHeteronym({ id: 'h1', name: 'Álvaro' }),
  makeHeteronym({ id: 'h2', name: 'Ricardo' }),
];

describe('VoiceSwitchModal', () => {
  const defaultProps = {
    heteronyms,
    activeId: 'def',
    guestId: null as string | null,
    onSelect: vi.fn(),
    onClearGuest: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders dialog with title', () => {
    render(<VoiceSwitchModal {...defaultProps} />);
    expect(screen.getByText('Switch Voice')).toBeTruthy();
  });

  it('shows other voices (excludes current)', () => {
    render(<VoiceSwitchModal {...defaultProps} />);
    expect(screen.queryByText('Myself')).toBeNull(); // active, excluded
    expect(screen.getByText('Álvaro')).toBeTruthy();
    expect(screen.getByText('Ricardo')).toBeTruthy();
  });

  it('calls onSelect when voice clicked', () => {
    render(<VoiceSwitchModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Álvaro'));
    expect(defaultProps.onSelect).toHaveBeenCalledWith('h1');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows "Return to own voice" when guest is active', () => {
    render(<VoiceSwitchModal {...defaultProps} guestId="h1" />);
    expect(screen.getByText('Return to own voice')).toBeTruthy();
  });

  it('calls onClearGuest when returning to own voice', () => {
    render(<VoiceSwitchModal {...defaultProps} guestId="h1" />);
    fireEvent.click(screen.getByText('Return to own voice'));
    expect(defaultProps.onClearGuest).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('closes on Escape key', () => {
    render(<VoiceSwitchModal {...defaultProps} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows empty state when no other voices', () => {
    const singleHeteronym = [makeHeteronym({ id: 'def', name: 'Myself', isDefault: true })];
    render(<VoiceSwitchModal {...defaultProps} heteronyms={singleHeteronym} activeId="def" />);
    expect(screen.getByText(/No other voices available/)).toBeTruthy();
  });

  it('has proper ARIA attributes', () => {
    render(<VoiceSwitchModal {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-label')).toBe('Switch writing voice');
  });
});
