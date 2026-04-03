import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/storage/dexie-db';

describe('dexie-db', () => {
  beforeEach(async () => {
    await db.chapters.clear();
    await db.sessions.clear();
    await db.chatMessages.clear();
  });

  it('should have chapters, sessions, and chatMessages tables', () => {
    expect(db.chapters).toBeDefined();
    expect(db.sessions).toBeDefined();
    expect(db.chatMessages).toBeDefined();
  });

  it('should CRUD chapters', async () => {
    const chapter = { id: 'ch-1', title: 'Test', content: 'Hello', summary: 'Sum', updatedAt: Date.now() };
    await db.chapters.add(chapter);
    const found = await db.chapters.get('ch-1');
    expect(found?.title).toBe('Test');

    await db.chapters.update('ch-1', { title: 'Updated' });
    const updated = await db.chapters.get('ch-1');
    expect(updated?.title).toBe('Updated');

    await db.chapters.delete('ch-1');
    const deleted = await db.chapters.get('ch-1');
    expect(deleted).toBeUndefined();
  });

  it('should CRUD sessions', async () => {
    const session = { id: 's-1', startedAt: '2026-01-01', endedAt: '2026-01-01', wordsAdded: 100, flowScore: 3, heteronymId: null };
    await db.sessions.add(session);
    const found = await db.sessions.get('s-1');
    expect(found?.wordsAdded).toBe(100);
  });

  it('should CRUD chat messages', async () => {
    const msg = { id: 'm-1', role: 'user' as const, content: 'Hello', timestamp: Date.now() };
    await db.chatMessages.add(msg);
    const found = await db.chatMessages.get('m-1');
    expect(found?.content).toBe('Hello');
  });

  it('should query by index', async () => {
    await db.chatMessages.bulkAdd([
      { id: 'm-1', role: 'user', content: 'A', timestamp: 1000, chapterId: 'ch-1' },
      { id: 'm-2', role: 'assistant', content: 'B', timestamp: 2000, chapterId: 'ch-1' },
      { id: 'm-3', role: 'user', content: 'C', timestamp: 3000, chapterId: 'ch-2' },
    ]);
    const ch1Messages = await db.chatMessages.where('chapterId').equals('ch-1').toArray();
    expect(ch1Messages).toHaveLength(2);
  });
});
