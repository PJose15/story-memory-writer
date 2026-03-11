import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { BraindumpPanel } from '@/components/flow/braindump-panel';
import type { UseBraindumpReturn } from '@/hooks/use-braindump';

function makeSpeech(overrides = {}) {
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
    ...overrides,
  };
}

function makeBraindump(overrides: Partial<UseBraindumpReturn> = {}): UseBraindumpReturn {
  return {
    panelOpen: true,
    historyOpen: false,
    speech: makeSpeech(),
    isStopped: false,
    isPolishing: false,
    polishError: null,
    polishProgress: 'Polishing...',
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

describe('BraindumpPanel', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders with aria-label', () => {
    render(<BraindumpPanel braindump={makeBraindump()} />);
    expect(screen.getByRole('region', { name: /voice braindump/i })).toBeDefined();
  });

  it('shows recording state with controls', () => {
    render(<BraindumpPanel braindump={makeBraindump({
      speech: makeSpeech({ isRecording: true }),
    })} />);
    expect(screen.getByText('Recording')).toBeDefined();
    expect(screen.getByLabelText('Pause recording')).toBeDefined();
    expect(screen.getByLabelText('Stop recording')).toBeDefined();
  });

  it('shows listening message when recording with no transcript', () => {
    render(<BraindumpPanel braindump={makeBraindump({
      speech: makeSpeech({ isRecording: true }),
    })} />);
    expect(screen.getByText(/Listening/i)).toBeDefined();
  });

  it('displays final transcript text', () => {
    render(<BraindumpPanel braindump={makeBraindump({
      speech: makeSpeech({ finalTranscript: 'Hello world from voice' }),
    })} />);
    expect(screen.getByText(/Hello world from voice/)).toBeDefined();
  });

  it('displays interim transcript in gray', () => {
    render(<BraindumpPanel braindump={makeBraindump({
      speech: makeSpeech({ isRecording: true, interimTranscript: 'partial text' }),
    })} />);
    expect(screen.getByText(/partial text/)).toBeDefined();
  });

  it('shows action buttons when stopped with transcript', () => {
    render(<BraindumpPanel braindump={makeBraindump({
      isStopped: true,
      speech: makeSpeech({ finalTranscript: 'some words here' }),
    })} />);
    expect(screen.getByText('Insert as-is')).toBeDefined();
    expect(screen.getByText('Polish & insert')).toBeDefined();
    expect(screen.getByText('Re-record')).toBeDefined();
  });

  it('calls insertAsIs when button clicked', () => {
    const insertAsIs = vi.fn();
    render(<BraindumpPanel braindump={makeBraindump({
      isStopped: true,
      speech: makeSpeech({ finalTranscript: 'text' }),
      insertAsIs,
    })} />);
    fireEvent.click(screen.getByText('Insert as-is'));
    expect(insertAsIs).toHaveBeenCalledTimes(1);
  });

  it('calls polishAndInsert when button clicked', () => {
    const polishAndInsert = vi.fn();
    render(<BraindumpPanel braindump={makeBraindump({
      isStopped: true,
      speech: makeSpeech({ finalTranscript: 'text' }),
      polishAndInsert,
    })} />);
    fireEvent.click(screen.getByText('Polish & insert'));
    expect(polishAndInsert).toHaveBeenCalledTimes(1);
  });

  it('shows loading state during polishing', () => {
    render(<BraindumpPanel braindump={makeBraindump({
      isStopped: true,
      isPolishing: true,
      polishProgress: 'Cleaning up the transcript...',
      speech: makeSpeech({ finalTranscript: 'text' }),
    })} />);
    expect(screen.getByText('Cleaning up the transcript...')).toBeDefined();
  });

  it('shows polish error message', () => {
    render(<BraindumpPanel braindump={makeBraindump({
      isStopped: true,
      polishError: 'Network error occurred',
      speech: makeSpeech({ finalTranscript: 'text' }),
    })} />);
    expect(screen.getByText('Network error occurred')).toBeDefined();
  });

  it('shows language selector', () => {
    render(<BraindumpPanel braindump={makeBraindump()} />);
    expect(screen.getByLabelText('Recognition language')).toBeDefined();
  });

  it('shows timer display', () => {
    render(<BraindumpPanel braindump={makeBraindump({
      speech: makeSpeech({ elapsedSeconds: 65 }),
    })} />);
    expect(screen.getByText('1:05')).toBeDefined();
  });

  // --- Paused state ---

  it('shows Paused label when paused', () => {
    render(<BraindumpPanel braindump={makeBraindump({
      speech: makeSpeech({ isRecording: true, isPaused: true }),
    })} />);
    expect(screen.getByText('Paused')).toBeDefined();
  });

  it('shows resume button when paused', () => {
    render(<BraindumpPanel braindump={makeBraindump({
      speech: makeSpeech({ isRecording: true, isPaused: true }),
    })} />);
    expect(screen.getByLabelText('Resume recording')).toBeDefined();
  });

  it('calls speech.pause when pause button clicked', () => {
    const pause = vi.fn();
    render(<BraindumpPanel braindump={makeBraindump({
      speech: makeSpeech({ isRecording: true, pause }),
    })} />);
    fireEvent.click(screen.getByLabelText('Pause recording'));
    expect(pause).toHaveBeenCalledTimes(1);
  });

  it('calls speech.resume when resume button clicked', () => {
    const resume = vi.fn();
    render(<BraindumpPanel braindump={makeBraindump({
      speech: makeSpeech({ isRecording: true, isPaused: true, resume }),
    })} />);
    fireEvent.click(screen.getByLabelText('Resume recording'));
    expect(resume).toHaveBeenCalledTimes(1);
  });

  it('calls speech.stop when stop button clicked', () => {
    const stop = vi.fn();
    render(<BraindumpPanel braindump={makeBraindump({
      speech: makeSpeech({ isRecording: true, stop }),
    })} />);
    fireEvent.click(screen.getByLabelText('Stop recording'));
    expect(stop).toHaveBeenCalledTimes(1);
  });

  // --- Close button ---

  it('calls closePanel when close button clicked', () => {
    const closePanel = vi.fn();
    render(<BraindumpPanel braindump={makeBraindump({ closePanel })} />);
    fireEvent.click(screen.getByLabelText('Close braindump panel'));
    expect(closePanel).toHaveBeenCalledTimes(1);
  });

  // --- Stopped state label ---

  it('shows Stopped label when isStopped', () => {
    render(<BraindumpPanel braindump={makeBraindump({
      isStopped: true,
      speech: makeSpeech({ finalTranscript: 'words' }),
    })} />);
    expect(screen.getByText('Stopped')).toBeDefined();
  });

  // --- No transcript after stop ---

  it('shows "No words captured" when stopped without transcript', () => {
    render(<BraindumpPanel braindump={makeBraindump({
      isStopped: true,
      speech: makeSpeech({ finalTranscript: '' }),
    })} />);
    expect(screen.getByText(/No words captured/i)).toBeDefined();
  });

  // --- Action buttons disabled state ---

  it('does not show action buttons when not stopped', () => {
    render(<BraindumpPanel braindump={makeBraindump({
      isStopped: false,
      speech: makeSpeech({ isRecording: true, finalTranscript: 'some text' }),
    })} />);
    expect(screen.queryByText('Insert as-is')).toBeNull();
    expect(screen.queryByText('Polish & insert')).toBeNull();
  });

  it('hides action buttons during polish and shows spinner', () => {
    render(<BraindumpPanel braindump={makeBraindump({
      isStopped: true,
      isPolishing: true,
      polishProgress: 'Making it shine...',
      speech: makeSpeech({ finalTranscript: 'text' }),
    })} />);
    // Action buttons should not render when isPolishing
    expect(screen.queryByText('Insert as-is')).toBeNull();
    expect(screen.getByText('Making it shine...')).toBeDefined();
  });

  it('calls reRecord when Re-record button clicked', () => {
    const reRecord = vi.fn();
    render(<BraindumpPanel braindump={makeBraindump({
      isStopped: true,
      speech: makeSpeech({ finalTranscript: 'text' }),
      reRecord,
    })} />);
    fireEvent.click(screen.getByText('Re-record'));
    expect(reRecord).toHaveBeenCalledTimes(1);
  });

  // --- Timer formatting ---

  it('formats zero seconds as 0:00', () => {
    render(<BraindumpPanel braindump={makeBraindump({
      speech: makeSpeech({ elapsedSeconds: 0 }),
    })} />);
    expect(screen.getByText('0:00')).toBeDefined();
  });

  it('formats 59 seconds as 0:59', () => {
    render(<BraindumpPanel braindump={makeBraindump({
      speech: makeSpeech({ elapsedSeconds: 59 }),
    })} />);
    expect(screen.getByText('0:59')).toBeDefined();
  });

  it('formats 600 seconds as 10:00', () => {
    render(<BraindumpPanel braindump={makeBraindump({
      speech: makeSpeech({ elapsedSeconds: 600 }),
    })} />);
    expect(screen.getByText('10:00')).toBeDefined();
  });

  // --- Language selector interaction ---

  it('calls setLanguage when language changed', () => {
    const setLanguage = vi.fn();
    render(<BraindumpPanel braindump={makeBraindump({
      speech: makeSpeech({ setLanguage }),
    })} />);
    fireEvent.change(screen.getByLabelText('Recognition language'), { target: { value: 'pt-BR' } });
    expect(setLanguage).toHaveBeenCalledWith('pt-BR');
  });

  it('shows current language in selector', () => {
    render(<BraindumpPanel braindump={makeBraindump({
      speech: makeSpeech({ language: 'fr-FR' }),
    })} />);
    const select = screen.getByLabelText('Recognition language') as HTMLSelectElement;
    expect(select.value).toBe('fr-FR');
  });

  // --- Error display during recording ---

  it('shows speech error when recording', () => {
    render(<BraindumpPanel braindump={makeBraindump({
      speech: makeSpeech({ isRecording: true, error: 'No speech detected — keep going or stop.' }),
    })} />);
    expect(screen.getByText(/No speech detected/)).toBeDefined();
  });

  it('does not show speech error when stopped (action area takes over)', () => {
    render(<BraindumpPanel braindump={makeBraindump({
      isStopped: true,
      speech: makeSpeech({ error: 'Some error' }),
    })} />);
    // The error condition checks !isStopped, so it should not render
    expect(screen.queryByText('Some error')).toBeNull();
  });

  // --- Transcript aria-live ---

  it('has aria-live on transcript area', () => {
    render(<BraindumpPanel braindump={makeBraindump({
      speech: makeSpeech({ finalTranscript: 'test text' }),
    })} />);
    const transcript = screen.getByText('test text').closest('[aria-live]');
    expect(transcript).toBeDefined();
    expect(transcript?.getAttribute('aria-live')).toBe('polite');
  });

  // --- Combined final + interim display ---

  it('shows final and interim together with space', () => {
    render(<BraindumpPanel braindump={makeBraindump({
      speech: makeSpeech({ finalTranscript: 'Hello', interimTranscript: 'world' }),
    })} />);
    expect(screen.getByText('Hello')).toBeDefined();
    expect(screen.getByText(/world/)).toBeDefined();
  });
});
