import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

import { DiagnosticGate } from '@/components/diagnostic/diagnostic-gate';

describe('DiagnosticGate', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders children directly', () => {
    render(
      <DiagnosticGate>
        <div data-testid="children">Main content</div>
      </DiagnosticGate>
    );

    expect(screen.getByTestId('children')).toBeDefined();
    expect(screen.getByTestId('children').textContent).toBe('Main content');
  });

  it('does not render any overlay', () => {
    render(
      <DiagnosticGate>
        <div data-testid="children">Content</div>
      </DiagnosticGate>
    );

    expect(screen.queryByTestId('diagnostic-overlay')).toBeNull();
    expect(screen.queryByTestId('ritual-overlay')).toBeNull();
  });

  it('renders multiple children', () => {
    render(
      <DiagnosticGate>
        <div data-testid="first">First</div>
        <div data-testid="second">Second</div>
      </DiagnosticGate>
    );

    expect(screen.getByTestId('first')).toBeDefined();
    expect(screen.getByTestId('second')).toBeDefined();
  });
});
