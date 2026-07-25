import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/services/api';
import { NutritionistEvaluationsView } from '@/features/evaluations/components/NutritionistEvaluationsView';

jest.mock('@/services/api', () => ({
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));
const mockGet = api.get as jest.Mock;

const appointment1 = {
  id: '1',
  name: 'Mariana Ovando',
  phone: '70112345',
  date: '2026-06-25',
  time: '09:00',
  subscriptionId: null,
  subscription: null,
};

function setupMocks(appointments = [appointment1]) {
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

  it('renders a card per assigned appointment', async () => {
    renderView();
    expect(await screen.findByText('Mariana Ovando')).toBeInTheDocument();
  });

  it('shows an empty state when there are no assigned appointments', async () => {
    setupMocks([]);
    renderView();
    expect(await screen.findByText('Sin citas asignadas')).toBeInTheDocument();
    expect(
      screen.getByText('Cuando se agenden evaluaciones aparecerán aquí, en orden cronológico.'),
    ).toBeInTheDocument();
  });
});
