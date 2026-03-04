import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, screen, act } from '@testing-library/react';
import React from 'react';

vi.mock('motion/react', () => {
  const MockMotionDiv = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    function MockMotionDiv({ children, ...props }, ref) {
      return <div ref={ref} {...props}>{children}</div>;
    }
  );
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: { div: MockMotionDiv },
  };
});

vi.mock('lucide-react', () => ({
  X: () => <span data-testid="icon-x" />,
  CheckCircle2: () => <span data-testid="icon-check" />,
  AlertTriangle: () => <span data-testid="icon-warning" />,
  AlertCircle: () => <span data-testid="icon-error" />,
  Info: () => <span data-testid="icon-info" />,
}));

import { ToastProvider, useToast } from '@/components/toast';

function wrapper({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}

describe('useToast() outside ToastProvider', () => {
  it('throws an error', () => {
    expect(() => {
      renderHook(() => useToast());
    }).toThrow('useToast must be used within a ToastProvider');
  });
});

describe('useToast() inside ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    let counter = 0;
    vi.stubGlobal('crypto', {
      randomUUID: () => `uuid-${++counter}`,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('toast() renders a toast message in the DOM', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.toast('Hello world');
    });

    expect(screen.getByText('Hello world')).toBeDefined();
  });

  it('caps at max 5 visible toasts when calling toast 6 times', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      for (let i = 1; i <= 6; i++) {
        result.current.toast(`Toast ${i}`);
      }
    });

    expect(screen.queryByText('Toast 1')).toBeNull();
    expect(screen.getByText('Toast 2')).toBeDefined();
    expect(screen.getByText('Toast 6')).toBeDefined();
  });

  it('auto-dismisses after 5 seconds', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.toast('Temporary toast');
    });

    expect(screen.getByText('Temporary toast')).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByText('Temporary toast')).toBeNull();
  });
});
