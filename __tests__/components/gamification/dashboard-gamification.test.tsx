import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { defaultGamificationState, defaultFinishingState, defaultStreakState } from '@/lib/types/gamification';

const mockUseGamification = vi.fn();

vi.mock('@/hooks/use-gamification', () => ({
  useGamification: () => mockUseGamification(),
}));

vi.mock('@/components/gamification/streak-badge', () => ({
  StreakBadge: (props: any) => <div data-testid="streak-badge" data-streak={props.streak}>{`streak:${props.streak}`}</div>,
}));

vi.mock('@/components/gamification/xp-bar', () => ({
  XPBar: (props: any) => <div data-testid="xp-bar" data-level={props.level}>{`level:${props.level}`}</div>,
}));

vi.mock('@/components/gamification/quest-panel', () => ({
  QuestPanel: (props: any) => <div data-testid="quest-panel">{`quests:${props.quests.length}`}</div>,
}));

vi.mock('@/components/gamification/finishing-progress', () => ({
  FinishingProgress: (props: any) => <div data-testid="finishing-progress">{`progress:${props.finishing.overallProgress}`}</div>,
}));

import { DashboardGamification } from '@/components/gamification/dashboard-gamification';

const makeLoadedState = () => ({
  gamification: defaultGamificationState(),
  isLoaded: true,
  xpProgress: { current: 50, needed: 100, progress: 50 },
  awardXP: vi.fn(),
  streak: defaultStreakState(),
  streakWarning: null,
  quests: [],
  completeQuest: vi.fn(),
  activeSprint: null,
  startSprint: vi.fn(),
  endSprint: vi.fn(),
  abandonSprint: vi.fn(),
  finishing: defaultFinishingState(),
  refreshFinishing: vi.fn(),
});

describe('DashboardGamification', () => {
  afterEach(cleanup);

  it('shows loading skeleton when isLoaded=false', () => {
    mockUseGamification.mockReturnValue({
      ...makeLoadedState(),
      isLoaded: false,
    });

    render(<DashboardGamification />);

    expect(screen.getByLabelText('Loading gamification data')).toBeDefined();
    expect(screen.queryByTestId('streak-badge')).toBeNull();
    expect(screen.queryByTestId('xp-bar')).toBeNull();
  });

  it('renders all child components when isLoaded=true', () => {
    mockUseGamification.mockReturnValue(makeLoadedState());

    render(<DashboardGamification />);

    expect(screen.getByTestId('streak-badge')).toBeDefined();
    expect(screen.getByTestId('xp-bar')).toBeDefined();
    expect(screen.getByTestId('quest-panel')).toBeDefined();
    expect(screen.getByTestId('finishing-progress')).toBeDefined();
  });

  it('passes correct props to children', () => {
    const state = makeLoadedState();
    state.gamification.xp.level = 7;
    state.xpProgress = { current: 80, needed: 120, progress: 67 };
    state.streak = { ...defaultStreakState(), currentStreak: 5 };
    state.finishing = { ...defaultFinishingState(), overallProgress: 42 };
    mockUseGamification.mockReturnValue(state);

    render(<DashboardGamification />);

    expect(screen.getByTestId('streak-badge').getAttribute('data-streak')).toBe('5');
    expect(screen.getByTestId('xp-bar').getAttribute('data-level')).toBe('7');
    expect(screen.getByTestId('finishing-progress').textContent).toContain('progress:42');
  });
});
