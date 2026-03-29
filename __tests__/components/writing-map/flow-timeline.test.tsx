import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { FlowTimeline } from '@/components/writing-map/flow-timeline';
import type { SessionFlowMoment } from '@/lib/types/writing-session';

afterEach(cleanup);

const BASE_START = '2026-03-10T10:00:00Z';
const BASE_END = '2026-03-10T10:30:00Z';

describe('FlowTimeline', () => {
  it('renders nothing for zero-duration session', () => {
    const { container } = render(
      <FlowTimeline
        sessionStart={BASE_START}
        sessionEnd={BASE_START}
        autoFlowScore={50}
        flowMoments={null}
      />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders timeline for valid session', () => {
    const { getByTestId } = render(
      <FlowTimeline
        sessionStart={BASE_START}
        sessionEnd={BASE_END}
        autoFlowScore={72}
        flowMoments={null}
      />
    );
    expect(getByTestId('flow-timeline')).toBeDefined();
  });

  it('displays auto flow score', () => {
    const { getByText } = render(
      <FlowTimeline
        sessionStart={BASE_START}
        sessionEnd={BASE_END}
        autoFlowScore={85}
        flowMoments={null}
      />
    );
    expect(getByText('85/100')).toBeDefined();
  });

  it('displays avg WPM when provided', () => {
    const { getByText } = render(
      <FlowTimeline
        sessionStart={BASE_START}
        sessionEnd={BASE_END}
        autoFlowScore={50}
        flowMoments={null}
        avgWPM={42.7}
      />
    );
    expect(getByText('43 WPM')).toBeDefined();
  });

  it('does not display WPM when 0', () => {
    const { container } = render(
      <FlowTimeline
        sessionStart={BASE_START}
        sessionEnd={BASE_END}
        autoFlowScore={50}
        flowMoments={null}
        avgWPM={0}
      />
    );
    expect(container.textContent).not.toContain('WPM');
  });

  it('displays duration in minutes', () => {
    const { getByText } = render(
      <FlowTimeline
        sessionStart={BASE_START}
        sessionEnd={BASE_END}
        autoFlowScore={50}
        flowMoments={null}
      />
    );
    expect(getByText('30m')).toBeDefined();
  });

  it('renders SVG with correct aria label for no flow moments', () => {
    const { getByRole } = render(
      <FlowTimeline
        sessionStart={BASE_START}
        sessionEnd={BASE_END}
        autoFlowScore={50}
        flowMoments={null}
      />
    );
    const svg = getByRole('img');
    expect(svg.getAttribute('aria-label')).toContain('0 flow moments');
  });

  it('renders flow moments count in aria label', () => {
    const moments: SessionFlowMoment[] = [
      { startTime: 1000, endTime: 61000, avgWPM: 45, peakWPM: 50 },
      { startTime: 70000, endTime: 131000, avgWPM: 48, peakWPM: 55 },
    ];
    const { getByRole } = render(
      <FlowTimeline
        sessionStart={BASE_START}
        sessionEnd={BASE_END}
        autoFlowScore={65}
        flowMoments={moments}
      />
    );
    const svg = getByRole('img');
    expect(svg.getAttribute('aria-label')).toContain('2 flow moments');
  });

  it('renders legend with Normal and Flow labels', () => {
    const { getByText } = render(
      <FlowTimeline
        sessionStart={BASE_START}
        sessionEnd={BASE_END}
        autoFlowScore={50}
        flowMoments={null}
      />
    );
    expect(getByText('Normal')).toBeDefined();
    expect(getByText('Flow')).toBeDefined();
  });

  it('shows moment count in legend when flow moments exist', () => {
    const moments: SessionFlowMoment[] = [
      { startTime: 1000, endTime: 61000, avgWPM: 45, peakWPM: 50 },
    ];
    const { container } = render(
      <FlowTimeline
        sessionStart={BASE_START}
        sessionEnd={BASE_END}
        autoFlowScore={70}
        flowMoments={moments}
      />
    );
    expect(container.textContent).toMatch(/1 moment/);
  });

  it('handles null autoFlowScore gracefully', () => {
    const { getByTestId, getByRole } = render(
      <FlowTimeline
        sessionStart={BASE_START}
        sessionEnd={BASE_END}
        autoFlowScore={null}
        flowMoments={null}
      />
    );
    expect(getByTestId('flow-timeline')).toBeDefined();
    const svg = getByRole('img');
    expect(svg.getAttribute('aria-label')).toContain('score N/A');
  });

  it('renders correctly with empty flow moments array', () => {
    const { getByTestId } = render(
      <FlowTimeline
        sessionStart={BASE_START}
        sessionEnd={BASE_END}
        autoFlowScore={30}
        flowMoments={[]}
      />
    );
    expect(getByTestId('flow-timeline')).toBeDefined();
  });

  it('renders correctly with many flow moments', () => {
    const moments: SessionFlowMoment[] = Array.from({ length: 10 }, (_, i) => ({
      startTime: i * 100000,
      endTime: i * 100000 + 60000,
      avgWPM: 40 + i,
      peakWPM: 50 + i,
    }));
    const { getByTestId } = render(
      <FlowTimeline
        sessionStart={BASE_START}
        sessionEnd={BASE_END}
        autoFlowScore={90}
        flowMoments={moments}
      />
    );
    expect(getByTestId('flow-timeline')).toBeDefined();
  });

  it('has heading text', () => {
    const { getByText } = render(
      <FlowTimeline
        sessionStart={BASE_START}
        sessionEnd={BASE_END}
        autoFlowScore={50}
        flowMoments={null}
      />
    );
    expect(getByText('Flow Timeline')).toBeDefined();
  });
});
