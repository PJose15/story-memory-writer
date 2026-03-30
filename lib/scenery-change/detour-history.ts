import type { DetourSession } from './types';

const STORAGE_KEY = 'zagafy_detour_history';
const MAX_HISTORY = 50;

// M13: Module-level cache to avoid re-parsing localStorage on every call
let _cachedRaw: string | null = null;
let _cachedHistory: DetourSession[] | null = null;

function isDetourSession(v: unknown): v is DetourSession {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.type === 'string' &&
    typeof o.startedAt === 'string' &&
    typeof o.prompt === 'string' &&
    typeof o.content === 'string' &&
    typeof o.wordCount === 'number'
  );
}

export function readDetourHistory(): DetourSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === _cachedRaw && _cachedHistory !== null) return _cachedHistory;
    _cachedRaw = raw;
    if (!raw) { _cachedHistory = []; return []; }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) { _cachedHistory = []; return []; }
    _cachedHistory = parsed.filter(isDetourSession);
    return _cachedHistory;
  } catch {
    return [];
  }
}

function writeDetourHistory(sessions: DetourSession[]): void {
  _cachedRaw = null; _cachedHistory = null; // M13: Invalidate cache on write
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(-MAX_HISTORY)));
  } catch {
    // Storage quota exceeded
  }
}

export function saveDetourSession(session: DetourSession): void {
  const history = readDetourHistory();
  const existing = history.findIndex(s => s.id === session.id);
  if (existing !== -1) {
    history[existing] = session;
  } else {
    history.push(session);
  }
  writeDetourHistory(history);
}

export function getDetourSession(id: string): DetourSession | undefined {
  return readDetourHistory().find(s => s.id === id);
}

export function getDetourStats(): {
  totalDetours: number;
  totalWords: number;
  favoriteType: string | null;
} {
  const history = readDetourHistory();
  if (history.length === 0) {
    return { totalDetours: 0, totalWords: 0, favoriteType: null };
  }

  const typeCounts = new Map<string, number>();
  let totalWords = 0;
  for (const s of history) {
    totalWords += s.wordCount;
    typeCounts.set(s.type, (typeCounts.get(s.type) || 0) + 1);
  }

  let favoriteType: string | null = null;
  let maxCount = 0;
  for (const [type, count] of typeCounts) {
    if (count > maxCount) {
      maxCount = count;
      favoriteType = type;
    }
  }

  return { totalDetours: history.length, totalWords, favoriteType };
}

export function clearDetourHistory(): void {
  _cachedRaw = null; _cachedHistory = null; // M13: Invalidate cache on clear
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // best effort
  }
}
