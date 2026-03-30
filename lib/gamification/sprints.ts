import type { SprintsState, WritingSprint, SprintTheme } from '@/lib/types/gamification';

const MAX_HISTORY = 50;

// ─── Sprint Themes ───

export interface SprintThemeConfig {
  theme: SprintTheme;
  name: string;
  durationMinutes: number;
  targetWords: number;
  prompt: string;
}

export const SPRINT_THEMES: SprintThemeConfig[] = [
  {
    theme: 'quick-focus',
    name: 'Quick Focus',
    durationMinutes: 15,
    targetWords: 250,
    prompt: 'Write without stopping. Don\'t edit, don\'t look back — just move the story forward.',
  },
  {
    theme: 'deep-dive',
    name: 'Deep Dive',
    durationMinutes: 20,
    targetWords: 400,
    prompt: 'Sink into a single scene. Describe the setting, the emotions, the sensory details.',
  },
  {
    theme: 'marathon-push',
    name: 'Marathon Push',
    durationMinutes: 30,
    targetWords: 600,
    prompt: 'Push through an extended session. Cover ground — move from one scene to the next.',
  },
  {
    theme: 'dialogue-sprint',
    name: 'Dialogue Sprint',
    durationMinutes: 20,
    targetWords: 350,
    prompt: 'Focus on conversation. Let your characters talk — reveal tension through what they say and don\'t say.',
  },
  {
    theme: 'conflict-burst',
    name: 'Conflict Burst',
    durationMinutes: 15,
    targetWords: 250,
    prompt: 'Write a scene of pure conflict — argument, chase, confrontation. Keep the tension high.',
  },
];

export function getThemeConfig(theme: SprintTheme): SprintThemeConfig {
  return SPRINT_THEMES.find((t) => t.theme === theme) ?? SPRINT_THEMES[0];
}

// ─── Sprint Actions ───

export function startSprint(state: SprintsState, theme: SprintTheme, wordsStart: number): SprintsState {
  if (state.activeSprint) return state;
  // M6: Validate wordsStart
  if (!Number.isFinite(wordsStart) || wordsStart < 0) wordsStart = 0;

  const config = getThemeConfig(theme);
  const sprint: WritingSprint = {
    id: crypto.randomUUID(),
    theme,
    prompt: config.prompt,
    durationMinutes: config.durationMinutes,
    startTime: new Date().toISOString(),
    endTime: null,
    wordsStart,
    wordsEnd: null,
    wordsWritten: null,
    status: 'active',
    targetWords: config.targetWords,
  };

  return { ...state, activeSprint: sprint };
}

export interface SprintResult {
  wordsWritten: number;
  targetMet: boolean;
  percentOfTarget: number;
  durationMinutes: number;
}

export function endSprint(state: SprintsState, wordsEnd: number): { newState: SprintsState; result: SprintResult | null } {
  if (!state.activeSprint || state.activeSprint.status !== 'active') {
    return { newState: state, result: null };
  }
  // M6: Validate wordsEnd
  if (!Number.isFinite(wordsEnd) || wordsEnd < 0) wordsEnd = 0;

  const sprint = state.activeSprint;
  const wordsWritten = Math.max(0, wordsEnd - sprint.wordsStart);
  const endTime = new Date().toISOString();
  const durationMs = new Date(endTime).getTime() - new Date(sprint.startTime).getTime();
  const durationMinutes = durationMs / 60_000;

  const completedSprint: WritingSprint = {
    ...sprint,
    endTime,
    wordsEnd,
    wordsWritten,
    status: 'completed',
  };

  const sprintHistory = [...state.sprintHistory, completedSprint].slice(-MAX_HISTORY);

  const result: SprintResult = {
    wordsWritten,
    targetMet: wordsWritten >= sprint.targetWords,
    percentOfTarget: sprint.targetWords > 0 ? Math.round((wordsWritten / sprint.targetWords) * 100) : 100,
    durationMinutes: Math.round(durationMinutes * 10) / 10,
  };

  return {
    newState: { activeSprint: null, sprintHistory },
    result,
  };
}

export function abandonSprint(state: SprintsState): SprintsState {
  if (!state.activeSprint) return state;

  // L14: Set null fields consistently on abandon
  const abandoned: WritingSprint = {
    ...state.activeSprint,
    endTime: new Date().toISOString(),
    wordsEnd: null,
    wordsWritten: null,
    status: 'abandoned',
  };

  const sprintHistory = [...state.sprintHistory, abandoned].slice(-MAX_HISTORY);
  return { activeSprint: null, sprintHistory };
}

// ─── Sprint Stats ───

export interface SprintStats {
  totalSprints: number;
  completedSprints: number;
  totalWordsWritten: number;
  totalMinutes: number;
  avgWordsPerSprint: number;
  targetsMetCount: number;
  targetMetRate: number;
}

export function getSprintStats(history: WritingSprint[]): SprintStats {
  const completed = history.filter((s) => s.status === 'completed');
  const totalWordsWritten = completed.reduce((sum, s) => sum + (s.wordsWritten ?? 0), 0);
  // L3/L20: Guard NaN from invalid date parsing
  const totalMinutes = completed.reduce((sum, s) => {
    if (!s.startTime || !s.endTime) return sum;
    const ms = new Date(s.endTime).getTime() - new Date(s.startTime).getTime();
    return sum + (Number.isFinite(ms) ? ms / 60_000 : 0);
  }, 0);
  const targetsMetCount = completed.filter((s) => (s.wordsWritten ?? 0) >= s.targetWords).length;

  return {
    totalSprints: history.length,
    completedSprints: completed.length,
    totalWordsWritten,
    totalMinutes: Math.round(totalMinutes),
    avgWordsPerSprint: completed.length > 0 ? Math.round(totalWordsWritten / completed.length) : 0,
    targetsMetCount,
    targetMetRate: completed.length > 0 ? Math.round((targetsMetCount / completed.length) * 100) : 0,
  };
}
