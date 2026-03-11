'use client';

import { useEffect, useState } from 'react';

type Phase = 'fade-in' | 'hold' | 'fade-out' | 'done';

interface SceneChangeOverlayProps {
  message: string;
  subtitle?: string;
  onComplete: () => void;
}

export function SceneChangeOverlay({ message, subtitle, onComplete }: SceneChangeOverlayProps) {
  const [phase, setPhase] = useState<Phase>('fade-in');

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase('hold'), 200));
    timers.push(setTimeout(() => setPhase('fade-out'), 800));
    timers.push(setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 1000));

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  if (phase === 'done') return null;

  const opacity = phase === 'fade-in' ? 'opacity-0' : phase === 'hold' ? 'opacity-100' : 'opacity-0';

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-zinc-950 flex flex-col items-center justify-center transition-opacity duration-200 ${opacity}`}
      role="status"
      aria-live="assertive"
    >
      <span className="text-4xl mb-4" aria-hidden="true">&#x1F500;</span>
      <p className="text-xl font-serif text-zinc-100">{message}</p>
      {subtitle && (
        <p className="text-sm text-zinc-400 mt-2">{subtitle}</p>
      )}
    </div>
  );
}
