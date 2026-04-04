'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStory } from '@/lib/store';

/**
 * GenesisGuard wraps the dashboard page.
 * If the project is empty (Untitled, no chapters, no characters, no synopsis),
 * it redirects to /genesis for the onboarding wizard.
 */
export function GenesisGuard({ children }: { children: React.ReactNode }) {
  const { state } = useStory();
  const router = useRouter();

  const isEmpty = useMemo(
    () =>
      state.title === 'Untitled Project' &&
      state.chapters.length === 0 &&
      state.characters.length === 0 &&
      state.synopsis === '',
    [state.title, state.chapters.length, state.characters.length, state.synopsis],
  );

  useEffect(() => {
    if (isEmpty) {
      router.replace('/genesis');
    }
  }, [isEmpty, router]);

  if (isEmpty) return null;

  return <>{children}</>;
}
