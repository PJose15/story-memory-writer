'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export type BlockType = 'fear' | 'perfectionism' | 'direction' | 'exhaustion' | null;

export interface SessionState {
  blockType: BlockType;
  diagnosticCompleted: boolean;
  diagnosticSkipped: boolean;
  ritualCompleted: boolean;
  ritualMode: 'quote' | 'mindfulness' | null;
  sessionStartedAt: string;
  flowChapterId: string | null;
}

interface SessionContextType {
  session: SessionState;
  setBlockType: (type: BlockType) => void;
  completeDiagnostic: (skipped?: boolean) => void;
  completeRitual: (mode: 'quote' | 'mindfulness') => void;
  setFlowChapterId: (id: string | null) => void;
  resetSession: () => void;
}

const defaultSession: SessionState = {
  blockType: null,
  diagnosticCompleted: false,
  diagnosticSkipped: false,
  ritualCompleted: false,
  ritualMode: null,
  sessionStartedAt: new Date().toISOString(),
  flowChapterId: null,
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionState>({
    ...defaultSession,
    sessionStartedAt: new Date().toISOString(),
  });

  const setBlockType = useCallback((type: BlockType) => {
    setSession(prev => ({ ...prev, blockType: type }));
  }, []);

  const completeDiagnostic = useCallback((skipped = false) => {
    setSession(prev => ({
      ...prev,
      diagnosticCompleted: true,
      diagnosticSkipped: skipped,
    }));
  }, []);

  const completeRitual = useCallback((mode: 'quote' | 'mindfulness') => {
    setSession(prev => ({
      ...prev,
      ritualCompleted: true,
      ritualMode: mode,
    }));
  }, []);

  const setFlowChapterId = useCallback((id: string | null) => {
    setSession(prev => ({ ...prev, flowChapterId: id }));
  }, []);

  const resetSession = useCallback(() => {
    setSession({
      ...defaultSession,
      sessionStartedAt: new Date().toISOString(),
    });
  }, []);

  return (
    <SessionContext.Provider
      value={{
        session,
        setBlockType,
        completeDiagnostic,
        completeRitual,
        setFlowChapterId,
        resetSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
