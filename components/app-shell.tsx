'use client';

import { useCallback } from 'react';
import { StoryProvider } from '@/lib/store';
import { SessionProvider } from '@/lib/session';
import { ToastProvider } from '@/components/toast';
import { ConfirmProvider } from '@/components/confirm-dialog';
import { Sidebar } from '@/components/sidebar';
import { DiagnosticGate } from '@/components/diagnostic/diagnostic-gate';
import { useSessionTracker } from '@/hooks/use-session-tracker';
import { FlowScoreModal } from '@/components/writing-map/flow-score-modal';
import { updateSessionFlowScore } from '@/lib/types/writing-session';
import type { FlowScore } from '@/lib/types/writing-session';

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { pendingFlowScore, dismissFlowScore } = useSessionTracker();

  const handleFlowSubmit = useCallback((sessionId: string, score: FlowScore) => {
    updateSessionFlowScore(sessionId, score);
    dismissFlowScore();
  }, [dismissFlowScore]);

  return (
    <>
      <Sidebar />
      <main
        id="main-content"
        className="flex-1 overflow-y-auto bg-zinc-900/50 md:rounded-tl-3xl border-t md:border-t-0 md:border-l border-zinc-800 relative shadow-2xl"
      >
        <DiagnosticGate>{children}</DiagnosticGate>
      </main>
      {pendingFlowScore && (
        <FlowScoreModal
          sessionId={pendingFlowScore.sessionId}
          onSubmit={handleFlowSubmit}
          onDismiss={dismissFlowScore}
        />
      )}
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <StoryProvider>
      <SessionProvider>
        <ToastProvider>
          <ConfirmProvider>
            <AppShellInner>{children}</AppShellInner>
          </ConfirmProvider>
        </ToastProvider>
      </SessionProvider>
    </StoryProvider>
  );
}
