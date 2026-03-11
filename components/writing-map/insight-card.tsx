'use client';

import { useMemo } from 'react';
import { Lightbulb } from 'lucide-react';
import type { WritingSession } from '@/lib/types/writing-session';

interface InsightCardProps {
  sessions: WritingSession[];
}

function formatHourRange(hour: number): string {
  const start = hour % 12 || 12;
  const end = (hour + 1) % 12 || 12;
  const startPeriod = hour < 12 ? 'AM' : 'PM';
  const endPeriod = (hour + 1) < 12 || (hour + 1) === 24 ? 'AM' : 'PM';
  return `${start}${startPeriod}–${end}${endPeriod}`;
}

interface Insight {
  headline: string;
  detail: string;
}

export function InsightCard({ sessions }: InsightCardProps) {
  const insight = useMemo((): Insight => {
    if (sessions.length < 5) {
      return {
        headline: 'Keep writing!',
        detail: 'Keep writing — we need at least 5 sessions to reveal your patterns.',
      };
    }

    // Calculate words per hour
    const hourBuckets = new Array(24).fill(0) as number[];
    const hourCounts = new Array(24).fill(0) as number[];

    for (const session of sessions) {
      const hour = new Date(session.startedAt).getHours();
      hourBuckets[hour] += session.wordsAdded;
      hourCounts[hour]++;
    }

    // Find the peak hour (by total words)
    let peakHour = 0;
    let peakWords = 0;
    for (let h = 0; h < 24; h++) {
      if (hourBuckets[h] > peakWords) {
        peakWords = hourBuckets[h];
        peakHour = h;
      }
    }

    // Check if productivity is flat (top hour < 1.5x average of non-zero hours)
    const nonZeroHours = hourBuckets.filter(w => w > 0);
    const avg = nonZeroHours.length > 0 ? nonZeroHours.reduce((a, b) => a + b, 0) / nonZeroHours.length : 0;

    if (nonZeroHours.length >= 4 && avg > 0 && peakWords < avg * 1.5) {
      return {
        headline: "You're consistently productive at all hours. Impressive.",
        detail: '',
      };
    }

    const hourRange = formatHourRange(peakHour);

    // Calculate % more than average
    const percentMore = avg > 0 ? Math.round(((peakWords - avg) / avg) * 100) : 0;

    let headline = `✨ Your secret hour: You write ${percentMore}% more between ${hourRange} than at any other time.`;

    // Add time-of-day emoji annotation
    if (peakHour >= 22 || peakHour < 6) {
      headline += ' You\'re a night writer 🌙';
    } else if (peakHour >= 5 && peakHour < 8) {
      headline += ' You\'re an early bird writer 🌅';
    }

    return {
      headline,
      detail: '',
    };
  }, [sessions]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6" data-testid="insight-card">
      <div className="flex items-start gap-3">
        <Lightbulb size={20} className="text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-base font-medium text-zinc-100">{insight.headline}</h3>
          {insight.detail && <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{insight.detail}</p>}
        </div>
      </div>
    </div>
  );
}
