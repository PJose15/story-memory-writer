'use client';

import { Mic, MicOff, Pause, Play, X, Sparkles, Type, RotateCcw, Loader2 } from 'lucide-react';
import type { UseBraindumpReturn } from '@/hooks/use-braindump';

const LANGUAGES = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'pt-BR', label: 'Portuguese (BR)' },
  { value: 'pt-PT', label: 'Portuguese (PT)' },
  { value: 'es-ES', label: 'Spanish' },
  { value: 'fr-FR', label: 'French' },
  { value: 'de-DE', label: 'German' },
  { value: 'it-IT', label: 'Italian' },
  { value: 'ja-JP', label: 'Japanese' },
  { value: 'zh-CN', label: 'Chinese' },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface BraindumpPanelProps {
  braindump: UseBraindumpReturn;
}

export function BraindumpPanel({ braindump }: BraindumpPanelProps) {
  const { speech, isStopped, isPolishing, polishError, polishProgress } = braindump;
  const hasTranscript = speech.finalTranscript.trim().length > 0;
  const isEmpty = !hasTranscript && !speech.interimTranscript;

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-[160] bg-zinc-950/90 backdrop-blur-lg border-t border-zinc-700/50"
      style={{ height: '38%' }}
      role="region"
      aria-label="Voice braindump panel"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/50">
        <div className="flex items-center gap-3">
          {/* Recording indicator */}
          {speech.isRecording && !speech.isPaused && (
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full bg-red-500"
                style={{ animation: 'braindump-pulse 1.5s ease-in-out infinite' }}
              />
              <span className="text-xs text-red-400 font-medium">Recording</span>
            </div>
          )}
          {speech.isPaused && (
            <span className="text-xs text-amber-400 font-medium">Paused</span>
          )}
          {isStopped && (
            <span className="text-xs text-zinc-400 font-medium">Stopped</span>
          )}

          {/* Timer */}
          <span className="text-xs text-zinc-500 tabular-nums">
            {formatTime(speech.elapsedSeconds)}
          </span>

          {/* Language selector */}
          <select
            value={speech.language}
            onChange={(e) => speech.setLanguage(e.target.value)}
            className="text-xs bg-zinc-800/50 border border-zinc-700/50 rounded px-1.5 py-0.5 text-zinc-400 focus:outline-none focus:border-zinc-600"
            aria-label="Recognition language"
          >
            {LANGUAGES.map(l => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Recording controls */}
          {speech.isRecording && !speech.isPaused && (
            <>
              <button
                onClick={speech.pause}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                aria-label="Pause recording"
              >
                <Pause size={14} />
              </button>
              <button
                onClick={speech.stop}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                aria-label="Stop recording"
              >
                <MicOff size={14} />
              </button>
            </>
          )}

          {speech.isPaused && (
            <>
              <button
                onClick={speech.resume}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition-colors"
                aria-label="Resume recording"
              >
                <Play size={14} />
              </button>
              <button
                onClick={speech.stop}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                aria-label="Stop recording"
              >
                <MicOff size={14} />
              </button>
            </>
          )}

          {/* Close */}
          <button
            onClick={braindump.closePanel}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            aria-label="Close braindump panel"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Transcript area */}
      <div className="flex-1 overflow-y-auto px-6 py-4" style={{ height: 'calc(100% - 84px)' }}>
        {isEmpty && speech.isRecording && (
          <p className="text-zinc-600 text-sm italic">Listening... start speaking.</p>
        )}

        {speech.error && !isStopped && (
          <p className="text-amber-400/80 text-xs mb-2">{speech.error}</p>
        )}

        <div className="text-zinc-200 text-base leading-relaxed font-serif whitespace-pre-wrap" aria-live="polite">
          {speech.finalTranscript}
          {speech.interimTranscript && (
            <span className="text-zinc-500">
              {speech.finalTranscript ? ' ' : ''}{speech.interimTranscript}
              <span style={{ animation: 'braindump-cursor-blink 1s step-end infinite' }}>|</span>
            </span>
          )}
        </div>

        {isStopped && !hasTranscript && (
          <p className="text-zinc-500 text-sm mt-2">No words captured. Try recording again.</p>
        )}
      </div>

      {/* Action buttons — shown when stopped with transcript */}
      {isStopped && (
        <div className="flex items-center justify-center gap-3 px-4 py-2 border-t border-zinc-800/50">
          {polishError && (
            <span className="text-red-400 text-xs mr-2">{polishError}</span>
          )}

          {isPolishing ? (
            <div className="flex items-center gap-2 text-zinc-400 text-sm">
              <Loader2 size={14} className="animate-spin" />
              <span>{polishProgress}</span>
            </div>
          ) : (
            <>
              <button
                onClick={braindump.insertAsIs}
                disabled={!hasTranscript}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Type size={14} />
                Insert as-is
              </button>
              <button
                onClick={braindump.polishAndInsert}
                disabled={!hasTranscript}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles size={14} />
                Polish & insert
              </button>
              <button
                onClick={braindump.reRecord}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                <RotateCcw size={14} />
                Re-record
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
