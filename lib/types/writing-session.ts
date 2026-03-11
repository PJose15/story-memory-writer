const SESSIONS_KEY = 'zagafy_sessions';
const WIP_KEY = 'zagafy_session_wip';
const PROJECT_ID_KEY = 'zagafy_project_id';

export type FlowScore = 1 | 2 | 3 | 4 | 5;

export interface WritingSession {
  id: string;
  projectId: string;
  projectName: string;
  startedAt: string; // ISO 8601
  endedAt: string;   // ISO 8601
  wordsStart: number;
  wordsEnd: number;
  wordsAdded: number;
  flowScore: FlowScore | null;
  heteronymId: string | null;
  heteronymName: string | null;
}

function isFlowScore(v: unknown): v is FlowScore | null {
  return v === null || (typeof v === 'number' && v >= 1 && v <= 5 && Number.isInteger(v));
}

function isNullableString(v: unknown): boolean {
  return v === null || v === undefined || typeof v === 'string';
}

function isWritingSession(v: unknown): v is WritingSession {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  if (
    typeof o.id !== 'string' ||
    typeof o.projectId !== 'string' ||
    typeof o.projectName !== 'string' ||
    typeof o.startedAt !== 'string' ||
    typeof o.endedAt !== 'string' ||
    typeof o.wordsStart !== 'number' ||
    typeof o.wordsEnd !== 'number' ||
    typeof o.wordsAdded !== 'number' ||
    !isFlowScore(o.flowScore)
  ) {
    return false;
  }
  // Backward compatible: existing sessions without heteronym fields are valid
  if (!isNullableString(o.heteronymId) || !isNullableString(o.heteronymName)) {
    return false;
  }
  // Normalize missing fields to null
  o.heteronymId = o.heteronymId ?? null;
  o.heteronymName = o.heteronymName ?? null;
  return true;
}

export function readSessions(): WritingSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isWritingSession);
  } catch {
    return [];
  }
}

export function writeSessions(sessions: WritingSession[]): void {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    // Storage quota exceeded — caller should handle via toast
  }
}

export function addSession(session: WritingSession): void {
  const sessions = readSessions();
  sessions.push(session);
  writeSessions(sessions);
}

export function updateSessionFlowScore(sessionId: string, score: FlowScore): void {
  const sessions = readSessions();
  const idx = sessions.findIndex(s => s.id === sessionId);
  if (idx === -1) return;
  sessions[idx] = { ...sessions[idx], flowScore: score };
  writeSessions(sessions);
}

export function getProjectId(): string {
  try {
    const existing = localStorage.getItem(PROJECT_ID_KEY);
    if (existing && typeof existing === 'string' && existing.length > 0) {
      return existing;
    }
    const newId = crypto.randomUUID();
    localStorage.setItem(PROJECT_ID_KEY, newId);
    return newId;
  } catch {
    return crypto.randomUUID();
  }
}

export function saveWipSession(session: Omit<WritingSession, 'endedAt' | 'wordsEnd' | 'wordsAdded' | 'flowScore'> & { currentWords: number }): void {
  try {
    localStorage.setItem(WIP_KEY, JSON.stringify(session));
  } catch {
    // Quota exceeded — best effort
  }
}

export function readWipSession(): (Omit<WritingSession, 'endedAt' | 'wordsEnd' | 'wordsAdded' | 'flowScore'> & { currentWords: number }) | null {
  try {
    const raw = localStorage.getItem(WIP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof parsed.id === 'string' &&
      typeof parsed.projectId === 'string' &&
      typeof parsed.projectName === 'string' &&
      typeof parsed.startedAt === 'string' &&
      typeof parsed.wordsStart === 'number' &&
      typeof parsed.currentWords === 'number'
    ) {
      // Normalize missing heteronym fields
      parsed.heteronymId = parsed.heteronymId ?? null;
      parsed.heteronymName = parsed.heteronymName ?? null;
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearWipSession(): void {
  try {
    localStorage.removeItem(WIP_KEY);
  } catch {
    // best effort
  }
}
