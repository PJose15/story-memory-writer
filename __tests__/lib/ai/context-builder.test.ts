import { describe, it, expect } from 'vitest';
import { buildContext } from '@/lib/ai/context-builder';
import { defaultState, type StoryState } from '@/lib/store';

function makeState(overrides: Partial<StoryState> = {}): StoryState {
  return {
    ...defaultState,
    title: 'Test Story',
    synopsis: 'A test story about Elena.',
    language: 'English',
    characters: [
      {
        id: 'c1',
        name: 'Elena',
        role: 'Protagonist',
        description: 'A young archaeologist.',
        relationships: 'Sister of Marco',
        canonStatus: 'confirmed',
      },
      {
        id: 'c2',
        name: 'Marco',
        role: 'Supporting',
        description: 'Elena\'s older brother.',
        relationships: 'Brother of Elena',
        canonStatus: 'confirmed',
      },
    ],
    chapters: [
      { id: 'ch1', title: 'The Discovery', content: 'Elena finds an ancient artifact...', summary: 'Elena discovers an artifact in the ruins.', canonStatus: 'confirmed' },
      { id: 'ch2', title: 'The Letter', content: 'A mysterious letter arrives...', summary: 'A letter reveals a family secret.', canonStatus: 'flexible' },
    ],
    scenes: [],
    locations: [
      { id: 'l1', name: 'The Ruins', description: 'Ancient ruins outside the city.', importance: 'Major setting', associatedRules: [], canonStatus: 'confirmed' },
    ],
    active_conflicts: [
      { id: 'conf1', title: 'Family Secret', description: 'Elena must decide whether to reveal the truth.', status: 'active', canonStatus: 'confirmed' },
    ],
    open_loops: [
      { id: 'ol1', description: 'Who sent the letter?', status: 'open', canonStatus: 'confirmed' },
    ],
    ...overrides,
  };
}

