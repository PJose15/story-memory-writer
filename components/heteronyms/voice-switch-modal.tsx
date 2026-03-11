'use client';

import { useEffect } from 'react';
import { X, Theater } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { AvatarCircle } from './avatar-circle';
import type { Heteronym } from '@/lib/types/heteronym';

interface VoiceSwitchModalProps {
  heteronyms: Heteronym[];
  activeId: string | null;
  guestId: string | null;
  onSelect: (id: string) => void;
  onClearGuest: () => void;
  onClose: () => void;
}

export function VoiceSwitchModal({ heteronyms, activeId, guestId, onSelect, onClearGuest, onClose }: VoiceSwitchModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const currentVoiceId = guestId || activeId;
  const otherVoices = heteronyms.filter(h => h.id !== currentVoiceId);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Switch writing voice"
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl max-w-sm w-full"
        >
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <h2 className="text-base font-serif font-semibold text-zinc-100 flex items-center gap-2">
              <Theater size={18} className="text-indigo-400" />
              Switch Voice
            </h2>
            <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800">
              <X size={18} />
            </button>
          </div>

          <div className="p-3 space-y-1 max-h-[60vh] overflow-y-auto">
            {guestId && (
              <button
                onClick={() => {
                  onClearGuest();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-zinc-800 transition-colors border border-dashed border-zinc-700"
              >
                <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-500">↩</div>
                <div>
                  <p className="text-sm text-zinc-300">Return to own voice</p>
                  <p className="text-[11px] text-zinc-500">Stop writing as someone else</p>
                </div>
              </button>
            )}

            {otherVoices.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-6">No other voices available. Create alter egos in Settings.</p>
            ) : (
              otherVoices.map((h) => (
                <button
                  key={h.id}
                  onClick={() => {
                    onSelect(h.id);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-zinc-800 transition-colors"
                >
                  <AvatarCircle color={h.avatarColor} emoji={h.avatarEmoji} size={28} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200 truncate">{h.name}</p>
                    {h.styleNote && (
                      <p className="text-[11px] text-zinc-500 truncate">{h.styleNote}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
