import type { BlockType } from '@/lib/session';

export interface WriterQuote {
  id: string;
  text: string;
  author: string;
  source: string;
  blockTypes: Exclude<BlockType, null>[];
  zagafyPhrase: string;
}
