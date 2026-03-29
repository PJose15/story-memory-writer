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
  const insights = useMemo((): Insight[] => {
    const result: Insight[] = [];

    if (sessions.length < 5) {
      return [{
        headline: 'Keep writing!',
        detail: 'Keep writing — we need at least 5 sessions to reveal your patterns.',
      }];
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
      result.push({
        headline: "You're consistently productive at all hours. Impressive.",
        detail: '',
      });
    } else {
      const hourRange = formatHourRange(peakHour);
      const percentMore = avg > 0 ? Math.round(((peakWords - avg) / avg) * 100) : 0;

      let headline = `Your secret hour: You write ${percentMore}% more between ${hourRange} than at any other time.`;

      if (peakHour >= 22 || peakHour < 6) {
        headline += ' You\'re a night writer.';
      } else if (peakHour >= 5 && peakHour < 8) {
        headline += ' You\'re an early bird writer.';
      }

      result.push({ headline, detail: '' });
    }

    // Flow-based insights
    const sessionsWithFlow = sessions.filter(s => s.autoFlowScore !== null && s.autoFlowScore !== undefined);
    if (sessionsWithFlow.length >= 3) {
      const avgWPM = sessionsWithFlow
        .filter(s => s.keystrokeMetrics?.avgWPM)
        .reduce((sum, s) => sum + (s.keystrokeMetrics?.avgWPM ?? 0), 0) / Math.max(1, sessionsWithFlow.filter(s => s.keystrokeMetrics?.avgWPM).length);

      if (avgWPM > 0) {
        result.push({
          headline: `Your average typing speed is ${Math.round(avgWPM)} WPM across ${sessionsWithFlow.length} tracked sessions.`,
          detail: '',
        });
      }

      // Flow moments peak hour
      const flowHourBuckets = new Array(24).fill(0) as number[];
      for (const s of sessionsWithFlow) {
        if (s.flowMoments && s.flowMoments.length > 0) {
          const hour = new Date(s.startedAt).getHours();
          flowHourBuckets[hour] += s.flowMoments.length;
        }
      }

      let flowPeakHour = -1;
      let flowPeakCount = 0;
      for (let h = 0; h < 24; h++) {
        if (flowHourBuckets[h] > flowPeakCount) {
          flowPeakCount = flowHourBuckets[h];
          flowPeakHour = h;
        }
      }

      if (flowPeakCount > 0) {
        result.push({
          headline: `Your flow moments peak at ${formatHourRange(flowPeakHour)} with ${flowPeakCount} detected.`,
          detail: '',
        });
      }
    }

    return result.length > 0 ? result : [{ headline: 'Keep writing!', detail: 'Keep writing — we need at least 5 sessions to reveal your patterns.' }];
  }, [sessions]);

  return (
    <div className="space-y-3" data-testid="insight-card">
      {insights.map((insight, i) => (
        <div key={i} className="bg-parchment-100 border border-sepia-300/50 rounded-xl p-6 texture-parchment shadow-parchment">
          <div className="flex items-start gap-3">
            <Lightbulb size={20} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-medium text-sepia-900">{insight.headline}</h3>
              {insight.detail && <p className="text-sm text-sepia-600 mt-1 leading-relaxed">{insight.detail}</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
