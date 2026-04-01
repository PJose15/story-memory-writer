import { describe, it, expect } from 'vitest';
import { formatDateKey } from '@/lib/gamification/date-utils';

describe('formatDateKey', () => {
  it('formats a normal date correctly', () => {
    expect(formatDateKey(new Date(2025, 0, 15))).toBe('2025-01-15');
  });

  it('pads single-digit month and day', () => {
    expect(formatDateKey(new Date(2025, 2, 5))).toBe('2025-03-05');
  });

  it('formats New Year Eve correctly', () => {
    expect(formatDateKey(new Date(2025, 11, 31))).toBe('2025-12-31');
  });

  it('formats New Year Day correctly', () => {
    expect(formatDateKey(new Date(2026, 0, 1))).toBe('2026-01-01');
  });

  it('formats leap day correctly', () => {
    expect(formatDateKey(new Date(2024, 1, 29))).toBe('2024-02-29');
  });

  it('formats month boundary (Jan 31) correctly', () => {
    expect(formatDateKey(new Date(2025, 0, 31))).toBe('2025-01-31');
  });
});
