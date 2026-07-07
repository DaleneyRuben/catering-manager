import { render, screen } from '@testing-library/react';
import { ProductionPage } from '@/pages/ProductionPage';
import type { ProductionData } from '@/features/production/types';
import { useProduction } from '@/features/production/hooks/useProduction';

jest.mock('@/features/production/hooks/useProduction');
const mockUseProduction = useProduction as jest.MockedFunction<typeof useProduction>;

const summary: ProductionData = {
  date: '2026-07-02',
  isDeliveryDay: true,
  total: 2,
  groups: {
    juice: ['Ana Flores'],
    lunchOnly: ['Ana Flores'],
    lunchAndDinner: ['Carlos Ríos'],
    full: [],
  },
  weeklyCounts: {
    weekStart: '2026-06-29',
    weekEnd: '2026-07-03',
    days: [
      { date: '2026-06-29', count: 10 },
      { date: '2026-06-30', count: 11 },
      { date: '2026-07-01', count: 12 },
      { date: '2026-07-02', count: 9 },
      { date: '2026-07-03', count: 8 },
    ],
  },
};

afterEach(() => jest.clearAllMocks());

describe('ProductionPage', () => {
  it('renders the eyebrow and the Producción heading', () => {
    mockUseProduction.mockReturnValue({ summary, isLoading: false, error: null });

    render(<ProductionPage />);

    expect(screen.getByText('Cocina · planificación')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Producción' })).toBeInTheDocument();
  });

  it('shows a skeleton while data is fetching', () => {
    mockUseProduction.mockReturnValue({ summary: null, isLoading: true, error: null });

    const { container } = render(<ProductionPage />);

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(screen.queryByText('Clientes de mañana')).not.toBeInTheDocument();
  });

  it('renders the production card once loaded', () => {
    mockUseProduction.mockReturnValue({ summary, isLoading: false, error: null });

    render(<ProductionPage />);

    expect(screen.getByText('Clientes de mañana')).toBeInTheDocument();
    expect(screen.getByText('Carlos Ríos')).toBeInTheDocument();
  });

  it('renders the weekly counts card once loaded', () => {
    mockUseProduction.mockReturnValue({ summary, isLoading: false, error: null });

    render(<ProductionPage />);

    expect(screen.getByText('Clientes activos por día')).toBeInTheDocument();
    expect(screen.getByText('29 – 3 jul')).toBeInTheDocument();
  });
});
