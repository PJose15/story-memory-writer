'use client';

import { motion } from 'motion/react';
import type { WriterQuote } from '@/lib/types/quotes';

interface QuoteDisplayProps {
  quote: WriterQuote;
}

export function QuoteDisplay({ quote }: QuoteDisplayProps) {
  return (
    <div className="text-center space-y-6 max-w-lg mx-auto px-4">
      <motion.blockquote
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-xl md:text-2xl font-serif text-sepia-900 leading-relaxed italic"
      >
        &ldquo;{quote.text}&rdquo;
      </motion.blockquote>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="text-sm text-sepia-600"
      >
        &mdash; {quote.author}, <span className="italic">{quote.source}</span>
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="text-base text-brass-400 font-serif"
      >
        {quote.zagafyPhrase}
      </motion.p>
    </div>
  );
}
