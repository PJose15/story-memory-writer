export type GenesisStep = 'name' | 'logline' | 'genre-tone' | 'protagonist' | 'antagonist' | 'world';

export const GENESIS_STEPS: GenesisStep[] = ['name', 'logline', 'genre-tone', 'protagonist', 'antagonist', 'world'];

export const GENRE_OPTIONS = [
  'Fantasy',
  'Science Fiction',
  'Mystery',
  'Thriller',
  'Romance',
  'Horror',
  'Literary Fiction',
  'Historical Fiction',
  'Adventure',
  'Dystopian',
  'Crime',
  'Magical Realism',
] as const;

export const TONE_OPTIONS = [
  'Dark',
  'Humorous',
  'Romantic',
  'Suspenseful',
  'Whimsical',
  'Gritty',
  'Lyrical',
  'Minimalist',
  'Epic',
  'Intimate',
  'Satirical',
  'Melancholic',
] as const;

export type AntagonistType = 'character' | 'force' | 'internal';

export interface GenesisProtagonist {
  name: string;
  role: string;
  description: string;
  goal: string;
  fear: string;
}

export interface GenesisAntagonist {
  type: AntagonistType;
  name: string;
  description: string;
  motivation: string;
}

export interface GenesisWorld {
  setting: string;
  timePeriod: string;
  rules: string[];
}

export interface GenesisData {
  projectName: string;
  logline: string;
  genres: string[];
  tones: string[];
  protagonist: GenesisProtagonist;
  antagonist: GenesisAntagonist;
  world: GenesisWorld;
}

export function isGenesisComplete(data: Partial<GenesisData>): data is GenesisData {
  if (!data.projectName || data.projectName.trim().length === 0) return false;
  if (!data.logline || data.logline.trim().length === 0) return false;
  if (!data.genres || data.genres.length === 0) return false;
  if (!data.tones || data.tones.length === 0) return false;
  if (!data.protagonist) return false;
  if (!data.protagonist.name || data.protagonist.name.trim().length === 0) return false;
  if (!data.antagonist) return false;
  if (!data.antagonist.name || data.antagonist.name.trim().length === 0) return false;
  if (!data.antagonist.type) return false;
  if (!data.world) return false;
  if (!data.world.setting || data.world.setting.trim().length === 0) return false;
  return true;
}

export function createEmptyGenesis(): Partial<GenesisData> {
  return {
    projectName: '',
    logline: '',
    genres: [],
    tones: [],
    protagonist: {
      name: '',
      role: 'Protagonist',
      description: '',
      goal: '',
      fear: '',
    },
    antagonist: {
      type: 'character',
      name: '',
      description: '',
      motivation: '',
    },
    world: {
      setting: '',
      timePeriod: '',
      rules: [],
    },
  };
}
