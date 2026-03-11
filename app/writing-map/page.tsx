'use client';

import { useState, useEffect } from 'react';
import { readSessions } from '@/lib/types/writing-session';
import { CalendarHeatmap } from '@/components/writing-map/calendar-heatmap';
import { WordsByHour } from '@/components/writing-map/words-by-hour';
import { InsightCard } from '@/components/writing-map/insight-card';
import { SessionsTable } from '@/components/writing-map/sessions-table';
import type { WritingSession } from '@/lib/types/writing-session';

export default function WritingMapPage() {
  const [sessions, setSessions] = useState<WritingSession[]>([]);

  useEffect(() => {
    setSessions(readSessions());
  }, []);

  const totalWords = sessions.reduce((sum, s) => sum + s.wordsAdded, 0);
  const totalSessions = sessions.length;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <header className="border-b border-zinc-800 pb-6">
        <h1 className="text-3xl font-serif font-bold text-zinc-100 tracking-tight">
          Writing Map
        </h1>
        <p className="text-zinc-400 mt-2 text-sm">
          {totalSessions > 0
            ? `${totalSessions.toLocaleString()} session${totalSessions === 1 ? '' : 's'} — ${totalWords.toLocaleString()} words tracked`
            : 'Your writing patterns will appear here as you write.'}
        </p>
      </header>

      {/* Section 1: Calendar Heatmap */}
      <section aria-label="Writing activity heatmap">
        <h2 className="text-lg font-medium text-zinc-200 mb-4">Activity</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-6">
          <CalendarHeatmap sessions={sessions} />
        </div>
      </section>

      {/* Section 2: Words by Hour */}
      <section aria-label="Words written by hour of day">
        <h2 className="text-lg font-medium text-zinc-200 mb-4">Words by Hour</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-6">
          <WordsByHour sessions={sessions} />
        </div>
      </section>

      {/* Section 3: Insight Card */}
      <section aria-label="Writing insight">
        <InsightCard sessions={sessions} />
      </section>

      {/* Section 4: Sessions Table */}
      <section aria-label="Recent writing sessions">
        <h2 className="text-lg font-medium text-zinc-200 mb-4">Recent Sessions</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-6">
          <SessionsTable sessions={sessions} />
        </div>
      </section>
    </div>
  );
}
