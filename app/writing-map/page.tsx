'use client';

import { useState } from 'react';
import { CarvedHeader, ParchmentCard } from '@/components/antiquarian';
import { readSessions } from '@/lib/types/writing-session';
import { CalendarHeatmap } from '@/components/writing-map/calendar-heatmap';
import { WordsByHour } from '@/components/writing-map/words-by-hour';
import { InsightCard } from '@/components/writing-map/insight-card';
import { SessionsTable } from '@/components/writing-map/sessions-table';
import type { WritingSession } from '@/lib/types/writing-session';

export default function WritingMapPage() {
  const [sessions] = useState<WritingSession[]>(() => readSessions());

  const totalWords = sessions.reduce((sum, s) => sum + s.wordsAdded, 0);
  const totalSessions = sessions.length;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <CarvedHeader
        title="Writing Map"
        subtitle={totalSessions > 0
          ? `${totalSessions.toLocaleString()} session${totalSessions === 1 ? '' : 's'} — ${totalWords.toLocaleString()} words tracked`
          : 'Your writing patterns will appear here as you write.'}
      />

      {/* Section 1: Calendar Heatmap */}
      <section aria-label="Writing activity heatmap">
        <h2 className="text-lg font-medium text-sepia-800 mb-4">Activity</h2>
        <ParchmentCard className="p-4 md:p-6">
          <CalendarHeatmap sessions={sessions} />
        </ParchmentCard>
      </section>

      {/* Section 2: Words by Hour */}
      <section aria-label="Words written by hour of day">
        <h2 className="text-lg font-medium text-sepia-800 mb-4">Words by Hour</h2>
        <ParchmentCard className="p-4 md:p-6">
          <WordsByHour sessions={sessions} />
        </ParchmentCard>
      </section>

      {/* Section 3: Insight Card */}
      <section aria-label="Writing insight">
        <InsightCard sessions={sessions} />
      </section>

      {/* Section 4: Sessions Table */}
      <section aria-label="Recent writing sessions">
        <h2 className="text-lg font-medium text-sepia-800 mb-4">Recent Sessions</h2>
        <ParchmentCard className="p-4 md:p-6">
          <SessionsTable sessions={sessions} />
        </ParchmentCard>
      </section>
    </div>
  );
}
