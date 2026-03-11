import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AvatarCircle } from '@/components/heteronyms/avatar-circle';

describe('AvatarCircle', () => {
  it('renders with correct size and color', () => {
    const { container } = render(<AvatarCircle color="#E74C3C" emoji="⚡" size={48} />);
    const div = container.firstElementChild as HTMLElement;
    expect(div.style.width).toBe('48px');
    expect(div.style.height).toBe('48px');
    expect(div.style.backgroundColor).toBe('#E74C3C');
  });

  it('uses default size of 40', () => {
    const { container } = render(<AvatarCircle color="#3498DB" emoji="🎭" />);
    const div = container.firstElementChild as HTMLElement;
    expect(div.style.width).toBe('40px');
    expect(div.style.height).toBe('40px');
  });

  it('renders the emoji', () => {
    render(<AvatarCircle color="#E74C3C" emoji="🦋" />);
    expect(screen.getByText('🦋')).toBeTruthy();
  });

  it('is aria-hidden', () => {
    const { container } = render(<AvatarCircle color="#E74C3C" emoji="⚡" />);
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
  });

  it('applies no filter on dark backgrounds', () => {
    render(<AvatarCircle color="#000000" emoji="🔥" />);
    const span = screen.getByText('🔥');
    expect(span.style.filter).toBe('none');
  });

  it('applies brightness filter on light backgrounds', () => {
    render(<AvatarCircle color="#FFFFFF" emoji="🌿" />);
    const span = screen.getByText('🌿');
    expect(span.style.filter).toBe('brightness(0.3)');
  });

  it('sets font size proportional to size', () => {
    const { container } = render(<AvatarCircle color="#E74C3C" emoji="⚡" size={60} />);
    const div = container.firstElementChild as HTMLElement;
    expect(div.style.fontSize).toBe('30px');
  });
});
