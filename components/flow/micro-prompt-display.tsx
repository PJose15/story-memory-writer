'use client';

import { motion, AnimatePresence } from 'motion/react';

interface MicroPromptDisplayProps {
  prompt: string | null;
  isLoading: boolean;
}

export function MicroPromptDisplay({ prompt, isLoading }: MicroPromptDisplayProps) {
  return (
    <div className="h-12 flex items-center justify-center">
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-forest-500/40 animate-pulse" />
            <div className="w-1.5 h-1.5 rounded-full bg-forest-500/40 animate-pulse" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-forest-500/40 animate-pulse" style={{ animationDelay: '300ms' }} />
          </motion.div>
        )}
        {prompt && !isLoading && (
          <motion.p
            key="prompt"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-base font-serif italic text-brass-400/80 text-center px-4"
          >
            {prompt}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
