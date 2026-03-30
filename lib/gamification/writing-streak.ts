import type { WritingStreakState, StreakDay } from '@/lib/types/gamification';
import type { WritingSession } from '@/lib/types/writing-session';

const MAX_HISTORY = 90;
const MIN_SESSION_MINUTES = 10;

// M16: Named constants for streak warning thresholds
const STREAK_WARNING_URGENT_HOUR = 20; // 8 PM — urgent warning
const STREAK_WARNING_REMINDER_HOUR = 18; // 6 PM — gentle reminder

// M16: Cache streak history to avoid rebuilding 90-day array on every mount
let _cachedHistoryKey: string | null = null;
let _cachedHistory: StreakDay[] | null = null;

// ─── Qualifying Session ───

export function isQualifyingSession(session: WritingSession): boolean {
  const start = new Date(session.startedAt).getTime();
  const end = new Date(session.endedAt).getTime();
  if (isNaN(start) || isNaN(end)) return false;
  const durationMinutes = (end - start) / 60_000;
  return durationMinutes >= MIN_SESSION_MINUTES;
}

// ─── Date Helpers ───

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ─── Update Streak ───

export function updateStreak(
  state: WritingStreakState,
  sessions: WritingSession[],
  today?: Date,
): WritingStreakState {
  const todayKey = toDateKey(today ?? new Date());

  // Build set of qualifying dates from sessions
  const qualifyingDates = new Set<string>();
  for (const session of sessions) {
    if (isQualifyingSession(session)) {
      qualifyingDates.add(toDateKey(new Date(session.startedAt)));
    }
  }

  const todayQualified = qualifyingDates.has(todayKey);

  // Compute streak by walking backwards from today
  let currentStreak = 0;
  const checkDate = new Date(todayKey + 'T00:00:00');

  // Start from today if qualified, otherwise from yesterday
  if (!todayQualified) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (qualifyingDates.has(toDateKey(checkDate))) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  const longestStreak = Math.max(state.longestStreak, currentStreak);

  // M16: Build streak history for recent days (last 90), cached by sessions+today
  const cacheKey = `${todayKey}:${sessions.length}:${qualifyingDates.size}`;
  let streakHistory: StreakDay[];
  if (_cachedHistoryKey === cacheKey && _cachedHistory !== null) {
    streakHistory = _cachedHistory;
  } else {
    const historyDate = new Date(todayKey + 'T00:00:00');
    streakHistory = [];
    for (let i = 0; i < MAX_HISTORY; i++) {
      const key = toDateKey(historyDate);
      streakHistory.unshift({ dateKey: key, qualified: qualifyingDates.has(key) });
      historyDate.setDate(historyDate.getDate() - 1);
    }
    _cachedHistoryKey = cacheKey;
    _cachedHistory = streakHistory;
  }

  const lastQualifyingDate = todayQualified
    ? todayKey
    : state.lastQualifyingDate;

  return {
    currentStreak,
    longestStreak,
    lastQualifyingDate,
    todayQualified,
    streakHistory,
  };
}

// ─── Streak Warning ───

export function getStreakWarning(state: WritingStreakState, currentHour: number): string | null {
  if (state.todayQualified) return null;
  if (state.currentStreak === 0) return null;

  if (currentHour >= STREAK_WARNING_URGENT_HOUR) {
    return `Your ${state.currentStreak}-day streak expires at midnight! Write for 10+ minutes to keep it alive.`;
  }
  if (currentHour >= STREAK_WARNING_REMINDER_HOUR) {
    return `Don't forget — write for 10+ minutes today to maintain your ${state.currentStreak}-day streak.`;
  }
  return null;
}

// ─── Streak Milestones ───

export const STREAK_MILESTONES = [7, 30, 100] as const;

export function isStreakMilestone(streak: number): boolean {
  return (STREAK_MILESTONES as readonly number[]).includes(streak);
}
