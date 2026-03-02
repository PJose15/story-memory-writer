'use client';

import { useEffect } from 'react';

/**
 * Warns the user before navigating away when there are unsaved changes.
 * Uses the browser's beforeunload event.
 */
export function useUnsavedChanges(hasUnsavedChanges: boolean) {
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);
}
