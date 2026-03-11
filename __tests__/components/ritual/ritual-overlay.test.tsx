import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';

const { mockStart, mockReset } = vi.hoisted(() => ({
  mockStart: vi.fn(),
  mockReset: vi.fn(),
}));

vi.mock('motion/react', () => {
  const MockMotionDiv = React.forwardRef<HTMLDivElement, Record<string, unknown>>(
    function MockMotionDiv({ children, initial, animate, exit, transition, whileHover, whileTap, ...props }, ref) {
      return <div ref={ref as React.Ref<HTMLDivElement>} {...props as React.HTMLAttributes<HTMLDivElement>}>{children as React.ReactNode}</div>;
    }
  );
  const MockMotionButton = React.forwardRef<HTMLButtonElement, Record<string, unknown>>(
    function MockMotionButton({ children, initial, animate, exit, transition, whileHover, whileTap, ...props }, ref) {
      return <button ref={ref as React.Ref<HTMLButtonElement>} {...props as React.ButtonHTMLAttributes<HTMLButtonElement>}>{children as React.ReactNode}</button>;
    }
  );
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      div: MockMotionDiv,
      button: MockMotionButton,
    },
  };
});

vi.mock('lucide-react', () => ({
  Sparkles: () => <span data-testid="icon-sparkles" />,
  Wind: () => <span data-testid="icon-wind" />,
}));

vi.mock('@/lib/quotes', () => ({
  getQuoteForBlock: vi.fn().mockReturnValue({
    id: 'q1', text: 'Test quote', author: 'Test Author', source: 'Test Source',
    blockTypes: ['fear'], zagafyPhrase: 'Test phrase',
  }),
  getRandomQuote: vi.fn().mockReturnValue({
    id: 'q1', text: 'Test quote', author: 'Test Author', source: 'Test Source',
    blockTypes: ['fear'], zagafyPhrase: 'Test phrase',
  }),
}));

vi.mock('@/hooks/use-countdown', () => ({
  useCountdown: vi.fn().mockReturnValue({
    remaining: 60, isComplete: false, progress: 0, start: mockStart, reset: mockReset,
  }),
}));

vi.mock('@/components/ritual/ambient-particles', () => ({
  AmbientParticles: () => <div data-testid="ambient-particles" />,
}));

vi.mock('@/components/ritual/quote-display', () => ({
  QuoteDisplay: ({ quote }: { quote: { text: string; zagafyPhrase: string } }) => (
    <div data-testid="quote-display">
      <p>{quote.text}</p>
      <p>{quote.zagafyPhrase}</p>
    </div>
  ),
}));

vi.mock('@/components/ritual/breathing-guide', () => ({
  BreathingGuide: ({ onComplete }: { onComplete: () => void }) => (
    <div data-testid="breathing-guide">
      <button onClick={onComplete}>Complete breathing</button>
    </div>
  ),
}));

import { SessionProvider } from '@/lib/session';
import { RitualOverlay } from '@/components/ritual/ritual-overlay';
import { useCountdown } from '@/hooks/use-countdown';

function renderWithProviders() {
  return render(
    <SessionProvider>
      <RitualOverlay />
    </SessionProvider>
  );
}

describe('RitualOverlay', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.mocked(useCountdown).mockReturnValue({
      remaining: 60, isComplete: false, progress: 0, start: mockStart, reset: mockReset,
    });
  });

  it('renders mode selection with Inspiration and Mindfulness options', () => {
    renderWithProviders();
    expect(screen.getByText('Inspiration')).toBeDefined();
    expect(screen.getByText('Mindfulness')).toBeDefined();
    expect(screen.getByText('Take a moment before you begin')).toBeDefined();
  });

  it('clicking Inspiration shows quote display', () => {
    renderWithProviders();
    fireEvent.click(screen.getByText('Inspiration'));
    expect(screen.getByTestId('quote-display')).toBeDefined();
    expect(mockStart).toHaveBeenCalled();
  });

  it('clicking Mindfulness shows breathing guide', () => {
    renderWithProviders();
    fireEvent.click(screen.getByText('Mindfulness'));
    expect(screen.getByTestId('breathing-guide')).toBeDefined();
  });

  it('"Enter your story" button appears after countdown completes', () => {
    vi.mocked(useCountdown).mockReturnValue({
      remaining: 0, isComplete: true, progress: 1, start: mockStart, reset: mockReset,
    });
    renderWithProviders();
    fireEvent.click(screen.getByText('Inspiration'));
    expect(screen.getByText('Enter your story')).toBeDefined();
  });

  it('"Enter your story" button is not visible while countdown is running', () => {
    renderWithProviders();
    fireEvent.click(screen.getByText('Inspiration'));
    expect(screen.queryByText('Enter your story')).toBeNull();
  });

  it('renders ambient particles', () => {
    renderWithProviders();
    expect(screen.getByTestId('ambient-particles')).toBeDefined();
  });

  it('has dialog role and aria-label', () => {
    renderWithProviders();
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByLabelText('Entry ritual')).toBeDefined();
  });
});
