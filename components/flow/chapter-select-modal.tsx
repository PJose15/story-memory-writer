'use client';

import { motion } from 'motion/react';
import { useStory } from '@/lib/store';
import { BookOpen, X } from 'lucide-react';

interface ChapterSelectModalProps {
  onSelect: (chapterId: string) => void;
  onClose: () => void;
}

export function ChapterSelectModal({ onSelect, onClose }: ChapterSelectModalProps) {
  const { state } = useStory();

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chapter-select-title"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[70vh] flex flex-col"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="chapter-select-title" className="text-xl font-serif font-bold text-zinc-100 flex items-center gap-2">
            <BookOpen className="text-indigo-400" size={20} />
            Choose a chapter
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {state.chapters.length === 0 ? (
          <p className="text-zinc-400 text-sm text-center py-8">
            No chapters yet. Create one in the Manuscript section first.
          </p>
        ) : (
          <div className="space-y-2 overflow-y-auto flex-1">
            {state.chapters.map((chapter, i) => (
              <button
                key={chapter.id}
                onClick={() => onSelect(chapter.id)}
                className="w-full text-left px-4 py-3 rounded-xl border border-zinc-800 hover:border-indigo-500/50 hover:bg-zinc-800/50 transition-colors"
              >
                <p className="text-sm font-medium text-zinc-200">
                  {i + 1}. {chapter.title}
                </p>
                {chapter.summary && (
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{chapter.summary}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
