import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/services/api';
import { NutritionistEvaluationsView } from '@/features/evaluations/components/NutritionistEvaluationsView';

jest.mock('@/services/api', () => ({
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));
const mockGet = api.get as jest.Mock;

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

const unpaidAppointment = {
  id: '3',
  name: 'Carmen Tapia',
  phone: '70993312',
  date: '2026-06-15',
  time: '10:30',
  subscriptionId: '10',
  clientId: null,
  subscription: { paid: false },
};

function setupMocks(appointments: unknown[] = [pendingAppointment]) {
  mockGet.mockImplementation((url: string) => {
    if (url === '/appointments/nutritionist') return Promise.resolve(appointments);
    return Promise.reject(new Error(`Unknown URL: ${url}`));
  });
}

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
  setupMocks();
});

describe('NutritionistEvaluationsView', () => {
  it('renders the Evaluaciones heading with no Nueva cita button', async () => {
    renderView();
    expect(await screen.findByRole('heading', { name: /evaluaciones/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /nueva cita/i })).not.toBeInTheDocument();
  });

  it('splits appointments into a Pendientes section and a Historial section', async () => {
    setupMocks([pendingAppointment, paidAppointment, unpaidAppointment]);
    renderView();

    // pending appointment shows as a card in the Pendientes section
    expect(await screen.findByText('Mariana Ovando')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Pendientes' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Historial' })).toBeInTheDocument();

    // resolved appointments show as rows in the Historial table, not as cards
    expect(screen.getByText('Julia Cuentas')).toBeInTheDocument();
    expect(screen.getByText('Carmen Tapia')).toBeInTheDocument();
    expect(screen.getByText('Pagado')).toBeInTheDocument();
    expect(screen.getByText('No pagado')).toBeInTheDocument();
  });

  it('shows the pending count in the Pendientes subtitle', async () => {
    setupMocks([pendingAppointment]);
    renderView();
    expect(await screen.findByText('1 cita por resolver')).toBeInTheDocument();
  });

  it('shows "Nada por resolver" in the Pendientes subtitle when there are none', async () => {
    setupMocks([paidAppointment]);
    renderView();
    expect(await screen.findByText('Nada por resolver')).toBeInTheDocument();
  });

  it('shows the resolved and paid-confirmed counts in the Historial subtitle', async () => {
    setupMocks([paidAppointment, unpaidAppointment]);
    renderView();
    expect(
      await screen.findByText('2 citas resueltas · 1 con pago confirmado'),
    ).toBeInTheDocument();
  });

  it('shows the Pendientes empty state when there are no pending appointments', async () => {
    setupMocks([paidAppointment]);
    renderView();
    expect(await screen.findByText('Sin citas pendientes')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Todas las evaluaciones asignadas ya fueron resueltas. Las nuevas citas aparecerán acá.',
      ),
    ).toBeInTheDocument();
  });

  it('shows the Historial empty state when there are no resolved appointments', async () => {
    setupMocks([pendingAppointment]);
    renderView();
    expect(await screen.findByText('Sin registros')).toBeInTheDocument();
    expect(
      screen.getByText('Las citas que resuelvas aparecerán acá con su estado de pago.'),
    ).toBeInTheDocument();
  });
});
