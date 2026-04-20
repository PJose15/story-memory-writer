'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { InkStampButton } from '@/components/antiquarian';
import { CATEGORY_META, WORLD_BIBLE_CATEGORIES } from '@/lib/types/world-bible';

interface WorldBibleExtractButtonProps {
  onExtract: () => Promise<number>;
  disabled?: boolean;
  chapterCount: number;
  onError?: (message: string) => void;
}

type ExtractState = 'idle' | 'extracting' | 'success' | 'error';

export function WorldBibleExtractButton({ onExtract, disabled, chapterCount, onError }: WorldBibleExtractButtonProps) {
  const [extractState, setExtractState] = useState<ExtractState>('idle');
  const [cycleIndex, setCycleIndex] = useState(0);
  const [resultCount, setResultCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (extractState === 'extracting') {
      intervalRef.current = setInterval(() => {
        setCycleIndex((i) => (i + 1) % WORLD_BIBLE_CATEGORIES.length);
      }, 800);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [extractState]);

  useEffect(() => {
    if (extractState === 'success' || extractState === 'error') {
      const t = setTimeout(() => setExtractState('idle'), 3000);
      return () => clearTimeout(t);
    }
  }, [extractState]);

  const handleClick = async () => {
    setExtractState('extracting');
    setCycleIndex(0);
    try {
      const count = await onExtract();
      setResultCount(count);
      setExtractState('success');
    } catch (err) {
      console.error('[WorldBibleExtract] extraction failed:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      onError?.(message);
      setExtractState('error');
    }
  };

  const currentCategory = WORLD_BIBLE_CATEGORIES[cycleIndex];
  const label = extractState === 'extracting'
    ? `Analyzing ${CATEGORY_META[currentCategory].label.toLowerCase()}...`
    : extractState === 'success'
      ? `Found ${resultCount} section${resultCount !== 1 ? 's' : ''}`
      : extractState === 'error'
        ? 'Extraction failed'
        : `Extract from manuscript (${chapterCount} ch.)`;

  return (
    <InkStampButton
      onClick={handleClick}
      disabled={disabled || extractState === 'extracting' || chapterCount === 0}
      loading={extractState === 'extracting'}
      icon={<Sparkles size={18} />}
      variant={extractState === 'error' ? 'danger' : 'primary'}
    >
      {label}
    </InkStampButton>
  );
}
