import { render, screen, waitFor } from '@testing-library/react';
import { addDays, format, subDays } from 'date-fns';
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

// Every date here is relative to today, because the page's rules are: a renewal only counts as
// queued while another plan still covers today, and only while its own start date is still ahead.
// Written out as literals, half these tests passed only during August 2026.
const asIso = (date: Date) => format(date, 'yyyy-MM-dd');
const asShown = (date: Date) => format(date, 'dd/MM/yyyy');

const runningStart = subDays(new Date(), 60);
const runningEnd = addDays(new Date(), 5);
const queuedStart = addDays(new Date(), 10);
const queuedEnd = addDays(queuedStart, 25);

const appointment = {
  id: 'appt-1',
  name: 'Fernando Daleney',
  phone: '76637732',
  date: asIso(new Date()),
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
      contractDate: asIso(runningStart),
      startDate: asIso(runningStart),
      contractEndDate: asIso(runningEnd),
      discount: 0,
      duration: 40,
      suspendedDates: [],
      finalizedAt: null,
      plan,
    },
  ],
};

function renderPage(overrides: Record<string, () => Promise<unknown>> = {}) {
  mockGet.mockImplementation((url: string) => {
    if (url in overrides) return overrides[url]();
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

  it('resolves the renewal in a single atomic call on confirm', async () => {
    const createdSubscription = { id: 'sub-new', clientId: 'client-5' };
    mockPost.mockResolvedValueOnce(createdSubscription);
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
        '/appointments/appt-1/resolve-renewal',
        expect.objectContaining({ renewalType: 'renewal', paid: true }),
      ),
    );
    expect(mockPatch).not.toHaveBeenCalled();
  });

  it('shows an error state when the appointment does not exist', async () => {
    renderPage({ '/appointments/appt-1': () => Promise.reject(new Error('not found')) });

    expect(await screen.findByText(/cita no encontrada/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /volver a evaluaciones/i })).toBeInTheDocument();
  });

  it('shows an error state when the appointment has no linked client', async () => {
    renderPage({
      '/appointments/appt-1': () => Promise.resolve({ ...appointment, clientId: null }),
    });

    expect(await screen.findByText(/cita no encontrada/i)).toBeInTheDocument();
  });

  it('shows an error state when the linked client fails to load', async () => {
    renderPage({ '/clients/client-5': () => Promise.reject(new Error('not found')) });

    expect(await screen.findByText(/cita no encontrada/i)).toBeInTheDocument();
  });
});

const queuedRenewal = {
  ...client.subscriptions[0],
  id: 'sub-queued',
  startDate: asIso(queuedStart),
  contractEndDate: asIso(queuedEnd),
  duration: 20,
};

const queuedRenewalLine = `Completo · ${asShown(queuedStart)} → ${asShown(queuedEnd)} · 20 días hábiles`;

const withQueuedRenewal = () =>
  renderPage({
    '/clients/client-5': () =>
      Promise.resolve({ ...client, subscriptions: [...client.subscriptions, queuedRenewal] }),
  });

describe('EvaluationRenewalPage with a renewal already registered', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does not auto-open the renewal modal', async () => {
    withQueuedRenewal();

    await screen.findByText('Renovación ya registrada');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('names the renewal that is already in place', async () => {
    withQueuedRenewal();

    expect(await screen.findByText(queuedRenewalLine)).toBeInTheDocument();
  });

  it('renders the renewal action dead instead of hiding it', async () => {
    withQueuedRenewal();

    expect(await screen.findByRole('button', { name: /renovar plan/i })).toBeDisabled();
  });

  it('tells her to escalate to an administrator', async () => {
    withQueuedRenewal();

    expect(await screen.findByText(/pide a administración que la elimine/i)).toBeInTheDocument();
  });

  it('gives her no way to delete the renewal herself', async () => {
    withQueuedRenewal();

    await screen.findByText('Renovación ya registrada');
    expect(screen.queryByRole('button', { name: /eliminar/i })).not.toBeInTheDocument();
  });
});

const unpaidQueuedRenewal = { ...queuedRenewal, id: 'sub-unpaid', paid: false };

const withUnpaidQueuedRenewal = () =>
  renderPage({
    '/clients/client-5': () =>
      Promise.resolve({ ...client, subscriptions: [...client.subscriptions, unpaidQueuedRenewal] }),
  });

describe('EvaluationRenewalPage with an unpaid renewal already registered', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does not auto-open the renewal modal — payment does not lift the one-renewal block', async () => {
    withUnpaidQueuedRenewal();

    await screen.findByRole('button', { name: /renovar plan/i });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('still renders the renewal action dead', async () => {
    withUnpaidQueuedRenewal();

    expect(await screen.findByRole('button', { name: /renovar plan/i })).toBeDisabled();
  });

  it('does not announce it as an already-registered renewal or show its plan details', async () => {
    withUnpaidQueuedRenewal();

    await screen.findByRole('button', { name: /renovar plan/i });
    expect(screen.queryByText('Renovación ya registrada')).not.toBeInTheDocument();
    expect(screen.queryByText(queuedRenewalLine)).not.toBeInTheDocument();
  });
});
