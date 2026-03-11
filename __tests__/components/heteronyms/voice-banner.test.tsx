import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { VoiceBanner } from '@/components/heteronyms/voice-banner';
import type { Heteronym } from '@/lib/types/heteronym';

describe('VoiceBanner', () => {
  const guest: Heteronym = {
    id: 'h1',
    name: 'Álvaro de Campos',
    bio: 'A naval engineer',
    styleNote: 'Ecstatic',
    avatarColor: '#E74C3C',
    avatarEmoji: '⚡',
    createdAt: '2026-03-10T10:00:00Z',
    isDefault: false,
  };

  const onClear = vi.fn();

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('displays the guest name', () => {
    render(<VoiceBanner guestHeteronym={guest} onClear={onClear} />);
    expect(screen.getByText('Álvaro de Campos')).toBeTruthy();
  });

  it('shows "Writing as" text', () => {
    render(<VoiceBanner guestHeteronym={guest} onClear={onClear} />);
    expect(screen.getByText(/Writing as/)).toBeTruthy();
  });

  it('calls onClear when dismiss button clicked', () => {
    render(<VoiceBanner guestHeteronym={guest} onClear={onClear} />);
    fireEvent.click(screen.getByLabelText('Stop writing as guest'));
    expect(onClear).toHaveBeenCalled();
  });

  it('has status role with aria-label', () => {
    render(<VoiceBanner guestHeteronym={guest} onClear={onClear} />);
    const banner = screen.getByRole('status');
    expect(banner.getAttribute('aria-label')).toBe('Writing as Álvaro de Campos');
  });

  it('renders the avatar', () => {
    render(<VoiceBanner guestHeteronym={guest} onClear={onClear} />);
    expect(screen.getByText('⚡')).toBeTruthy();
  });
});
