import { render, screen } from '@testing-library/react';
import { ProductionPage } from '@/pages/ProductionPage';
import type { ProductionSummary } from '@/features/production/types';
import { useProduction } from '@/features/production/hooks/useProduction';

jest.mock('@/features/production/hooks/useProduction');
const mockUseProduction = useProduction as jest.MockedFunction<typeof useProduction>;

const summary: ProductionSummary = {
  date: '2026-07-02',
  isDeliveryDay: true,
  total: 2,
  groups: {
    juice: ['Ana Flores'],
    lunchOnly: ['Ana Flores'],
    lunchAndDinner: ['Carlos Ríos'],
    full: [],
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
});
