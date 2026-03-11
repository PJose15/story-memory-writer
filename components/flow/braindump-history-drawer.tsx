'use client';

import { useEffect, useRef } from 'react';
import { X, Type, Sparkles, Trash2, Clock, Languages, FileText } from 'lucide-react';
import type { UseBraindumpReturn } from '@/hooks/use-braindump';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

interface BraindumpHistoryDrawerProps {
  braindump: UseBraindumpReturn;
}

export function BraindumpHistoryDrawer({ braindump }: BraindumpHistoryDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') braindump.closeHistory();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [braindump]);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        braindump.closeHistory();
      }
    };
    // Delay to prevent the opening click from immediately closing
    const timer = setTimeout(() => {
      window.addEventListener('mousedown', handleClick);
    }, 100);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousedown', handleClick);
    };
  }, [braindump]);

  return (
    <div
      ref={drawerRef}
      className="absolute top-0 right-0 bottom-0 w-[360px] z-[170] bg-zinc-950/95 backdrop-blur-lg border-l border-zinc-700/50 flex flex-col"
      role="dialog"
      aria-label="Braindump history"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50">
        <h3 className="text-sm font-medium text-zinc-300">Voice History</h3>
        <button
          onClick={braindump.closeHistory}
          className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          aria-label="Close history"
        >
          <X size={14} />
        </button>
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto">
        {braindump.history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600 px-6">
            <FileText size={32} className="mb-3 opacity-50" />
            <p className="text-sm text-center">No voice recordings yet.</p>
            <p className="text-xs text-center mt-1">Your braindump sessions will appear here.</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {[...braindump.history].reverse().map(entry => (
              <div
                key={entry.id}
                className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-3 group"
              >
                {/* Meta row */}
                <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                  <Clock size={10} />
                  <span>{formatDate(entry.timestamp)}</span>
                  <span className="text-zinc-700">|</span>
                  <span>{formatDuration(entry.durationSeconds)}</span>
                  <span className="text-zinc-700">|</span>
                  <Languages size={10} />
                  <span>{entry.language}</span>
                  <span className="text-zinc-700">|</span>
                  <span>{entry.wordCount} words</span>
                </div>

                {/* Preview */}
                <p className="text-sm text-zinc-300 leading-relaxed line-clamp-3 font-serif">
                  {entry.polishedText || entry.rawTranscript}
                </p>

                {entry.wasPolished && (
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-indigo-400/60">
                    <Sparkles size={10} />
                    <span>Polished</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 mt-2 pt-2 border-t border-zinc-800/30">
                  <button
                    onClick={() => braindump.reInsertFromHistory(entry.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                    aria-label="Re-insert text"
                  >
                    <Type size={12} />
                    Re-insert
                  </button>
                  {!entry.wasPolished && (
                    <button
                      onClick={() => braindump.rePolishFromHistory(entry.id)}
                      disabled={braindump.isPolishing}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs text-indigo-400 hover:text-indigo-300 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                      aria-label="Polish this entry"
                    >
                      <Sparkles size={12} />
                      Polish
                    </button>
                  )}
                  <button
                    onClick={() => braindump.deleteHistoryEntry(entry.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs text-zinc-600 hover:text-red-400 hover:bg-zinc-800 transition-colors ml-auto"
                    aria-label="Delete entry"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
