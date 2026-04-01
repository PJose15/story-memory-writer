import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  Timer: (props: any) => <span data-testid="icon-timer" {...props} />,
  Pen: (props: any) => <span data-testid="icon-pen" {...props} />,
  Mountain: (props: any) => <span data-testid="icon-mountain" {...props} />,
  MessageCircle: (props: any) => <span data-testid="icon-messagecircle" {...props} />,
  Flame: (props: any) => <span data-testid="icon-flame" {...props} />,
}));

vi.mock('@/components/antiquarian', () => ({
  ParchmentCard: ({ children, ...props }: any) => <div data-testid="parchment-card" {...props}>{children}</div>,
  BrassButton: ({ children, onClick, disabled, ...props }: any) => <button onClick={onClick} disabled={disabled} {...props}>{children}</button>,
}));

import { SprintLauncher } from '@/components/gamification/sprint-launcher';

describe('SprintLauncher', () => {
  afterEach(cleanup);

  it('renders all 5 sprint themes', () => {
    render(<SprintLauncher onStart={vi.fn()} />);

    expect(screen.getByText('Quick Focus')).toBeDefined();
    expect(screen.getByText('Deep Dive')).toBeDefined();
    expect(screen.getByText('Marathon Push')).toBeDefined();
    expect(screen.getByText('Dialogue Sprint')).toBeDefined();
    expect(screen.getByText('Conflict Burst')).toBeDefined();
  });

  it('shows theme name, duration, and target words', () => {
    render(<SprintLauncher onStart={vi.fn()} />);

    // Quick Focus: 15m, 250w
    expect(screen.getByText(/15m/)).toBeDefined();
    expect(screen.getByText(/250w/)).toBeDefined();
  });

  it('calls onStart with theme when Begin clicked', () => {
    const onStart = vi.fn();
    render(<SprintLauncher onStart={onStart} />);

    const buttons = screen.getAllByText('Begin');
    expect(buttons.length).toBe(5);

    // Click the first one (Quick Focus)
    fireEvent.click(buttons[0]);

    expect(onStart).toHaveBeenCalledWith('quick-focus');
  });
});
