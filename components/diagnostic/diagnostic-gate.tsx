'use client';

import { usePathname } from 'next/navigation';
import { useSession } from '@/lib/session';
import { DiagnosticOverlay } from './diagnostic-overlay';
import { RitualOverlay } from '@/components/ritual/ritual-overlay';

// Routes that bypass the diagnostic/ritual gate
const BYPASS_ROUTES = ['/flow'];

export function DiagnosticGate({ children }: { children: React.ReactNode }) {
  const { session } = useSession();
  const pathname = usePathname();

  if (BYPASS_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

  if (!session.diagnosticCompleted) {
    return <DiagnosticOverlay />;
  }

  if (!session.ritualCompleted) {
    return <RitualOverlay />;
  }

  return <>{children}</>;
}
