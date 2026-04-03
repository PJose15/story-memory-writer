import { describe, it, expect } from 'vitest';
import { getLocalMicroPrompt } from '@/lib/prompts/micro-prompt-bank';

describe('micro-prompt-bank', () => {
  it('should return a non-empty string for English', () => {
    const prompt = getLocalMicroPrompt(null, 'English');
    expect(prompt).toBeTruthy();
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(10);
  });

  it('should return a non-empty string for Spanish', () => {
    const prompt = getLocalMicroPrompt(null, 'Español');
    expect(prompt).toBeTruthy();
    expect(prompt.endsWith('?')).toBe(true);
  });

  it('should return prompts for all block types', () => {
    for (const blockType of ['fear', 'perfectionism', 'direction', 'exhaustion']) {
      const prompt = getLocalMicroPrompt(blockType, 'English');
      expect(prompt).toBeTruthy();
      expect(prompt.length).toBeGreaterThan(10);
    }
  });

  it('should return English by default', () => {
    const prompt = getLocalMicroPrompt();
    expect(prompt).toBeTruthy();
    expect(typeof prompt).toBe('string');
  });

  it('should handle unknown block type gracefully', () => {
    const prompt = getLocalMicroPrompt('unknown-type', 'English');
    expect(prompt).toBeTruthy();
  });

  it('should return Spanish prompts for es language codes', () => {
    const prompt = getLocalMicroPrompt(null, 'es');
    expect(prompt).toBeTruthy();
  });

  it('should return different prompts on multiple calls (probabilistic)', () => {
    const prompts = new Set<string>();
    for (let i = 0; i < 20; i++) {
      prompts.add(getLocalMicroPrompt(null, 'English'));
    }
    expect(prompts.size).toBeGreaterThan(1);
  });
});
