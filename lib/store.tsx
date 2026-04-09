'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { StoreSkeleton } from '@/components/antiquarian/StoreSkeleton';
import { migrateFromLocalStorage, getAllChapterContents, putChapterContent } from '@/lib/storage/dexie-db';
import type { WorldBibleSection } from '@/lib/types/world-bible';

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
  structured?: Record<string, unknown>;
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
  world_bible: WorldBibleSection[];
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
  world_bible: [],
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
    async function loadState() {
      // Run Dexie migration first (idempotent)
      await migrateFromLocalStorage();

      // Migration: copy legacy key to new key if needed
      if (!localStorage.getItem('zagafy_state') && localStorage.getItem('story_memory_state')) {
        localStorage.setItem('zagafy_state', localStorage.getItem('story_memory_state')!);
        localStorage.removeItem('story_memory_state');
      }

      const saved = localStorage.getItem('zagafy_state');
      let loadedState = defaultState;
      if (saved) {
        try {
          loadedState = { ...defaultState, ...JSON.parse(saved) };
        } catch (e) {
          console.error('Failed to parse saved state', e);
        }
      }

      // Load chapter contents from Dexie and merge back
      try {
        const contentMap = await getAllChapterContents();
        if (contentMap.size > 0 && Array.isArray(loadedState.chapters)) {
          loadedState = {
            ...loadedState,
            chapters: loadedState.chapters.map(ch => ({
              ...ch,
              content: contentMap.get(ch.id) ?? ch.content,
            })),
          };
        }
      } catch {
        // Dexie unavailable — chapters keep whatever content they have from localStorage
      }

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(loadedState);
      setIsLoaded(true);
    }

    loadState();
  }, []);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveError, setSaveError] = useState(false);
  useEffect(() => {
    if (isLoaded) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        try {
          // Save to localStorage with chapter content stripped (stubs only)
          const stateForLS = {
            ...state,
            chapters: state.chapters.map(ch => ({ ...ch, content: '' })),
          };
          localStorage.setItem('zagafy_state', JSON.stringify(stateForLS));
          if (saveError) setSaveError(false);
        } catch {
          if (!saveError) setSaveError(true);
        }

        // Save chapter contents to Dexie (async, best-effort)
        for (const ch of state.chapters) {
          putChapterContent(ch.id, ch.content, ch.title, ch.summary, ch.canonStatus, ch.source).catch(() => {
            // Dexie write failed — content was already in memory, will retry on next save
          });
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
      if (e.key === 'zagafy_state' && e.newValue) {
        try {
          const parsed = { ...defaultState, ...JSON.parse(e.newValue) };
          // Re-hydrate chapter content from Dexie for cross-tab sync
          getAllChapterContents().then(contentMap => {
            if (contentMap.size > 0 && Array.isArray(parsed.chapters)) {
              parsed.chapters = parsed.chapters.map((ch: Chapter) => ({
                ...ch,
                content: contentMap.get(ch.id) ?? ch.content,
              }));
            }
            setState(parsed);
          }).catch(() => {
            setState(parsed);
          });
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
    return <StoreSkeleton />;
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
