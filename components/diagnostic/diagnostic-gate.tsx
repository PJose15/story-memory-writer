'use client';

import { useSession } from '@/lib/session';
import { DiagnosticOverlay } from './diagnostic-overlay';
import { RitualOverlay } from '@/components/ritual/ritual-overlay';

export function DiagnosticGate({ children }: { children: React.ReactNode }) {
  const { session } = useSession();

  if (!session.diagnosticCompleted) {
    return <DiagnosticOverlay />;
  }

  if (!session.ritualCompleted) {
    return <RitualOverlay />;
  }

  return <>{children}</>;
}
