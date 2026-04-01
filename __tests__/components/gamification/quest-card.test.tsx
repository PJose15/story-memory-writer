import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import type { DailyQuest } from '@/lib/types/gamification';

vi.mock('lucide-react', () => ({
  MessageSquareText: (props: any) => <span data-testid="icon-messagesquaretext" {...props} />,
  Users: (props: any) => <span data-testid="icon-users" {...props} />,
  BookOpen: (props: any) => <span data-testid="icon-bookopen" {...props} />,
  Check: (props: any) => <span data-testid="icon-check" {...props} />,
}));

vi.mock('@/components/antiquarian', () => ({
  ParchmentCard: ({ children, ...props }: any) => <div data-testid="parchment-card" {...props}>{children}</div>,
  BrassButton: ({ children, onClick, disabled, ...props }: any) => <button onClick={onClick} disabled={disabled} {...props}>{children}</button>,
}));

import { QuestCard } from '@/components/gamification/quest-card';

const makeQuest = (overrides: Partial<DailyQuest> = {}): DailyQuest => ({
  id: 'quest-1',
  type: 'dialogue',
  title: 'Write a Conversation',
  description: 'Add a dialogue scene between two characters.',
  xpReward: 25,
  status: 'active',
  dateKey: '2026-03-30',
  ...overrides,
});

describe('QuestCard', () => {
  afterEach(cleanup);

  it('renders quest title, description, type label, and XP reward', () => {
    render(<QuestCard quest={makeQuest()} onComplete={vi.fn()} />);

    expect(screen.getByText('Write a Conversation')).toBeDefined();
    expect(screen.getByText('Add a dialogue scene between two characters.')).toBeDefined();
    expect(screen.getByText('Dialogue')).toBeDefined();
    expect(screen.getByText('+25 XP')).toBeDefined();
  });

  it('shows Complete button for active quest', () => {
    render(<QuestCard quest={makeQuest()} onComplete={vi.fn()} />);

    expect(screen.getByText('Complete')).toBeDefined();
  });

  it('hides Complete button for completed quest', () => {
    render(<QuestCard quest={makeQuest({ status: 'completed' })} onComplete={vi.fn()} />);

    expect(screen.queryByText('Complete')).toBeNull();
  });

  it('calls onComplete on button click', () => {
    const onComplete = vi.fn();
    render(<QuestCard quest={makeQuest({ id: 'q-42' })} onComplete={onComplete} />);

    fireEvent.click(screen.getByText('Complete'));

    expect(onComplete).toHaveBeenCalledWith('q-42');
  });

  it('prevents double-click (completing state)', () => {
    const onComplete = vi.fn();
    render(<QuestCard quest={makeQuest()} onComplete={onComplete} />);

    const button = screen.getByText('Complete');
    fireEvent.click(button);
    fireEvent.click(button);

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('shows Completed icon for completed status', () => {
    render(<QuestCard quest={makeQuest({ status: 'completed' })} onComplete={vi.fn()} />);

    expect(screen.getByLabelText('Completed')).toBeDefined();
  });
});
