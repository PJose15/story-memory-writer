import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StoreSkeleton } from '@/components/antiquarian/StoreSkeleton';

describe('StoreSkeleton', () => {
  it('should render with loading label', () => {
    render(<StoreSkeleton />);
    expect(screen.getByLabelText('Loading project...')).toBeDefined();
  });

  it('should have animate-pulse class', () => {
    const { container } = render(<StoreSkeleton />);
    expect(container.firstElementChild?.classList.contains('animate-pulse')).toBe(true);
  });
});
