import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { XPBar } from '@/components/gamification/xp-bar';

describe('XPBar', () => {
  afterEach(cleanup);

  it('renders level and progress bar', () => {
    render(<XPBar level={5} current={120} needed={200} progress={60} />);

    expect(screen.getByText('Lv 5')).toBeDefined();
    expect(screen.getByRole('progressbar')).toBeDefined();
  });

  it('displays XP values in non-compact mode', () => {
    render(<XPBar level={3} current={50} needed={150} progress={33} />);

    expect(screen.getByText('50 XP')).toBeDefined();
    expect(screen.getByText('150 to next')).toBeDefined();
  });

  it('hides XP values in compact mode', () => {
    render(<XPBar level={3} current={50} needed={150} progress={33} compact />);

    expect(screen.queryByText('50 XP')).toBeNull();
    expect(screen.queryByText('150 to next')).toBeNull();
  });

  it('handles NaN progress by guarding to 0', () => {
    render(<XPBar level={1} current={0} needed={100} progress={NaN} />);

    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('0');
  });

  it('clamps progress to 0-100 range', () => {
    const { rerender } = render(
      <XPBar level={1} current={0} needed={100} progress={150} />
    );

    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100');

    rerender(<XPBar level={1} current={0} needed={100} progress={-20} />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
  });

  it('has accessible progressbar role with aria attributes', () => {
    render(<XPBar level={7} current={80} needed={120} progress={67} />);

    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('67');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
    expect(bar.getAttribute('aria-label')).toContain('Level 7');
    expect(bar.getAttribute('aria-label')).toContain('67%');
  });
});
