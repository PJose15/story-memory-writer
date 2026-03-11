import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { BraindumpHistoryDrawer } from '@/components/flow/braindump-history-drawer';
import type { UseBraindumpReturn } from '@/hooks/use-braindump';
import type { BraindumpEntry } from '@/lib/types/braindump';

function makeEntry(overrides: Partial<BraindumpEntry> = {}): BraindumpEntry {
  return {
    id: 'entry-1',
    timestamp: '2026-03-10T14:30:00.000Z',
    durationSeconds: 45,
    language: 'en-US',
    projectId: 'proj-1',
    projectName: 'Test Project',
    rawTranscript: 'Hello world this is a voice transcript',
    polishedText: null,
    wasPolished: false,
    wordCount: 7,
    ...overrides,
  };
}

function makeSpeech() {
  return {
    isSupported: true,
    permissionState: 'granted' as const,
    isRecording: false,
    isPaused: false,
    finalTranscript: '',
    interimTranscript: '',
    elapsedSeconds: 0,
    language: 'en-US',
    error: null,
    start: vi.fn(),
    stop: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    setLanguage: vi.fn(),
    reset: vi.fn(),
  };
}

function makeBraindump(overrides: Partial<UseBraindumpReturn> = {}): UseBraindumpReturn {
  return {
    panelOpen: false,
    historyOpen: true,
    speech: makeSpeech(),
    isStopped: false,
    isPolishing: false,
    polishError: null,
    polishProgress: '',
    openPanel: vi.fn(),
    closePanel: vi.fn(),
    openHistory: vi.fn(),
    closeHistory: vi.fn(),
    insertAsIs: vi.fn(),
    polishAndInsert: vi.fn(),
    reRecord: vi.fn(),
    reInsertFromHistory: vi.fn(),
    rePolishFromHistory: vi.fn(),
    deleteHistoryEntry: vi.fn(),
    history: [],
    ...overrides,
  };
}

