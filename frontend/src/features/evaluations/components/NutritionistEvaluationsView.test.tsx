import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/services/api';
import { NutritionistEvaluationsView } from '@/features/evaluations/components/NutritionistEvaluationsView';

jest.mock('@/services/api', () => ({
  default: { get: jest.fn(), getPaginated: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));
const mockGet = api.get as jest.Mock;
const mockGetPaginated = api.getPaginated as jest.Mock;

const pendingAppointment = {
  id: '1',
  name: 'Mariana Ovando',
  phone: '70112345',
  date: '2026-06-25',
  time: '09:00',
  subscriptionId: null,
  clientId: null,
  subscription: null,
};

const paidAppointment = {
  id: '2',
  name: 'Julia Cuentas',
  phone: '76441120',
  date: '2026-06-12',
  time: '16:00',
  subscriptionId: '9',
  clientId: null,
  subscription: { paid: true },
};

function renderView() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <NutritionistEvaluationsView />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockResolvedValue([pendingAppointment]);
  mockGetPaginated.mockResolvedValue({ data: [paidAppointment], total: 1, page: 1, limit: 25 });
});

describe('NutritionistEvaluationsView', () => {
  it('renders the Evaluaciones heading with no Nueva cita button', async () => {
    renderView();
    expect(await screen.findByRole('heading', { name: /evaluaciones/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /nueva cita/i })).not.toBeInTheDocument();
  });

  it('renders both the Pendientes and Historial sections', async () => {
    renderView();

    expect(await screen.findByText('Mariana Ovando')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pendientes' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Historial' })).toBeInTheDocument();
    expect(await screen.findByText('Julia Cuentas')).toBeInTheDocument();
  });

  it('shows the Pendientes empty state when there are no pending appointments', async () => {
    mockGet.mockResolvedValue([]);
    renderView();
    expect(await screen.findByText('Sin citas pendientes')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Todas las evaluaciones asignadas ya fueron resueltas. Las nuevas citas aparecerán acá.',
      ),
    ).toBeInTheDocument();
  });
});
