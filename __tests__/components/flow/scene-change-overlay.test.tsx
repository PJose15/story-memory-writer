import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { SceneChangeOverlay } from '@/components/flow/scene-change-overlay';

describe('SceneChangeOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    cleanup();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders message and subtitle', () => {
    render(
      <SceneChangeOverlay message="Switching scenes..." subtitle="Take a breath" onComplete={vi.fn()} />
    );
    expect(screen.getByText('Switching scenes...')).toBeDefined();
    expect(screen.getByText('Take a breath')).toBeDefined();
  });

  it('renders without subtitle', () => {
    render(
      <SceneChangeOverlay message="Going back" onComplete={vi.fn()} />
    );
    expect(screen.getByText('Going back')).toBeDefined();
  });

  it('calls onComplete after animation completes', () => {
    const onComplete = vi.fn();
    render(<SceneChangeOverlay message="test" onComplete={onComplete} />);

    expect(onComplete).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('has z-[9999] overlay', () => {
    const { container } = render(
      <SceneChangeOverlay message="test" onComplete={vi.fn()} />
    );
    const overlay = container.firstElementChild as HTMLElement;
    expect(overlay.className).toContain('z-[9999]');
  });
});
