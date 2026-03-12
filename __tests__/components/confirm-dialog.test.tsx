import { describe, it, expect, vi } from 'vitest';
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
  AlertTriangle: () => <span data-testid="icon-alert" />,
  X: () => <span data-testid="icon-x" />,
}));

import { ConfirmProvider, useConfirm } from '@/components/confirm-dialog';

function wrapper({ children }: { children: React.ReactNode }) {
  return <ConfirmProvider>{children}</ConfirmProvider>;
}

describe('useConfirm() outside ConfirmProvider', () => {
  it('throws an error', () => {
    expect(() => {
      renderHook(() => useConfirm());
    }).toThrow('useConfirm must be used within a ConfirmProvider');
  });
});

describe('useConfirm() inside ConfirmProvider', () => {
  it('confirm() resolves true when confirm button clicked', async () => {
    const { result } = renderHook(() => useConfirm(), { wrapper });

    let resultPromise!: Promise<boolean>;

    act(() => {
      resultPromise = result.current.confirm({ title: 'Delete?', message: 'Are you sure?' });
    });

    act(() => {
      screen.getByText('Confirm').click();
    });

    expect(await resultPromise).toBe(true);
  });

  it('confirm() resolves false when cancel button clicked', async () => {
    const { result } = renderHook(() => useConfirm(), { wrapper });

    let resultPromise!: Promise<boolean>;

    act(() => {
      resultPromise = result.current.confirm({ title: 'Delete?', message: 'Are you sure?' });
    });

    act(() => {
      screen.getByText('Cancel').click();
    });

    expect(await resultPromise).toBe(false);
  });

  it('renders custom title and message', () => {
    const { result } = renderHook(() => useConfirm(), { wrapper });

    act(() => {
      result.current.confirm({ title: 'Custom Title', message: 'Custom message body' });
    });

    expect(screen.getByText('Custom Title')).toBeDefined();
    expect(screen.getByText('Custom message body')).toBeDefined();
  });

  it('renders custom button labels', () => {
    const { result } = renderHook(() => useConfirm(), { wrapper });

    act(() => {
      result.current.confirm({
        title: 'Remove?',
        message: 'Gone forever',
        confirmLabel: 'Yes, delete',
        cancelLabel: 'Nope',
      });
    });

    expect(screen.getByText('Yes, delete')).toBeDefined();
    expect(screen.getByText('Nope')).toBeDefined();
  });
});
