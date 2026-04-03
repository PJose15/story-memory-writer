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
  chatMessages!: Table<DexieChatMessage, string>;

  constructor() {
    super('zagafy');
    this.version(1).stores({
      chapters: 'id, title, updatedAt',
      sessions: 'id, startedAt',
      chatMessages: 'id, timestamp, chapterId',
    });
  }
}

export const db = new ZagafyDB();
