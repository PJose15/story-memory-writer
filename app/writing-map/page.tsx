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
      <header className="border-b border-sepia-300/30 pb-6">
        <h1 className="text-3xl font-serif font-bold text-sepia-900 tracking-tight letterpress">
          Writing Map
        </h1>
        <p className="text-sepia-600 mt-2 text-sm">
          {totalSessions > 0
            ? `${totalSessions.toLocaleString()} session${totalSessions === 1 ? '' : 's'} — ${totalWords.toLocaleString()} words tracked`
            : 'Your writing patterns will appear here as you write.'}
        </p>
        <div className="mt-3 h-0.5 w-16 bg-gradient-to-r from-brass-500 to-brass-300/0 rounded-full" />
      </header>

      {/* Section 1: Calendar Heatmap */}
      <section aria-label="Writing activity heatmap">
        <h2 className="text-lg font-medium text-sepia-800 mb-4">Activity</h2>
        <div className="bg-parchment-100 border border-sepia-300/50 rounded-xl p-4 md:p-6 texture-parchment shadow-parchment">
          <CalendarHeatmap sessions={sessions} />
        </div>
      </section>

      {/* Section 2: Words by Hour */}
      <section aria-label="Words written by hour of day">
        <h2 className="text-lg font-medium text-sepia-800 mb-4">Words by Hour</h2>
        <div className="bg-parchment-100 border border-sepia-300/50 rounded-xl p-4 md:p-6 texture-parchment shadow-parchment">
          <WordsByHour sessions={sessions} />
        </div>
      </section>

      {/* Section 3: Insight Card */}
      <section aria-label="Writing insight">
        <InsightCard sessions={sessions} />
      </section>

      {/* Section 4: Sessions Table */}
      <section aria-label="Recent writing sessions">
        <h2 className="text-lg font-medium text-sepia-800 mb-4">Recent Sessions</h2>
        <div className="bg-parchment-100 border border-sepia-300/50 rounded-xl p-4 md:p-6 texture-parchment shadow-parchment">
          <SessionsTable sessions={sessions} />
        </div>
      </section>
    </div>
  );
}
