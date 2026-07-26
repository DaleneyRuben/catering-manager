import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import api from '@/services/api';
import { EvaluationRenewalPage } from '@/pages/EvaluationRenewalPage';

jest.mock('@/services/api', () => ({
  default: { get: jest.fn(), patch: jest.fn(), post: jest.fn() },
}));
jest.mock('sonner', () => ({ toast: { success: jest.fn() } }));

const mockGet = api.get as jest.Mock;
const mockPatch = api.patch as jest.Mock;
const mockPost = api.post as jest.Mock;

const appointment = {
  id: 'appt-1',
  name: 'Fernando Daleney',
  phone: '76637732',
  date: '2026-08-03',
  time: '09:00',
  subscriptionId: null,
  clientId: 'client-5',
};

const plan = { id: 'plan-1', name: 'Completo', price: 1200, meals: ['breakfast', 'lunch'] };

const client = {
  id: 'client-5',
  name: 'Fernando Daleney',
  sex: 'M',
  dateOfBirth: '1985-03-15',
  phoneNumber: '76637732',
  address: 'Calle Falsa 123',
  deliveryZone: 'Centro',
  delivery: 'La Oliva',
  nit: null,
  businessName: null,
  underlyingDiseases: [],
  restrictions: [],
  pausedSince: null,
  status: 'active',
  groupMembers: [],
  subscriptions: [
    {
      id: 'sub-old',
      clientId: 'client-5',
      planId: 'plan-1',
      contractDate: '2026-01-01',
      startDate: '2026-01-02',
      contractEndDate: '2026-08-14',
      discount: 0,
      duration: 40,
      suspendedDates: [],
      finalizedAt: null,
      plan,
    },
  ],
};

function renderPage() {
  mockGet.mockImplementation((url: string) => {
    if (url === '/appointments/appt-1') return Promise.resolve(appointment);
    if (url === '/clients/client-5') return Promise.resolve(client);
    if (url === '/plans') return Promise.resolve([plan]);
    if (url === '/plans/client-counts') return Promise.resolve({});
    return Promise.resolve([]);
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/evaluaciones/citas/appt-1/renovar']}>
        <Routes>
          <Route path="/evaluaciones/citas/:id/renovar" element={<EvaluationRenewalPage />} />
          <Route path="/evaluaciones" element={<div>Evaluaciones</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('EvaluationRenewalPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows a back link to Evaluaciones', async () => {
    renderPage();
    expect(
      await screen.findByRole('button', { name: /volver a evaluaciones/i }),
    ).toBeInTheDocument();
  });

  it('renders the client summary once loaded', async () => {
    renderPage();
    expect((await screen.findAllByText('Fernando Daleney')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Completo').length).toBeGreaterThan(0);
  });

  it('auto-opens the renewal modal', async () => {
    renderPage();
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('shows the ¿Pagó el servicio? toggle in the auto-opened modal', async () => {
    renderPage();
    expect(await screen.findByText(/¿pagó el servicio\?/i)).toBeInTheDocument();
  });

  it('creates the subscription then links it to the appointment on confirm', async () => {
    const createdSubscription = { id: 'sub-new', clientId: 'client-5' };
    mockPost.mockResolvedValueOnce(createdSubscription);
    mockPatch.mockResolvedValueOnce({ ...appointment, subscriptionId: 'sub-new' });
    renderPage();

    await screen.findByRole('dialog');
    // wait for usePlans to resolve so the precio input becomes enabled
    await waitFor(() => expect(screen.getByLabelText(/precio/i)).not.toBeDisabled());
    const precio = screen.getByLabelText(/precio/i);
    await userEvent.clear(precio);
    await userEvent.type(precio, '1200');
    await userEvent.click(screen.getByRole('button', { name: /^sí$/i }));
    await userEvent.click(screen.getByRole('button', { name: /^renovar$/i }));

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith(
        '/clients/client-5/subscriptions',
        expect.objectContaining({ renewalType: 'renewal', paid: true, appointmentId: 'appt-1' }),
      ),
    );
    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith('/appointments/appt-1', {
        subscriptionId: 'sub-new',
      }),
    );
  });
});