describe('buildContext', () => {
  it('returns context string and known entities', () => {
    const state = makeState();
    const result = buildContext(state, { userInput: 'What happens next?', isBlockedMode: false });

    expect(typeof result.context).toBe('string');
    expect(result.context.length).toBeGreaterThan(0);
    expect(result.knownEntities.characters).toContain('Elena');
    expect(result.knownEntities.characters).toContain('Marco');
    expect(result.knownEntities.chapters).toContain('The Discovery');
    expect(result.knownEntities.locations).toContain('The Ruins');
  });

  it('includes story title and synopsis', () => {
    const state = makeState();
    const { context } = buildContext(state, { userInput: 'test', isBlockedMode: false });

    expect(context).toContain('Test Story');
    expect(context).toContain('A test story about Elena.');
  });

  it('includes context inventory with correct counts', () => {
    const state = makeState();
    const { context } = buildContext(state, { userInput: 'test', isBlockedMode: false });

    expect(context).toContain('Characters (2)');
    expect(context).toContain('Chapters (2)');
    expect(context).toContain('Locations (1)');
    expect(context).toContain('Active Conflicts (1)');
  });

  it('includes entity names in context inventory', () => {
    const state = makeState();
    const { context } = buildContext(state, { userInput: 'test', isBlockedMode: false });

    // Character names
    expect(context).toContain('Characters (2): Elena, Marco');
    // Chapter titles
    expect(context).toContain('Chapters (2): The Discovery, The Letter');
    // Location names
    expect(context).toContain('Locations (1): The Ruins');
    // Conflict titles
    expect(context).toContain('Active Conflicts (1): Family Secret');
  });

  it('includes confirmed canon items', () => {
    const state = makeState();
    const { context } = buildContext(state, { userInput: 'test', isBlockedMode: false });

    expect(context).toContain('CONFIRMED CANON');
    expect(context).toContain('Elena');
    expect(context).toContain('The Discovery');
  });

  it('excludes discarded items', () => {
    const state = makeState({
      characters: [
        ...makeState().characters,
        { id: 'c3', name: 'Removed Character', role: 'Villain', description: 'Gone', relationships: '', canonStatus: 'discarded' },
      ],
    });
    const { context, knownEntities } = buildContext(state, { userInput: 'test', isBlockedMode: false });

    expect(context).not.toContain('Removed Character');
    expect(knownEntities.characters).not.toContain('Removed Character');
  });

  it('respects maxLength limit', () => {
    const state = makeState();
    const { context } = buildContext(state, { userInput: 'test', isBlockedMode: false, maxLength: 2000 });

    // The header alone takes space, but optional sections should be truncated to stay near limit
    expect(context.length).toBeLessThanOrEqual(2500); // header + truncation manifest buffer
  });

  it('includes writer block type when provided', () => {
    const state = makeState();
    const { context } = buildContext(state, {
      userInput: 'test',
      isBlockedMode: false,
      writerBlockType: 'fear',
    });

    expect(context).toContain('WRITER STATE: FEAR');
  });

  it('includes open loops section', () => {
    const state = makeState();
    const { context } = buildContext(state, { userInput: 'test', isBlockedMode: false });

    expect(context).toContain('Who sent the letter?');
  });

  it('handles empty story state gracefully', () => {
    const { context, knownEntities } = buildContext(defaultState, { userInput: 'test', isBlockedMode: false });

    expect(context).toContain('CONTEXT INVENTORY');
    expect(context).toContain('Characters (0): None');
    expect(knownEntities.characters).toHaveLength(0);
  });

  it('in blocked mode, uses larger content limit and includes conflicts', () => {
    const state = makeState();
    const { context: normalCtx } = buildContext(state, { userInput: 'test', isBlockedMode: false });
    const { context: blockedCtx } = buildContext(state, { userInput: 'test', isBlockedMode: true });

    // Blocked mode should include conflicts section explicitly
    expect(blockedCtx).toContain('ACTIVE CONFLICTS');
    expect(blockedCtx).toContain('Family Secret');
    // Both should include the conflict in confirmed canon at least
    expect(normalCtx).toContain('Family Secret');
  });

  it('places truncation manifest before story sections when truncation occurs', () => {
    const state = makeState();
    const { context } = buildContext(state, { userInput: 'test', isBlockedMode: false, maxLength: 2000 });

    const manifestIdx = context.indexOf('CONTEXT TRUNCATION MANIFEST');
    if (manifestIdx !== -1) {
      // Manifest should appear before optional sections like OPEN LOOPS
      const openLoopsIdx = context.indexOf('OPEN LOOPS');
      if (openLoopsIdx !== -1) {
        expect(manifestIdx).toBeLessThan(openLoopsIdx);
      }
      // Manifest should appear after the header (STORY BIBLE)
      const storyBibleIdx = context.indexOf('STORY BIBLE');
      expect(manifestIdx).toBeGreaterThan(storyBibleIdx);
      // Should contain the "read this FIRST" marker
      expect(context).toContain('read this FIRST');
    }
  });

  it('includes timeline temporal ordering markers', () => {
    const state = makeState({
      timeline_events: [
        { id: 't1', date: '2024-03-01', description: 'Event B happens', impact: 'moderate', canonStatus: 'confirmed' },
        { id: 't2', date: '2024-01-15', description: 'Event A happens', impact: 'major', canonStatus: 'confirmed' },
        { id: 't3', date: '2024-06-20', description: 'Event C happens', impact: 'minor', canonStatus: 'confirmed' },
      ],
    });
    const { context } = buildContext(state, { userInput: 'test', isBlockedMode: false });

    // Should contain ordering markers
    expect(context).toContain('[earliest]');
    expect(context).toContain('[after:');
    // First event chronologically should be marked [earliest]
    expect(context).toContain('2024-01-15 [earliest]');
    // Later events should reference the previous date
    expect(context).toContain('[after: 2024-01-15]');
  });

  it('detects orphaned scenes', () => {
    const state = makeState({
      scenes: [
        { id: 's1', chapterId: 'nonexistent', title: 'Orphan Scene', content: '', summary: 'An orphaned scene', canonStatus: 'draft' },
      ],
    });
    const { context } = buildContext(state, { userInput: 'test', isBlockedMode: false });

    expect(context).toContain('DATA INTEGRITY NOTES');
    expect(context).toContain('non-existent chapters');
  });
});
