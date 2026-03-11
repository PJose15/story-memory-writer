'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseCountdownReturn {
  remaining: number;
  isComplete: boolean;
  progress: number;
  start: () => void;
  reset: () => void;
}

export function useCountdown(durationSeconds: number): UseCountdownReturn {
  const [remaining, setRemaining] = useState(durationSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    cleanup();
    setRemaining(durationSeconds);
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          cleanup();
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [durationSeconds, cleanup]);

  const reset = useCallback(() => {
    cleanup();
    setIsRunning(false);
    setRemaining(durationSeconds);
  }, [durationSeconds, cleanup]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const isComplete = remaining === 0 && !isRunning;
  const progress = durationSeconds > 0 ? 1 - remaining / durationSeconds : 1;

  return { remaining, isComplete, progress, start, reset };
}
