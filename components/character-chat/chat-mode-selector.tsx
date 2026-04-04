'use client';

import { BookOpen, Theater, Swords } from 'lucide-react';
import { motion } from 'motion/react';
import type { ChatMode } from '@/lib/types/character-chat';

const modes: { value: ChatMode; label: string; icon: typeof BookOpen }[] = [
  { value: 'exploration', label: 'Exploration', icon: BookOpen },
  { value: 'scene', label: 'Scene', icon: Theater },
  { value: 'confrontation', label: 'Confrontation', icon: Swords },
];

interface ChatModeSelectorProps {
  activeMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
}

export function ChatModeSelector({ activeMode, onModeChange }: ChatModeSelectorProps) {
  return (
    <div className="flex gap-1 p-1 bg-mahogany-800/50 rounded-lg border border-mahogany-700/30">
      {modes.map(({ value, label, icon: Icon }) => {
        const isActive = activeMode === value;
        return (
          <motion.button
            key={value}
            onClick={() => onModeChange(value)}
            whileTap={{ scale: 0.97 }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              isActive
                ? 'bg-forest-700 text-cream-50'
                : 'text-cream-300/70 hover:bg-mahogany-700/50 hover:text-cream-100'
            }`}
          >
            <Icon size={14} />
            {label}
          </motion.button>
        );
      })}
    </div>
  );
}
