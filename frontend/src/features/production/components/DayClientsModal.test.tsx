import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DayClientsModal } from '@/features/production/components/DayClientsModal';
import { useProductionDay } from '@/features/production/hooks/useProductionDay';
import type { DayClients } from '@/features/production/types';

jest.mock('@/features/production/hooks/useProductionDay', () => ({
  useProductionDay: jest.fn(),
}));
const mockUseProductionDay = useProductionDay as jest.Mock;

const dayClients: DayClients = {
  date: '2026-07-16',
  count: 2,
  clients: [
    { id: 'abc123', name: 'Ana Rojas', phoneNumber: '70123456', deliveryZone: 'Centro' },
    { id: 'def456', name: 'Tomás Vargas', phoneNumber: '70987654', deliveryZone: 'Sur' },
  ],
};

const renderModal = (onClose = jest.fn()) =>
  render(
    <MemoryRouter>
      <DayClientsModal date="2026-07-16" onClose={onClose} />
    </MemoryRouter>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockUseProductionDay.mockReturnValue({ dayClients, isLoading: false, error: null });
});

describe('DayClientsModal', () => {
  it('renders the capitalized weekday title and the count subtitle', () => {
    renderModal();

    expect(screen.getByText('Clientes activos · Jueves 16/07')).toBeInTheDocument();
    expect(screen.getByText('2 clientes activos')).toBeInTheDocument();
  });

  it('uses the singular form for one client', () => {
    mockUseProductionDay.mockReturnValue({
      dayClients: { ...dayClients, count: 1, clients: dayClients.clients.slice(0, 1) },
      isLoading: false,
      error: null,
    });

    renderModal();

    expect(screen.getByText('1 cliente activo')).toBeInTheDocument();
  });

  it('renders one row per client with phone, zone, and a link to the client detail', () => {
    renderModal();

    expect(screen.getByText('Ana Rojas')).toBeInTheDocument();
    expect(screen.getByText('70123456 · Centro')).toBeInTheDocument();
    expect(screen.getByText('Tomás Vargas')).toBeInTheDocument();
    expect(screen.getByText('70987654 · Sur')).toBeInTheDocument();

    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/clientes/abc123');
    expect(links[1]).toHaveAttribute('href', '/clientes/def456');
  });

  it('shows the empty state when the day has no active clients', () => {
    mockUseProductionDay.mockReturnValue({
      dayClients: { date: '2026-07-16', count: 0, clients: [] },
      isLoading: false,
      error: null,
    });

    renderModal();

    expect(screen.getByText('Sin clientes activos')).toBeInTheDocument();
  });

  it('shows a loading message while fetching', () => {
    mockUseProductionDay.mockReturnValue({ dayClients: null, isLoading: true, error: null });

    renderModal();

    expect(screen.getByText('Cargando…')).toBeInTheDocument();
  });

  it('calls onClose from the close button', () => {
    const onClose = jest.fn();
    renderModal(onClose);

    fireEvent.click(screen.getByLabelText('Cerrar'));

    expect(onClose).toHaveBeenCalled();
  });
});
