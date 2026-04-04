import { describe, it, expect } from 'vitest';
import {
  isGenesisComplete,
  createEmptyGenesis,
  GENESIS_STEPS,
  GENRE_OPTIONS,
  TONE_OPTIONS,
} from '@/lib/types/genesis';
import type { GenesisData } from '@/lib/types/genesis';

function makeGenesisData(overrides: Partial<GenesisData> = {}): GenesisData {
  return {
    projectName: 'The Obsidian Crown',
    logline: 'A disgraced knight seeks redemption.',
    genres: ['Fantasy'],
    tones: ['Dark'],
    protagonist: {
      name: 'Alaric',
      role: 'Protagonist',
      description: 'A fallen knight',
      goal: 'Reclaim his honor',
      fear: 'Being forgotten',
    },
    antagonist: {
      type: 'character',
      name: 'Morvaine',
      description: 'A shadow sorcerer',
      motivation: 'Absolute power',
    },
    world: {
      setting: 'A crumbling medieval kingdom',
      timePeriod: 'Dark Ages',
      rules: ['Magic corrupts the user'],
    },
    ...overrides,
  };
}

describe('genesis types', () => {
  describe('GENESIS_STEPS', () => {
    it('has 6 steps in order', () => {
      expect(GENESIS_STEPS).toEqual([
        'name', 'logline', 'genre-tone', 'protagonist', 'antagonist', 'world',
      ]);
    });
  });

  describe('GENRE_OPTIONS', () => {
    it('contains at least 10 genres', () => {
      expect(GENRE_OPTIONS.length).toBeGreaterThanOrEqual(10);
    });

    it('includes Fantasy and Science Fiction', () => {
      expect(GENRE_OPTIONS).toContain('Fantasy');
      expect(GENRE_OPTIONS).toContain('Science Fiction');
    });
  });

  describe('TONE_OPTIONS', () => {
    it('contains at least 10 tones', () => {
      expect(TONE_OPTIONS.length).toBeGreaterThanOrEqual(10);
    });

    it('includes Dark and Humorous', () => {
      expect(TONE_OPTIONS).toContain('Dark');
      expect(TONE_OPTIONS).toContain('Humorous');
    });
  });

  describe('isGenesisComplete', () => {
    it('returns true for complete data', () => {
      expect(isGenesisComplete(makeGenesisData())).toBe(true);
    });

    it('returns false when projectName is empty', () => {
      expect(isGenesisComplete(makeGenesisData({ projectName: '' }))).toBe(false);
    });

    it('returns false when projectName is whitespace', () => {
      expect(isGenesisComplete(makeGenesisData({ projectName: '   ' }))).toBe(false);
    });

    it('returns false when logline is empty', () => {
      expect(isGenesisComplete(makeGenesisData({ logline: '' }))).toBe(false);
    });

    it('returns false when genres is empty', () => {
      expect(isGenesisComplete(makeGenesisData({ genres: [] }))).toBe(false);
    });

    it('returns false when tones is empty', () => {
      expect(isGenesisComplete(makeGenesisData({ tones: [] }))).toBe(false);
    });

    it('returns false when protagonist name is empty', () => {
      expect(isGenesisComplete(makeGenesisData({
        protagonist: { name: '', role: 'Protagonist', description: '', goal: '', fear: '' },
      }))).toBe(false);
    });

    it('returns false when antagonist name is empty', () => {
      expect(isGenesisComplete(makeGenesisData({
        antagonist: { type: 'character', name: '', description: '', motivation: '' },
      }))).toBe(false);
    });

    it('returns false when world setting is empty', () => {
      expect(isGenesisComplete(makeGenesisData({
        world: { setting: '', timePeriod: '', rules: [] },
      }))).toBe(false);
    });

    it('returns false for empty partial data', () => {
      expect(isGenesisComplete({})).toBe(false);
    });
  });

  describe('createEmptyGenesis', () => {
    it('returns a partial with empty fields', () => {
      const empty = createEmptyGenesis();
      expect(empty.projectName).toBe('');
      expect(empty.logline).toBe('');
      expect(empty.genres).toEqual([]);
      expect(empty.tones).toEqual([]);
      expect(empty.protagonist?.name).toBe('');
      expect(empty.antagonist?.type).toBe('character');
      expect(empty.world?.rules).toEqual([]);
    });

    it('is not considered complete', () => {
      expect(isGenesisComplete(createEmptyGenesis())).toBe(false);
    });
  });
});
