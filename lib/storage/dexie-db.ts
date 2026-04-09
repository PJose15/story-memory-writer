import Dexie, { type Table } from 'dexie';

export interface DexieChapter {
  id: string;
  title: string;
  content: string;
  summary: string;
  canonStatus?: string;
  source?: string;
  updatedAt: number;
}

export interface DexieSession {
  id: string;
  startedAt: string;
  endedAt: string;
  wordsAdded: number;
  flowScore: number | null;
  heteronymId: string | null;
  // Full WritingSession fields stored as JSON blob for forward compat
  data: string;
}

export interface DexieChapterVersion {
  id: string;
  chapterId: string;
  createdAt: string;
  // Full ChapterVersion fields stored as JSON blob
  data: string;
}

export interface DexieMeta {
  id: string;
  completedAt: string;
}

export interface DexieChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  chapterId?: string;
}

class ZagafyDB extends Dexie {
  chapters!: Table<DexieChapter, string>;
  sessions!: Table<DexieSession, string>;
  chapterVersions!: Table<DexieChapterVersion, string>;
  meta!: Table<DexieMeta, string>;
  chatMessages!: Table<DexieChatMessage, string>;

  constructor() {
    super('zagafy');
    this.version(1).stores({
      chapters: 'id, title, updatedAt',
      sessions: 'id, startedAt',
      chatMessages: 'id, timestamp, chapterId',
    });
    this.version(2).stores({
      chapters: 'id, title, updatedAt',
      sessions: 'id, startedAt',
      chapterVersions: 'id, chapterId, createdAt',
      meta: 'id',
      chatMessages: 'id, timestamp, chapterId',
    });
  }
}

export const db = new ZagafyDB();

// ─── Migration from localStorage ───

export async function migrateFromLocalStorage(): Promise<void> {
  try {
    const existing = await db.meta.get('migration');
    if (existing) return; // already migrated

    await db.transaction('rw', [db.chapters, db.chapterVersions, db.sessions, db.meta], async () => {
      // 1. Migrate chapters with content from zagafy_state
      const stateRaw = localStorage.getItem('zagafy_state');
      if (stateRaw) {
        try {
          const state = JSON.parse(stateRaw);
          if (Array.isArray(state.chapters)) {
            const dexieChapters: DexieChapter[] = state.chapters
              .filter((ch: Record<string, unknown>) => ch && typeof ch.id === 'string')
              .map((ch: Record<string, unknown>) => ({
                id: ch.id as string,
                title: (ch.title as string) || '',
                content: (ch.content as string) || '',
                summary: (ch.summary as string) || '',
                canonStatus: ch.canonStatus as string | undefined,
                source: ch.source as string | undefined,
                updatedAt: Date.now(),
              }));
            if (dexieChapters.length > 0) {
              await db.chapters.bulkPut(dexieChapters);
            }

            // Strip content from chapters in localStorage (keep stubs)
            state.chapters = state.chapters.map((ch: Record<string, unknown>) => ({
              ...ch,
              content: '',
            }));
            localStorage.setItem('zagafy_state', JSON.stringify(state));
          }
        } catch {
          // Parse error — leave localStorage intact
        }
      }

      // 2. Migrate chapter versions
      const versionsRaw = localStorage.getItem('zagafy_chapter_versions');
      if (versionsRaw) {
        try {
          const versions = JSON.parse(versionsRaw);
          if (Array.isArray(versions)) {
            const dexieVersions: DexieChapterVersion[] = versions
              .filter((v: Record<string, unknown>) => v && typeof v.id === 'string')
              .map((v: Record<string, unknown>) => ({
                id: v.id as string,
                chapterId: (v.chapterId as string) || '',
                createdAt: (v.createdAt as string) || new Date().toISOString(),
                data: JSON.stringify(v),
              }));
            if (dexieVersions.length > 0) {
              await db.chapterVersions.bulkPut(dexieVersions);
            }
          }
          localStorage.removeItem('zagafy_chapter_versions');
        } catch {
          // Parse error — leave localStorage intact
        }
      }

      // 3. Migrate writing sessions
      const sessionsRaw = localStorage.getItem('zagafy_sessions');
      if (sessionsRaw) {
        try {
          const sessions = JSON.parse(sessionsRaw);
          if (Array.isArray(sessions)) {
            const dexieSessions: DexieSession[] = sessions
              .filter((s: Record<string, unknown>) => s && typeof s.id === 'string')
              .map((s: Record<string, unknown>) => ({
                id: s.id as string,
                startedAt: (s.startedAt as string) || '',
                endedAt: (s.endedAt as string) || '',
                wordsAdded: (s.wordsAdded as number) || 0,
                flowScore: (s.flowScore as number) ?? null,
                heteronymId: (s.heteronymId as string) ?? null,
                data: JSON.stringify(s),
              }));
            if (dexieSessions.length > 0) {
              await db.sessions.bulkPut(dexieSessions);
            }
          }
          localStorage.removeItem('zagafy_sessions');
        } catch {
          // Parse error — leave localStorage intact
        }
      }

      // 4. Mark migration complete
      await db.meta.put({ id: 'migration', completedAt: new Date().toISOString() });
    });
  } catch (e) {
    console.error('[dexie] Migration failed, falling back to localStorage', e);
  }
}

