import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import React, { useRef, useImperativeHandle } from 'react';

vi.mock('@/components/diagnostic/diagnostic-overlay', () => ({
  DiagnosticOverlay: () => <div data-testid="diagnostic-overlay" />,
}));

vi.mock('@/components/ritual/ritual-overlay', () => ({
  RitualOverlay: () => <div data-testid="ritual-overlay" />,
}));

const mockPathname = vi.fn().mockReturnValue('/');
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

import { SessionProvider, useSession } from '@/lib/session';
import { DiagnosticGate } from '@/components/diagnostic/diagnostic-gate';

// Controller component that exposes session actions via ref
const TestController = React.forwardRef(function TestController(_props, ref) {
  const session = useSession();
  useImperativeHandle(ref, () => session, [session]);
  return null;
});

describe('DiagnosticGate', () => {
  beforeEach(() => {
    cleanup();
    mockPathname.mockReturnValue('/');
  });

  it('shows DiagnosticOverlay when diagnosticCompleted is false', () => {
    render(
      <SessionProvider>
        <DiagnosticGate>
          <div data-testid="children">Main content</div>
        </DiagnosticGate>
      </SessionProvider>
    );

    expect(screen.getByTestId('diagnostic-overlay')).toBeDefined();
    expect(screen.queryByTestId('ritual-overlay')).toBeNull();
    expect(screen.queryByTestId('children')).toBeNull();
  });

  it('shows RitualOverlay when diagnosticCompleted but ritualCompleted is false', () => {
    const ref = React.createRef<ReturnType<typeof useSession>>();

    render(
      <SessionProvider>
        <TestController ref={ref} />
        <DiagnosticGate>
          <div data-testid="children">Main content</div>
        </DiagnosticGate>
      </SessionProvider>
    );

    expect(screen.getByTestId('diagnostic-overlay')).toBeDefined();

    act(() => {
      ref.current!.completeDiagnostic();
    });

    expect(screen.queryByTestId('diagnostic-overlay')).toBeNull();
    expect(screen.getByTestId('ritual-overlay')).toBeDefined();
    expect(screen.queryByTestId('children')).toBeNull();
  });

  it('shows children when both completed', () => {
    const ref = React.createRef<ReturnType<typeof useSession>>();

    render(
      <SessionProvider>
        <TestController ref={ref} />
        <DiagnosticGate>
          <div data-testid="children">Main content</div>
        </DiagnosticGate>
      </SessionProvider>
    );

    act(() => {
      ref.current!.completeDiagnostic();
    });

    act(() => {
      ref.current!.completeRitual('quote');
    });

    expect(screen.queryByTestId('diagnostic-overlay')).toBeNull();
    expect(screen.queryByTestId('ritual-overlay')).toBeNull();
    expect(screen.getByTestId('children')).toBeDefined();
    expect(screen.getByTestId('children').textContent).toBe('Main content');
  });

  it('shows children after skipping diagnostic and completing ritual', () => {
    const ref = React.createRef<ReturnType<typeof useSession>>();

    render(
      <SessionProvider>
        <TestController ref={ref} />
        <DiagnosticGate>
          <div data-testid="children">Skipped path</div>
        </DiagnosticGate>
      </SessionProvider>
    );

    act(() => {
      ref.current!.completeDiagnostic(true);
    });

    act(() => {
      ref.current!.completeRitual('mindfulness');
    });

    expect(screen.queryByTestId('diagnostic-overlay')).toBeNull();
    expect(screen.queryByTestId('ritual-overlay')).toBeNull();
    expect(screen.getByTestId('children')).toBeDefined();
  });

  it('bypasses gate for /flow route', () => {
    mockPathname.mockReturnValue('/flow');

    render(
      <SessionProvider>
        <DiagnosticGate>
          <div data-testid="children">Flow content</div>
        </DiagnosticGate>
      </SessionProvider>
    );

    expect(screen.queryByTestId('diagnostic-overlay')).toBeNull();
    expect(screen.queryByTestId('ritual-overlay')).toBeNull();
    expect(screen.getByTestId('children')).toBeDefined();
    expect(screen.getByTestId('children').textContent).toBe('Flow content');
  });

  it('goes back to diagnostic overlay after resetSession', () => {
    const ref = React.createRef<ReturnType<typeof useSession>>();

    render(
      <SessionProvider>
        <TestController ref={ref} />
        <DiagnosticGate>
          <div data-testid="children">Main content</div>
        </DiagnosticGate>
      </SessionProvider>
    );

    act(() => { ref.current!.completeDiagnostic(); });
    act(() => { ref.current!.completeRitual('quote'); });
    expect(screen.getByTestId('children')).toBeDefined();

    act(() => { ref.current!.resetSession(); });
    expect(screen.getByTestId('diagnostic-overlay')).toBeDefined();
    expect(screen.queryByTestId('children')).toBeNull();
  });
});
