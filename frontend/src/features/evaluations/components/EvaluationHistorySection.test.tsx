import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/services/api';
import { EvaluationHistorySection } from '@/features/evaluations/components/EvaluationHistorySection';

jest.mock('@/services/api', () => ({
  default: { get: jest.fn(), getPaginated: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));
const mockGetPaginated = api.getPaginated as jest.Mock;

const paidAppointment = {
  id: '1',
  name: 'Julia Cuentas',
  phone: '76441120',
  date: '2026-06-12',
  time: '16:00',
  subscriptionId: '9',
  clientId: null,
  subscription: { paid: true },
};

function renderSection() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <EvaluationHistorySection />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetPaginated.mockResolvedValue({ data: [paidAppointment], total: 1, page: 1, limit: 25 });
});

describe('EvaluationHistorySection', () => {
  it('renders the Historial heading', async () => {
    renderSection();
    expect(await screen.findByRole('heading', { name: 'Historial' })).toBeInTheDocument();
  });

  it('renders resolved appointments in the table', async () => {
    renderSection();
    expect(await screen.findByText('Julia Cuentas')).toBeInTheDocument();
  });

  it('shows the resolved count in the subtitle when no status filter is active', async () => {
    renderSection();
    expect(await screen.findByText('1 cita resuelta')).toBeInTheDocument();
  });

  it('re-queries with the search term when typing in the filter bar', async () => {
    renderSection();
    await screen.findByText('Julia Cuentas');

    await userEvent.type(screen.getByPlaceholderText('Buscar por nombre o teléfono…'), 'Julia');

    await waitFor(() =>
      expect(mockGetPaginated).toHaveBeenLastCalledWith(expect.stringContaining('q=Julia')),
    );
  });

  it('re-queries with the status filter when a status button is clicked', async () => {
    renderSection();
    await screen.findByText('Julia Cuentas');

    await userEvent.click(screen.getByRole('button', { name: 'Pagado' }));

    await waitFor(() =>
      expect(mockGetPaginated).toHaveBeenLastCalledWith(expect.stringContaining('status=pagado')),
    );
  });

  it('renders an empty state when there is no history', async () => {
    mockGetPaginated.mockResolvedValue({ data: [], total: 0, page: 1, limit: 25 });
    renderSection();
    expect(await screen.findByText('Sin registros')).toBeInTheDocument();
  });
});
