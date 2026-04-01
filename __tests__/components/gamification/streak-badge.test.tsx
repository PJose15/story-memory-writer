import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  Flame: (props: any) => <span data-testid="icon-flame" {...props} />,
  Bell: (props: any) => <span data-testid="icon-bell" {...props} />,
}));

vi.mock('@/lib/gamification/writing-streak', () => ({
  isStreakMilestone: vi.fn(() => false),
}));

import { StreakBadge } from '@/components/gamification/streak-badge';
import { isStreakMilestone } from '@/lib/gamification/writing-streak';

describe('StreakBadge', () => {
  afterEach(() => {
    cleanup();
    vi.mocked(isStreakMilestone).mockReturnValue(false);
  });

  it('renders "No streak" when streak=0 and no warning', () => {
    render(<StreakBadge streak={0} />);

    expect(screen.getByText('No streak')).toBeDefined();
  });

  it('returns null in compact mode with streak=0', () => {
    const { container } = render(<StreakBadge streak={0} compact />);

    expect(container.innerHTML).toBe('');
  });

  it('shows Day N for positive streak', () => {
    render(<StreakBadge streak={7} />);

    expect(screen.getByText('Day 7')).toBeDefined();
  });

  it('shows warning text with alert role', () => {
    render(<StreakBadge streak={3} warning="Write today to keep your streak!" />);

    const alert = screen.getByRole('alert');
    expect(alert).toBeDefined();
    expect(alert.textContent).toContain('Write today to keep your streak!');
  });

  it('applies milestone styles when isStreakMilestone returns true', () => {
    vi.mocked(isStreakMilestone).mockReturnValue(true);

    render(<StreakBadge streak={30} />);

    const badge = screen.getByLabelText(/milestone/i);
    expect(badge).toBeDefined();
    expect(badge.className).toContain('animate-pulse');
  });

  it('has accessible aria-label with streak count', () => {
    render(<StreakBadge streak={5} />);

    const badge = screen.getByLabelText(/Writing streak: 5 days/);
    expect(badge).toBeDefined();
  });
});
