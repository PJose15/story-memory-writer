import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { FeatureErrorBoundary } from '@/components/antiquarian/FeatureErrorBoundary';

function BrokenComponent(): React.ReactElement {
  throw new Error('Test error');
}

function WorkingComponent() {
  return <div>Content is working</div>;
}

describe('FeatureErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
  });

  it('should render children when no error', () => {
    render(
      <FeatureErrorBoundary title="Test Feature">
        <WorkingComponent />
      </FeatureErrorBoundary>
    );
    expect(screen.getByText('Content is working')).toBeDefined();
  });

  it('should show error state when child throws', () => {
    render(
      <FeatureErrorBoundary title="Error Test">
        <BrokenComponent />
      </FeatureErrorBoundary>
    );
    expect(screen.getByText('Error Test')).toBeDefined();
    expect(screen.getByText(/encountered an error/)).toBeDefined();
    expect(screen.getByText('Test error')).toBeDefined();
  });

  it('should show retry button', () => {
    render(
      <FeatureErrorBoundary title="Retry Test">
        <BrokenComponent />
      </FeatureErrorBoundary>
    );
    expect(screen.getByText('Retry')).toBeDefined();
  });

  it('should display the title prop', () => {
    render(
      <FeatureErrorBoundary title="Custom Title">
        <BrokenComponent />
      </FeatureErrorBoundary>
    );
    expect(screen.getByText('Custom Title')).toBeDefined();
  });

  it('should reset error state on retry', () => {
    let shouldThrow = true;
    function MaybeBroken() {
      if (shouldThrow) throw new Error('Conditional error');
      return <div>Recovered</div>;
    }

    const { unmount } = render(
      <FeatureErrorBoundary title="Reset Test">
        <MaybeBroken />
      </FeatureErrorBoundary>
    );

    expect(screen.getByText(/encountered an error/)).toBeDefined();

    shouldThrow = false;
    fireEvent.click(screen.getByText('Retry'));

    expect(screen.getByText('Recovered')).toBeDefined();
    unmount();
  });
});
