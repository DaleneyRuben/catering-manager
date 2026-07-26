import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/services/api';
import { AdminEvaluationsView } from '@/features/evaluations/components/AdminEvaluationsView';

jest.mock('@/services/api', () => ({
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));
const mockGet = api.get as jest.Mock;
const mockPost = api.post as jest.Mock;
const mockPatch = api.patch as jest.Mock;
const mockDelete = api.delete as jest.Mock;

const appointment1 = {
  id: '1',
  name: 'Mariana Ovando',
  phone: '70112345',
  date: '2026-06-25',
  time: '09:00',
  subscriptionId: null,
  clientId: null,
};

const pendingClient = {
  id: '5',
  name: 'Gabriel Antelo',
  phoneNumber: '74552201',
  isExistingClientRenewal: false,
  subscriptions: [
    {
      id: '9',
      discount: 100,
      startDate: '2026-06-23',
      contractEndDate: '2026-07-18',
      paid: false,
      plan: { id: '2', name: 'Reductor', price: 1450 },
    },
  ],
};

const pendingRenewalClient = { ...pendingClient, id: '6', isExistingClientRenewal: true };

function setupMocks({ appointments = [appointment1], pendingClients = [pendingClient] } = {}) {
  mockGet.mockImplementation((url: string) => {
    if (url === '/appointments/pending') return Promise.resolve(appointments);
    if (url === '/evaluations/pending-payment') return Promise.resolve(pendingClients);
    return Promise.reject(new Error(`Unknown URL: ${url}`));
  });
}

function renderView() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AdminEvaluationsView />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  setupMocks();
});

describe('AdminEvaluationsView', () => {
  it('renders the Evaluaciones heading and Nueva cita button', async () => {
    renderView();
    expect(await screen.findByRole('heading', { name: /evaluaciones/i })).toBeInTheDocument();
    await screen.findByText('Mariana Ovando');
    expect(screen.getByRole('button', { name: /nueva cita/i })).toBeInTheDocument();
  });

  it('shows the pending appointment in the citas pendientes table', async () => {
    renderView();
    expect(await screen.findByText('Mariana Ovando')).toBeInTheDocument();
  });

  it('shows the pending payment client card', async () => {
    renderView();
    expect(await screen.findByText('Gabriel Antelo')).toBeInTheDocument();
  });

  it('shows both empty states when there is no data', async () => {
    setupMocks({ appointments: [], pendingClients: [] });
    renderView();
    expect(await screen.findByText('Sin citas pendientes')).toBeInTheDocument();
    expect(screen.getByText('Sin clientes pendientes de pago')).toBeInTheDocument();
    expect(
      screen.getByText('Los clientes convertidos aparecerán aquí hasta que confirmes su pago.'),
    ).toBeInTheDocument();
  });

  it('Nueva cita opens a create modal and submits POST /appointments', async () => {
    mockPost.mockResolvedValue(appointment1);
    renderView();
    await screen.findByText('Mariana Ovando');

    await userEvent.click(screen.getByRole('button', { name: /nueva cita/i }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Nueva cita')).toBeInTheDocument();

    await userEvent.type(within(dialog).getByLabelText(/nombre/i), 'Ana');
    await userEvent.type(within(dialog).getByLabelText(/tel[eé]fono/i), '123');
    await userEvent.type(within(dialog).getByLabelText(/hora/i), '09:00');
    await userEvent.click(within(dialog).getByRole('button', { name: /crear cita/i }));

    await waitFor(() => expect(mockPost).toHaveBeenCalledWith('/appointments', expect.any(Object)));
  });

  it('editing an appointment opens a prefilled modal and submits PATCH /appointments/:id', async () => {
    mockPatch.mockResolvedValue({ ...appointment1, name: 'Nuevo nombre' });
    renderView();
    await screen.findByText('Mariana Ovando');

    await userEvent.click(screen.getByRole('button', { name: /editar cita/i }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByDisplayValue('Mariana Ovando')).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith('/appointments/1', expect.any(Object)),
    );
  });

  it('cancelling an appointment opens a confirm modal and calls DELETE /appointments/:id', async () => {
    mockDelete.mockResolvedValue({});
    renderView();
    await screen.findByText('Mariana Ovando');

    await userEvent.click(screen.getByRole('button', { name: /cancelar cita/i }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('button', { name: /^cancelar cita$/i })).toBeInTheDocument();
    expect(within(dialog).getByText(/¿Seguro que quieres cancelar la cita de/)).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: /^cancelar cita$/i }));

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith('/appointments/1'));
  });

  it('marking a client as paid opens a confirm modal and calls POST /evaluations/:id/mark-paid', async () => {
    mockPost.mockResolvedValue({});
    renderView();
    await screen.findByText('Gabriel Antelo');

    await userEvent.click(screen.getByRole('button', { name: /marcar como pagado/i }));
    expect(await screen.findByText('Marcar como pagado')).toBeInTheDocument();

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/¿Confirmas que/)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: /confirmar pago/i }));

    await waitFor(() => expect(mockPost).toHaveBeenCalledWith('/evaluations/5/mark-paid'));
  });

  it('deleting a pending client opens a confirm modal and calls DELETE /evaluations/:id', async () => {
    mockDelete.mockResolvedValue({});
    renderView();
    await screen.findByText('Gabriel Antelo');

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(await screen.findByText('Eliminar cliente pendiente')).toBeInTheDocument();

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/¿Seguro que quieres eliminar a/)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: /^eliminar$/i }));

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith('/evaluations/5'));
  });

  it('discarding a pending existing-client renewal opens a distinct confirm modal and calls DELETE /evaluations/:id/pending-renewal', async () => {
    setupMocks({ pendingClients: [pendingRenewalClient] });
    mockDelete.mockResolvedValue({});
    renderView();
    await screen.findByText('Gabriel Antelo');

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(await screen.findByText('Descartar renovación pendiente')).toBeInTheDocument();

    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByText(/¿Seguro que quieres descartar la renovación de/),
    ).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: /^descartar$/i }));

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith('/evaluations/6/pending-renewal'));
  });

  it('modal Cancelar closes the create modal without submitting', async () => {
    renderView();
    await screen.findByText('Mariana Ovando');
    fireEvent.click(screen.getByRole('button', { name: /nueva cita/i }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /cancelar/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockPost).not.toHaveBeenCalled();
  });
});
