import { render, screen } from '@testing-library/react';
import { HealthMetricsGrid } from '@/features/health/components/HealthMetricsGrid';

describe('HealthMetricsGrid', () => {
  it('shows latency, memory, and uptime values', () => {
    render(
      <HealthMetricsGrid apiLatencyMs={2} dbLatencyMs={8} memoryUsedMb={82} uptimeSeconds={125} />,
    );
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('82')).toBeInTheDocument();
    expect(screen.getByText('2m')).toBeInTheDocument();
  });

  it('shows a dash when a latency value is missing', () => {
    render(
      <HealthMetricsGrid
        apiLatencyMs={undefined}
        dbLatencyMs={undefined}
        memoryUsedMb={0}
        uptimeSeconds={30}
      />,
    );
    expect(screen.getAllByText('—')).toHaveLength(2);
  });

  it('formats uptime under a minute in seconds', () => {
    render(
      <HealthMetricsGrid apiLatencyMs={1} dbLatencyMs={1} memoryUsedMb={10} uptimeSeconds={45} />,
    );
    expect(screen.getByText('45s')).toBeInTheDocument();
  });

  it('formats uptime over an hour in hours and minutes', () => {
    render(
      <HealthMetricsGrid apiLatencyMs={1} dbLatencyMs={1} memoryUsedMb={10} uptimeSeconds={3725} />,
    );
    expect(screen.getByText('1h 2m')).toBeInTheDocument();
  });
});
