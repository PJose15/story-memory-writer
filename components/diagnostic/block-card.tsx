'use client';

import { motion } from 'motion/react';
import type { BlockType } from '@/lib/session';
import { Eye, Target, Compass, BatteryLow } from 'lucide-react';

export interface BlockCardData {
  type: Exclude<BlockType, null>;
  label: string;
  description: string;
  icon: typeof Eye;
  accent: string;
  bgAccent: string;
}

export const blockCards: BlockCardData[] = [
  {
    type: 'fear',
    label: 'Fear',
    description: "Heavy... like someone's watching",
    icon: Eye,
    accent: 'text-purple-400',
    bgAccent: 'border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/5',
  },
  {
    type: 'perfectionism',
    label: 'Perfectionism',
    description: 'Nothing I write feels good enough',
    icon: Target,
    accent: 'text-amber-400',
    bgAccent: 'border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/5',
  },
  {
    type: 'direction',
    label: 'Direction',
    description: "I don't know where to go next",
    icon: Compass,
    accent: 'text-blue-400',
    bgAccent: 'border-blue-500/30 hover:border-blue-500/60 hover:bg-blue-500/5',
  },
  {
    type: 'exhaustion',
    label: 'Exhaustion',
    description: "I'm running on empty",
    icon: BatteryLow,
    accent: 'text-emerald-400',
    bgAccent: 'border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/5',
  },
];

interface BlockCardProps {
  card: BlockCardData;
  index: number;
  onSelect: (type: Exclude<BlockType, null>) => void;
}

export function BlockCard({ card, index, onSelect }: BlockCardProps) {
  const Icon = card.icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={() => onSelect(card.type)}
      className={`w-full text-left bg-zinc-900/50 border rounded-2xl p-6 transition-colors cursor-pointer ${card.bgAccent}`}
      aria-label={`Select ${card.label}: ${card.description}`}
    >
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-xl bg-zinc-800 ${card.accent}`}>
          <Icon size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-zinc-200 text-lg">{card.label}</h3>
          <p className="text-sm text-zinc-400 mt-1 italic">&ldquo;{card.description}&rdquo;</p>
        </div>
      </div>
    </motion.button>
  );
}
