import { render, screen } from '@testing-library/react';
import { HealthServicesTable } from '@/features/health/components/HealthServicesTable';

const services = [
  { name: 'API La Oliva', status: 'ok' as const, latencyMs: 2 },
  { name: 'Base de datos', status: 'ok' as const, latencyMs: 8 },
];

describe('HealthServicesTable', () => {
  it('renders a row for each service with its status', () => {
    render(<HealthServicesTable services={services} />);
    expect(screen.getByText('API La Oliva')).toBeInTheDocument();
    expect(screen.getByText('Base de datos')).toBeInTheDocument();
    expect(screen.getAllByText('Operativo')).toHaveLength(2);
  });

  it('renders the service status as a filled pill badge', () => {
    render(<HealthServicesTable services={services} />);
    const badge = screen.getAllByText('Operativo')[0].closest('span');
    expect(badge?.className).toContain('rounded-full');
    expect(badge?.className).toContain('bg-ok-bg');
  });

  it('shows Caído for a down service', () => {
    render(
      <HealthServicesTable
        services={[
          ...services.slice(0, 1),
          { name: 'Base de datos', status: 'down', latencyMs: 0 },
        ]}
      />,
    );
    expect(screen.getByText('Caído')).toBeInTheDocument();
  });
});
