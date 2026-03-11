const BRAINDUMPS_KEY = 'zagafy_braindumps';
const TEMP_KEY = 'zagafy_braindump_temp';
const MAX_ENTRIES = 10;

export interface BraindumpEntry {
  id: string;
  timestamp: string;        // ISO 8601
  durationSeconds: number;
  language: string;          // e.g. 'en-US', 'auto'
  projectId: string;
  projectName: string;
  rawTranscript: string;
  polishedText: string | null;
  wasPolished: boolean;
  wordCount: number;
}

export interface BraindumpTemp {
  transcript: string;
  language: string;
  elapsedSeconds: number;
  savedAt: string;
}

export function isBraindumpEntry(v: unknown): v is BraindumpEntry {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.timestamp === 'string' &&
    typeof o.durationSeconds === 'number' &&
    typeof o.language === 'string' &&
    typeof o.projectId === 'string' &&
    typeof o.projectName === 'string' &&
    typeof o.rawTranscript === 'string' &&
    (o.polishedText === null || typeof o.polishedText === 'string') &&
    typeof o.wasPolished === 'boolean' &&
    typeof o.wordCount === 'number'
  );
}

export function readBraindumps(): BraindumpEntry[] {
  try {
    const raw = localStorage.getItem(BRAINDUMPS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isBraindumpEntry);
  } catch {
    return [];
  }
}

export function writeBraindumps(entries: BraindumpEntry[]): void {
  try {
    // Enforce max entries — keep newest
    const trimmed = entries.slice(-MAX_ENTRIES);
    localStorage.setItem(BRAINDUMPS_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage quota exceeded
  }
}

export function addBraindump(entry: BraindumpEntry): void {
  const entries = readBraindumps();
  entries.push(entry);
  writeBraindumps(entries);
}

export function updateBraindump(id: string, updates: Partial<Pick<BraindumpEntry, 'polishedText' | 'wasPolished'>>): void {
  const entries = readBraindumps();
  const idx = entries.findIndex(e => e.id === id);
  if (idx === -1) return;
  entries[idx] = { ...entries[idx], ...updates };
  writeBraindumps(entries);
}

export function deleteBraindump(id: string): void {
  const entries = readBraindumps();
  writeBraindumps(entries.filter(e => e.id !== id));
}

export function clearBraindumps(): void {
  try {
    localStorage.removeItem(BRAINDUMPS_KEY);
  } catch {
    // best effort
  }
}

export function saveBraindumpTemp(temp: BraindumpTemp): void {
  try {
    localStorage.setItem(TEMP_KEY, JSON.stringify(temp));
  } catch {
    // Quota exceeded
  }
}

export function readBraindumpTemp(): BraindumpTemp | null {
  try {
    const raw = localStorage.getItem(TEMP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof parsed.transcript === 'string' &&
      typeof parsed.language === 'string' &&
      typeof parsed.elapsedSeconds === 'number' &&
      typeof parsed.savedAt === 'string'
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearBraindumpTemp(): void {
  try {
    localStorage.removeItem(TEMP_KEY);
  } catch {
    // best effort
  }
}