// ─── Chapter Content CRUD ───

export async function getChapterContent(id: string): Promise<string> {
  const row = await db.chapters.get(id);
  return row?.content ?? '';
}

export async function putChapterContent(id: string, content: string, title = '', summary = '', canonStatus?: string, source?: string): Promise<void> {
  await db.chapters.put({
    id,
    title,
    content,
    summary,
    canonStatus,
    source,
    updatedAt: Date.now(),
  });
}

export async function getAllChapterContents(): Promise<Map<string, string>> {
  const all = await db.chapters.toArray();
  const map = new Map<string, string>();
  for (const ch of all) {
    map.set(ch.id, ch.content);
  }
  return map;
}

export async function deleteChapterContent(id: string): Promise<void> {
  await db.chapters.delete(id);
}

// ─── Chapter Versions CRUD ───

export async function getVersions(chapterId: string): Promise<Record<string, unknown>[]> {
  const rows = await db.chapterVersions.where('chapterId').equals(chapterId).toArray();
  return rows.map(r => {
    try { return JSON.parse(r.data); }
    catch { return null; }
  }).filter(Boolean) as Record<string, unknown>[];
}

export async function getAllVersions(): Promise<Record<string, unknown>[]> {
  const rows = await db.chapterVersions.toArray();
  return rows.map(r => {
    try { return JSON.parse(r.data); }
    catch { return null; }
  }).filter(Boolean) as Record<string, unknown>[];
}

export async function putVersion(version: Record<string, unknown>): Promise<void> {
  await db.chapterVersions.put({
    id: version.id as string,
    chapterId: (version.chapterId as string) || '',
    createdAt: (version.createdAt as string) || new Date().toISOString(),
    data: JSON.stringify(version),
  });
}

export async function putAllVersions(versions: Record<string, unknown>[]): Promise<void> {
  const rows: DexieChapterVersion[] = versions.map(v => ({
    id: v.id as string,
    chapterId: (v.chapterId as string) || '',
    createdAt: (v.createdAt as string) || new Date().toISOString(),
    data: JSON.stringify(v),
  }));
  await db.chapterVersions.clear();
  if (rows.length > 0) {
    await db.chapterVersions.bulkPut(rows);
  }
}

export async function deleteVersionById(id: string): Promise<void> {
  await db.chapterVersions.delete(id);
}

// ─── Sessions CRUD ───

export async function getSessions(): Promise<Record<string, unknown>[]> {
  const rows = await db.sessions.toArray();
  return rows.map(r => {
    try { return JSON.parse(r.data); }
    catch { return null; }
  }).filter(Boolean) as Record<string, unknown>[];
}

export async function putSession(session: Record<string, unknown>): Promise<void> {
  await db.sessions.put({
    id: session.id as string,
    startedAt: (session.startedAt as string) || '',
    endedAt: (session.endedAt as string) || '',
    wordsAdded: (session.wordsAdded as number) || 0,
    flowScore: (session.flowScore as number) ?? null,
    heteronymId: (session.heteronymId as string) ?? null,
    data: JSON.stringify(session),
  });
}

export async function putAllSessions(sessions: Record<string, unknown>[]): Promise<void> {
  const rows: DexieSession[] = sessions.map(s => ({
    id: s.id as string,
    startedAt: (s.startedAt as string) || '',
    endedAt: (s.endedAt as string) || '',
    wordsAdded: (s.wordsAdded as number) || 0,
    flowScore: (s.flowScore as number) ?? null,
    heteronymId: (s.heteronymId as string) ?? null,
    data: JSON.stringify(s),
  }));
  await db.sessions.clear();
  if (rows.length > 0) {
    await db.sessions.bulkPut(rows);
  }
}
