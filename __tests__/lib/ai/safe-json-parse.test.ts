import { describe, it, expect, vi } from 'vitest';
import { safeParseGeminiResponse } from '@/lib/ai/safe-json-parse';

describe('safeParseGeminiResponse', () => {
  it('should parse clean JSON', () => {
    const result = safeParseGeminiResponse('{"key": "value"}', {});
    expect(result).toEqual({ key: 'value' });
  });

  it('should parse markdown-fenced JSON', () => {
    const fenced = '```json\n{"key": "value"}\n```';
    const result = safeParseGeminiResponse(fenced, {});
    expect(result).toEqual({ key: 'value' });
  });

  it('should parse JSON with just backticks (no json label)', () => {
    const fenced = '```\n{"key": "value"}\n```';
    const result = safeParseGeminiResponse(fenced, {});
    expect(result).toEqual({ key: 'value' });
  });

  it('should return fallback for empty string', () => {
    const result = safeParseGeminiResponse('', { default: true });
    expect(result).toEqual({ default: true });
  });

  it('should return fallback for malformed JSON', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = safeParseGeminiResponse('not json at all', { fallback: true });
    expect(result).toEqual({ fallback: true });
  });

  it('should extract JSON from mixed text', () => {
    const mixed = 'Here is the response:\n{"key": "value"}\nEnd of response';
    const result = safeParseGeminiResponse(mixed, {});
    expect(result).toEqual({ key: 'value' });
  });

  it('should use validator when provided', () => {
    const isString = (v: unknown): v is string => typeof v === 'string';
    const result = safeParseGeminiResponse('"hello"', 'fallback', isString);
    expect(result).toBe('hello');
  });

  it('should return fallback when validator rejects', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const isNumber = (v: unknown): v is number => typeof v === 'number';
    const result = safeParseGeminiResponse('"hello"', 42, isNumber);
    expect(result).toBe(42);
  });

  it('should handle arrays', () => {
    const result = safeParseGeminiResponse('[1, 2, 3]', []);
    expect(result).toEqual([1, 2, 3]);
  });

  it('should handle null/undefined input', () => {
    expect(safeParseGeminiResponse(null as unknown as string, 'default')).toBe('default');
    expect(safeParseGeminiResponse(undefined as unknown as string, 'default')).toBe('default');
  });
});
