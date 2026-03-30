'use client';

import { Zap, Eye, Heart, Clock, Sparkles, MessageSquare } from 'lucide-react';
import type { CoachingLens } from '@/lib/story-coach/types';
import { LENS_LABELS } from '@/lib/story-coach/types';

const LENS_ICONS: Record<CoachingLens, React.FC<{ size?: number; className?: string }>> = {
  tension: Zap,
  sensory: Eye,
  motivation: Heart,
  pacing: Clock,
  foreshadowing: Sparkles,
  dialogue: MessageSquare,
};

const LENSES: CoachingLens[] = ['tension', 'sensory', 'motivation', 'pacing', 'foreshadowing', 'dialogue'];

interface CoachLensFilterProps {
  activeLens: CoachingLens | 'all';
  onChange: (lens: CoachingLens | 'all') => void;
}

export function CoachLensFilter({ activeLens, onChange }: CoachLensFilterProps) {
  return (
    <div className="flex gap-1 flex-wrap">
      <button
        onClick={() => onChange('all')}
        className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
          activeLens === 'all' ? 'bg-brass-500 text-cream-50' : 'text-sepia-600 hover:bg-parchment-200'
        }`}
      >
        All
      </button>
      {LENSES.map(lens => {
        const Icon = LENS_ICONS[lens];
        return (
          <button
            key={lens}
            onClick={() => onChange(lens)}
            className={`px-2 py-1 rounded text-[10px] font-medium transition-colors flex items-center gap-1 ${
              activeLens === lens ? 'bg-brass-500 text-cream-50' : 'text-sepia-600 hover:bg-parchment-200'
            }`}
          >
            <Icon size={10} />
            {LENS_LABELS[lens]}
          </button>
        );
      })}
    </div>
  );
}
