import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import type { DailyQuest } from '@/lib/types/gamification';

vi.mock('lucide-react', () => ({
  Scroll: (props: any) => <span data-testid="icon-scroll" {...props} />,
  MessageSquareText: (props: any) => <span data-testid="icon-messagesquaretext" {...props} />,
  Users: (props: any) => <span data-testid="icon-users" {...props} />,
  BookOpen: (props: any) => <span data-testid="icon-bookopen" {...props} />,
  Check: (props: any) => <span data-testid="icon-check" {...props} />,
}));

vi.mock('@/components/antiquarian', () => ({
  ParchmentCard: ({ children, ...props }: any) => <div data-testid="parchment-card" {...props}>{children}</div>,
  BrassButton: ({ children, onClick, disabled, ...props }: any) => <button onClick={onClick} disabled={disabled} {...props}>{children}</button>,
  DecorativeDivider: () => <hr />,
}));

import { QuestPanel } from '@/components/gamification/quest-panel';

const sampleQuests: DailyQuest[] = [
  {
    id: 'q1',
    type: 'dialogue',
    title: 'Quest One',
    description: 'First quest',
    xpReward: 20,
    status: 'active',
    dateKey: '2026-03-30',
  },
  {
    id: 'q2',
    type: 'story',
    title: 'Quest Two',
    description: 'Second quest',
    xpReward: 30,
    status: 'active',
    dateKey: '2026-03-30',
  },
];

describe('QuestPanel', () => {
  afterEach(cleanup);

  it('renders heading "Daily Quests"', () => {
    render(<QuestPanel quests={sampleQuests} onComplete={vi.fn()} />);

    expect(screen.getByText('Daily Quests')).toBeDefined();
  });

  it('renders quest cards for each quest', () => {
    render(<QuestPanel quests={sampleQuests} onComplete={vi.fn()} />);

    expect(screen.getByText('Quest One')).toBeDefined();
    expect(screen.getByText('Quest Two')).toBeDefined();
  });

  it('shows empty state when quests is empty array', () => {
    render(<QuestPanel quests={[]} onComplete={vi.fn()} />);

    expect(screen.getByText(/No quests available today/)).toBeDefined();
  });
});