describe('BraindumpHistoryDrawer', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders with dialog role', () => {
    render(<BraindumpHistoryDrawer braindump={makeBraindump()} />);
    expect(screen.getByRole('dialog', { name: /history/i })).toBeDefined();
  });

  it('shows empty state when no history', () => {
    render(<BraindumpHistoryDrawer braindump={makeBraindump()} />);
    expect(screen.getByText(/No voice recordings/i)).toBeDefined();
  });

  it('renders history entries', () => {
    const entry = makeEntry();
    render(<BraindumpHistoryDrawer braindump={makeBraindump({ history: [entry] })} />);
    expect(screen.getByText(/Hello world this is a voice transcript/)).toBeDefined();
  });

  it('shows polished badge for polished entries', () => {
    const entry = makeEntry({ wasPolished: true, polishedText: 'Clean text here' });
    render(<BraindumpHistoryDrawer braindump={makeBraindump({ history: [entry] })} />);
    expect(screen.getByText('Polished')).toBeDefined();
  });

  it('displays polished text when available', () => {
    const entry = makeEntry({ wasPolished: true, polishedText: 'Clean polished version' });
    render(<BraindumpHistoryDrawer braindump={makeBraindump({ history: [entry] })} />);
    expect(screen.getByText(/Clean polished version/)).toBeDefined();
  });

  it('calls reInsertFromHistory on Re-insert click', () => {
    const reInsertFromHistory = vi.fn();
    const entry = makeEntry({ id: 'h-1' });
    render(<BraindumpHistoryDrawer braindump={makeBraindump({ history: [entry], reInsertFromHistory })} />);
    fireEvent.click(screen.getByText('Re-insert'));
    expect(reInsertFromHistory).toHaveBeenCalledWith('h-1');
  });

  it('shows Polish button for unpolished entries', () => {
    const entry = makeEntry({ wasPolished: false });
    render(<BraindumpHistoryDrawer braindump={makeBraindump({ history: [entry] })} />);
    expect(screen.getByText('Polish')).toBeDefined();
  });

  it('hides Polish button for already polished entries', () => {
    const entry = makeEntry({ wasPolished: true, polishedText: 'done' });
    render(<BraindumpHistoryDrawer braindump={makeBraindump({ history: [entry] })} />);
    expect(screen.queryByText('Polish')).toBeNull();
  });

  it('calls deleteHistoryEntry on delete click', () => {
    const deleteHistoryEntry = vi.fn();
    const entry = makeEntry({ id: 'h-2' });
    render(<BraindumpHistoryDrawer braindump={makeBraindump({ history: [entry], deleteHistoryEntry })} />);
    fireEvent.click(screen.getByLabelText('Delete entry'));
    expect(deleteHistoryEntry).toHaveBeenCalledWith('h-2');
  });

  it('closes on Escape key', () => {
    const closeHistory = vi.fn();
    render(<BraindumpHistoryDrawer braindump={makeBraindump({ closeHistory })} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(closeHistory).toHaveBeenCalled();
  });

  it('shows word count and duration', () => {
    const entry = makeEntry({ wordCount: 7, durationSeconds: 45 });
    render(<BraindumpHistoryDrawer braindump={makeBraindump({ history: [entry] })} />);
    expect(screen.getByText('7 words')).toBeDefined();
    expect(screen.getByText('45s')).toBeDefined();
  });

  // --- Duration formatting ---

  it('formats duration in minutes+seconds', () => {
    const entry = makeEntry({ durationSeconds: 125 });
    render(<BraindumpHistoryDrawer braindump={makeBraindump({ history: [entry] })} />);
    expect(screen.getByText('2m 5s')).toBeDefined();
  });

  it('formats exact minutes without seconds suffix', () => {
    const entry = makeEntry({ durationSeconds: 120 });
    render(<BraindumpHistoryDrawer braindump={makeBraindump({ history: [entry] })} />);
    expect(screen.getByText('2m')).toBeDefined();
  });

  it('formats 0 seconds as 0s', () => {
    const entry = makeEntry({ durationSeconds: 0 });
    render(<BraindumpHistoryDrawer braindump={makeBraindump({ history: [entry] })} />);
    expect(screen.getByText('0s')).toBeDefined();
  });

  // --- Multiple entries ---

  it('renders multiple entries', () => {
    const entries = [
      makeEntry({ id: 'e-1', rawTranscript: 'First entry' }),
      makeEntry({ id: 'e-2', rawTranscript: 'Second entry' }),
    ];
    render(<BraindumpHistoryDrawer braindump={makeBraindump({ history: entries })} />);
    expect(screen.getByText(/First entry/)).toBeDefined();
    expect(screen.getByText(/Second entry/)).toBeDefined();
  });

  it('shows newest entry first (reversed order)', () => {
    const entries = [
      makeEntry({ id: 'e-1', rawTranscript: 'Older entry' }),
      makeEntry({ id: 'e-2', rawTranscript: 'Newer entry' }),
    ];
    render(<BraindumpHistoryDrawer braindump={makeBraindump({ history: entries })} />);
    const older = screen.getByText(/Older entry/);
    const newer = screen.getByText(/Newer entry/);
    // Newer should come before older in DOM
    const parent = older.closest('.space-y-2')!;
    const cards = parent.querySelectorAll('.group');
    expect(cards[0].textContent).toContain('Newer entry');
    expect(cards[1].textContent).toContain('Older entry');
  });

  // --- Polish button calls rePolishFromHistory ---

  it('calls rePolishFromHistory on Polish click', () => {
    const rePolishFromHistory = vi.fn();
    const entry = makeEntry({ id: 'h-3', wasPolished: false });
    render(<BraindumpHistoryDrawer braindump={makeBraindump({ history: [entry], rePolishFromHistory })} />);
    fireEvent.click(screen.getByText('Polish'));
    expect(rePolishFromHistory).toHaveBeenCalledWith('h-3');
  });

  // --- Polish button disabled when polishing ---

  it('disables Polish button when isPolishing', () => {
    const entry = makeEntry({ wasPolished: false });
    render(<BraindumpHistoryDrawer braindump={makeBraindump({ history: [entry], isPolishing: true })} />);
    const btn = screen.getByText('Polish').closest('button');
    expect(btn?.disabled).toBe(true);
  });

  // --- Close button ---

  it('has a close button that calls closeHistory', () => {
    const closeHistory = vi.fn();
    render(<BraindumpHistoryDrawer braindump={makeBraindump({ closeHistory })} />);
    fireEvent.click(screen.getByLabelText('Close history'));
    expect(closeHistory).toHaveBeenCalledTimes(1);
  });

  // --- Header ---

  it('shows Voice History header', () => {
    render(<BraindumpHistoryDrawer braindump={makeBraindump()} />);
    expect(screen.getByText('Voice History')).toBeDefined();
  });

  // --- Language display ---

  it('shows entry language', () => {
    const entry = makeEntry({ language: 'pt-BR' });
    render(<BraindumpHistoryDrawer braindump={makeBraindump({ history: [entry] })} />);
    expect(screen.getByText('pt-BR')).toBeDefined();
  });

  // --- Entry with both raw and polished (shows polished) ---

  it('shows polished text over raw when both exist', () => {
    const entry = makeEntry({
      rawTranscript: 'um like you know raw',
      polishedText: 'Clean polished version',
      wasPolished: true,
    });
    render(<BraindumpHistoryDrawer braindump={makeBraindump({ history: [entry] })} />);
    // Should show polished text in preview
    expect(screen.getByText(/Clean polished version/)).toBeDefined();
  });

  // --- Empty state message detail ---

  it('shows guidance text in empty state', () => {
    render(<BraindumpHistoryDrawer braindump={makeBraindump()} />);
    expect(screen.getByText(/sessions will appear here/i)).toBeDefined();
  });

  // --- 10 entries (max) renders ---

  it('renders all 10 entries at max', () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      makeEntry({ id: `e-${i}`, rawTranscript: `Entry number ${i}` })
    );
    render(<BraindumpHistoryDrawer braindump={makeBraindump({ history: entries })} />);
    expect(screen.getByText(/Entry number 0/)).toBeDefined();
    expect(screen.getByText(/Entry number 9/)).toBeDefined();
  });

  // --- Unicode in transcript ---

  it('renders unicode characters in transcript', () => {
    const entry = makeEntry({ rawTranscript: 'Olá mundo 你好世界' });
    render(<BraindumpHistoryDrawer braindump={makeBraindump({ history: [entry] })} />);
    expect(screen.getByText(/Olá mundo 你好世界/)).toBeDefined();
  });
});
