import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useHealth } from '../hooks/useHealth';
import { HealthPage } from './HealthPage';

jest.mock('../hooks/useHealth', () => ({
  useHealth: jest.fn(),
}));

const mockUseHealth = useHealth as jest.Mock;

const okReport = {
  status: 'ok' as const,
  checkedAt: '2026-06-22T20:15:00',
  services: [
    { name: 'API La Oliva', status: 'ok' as const, latencyMs: 2 },
    { name: 'Base de datos', status: 'ok' as const, latencyMs: 8 },
  ],
  process: { uptimeSeconds: 125, memoryUsedMb: 82 },
};

function setup(overrides: object = {}) {
  mockUseHealth.mockReturnValue({
    report: okReport,
    isLoading: false,
    isFetching: false,
    refresh: jest.fn(),
    ...overrides,
  });
}

describe('HealthPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setup();
  });

  it('renders the header eyebrow and title', () => {
    render(<HealthPage />);
    expect(screen.getByText('Estado del sistema')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Health' })).toBeInTheDocument();
  });

  it('renders the Probar conexión button', () => {
    render(<HealthPage />);
    expect(screen.getByRole('button', { name: /probar conexión/i })).toBeInTheDocument();
  });

  it('shows a loading skeleton when there is no report yet', () => {
    setup({ report: undefined, isLoading: true });
    render(<HealthPage />);
    expect(screen.getByText('Verificando...')).toBeInTheDocument();
  });

  it('shows the ok banner message', () => {
    render(<HealthPage />);
    expect(screen.getByText('Todos los sistemas operativos')).toBeInTheDocument();
    expect(
      screen.getByText('La API y los servicios conectados responden con normalidad.'),
    ).toBeInTheDocument();
  });

  it('shows the degraded banner message', () => {
    setup({ report: { ...okReport, status: 'degraded' } });
    render(<HealthPage />);
    expect(screen.getByText('Servicios degradados')).toBeInTheDocument();
  });

  it('shows the down banner message', () => {
    setup({ report: { ...okReport, status: 'down' } });
    render(<HealthPage />);
    expect(screen.getByText('Servicios caídos')).toBeInTheDocument();
  });

  it('shows the last checked timestamp', () => {
    render(<HealthPage />);
    expect(screen.getByText('22/06/2026 20:15')).toBeInTheDocument();
  });

  it('shows metric cards with real latency, memory, and uptime values', () => {
    render(<HealthPage />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('82')).toBeInTheDocument();
    expect(screen.getByText('2m')).toBeInTheDocument();
  });

  it('renders a row for each service with its status', () => {
    render(<HealthPage />);
    expect(screen.getByText('API La Oliva')).toBeInTheDocument();
    expect(screen.getAllByText('Base de datos').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Operativo')).toHaveLength(2);
  });

  it('renders the service status as a filled pill badge', () => {
    render(<HealthPage />);
    const badge = screen.getAllByText('Operativo')[0].closest('span');
    expect(badge?.className).toContain('rounded-full');
    expect(badge?.className).toContain('bg-ok-bg');
  });

  it('shows Caído for a down service', () => {
    setup({
      report: {
        ...okReport,
        services: [
          okReport.services[0],
          { name: 'Base de datos', status: 'down' as const, latencyMs: 0 },
        ],
      },
    });
    render(<HealthPage />);
    expect(screen.getByText('Caído')).toBeInTheDocument();
  });

  it('calls refresh when Probar conexión is clicked', async () => {
    const refresh = jest.fn();
    setup({ refresh });
    render(<HealthPage />);
    await userEvent.click(screen.getByRole('button', { name: /probar conexión/i }));
    expect(refresh).toHaveBeenCalled();
  });
});
