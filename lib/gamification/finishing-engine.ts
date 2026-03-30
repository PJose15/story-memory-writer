import type { FinishingEngineState, Milestone, NarrativePhase } from '@/lib/types/gamification';
import type { StoryState } from '@/lib/store';

// ─── Milestone Definitions ───

interface MilestoneDefinition {
  id: string;
  phase: NarrativePhase;
  description: string;
  weight: number;
  check: (story: StoryState) => boolean;
}

// M7: Null-guard story.chapters
function totalWords(story: StoryState): number {
  if (!Array.isArray(story.chapters)) return 0;
  return story.chapters.reduce(
    (sum, ch) => sum + (ch.content ? ch.content.split(/\s+/).filter(Boolean).length : 0),
    0,
  );
}

const MILESTONE_DEFINITIONS: MilestoneDefinition[] = [
  // Setup (weight: 30 total)
  {
    id: 'synopsis-written',
    phase: 'setup',
    description: 'Write a synopsis for your story',
    weight: 8,
    // M7: Null-guard synopsis
    check: (s) => (s.synopsis ?? '').trim().length > 0,
  },
  {
    id: 'three-characters',
    phase: 'setup',
    description: 'Create at least 3 characters',
    weight: 10,
    // M7: Null-guard characters
    check: (s) => Array.isArray(s.characters) && s.characters.length >= 3,
  },
  {
    id: 'first-chapter',
    phase: 'setup',
    description: 'Write your first chapter (500+ words)',
    weight: 12,
    check: (s) => {
      if (!Array.isArray(s.chapters) || s.chapters.length === 0) return false;
      const firstWords = s.chapters[0].content?.split(/\s+/).filter(Boolean).length ?? 0;
      return firstWords >= 500;
    },
  },

  // Rising Action (weight: 20 total)
  {
    id: 'active-conflict',
    phase: 'rising-action',
    description: 'Establish an active conflict',
    weight: 10,
    // M7: Null-guard active_conflicts
    check: (s) => Array.isArray(s.active_conflicts) && s.active_conflicts.some((c) => c.status === 'active'),
  },
  {
    id: 'five-chapters',
    phase: 'rising-action',
    description: 'Write 5 chapters',
    weight: 10,
    check: (s) => Array.isArray(s.chapters) && s.chapters.length >= 5,
  },

  // Midpoint (weight: 20 total)
  {
    id: 'three-open-loops',
    phase: 'midpoint',
    description: 'Have 3 or more open narrative loops',
    weight: 10,
    // M7: Null-guard open_loops
    check: (s) => Array.isArray(s.open_loops) && s.open_loops.filter((l) => l.status === 'open').length >= 3,
  },
  {
    id: 'foreshadowing-planted',
    phase: 'midpoint',
    description: 'Plant at least one foreshadowing element',
    weight: 10,
    // M7: Null-guard foreshadowing_elements
    check: (s) => Array.isArray(s.foreshadowing_elements) && s.foreshadowing_elements.length >= 1,
  },

  // Climax (weight: 10)
  {
    id: 'twenty-thousand-words',
    phase: 'climax',
    description: 'Reach 20,000 words',
    weight: 10,
    check: (s) => totalWords(s) >= 20_000,
  },

  // Falling Action (weight: 10)
  {
    id: 'half-conflicts-resolved',
    phase: 'falling-action',
    description: 'Resolve at least 50% of your conflicts',
    weight: 10,
    // M7: Null-guard active_conflicts
    check: (s) => {
      if (!Array.isArray(s.active_conflicts) || s.active_conflicts.length === 0) return false;
      const resolved = s.active_conflicts.filter((c) => c.status === 'resolved').length;
      return resolved >= s.active_conflicts.length / 2;
    },
  },

  // Resolution (weight: 10)
  {
    id: 'half-loops-closed',
    phase: 'resolution',
    description: 'Close at least 50% of your open loops',
    weight: 10,
    // M7: Null-guard open_loops
    check: (s) => {
      if (!Array.isArray(s.open_loops) || s.open_loops.length === 0) return false;
      const closed = s.open_loops.filter((l) => l.status === 'closed').length;
      return closed >= s.open_loops.length / 2;
    },
  },
];

// ─── Phase Ordering ───

const PHASE_ORDER: NarrativePhase[] = [
  'setup',
  'rising-action',
  'midpoint',
  'climax',
  'falling-action',
  'resolution',
];

// M18: Clamp input to 0-100 range
function phaseFromProgress(progress: number): NarrativePhase {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(progress) ? progress : 0));
  if (clamped < 15) return 'setup';
  if (clamped < 35) return 'rising-action';
  if (clamped < 55) return 'midpoint';
  if (clamped < 75) return 'climax';
  if (clamped < 90) return 'falling-action';
  return 'resolution';
}

// ─── Analyze Story ───

export function analyzeStory(story: StoryState, previousMilestones?: Milestone[]): FinishingEngineState {
  const prevMap = new Map(previousMilestones?.map((m) => [m.id, m.completed]) ?? []);
  const milestones: Milestone[] = MILESTONE_DEFINITIONS.map((def) => ({
    id: def.id,
    phase: def.phase,
    description: def.description,
    weight: def.weight,
    // Once completed, stays completed (snapshot)
    completed: prevMap.get(def.id) === true || def.check(story),
  }));

  const totalWeight = milestones.reduce((sum, m) => sum + m.weight, 0);
  const completedWeight = milestones.filter((m) => m.completed).reduce((sum, m) => sum + m.weight, 0);
  const overallProgress = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;

  const currentPhase = phaseFromProgress(overallProgress);

  // Next suggestion = first incomplete milestone in phase order
  const nextIncomplete = findNextIncomplete(milestones);
  const nextSuggestion = nextIncomplete
    ? nextIncomplete.description
    : 'Your story is complete! Review and polish your manuscript.';

  return {
    currentPhase,
    overallProgress,
    milestones,
    nextSuggestion,
  };
}

function findNextIncomplete(milestones: Milestone[]): Milestone | null {
  for (const phase of PHASE_ORDER) {
    const incomplete = milestones.find((m) => m.phase === phase && !m.completed);
    if (incomplete) return incomplete;
  }
  return null;
}

// ─── Exports for testing ───

export { MILESTONE_DEFINITIONS, PHASE_ORDER, phaseFromProgress, totalWords };
