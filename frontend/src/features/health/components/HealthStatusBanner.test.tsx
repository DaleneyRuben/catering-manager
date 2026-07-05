import { render, screen } from '@testing-library/react';
import { HealthStatusBanner } from '@/features/health/components/HealthStatusBanner';

describe('HealthStatusBanner', () => {
  it('shows the ok banner message', () => {
    render(<HealthStatusBanner status="ok" checkedAt="2026-06-22T20:15:00" />);
    expect(screen.getByText('Todos los sistemas operativos')).toBeInTheDocument();
    expect(
      screen.getByText('La API y los servicios conectados responden con normalidad.'),
    ).toBeInTheDocument();
  });

  it('shows the degraded banner message', () => {
    render(<HealthStatusBanner status="degraded" checkedAt="2026-06-22T20:15:00" />);
    expect(screen.getByText('Servicios degradados')).toBeInTheDocument();
  });

  it('shows the down banner message', () => {
    render(<HealthStatusBanner status="down" checkedAt="2026-06-22T20:15:00" />);
    expect(screen.getByText('Servicios caídos')).toBeInTheDocument();
  });

  it('shows the formatted last-checked timestamp', () => {
    render(<HealthStatusBanner status="ok" checkedAt="2026-06-22T20:15:00" />);
    expect(screen.getByText('22/06/2026 20:15')).toBeInTheDocument();
  });
});
