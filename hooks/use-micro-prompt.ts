'use client';

import { useState, useRef, useCallback } from 'react';
import type { MicroPromptStoryContext } from '@/lib/prompts/micro-prompt';

interface UseMicroPromptReturn {
  prompt: string | null;
  isLoading: boolean;
  fetchPrompt: (options: {
    recentText: string;
    storyContext?: MicroPromptStoryContext;
    genre?: string;
    protagonistName?: string;
    blockType?: string | null;
  }) => void;
  clearPrompt: () => void;
}

export function useMicroPrompt(): UseMicroPromptReturn {
  const [prompt, setPrompt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchPrompt = useCallback(
    (options: {
      recentText: string;
      storyContext?: MicroPromptStoryContext;
      genre?: string;
      protagonistName?: string;
      blockType?: string | null;
    }) => {
      // Abort any in-flight request
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setIsLoading(true);

      const controller = abortRef.current;

      fetch('/api/micro-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
        signal: controller.signal,
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch prompt');
          return res.json();
        })
        .then(data => {
          if (!controller.signal.aborted) {
            setPrompt(data.prompt || null);
          }
        })
        .catch(err => {
          // Ignore aborted requests — can manifest as DOMException, Event, or other types
          if (controller.signal.aborted) return;
          if (err instanceof DOMException && err.name === 'AbortError') return;
          console.error('Micro-prompt fetch error:', err);
          setPrompt(null);
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsLoading(false);
          }
        });
    },
    []
  );

  const clearPrompt = useCallback(() => {
    abortRef.current?.abort();
    setPrompt(null);
    setIsLoading(false);
  }, []);

  return { prompt, isLoading, fetchPrompt, clearPrompt };
}
