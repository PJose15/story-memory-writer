import type { XPState, XPEvent } from '@/lib/types/gamification';

const MAX_EVENTS = 200;

// ─── XP Award Rates ───

export const XP_RATES = {
  WORDS_100: 10,
  SESSION_COMPLETE: 25,
  CHAPTER_FINISHED: 100,
  QUEST_COMPLETE: 50,
  SPRINT_COMPLETE: 75,
  STREAK_MILESTONE: 200,
} as const;

// ─── Level Formula ───
// xpForLevel(n) = 100 * n * (n+1) / 2
// Level 1: 100 XP, Level 2: 300 XP cumulative, Level 5: 1500 XP, Level 10: 5500 XP

export function xpForLevel(level: number): number {
  if (level < 1) return 0;
  // M17: Cap at level 1000 to prevent overflow (level 1000 = 50,050,000 XP)
  const safeLev = Math.min(level, 1000);
  return 100 * safeLev * (safeLev + 1) / 2;
}

export function calculateLevel(totalXP: number): number {
  if (!Number.isFinite(totalXP) || totalXP < 0) return 1;
  let level = 1;
  while (level <= 1000 && xpForLevel(level) <= totalXP) {
    level++;
  }
  return level - 1 || 1;
}

export function xpToNextLevel(totalXP: number): { current: number; needed: number; progress: number } {
  const safeXP = (!Number.isFinite(totalXP) || totalXP < 0) ? 0 : totalXP;
  const level = calculateLevel(safeXP);
  const currentLevelXP = xpForLevel(level);
  const nextLevelXP = xpForLevel(level + 1);

  // Below level 1 threshold (0-99 XP): show progress toward level 1
  if (safeXP < currentLevelXP) {
    const floor = level <= 1 ? 0 : xpForLevel(level - 1);
    const current = safeXP - floor;
    const needed = currentLevelXP - floor;
    const progress = needed > 0 ? Math.min(100, (current / needed) * 100) : 100;
    return { current, needed, progress };
  }

  const current = safeXP - currentLevelXP;
  const needed = nextLevelXP - currentLevelXP;
  const progress = needed > 0 ? Math.min(100, (current / needed) * 100) : 100;
  return { current, needed, progress };
}

// ─── XP Award ───

// L2: Known XP event types for type safety
export type XPEventType = 'words' | 'session' | 'chapter' | 'quest' | 'sprint' | 'streak' | (string & {});

export function awardXP(
  xpState: XPState,
  type: XPEventType,
  amount: number,
  metadata?: string,
): XPState {
  if (!(amount > 0) || !Number.isFinite(amount)) return xpState;

  const event: XPEvent = {
    id: crypto.randomUUID(),
    type,
    amount,
    metadata,
    timestamp: new Date().toISOString(),
  };

  const newTotalXP = Math.min(xpState.totalXP + amount, 50_050_000);
  const newLevel = calculateLevel(newTotalXP);

  // Append event, prune to MAX_EVENTS
  const events = [...xpState.events, event];
  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS);
  }

  return {
    totalXP: newTotalXP,
    level: newLevel,
    events,
  };
}
