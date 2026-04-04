import { describe, it, expect } from 'vitest';
import { shouldBlockKey, isDestructiveKey } from '@/lib/no-retreat-handler';

describe('isDestructiveKey', () => {
  it('identifies Backspace as destructive', () => {
    expect(isDestructiveKey('Backspace', false, false)).toBe(true);
  });

  it('identifies Delete as destructive', () => {
    expect(isDestructiveKey('Delete', false, false)).toBe(true);
  });

  it('identifies Ctrl+Z as destructive', () => {
    expect(isDestructiveKey('z', true, false)).toBe(true);
  });

  it('identifies Meta+Z as destructive', () => {
    expect(isDestructiveKey('z', false, true)).toBe(true);
  });

  it('identifies Ctrl+X as destructive', () => {
    expect(isDestructiveKey('x', true, false)).toBe(true);
  });

  it('identifies Meta+X as destructive', () => {
    expect(isDestructiveKey('x', false, true)).toBe(true);
  });

  it('identifies Ctrl+Backspace as destructive', () => {
    expect(isDestructiveKey('Backspace', true, false)).toBe(true);
  });

  it('identifies Ctrl+Delete as destructive', () => {
    expect(isDestructiveKey('Delete', true, false)).toBe(true);
  });

  it('does NOT identify regular keys as destructive', () => {
    expect(isDestructiveKey('a', false, false)).toBe(false);
    expect(isDestructiveKey('Enter', false, false)).toBe(false);
    expect(isDestructiveKey(' ', false, false)).toBe(false);
  });

  it('does NOT identify Ctrl+C as destructive', () => {
    expect(isDestructiveKey('c', true, false)).toBe(false);
  });
});

describe('shouldBlockKey', () => {
  const defaults = {
    ctrlKey: false,
    metaKey: false,
    sessionStartOffset: 100,
  };

  describe('non-destructive keys', () => {
    it('never blocks regular typing', () => {
      expect(shouldBlockKey({
        ...defaults,
        key: 'a',
        cursorPos: 50,
        selectionStart: 50,
        selectionEnd: 50,
      })).toBe(false);
    });

    it('never blocks Enter', () => {
      expect(shouldBlockKey({
        ...defaults,
        key: 'Enter',
        cursorPos: 150,
        selectionStart: 150,
        selectionEnd: 150,
      })).toBe(false);
    });
  });

  describe('Backspace in pre-existing zone', () => {
    it('blocks Backspace at cursor <= sessionStartOffset', () => {
      expect(shouldBlockKey({
        ...defaults,
        key: 'Backspace',
        cursorPos: 50,
        selectionStart: 50,
        selectionEnd: 50,
      })).toBe(true);
    });

    it('blocks Backspace at exact boundary', () => {
      expect(shouldBlockKey({
        ...defaults,
        key: 'Backspace',
        cursorPos: 100,
        selectionStart: 100,
        selectionEnd: 100,
      })).toBe(true);
    });
  });

  describe('Backspace in new-text zone', () => {
    it('blocks Backspace in new zone (no-retreat active)', () => {
      expect(shouldBlockKey({
        ...defaults,
        key: 'Backspace',
        cursorPos: 150,
        selectionStart: 150,
        selectionEnd: 150,
      })).toBe(true);
    });
  });

  describe('Delete in pre-existing zone', () => {
    it('blocks Delete at cursor < sessionStartOffset', () => {
      expect(shouldBlockKey({
        ...defaults,
        key: 'Delete',
        cursorPos: 50,
        selectionStart: 50,
        selectionEnd: 50,
      })).toBe(true);
    });
  });

  describe('Delete in new-text zone', () => {
    it('blocks Delete in new zone (no-retreat active)', () => {
      expect(shouldBlockKey({
        ...defaults,
        key: 'Delete',
        cursorPos: 150,
        selectionStart: 150,
        selectionEnd: 150,
      })).toBe(true);
    });
  });

  describe('selection spanning boundary', () => {
    it('blocks when selection crosses from pre-existing into new zone', () => {
      expect(shouldBlockKey({
        ...defaults,
        key: 'Backspace',
        cursorPos: 80,
        selectionStart: 80,
        selectionEnd: 120,
      })).toBe(true);
    });
  });

  describe('selection entirely in pre-existing zone', () => {
    it('blocks deletion of pre-existing content', () => {
      expect(shouldBlockKey({
        ...defaults,
        key: 'Delete',
        cursorPos: 20,
        selectionStart: 20,
        selectionEnd: 60,
      })).toBe(true);
    });
  });

  describe('selection entirely in new zone', () => {
    it('blocks deletion in new zone (no-retreat active)', () => {
      expect(shouldBlockKey({
        ...defaults,
        key: 'Backspace',
        cursorPos: 110,
        selectionStart: 110,
        selectionEnd: 140,
      })).toBe(true);
    });
  });

  describe('Ctrl combinations', () => {
    it('blocks Ctrl+Z', () => {
      expect(shouldBlockKey({
        ...defaults,
        key: 'z',
        ctrlKey: true,
        cursorPos: 150,
        selectionStart: 150,
        selectionEnd: 150,
      })).toBe(true);
    });

    it('blocks Meta+X', () => {
      expect(shouldBlockKey({
        ...defaults,
        key: 'x',
        metaKey: true,
        cursorPos: 150,
        selectionStart: 150,
        selectionEnd: 150,
      })).toBe(true);
    });

    it('blocks Ctrl+Backspace', () => {
      expect(shouldBlockKey({
        ...defaults,
        key: 'Backspace',
        ctrlKey: true,
        cursorPos: 150,
        selectionStart: 150,
        selectionEnd: 150,
      })).toBe(true);
    });

    it('blocks Ctrl+Delete', () => {
      expect(shouldBlockKey({
        ...defaults,
        key: 'Delete',
        ctrlKey: true,
        cursorPos: 150,
        selectionStart: 150,
        selectionEnd: 150,
      })).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles sessionStartOffset = 0 (empty initial)', () => {
      expect(shouldBlockKey({
        ...defaults,
        key: 'Backspace',
        sessionStartOffset: 0,
        cursorPos: 5,
        selectionStart: 5,
        selectionEnd: 5,
      })).toBe(true);
    });

    it('handles cursor at position 0', () => {
      expect(shouldBlockKey({
        ...defaults,
        key: 'Backspace',
        cursorPos: 0,
        selectionStart: 0,
        selectionEnd: 0,
      })).toBe(true);
    });
  });
});
