'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

export type CanonStatus = 'confirmed' | 'flexible' | 'draft' | 'discarded';
export type DataSource = 'manuscript' | 'ai-inferred' | 'user-entered';

export interface Chapter {
  id: string;
  title: string;
  content: string;
  summary: string;
  canonStatus?: CanonStatus;
  source?: DataSource;
}

export interface Scene {
  id: string;
  chapterId: string;
  title: string;
  content: string;
  summary: string;
  canonStatus?: CanonStatus;
  source?: DataSource;
}

export interface CharacterState {
  emotionalState: string;
  visibleGoal: string;
  hiddenNeed: string;
  currentFear: string;
  dominantBelief: string;
  emotionalWound: string;
  pressureLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  currentKnowledge: string;
  indicator: 'stable' | 'shifting' | 'under pressure' | 'emotionally conflicted' | 'at risk of contradiction';
}

export interface CharacterStateHistory {
  id: string;
  date: string;
  context: string;
  changes: string;
}

export interface CharacterRelationship {
  targetId: string;
  trustLevel: number;
  tensionLevel: number;
  dynamics: string;
}

export interface Character {
  id: string;
  name: string;
  role: string;
  description: string;
  coreIdentity?: string;
  relationships: string;
  dynamicRelationships?: CharacterRelationship[];
  currentState?: CharacterState;
  stateHistory?: CharacterStateHistory[];
  canonStatus?: CanonStatus;
  source?: DataSource;
}

export interface TimelineEvent {
  id: string;
  date: string;
  description: string;
  impact: string;
  canonStatus?: CanonStatus;
  source?: DataSource;
}

export interface OpenLoop {
  id: string;
  description: string;
  status: 'open' | 'closed';
  canonStatus?: CanonStatus;
  source?: DataSource;
}

export interface WorldRule {
  id: string;
  category: string;
  rule: string;
  canonStatus?: CanonStatus;
  source?: DataSource;
}

export interface Conflict {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'resolved';
  canonStatus?: CanonStatus;
  source?: DataSource;
}

export interface Foreshadowing {
  id: string;
  clue: string;
  payoff: string;
  canonStatus?: CanonStatus;
  source?: DataSource;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  importance: string;
  associatedRules: string[];
  canonStatus?: CanonStatus;
  source?: DataSource;
}

export interface Theme {
  id: string;
  theme: string;
  evidence: string[];
  canonStatus?: CanonStatus;
  source?: DataSource;
}

export interface CanonItem {
  id: string;
  category: string;
  description: string;
  status: string;
  sourceReference: string;
}

export interface Ambiguity {
  id: string;
  issue: string;
  affectedSection: string;
  confidence: string;
  recommendedReview: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isBlockedMode?: boolean;
}

export interface StoryState {
  language: string;
  title: string;
  genre: string[];
  synopsis: string;
  author_intent: string;
  chapters: Chapter[];
  scenes: Scene[];
  characters: Character[];
  timeline_events: TimelineEvent[];
  open_loops: OpenLoop[];
  world_rules: WorldRule[];
  style_profile: string;
  active_conflicts: Conflict[];
  foreshadowing_elements: Foreshadowing[];
  locations: Location[];
  themes: Theme[];
  canon_items: CanonItem[];
  ambiguities: Ambiguity[];
  chat_messages: ChatMessage[];
}

export const defaultState: StoryState = {
  language: 'English',
  title: 'Untitled Project',
  genre: [],
  synopsis: '',
  author_intent: '',
  chapters: [],
  scenes: [],
  characters: [],
  timeline_events: [],
  open_loops: [],
  world_rules: [],
  style_profile: '',
  active_conflicts: [],
  foreshadowing_elements: [],
  locations: [],
  themes: [],
  canon_items: [],
  ambiguities: [],
  chat_messages: [],
};

interface StoryContextType {
  state: StoryState;
  setState: React.Dispatch<React.SetStateAction<StoryState>>;
  updateField: <K extends keyof StoryState>(field: K, value: StoryState[K]) => void;
}

const StoryContext = createContext<StoryContextType | undefined>(undefined);

export function StoryProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoryState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('story_memory_state');
    if (saved) {
      try {
        // Merge saved data with defaults so new fields added after save get their default values
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setState({ ...defaultState, ...JSON.parse(saved) });
      } catch (e) {
        console.error('Failed to parse saved state', e);
      }
    }
    setIsLoaded(true);
  }, []);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveError, setSaveError] = useState(false);
  useEffect(() => {
    if (isLoaded) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        try {
          localStorage.setItem('story_memory_state', JSON.stringify(state));
          if (saveError) setSaveError(false);
        } catch {
          if (!saveError) setSaveError(true);
        }
      }, 500);
    }
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state, isLoaded, saveError]);

  // Sync state across tabs via storage events
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'story_memory_state' && e.newValue) {
        try {
          setState({ ...defaultState, ...JSON.parse(e.newValue) });
        } catch {
          // Ignore parse errors from other tabs
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const updateField = useCallback(<K extends keyof StoryState>(field: K, value: StoryState[K]) => {
    setState((prev) => ({ ...prev, [field]: value }));
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-indigo-400 rounded-full animate-spin" />
          <span className="text-sm text-zinc-500">Loading project...</span>
        </div>
      </div>
    );
  }

  return (
    <StoryContext.Provider value={{ state, setState, updateField }}>
      {saveError && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-red-900/90 text-red-100 text-sm text-center px-4 py-2 backdrop-blur">
          Storage quota exceeded — your changes may not be saved. Export your project from Settings.
        </div>
      )}
      {children}
    </StoryContext.Provider>
  );
}

export function useStory() {
  const context = useContext(StoryContext);
  if (context === undefined) {
    throw new Error('useStory must be used within a StoryProvider');
  }
  return context;
}
