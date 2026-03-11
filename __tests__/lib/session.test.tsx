import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { SessionProvider, useSession } from '@/lib/session';
import type { BlockType, SessionState } from '@/lib/session';

function wrapper({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

describe('SessionProvider', () => {
  it('renders children', () => {
    render(
      <SessionProvider>
        <div data-testid="child">Hello</div>
      </SessionProvider>
    );
    expect(screen.getByTestId('child')).toBeDefined();
    expect(screen.getByTestId('child').textContent).toBe('Hello');
  });
});

describe('useSession() outside SessionProvider', () => {
  it('throws an error', () => {
    expect(() => {
      renderHook(() => useSession());
    }).toThrow('useSession must be used within a SessionProvider');
  });
});

describe('useSession() inside SessionProvider', () => {
  it('has default session state values', () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    const { session } = result.current;

    expect(session.blockType).toBeNull();
    expect(session.diagnosticCompleted).toBe(false);
    expect(session.diagnosticSkipped).toBe(false);
    expect(session.ritualCompleted).toBe(false);
    expect(session.ritualMode).toBeNull();
    expect(session.flowChapterId).toBeNull();
    expect(typeof session.sessionStartedAt).toBe('string');
    // sessionStartedAt should be a valid ISO date string
    expect(new Date(session.sessionStartedAt).toISOString()).toBe(session.sessionStartedAt);
  });

  it('setBlockType updates session.blockType', () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    act(() => {
      result.current.setBlockType('fear');
    });

    expect(result.current.session.blockType).toBe('fear');
  });

  it('setBlockType works with all block types', () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    const blockTypes: BlockType[] = ['fear', 'perfectionism', 'direction', 'exhaustion', null];
    for (const type of blockTypes) {
      act(() => {
        result.current.setBlockType(type);
      });
      expect(result.current.session.blockType).toBe(type);
    }
  });

  it('completeDiagnostic sets diagnosticCompleted true and diagnosticSkipped false', () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    act(() => {
      result.current.completeDiagnostic();
    });

    expect(result.current.session.diagnosticCompleted).toBe(true);
    expect(result.current.session.diagnosticSkipped).toBe(false);
  });

  it('completeDiagnostic(true) sets diagnosticSkipped true', () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    act(() => {
      result.current.completeDiagnostic(true);
    });

    expect(result.current.session.diagnosticCompleted).toBe(true);
    expect(result.current.session.diagnosticSkipped).toBe(true);
  });

  it('completeDiagnostic(false) explicitly sets diagnosticSkipped false', () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    act(() => {
      result.current.completeDiagnostic(false);
    });

    expect(result.current.session.diagnosticCompleted).toBe(true);
    expect(result.current.session.diagnosticSkipped).toBe(false);
  });

  it('completeRitual sets ritualCompleted true and ritualMode', () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    act(() => {
      result.current.completeRitual('quote');
    });

    expect(result.current.session.ritualCompleted).toBe(true);
    expect(result.current.session.ritualMode).toBe('quote');
  });

  it('completeRitual sets ritualMode to mindfulness', () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    act(() => {
      result.current.completeRitual('mindfulness');
    });

    expect(result.current.session.ritualCompleted).toBe(true);
    expect(result.current.session.ritualMode).toBe('mindfulness');
  });

  it('setFlowChapterId updates flowChapterId', () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    act(() => {
      result.current.setFlowChapterId('chapter-42');
    });

    expect(result.current.session.flowChapterId).toBe('chapter-42');
  });

  it('setFlowChapterId can be set to null', () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    act(() => {
      result.current.setFlowChapterId('chapter-1');
    });
    expect(result.current.session.flowChapterId).toBe('chapter-1');

    act(() => {
      result.current.setFlowChapterId(null);
    });
    expect(result.current.session.flowChapterId).toBeNull();
  });

  it('resetSession resets to defaults', () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    // Mutate all fields
    act(() => {
      result.current.setBlockType('exhaustion');
      result.current.completeDiagnostic(true);
      result.current.completeRitual('mindfulness');
      result.current.setFlowChapterId('ch-99');
    });

    // Verify fields are set
    expect(result.current.session.blockType).toBe('exhaustion');
    expect(result.current.session.diagnosticCompleted).toBe(true);
    expect(result.current.session.diagnosticSkipped).toBe(true);
    expect(result.current.session.ritualCompleted).toBe(true);
    expect(result.current.session.ritualMode).toBe('mindfulness');
    expect(result.current.session.flowChapterId).toBe('ch-99');

    // Reset
    act(() => {
      result.current.resetSession();
    });

    expect(result.current.session.blockType).toBeNull();
    expect(result.current.session.diagnosticCompleted).toBe(false);
    expect(result.current.session.diagnosticSkipped).toBe(false);
    expect(result.current.session.ritualCompleted).toBe(false);
    expect(result.current.session.ritualMode).toBeNull();
    expect(result.current.session.flowChapterId).toBeNull();
    // sessionStartedAt should be refreshed (still a valid ISO string)
    expect(typeof result.current.session.sessionStartedAt).toBe('string');
  });

  it('updates do not affect unrelated fields', () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    act(() => {
      result.current.setBlockType('direction');
    });

    expect(result.current.session.blockType).toBe('direction');
    // Unrelated fields remain at defaults
    expect(result.current.session.diagnosticCompleted).toBe(false);
    expect(result.current.session.ritualCompleted).toBe(false);
    expect(result.current.session.flowChapterId).toBeNull();
  });
});
