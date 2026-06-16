import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import api from '../../services/api';
import { ClientDetailPage } from '.';

jest.mock('../../services/api', () => ({
  default: { get: jest.fn(), patch: jest.fn(), post: jest.fn() },
}));
const mockGet = api.get as jest.Mock;
const mockPatch = api.patch as jest.Mock;
const mockPost = api.post as jest.Mock;

const mockClient = {
  id: 1,
  name: 'John Doe',
  sex: 'male',
  dateOfBirth: '1990-05-15',
  phoneNumber: '+1234567890',
  address: '123 Main St',
  deliveryZone: 'Centro',
  delivery: 'La Oliva',
  nit: null,
  businessName: null,
  underlyingDiseases: ['diabetes'],
  restrictions: ['gluten'],
  pausedSince: null,
  status: 'active',
  subscriptions: [
    {
      id: 1,
      clientId: 1,
      planId: 2,
      contractDate: '2026-05-25',
      startDate: '2026-05-26',
      contractEndDate: '2026-06-25',
      discount: 0,
      duration: 20,
      suspendedDates: [],
      finalizedAt: null,
      plan: { id: 2, name: 'Plan A', price: 1200, meals: [] },
    },
  ],
};

function renderPage(client = mockClient) {
  mockGet.mockImplementation((url: string) => {
    if (url.includes('/history')) return Promise.resolve([]);
    return Promise.resolve(client);
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {/* two entries so navigate(-1) returns to /clientes */}
      <MemoryRouter initialEntries={['/clientes', '/clientes/1']} initialIndex={1}>
        <Routes>
          <Route path="/clientes/:id" element={<ClientDetailPage />} />
          <Route path="/clientes" element={<div>Lista clientes</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ClientDetailPage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the client name', async () => {
    renderPage();
    expect(await screen.findByText('John Doe')).toBeInTheDocument();
  });

  it('shows identity fields', async () => {
    renderPage();
    await screen.findByText('John Doe');
    expect(screen.getByText('+1234567890')).toBeInTheDocument();
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
  });

  it('shows restrictions', async () => {
    renderPage();
    await screen.findByText('John Doe');
    expect(screen.getByText('diabetes')).toBeInTheDocument();
    expect(screen.getByText('gluten')).toBeInTheDocument();
  });

  it('shows plan info', async () => {
    renderPage();
    expect(await screen.findByText('Plan A')).toBeInTheDocument();
  });

  it('shows Pausar button when client is active', async () => {
    renderPage();
    expect(await screen.findByRole('button', { name: /pausar/i })).toBeInTheDocument();
  });

  it('shows Reanudar button when client is paused', async () => {
    renderPage({ ...mockClient, status: 'paused', pausedSince: '2026-06-10T00:00:00.000Z' });
    expect(await screen.findByRole('button', { name: /reanudar/i })).toBeInTheDocument();
  });

  it('does not show Reanudar button when client has a future start date', async () => {
    const futureStartClient = {
      ...mockClient,
      status: 'future',
      subscriptions: [
        {
          ...mockClient.subscriptions[0],
          startDate: '2099-01-01',
          contractEndDate: '2099-03-01',
        },
      ],
    };
    renderPage(futureStartClient);
    await screen.findByText('John Doe');
    expect(screen.queryByRole('button', { name: /reanudar/i })).not.toBeInTheDocument();
    expect(screen.getByText('Plan programado')).toBeInTheDocument();
  });

  it('calls PATCH on pause and toggles button', async () => {
    mockPatch.mockResolvedValue({
      ...mockClient,
      status: 'paused',
      pausedSince: '2026-06-15T00:00:00.000Z',
    });
    renderPage();
    const btn = await screen.findByRole('button', { name: /pausar/i });
    fireEvent.click(btn);
    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith(
        '/clients/1',
        expect.objectContaining({
          pausedSince: expect.any(String),
        }),
      ),
    );
    expect(await screen.findByRole('button', { name: /reanudar/i })).toBeInTheDocument();
  });

  it('shows overflow menu trigger in view mode', async () => {
    renderPage();
    expect(await screen.findByRole('button', { name: /más acciones/i })).toBeInTheDocument();
  });

  it('clicking Editar datos shows form with current values pre-filled', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /más acciones/i }));
    fireEvent.click(screen.getByText('Editar datos'));
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument();
  });

  it('shows Guardar and Cancelar buttons in edit mode', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /más acciones/i }));
    fireEvent.click(screen.getByText('Editar datos'));
    expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

  it('Cancelar returns to view mode', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /más acciones/i }));
    fireEvent.click(screen.getByText('Editar datos'));
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(screen.getByRole('button', { name: /más acciones/i })).toBeInTheDocument();
    expect(screen.queryByDisplayValue('John Doe')).not.toBeInTheDocument();
  });

  it('Guardar calls PATCH with updated fields and shows new name', async () => {
    mockPatch.mockResolvedValue({ ...mockClient, name: 'Jane Doe' });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /más acciones/i }));
    fireEvent.click(screen.getByText('Editar datos'));
    fireEvent.change(screen.getByDisplayValue('John Doe'), { target: { value: 'Jane Doe' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith(
        '/clients/1',
        expect.objectContaining({ name: 'Jane Doe' }),
      ),
    );
    expect(await screen.findByRole('heading', { name: 'Jane Doe' })).toBeInTheDocument();
  });

  it('navigates back to /clientes on back button click', async () => {
    renderPage();
    await screen.findByText('John Doe');
    fireEvent.click(screen.getByRole('button', { name: /clientes/i }));
    expect(await screen.findByText('Lista clientes')).toBeInTheDocument();
  });

  it('renders 4 navigation tabs', async () => {
    renderPage();
    await screen.findByText('John Doe');
    expect(screen.getByRole('tab', { name: /resumen/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /plan/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /suspensiones/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /historial/i })).toBeInTheDocument();
  });

  it('shows plan vigente card in Resumen tab by default', async () => {
    renderPage();
    await screen.findByText('John Doe');
    expect(screen.getByText(/plan vigente/i)).toBeInTheDocument();
  });

  it('switching to Plan tab shows plan asignado section', async () => {
    renderPage();
    await screen.findByText('John Doe');
    fireEvent.click(screen.getByRole('tab', { name: /plan/i }));
    expect(screen.getByText(/plan asignado/i)).toBeInTheDocument();
  });

  it('switching to Suspensiones tab shows empty state', async () => {
    renderPage();
    await screen.findByText('John Doe');
    fireEvent.click(screen.getByRole('tab', { name: /suspensiones/i }));
    expect(screen.getByText(/sin suspensiones/i)).toBeInTheDocument();
  });

  it('switching to Historial tab shows empty state', async () => {
    renderPage();
    await screen.findByText('John Doe');
    fireEvent.click(screen.getByRole('tab', { name: /historial/i }));
    expect(await screen.findByText(/sin eventos/i)).toBeInTheDocument();
  });

  it('clicking Editar datos opens a modal with Editar cliente heading', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /más acciones/i }));
    fireEvent.click(screen.getByText('Editar datos'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Editar cliente')).toBeInTheDocument();
  });

  it('modal shows predefined disease chips', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /más acciones/i }));
    fireEvent.click(screen.getByText('Editar datos'));
    expect(screen.getByRole('button', { name: 'Diabetes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hipertensión' })).toBeInTheDocument();
  });

  it('shows Finalizar plan in overflow menu when client is active', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /más acciones/i }));
    expect(screen.getByText('Finalizar plan')).toBeInTheDocument();
  });

  it('does not show Finalizar plan in overflow menu when client is already ended', async () => {
    renderPage({
      ...mockClient,
      status: 'ended',
      subscriptions: [{ ...mockClient.subscriptions[0], contractEndDate: '2020-01-01' }],
    });
    fireEvent.click(await screen.findByRole('button', { name: /más acciones/i }));
    expect(screen.queryByText('Finalizar plan')).not.toBeInTheDocument();
  });

  it('clicking Finalizar plan opens a confirmation dialog', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /más acciones/i }));
    fireEvent.click(screen.getByText('Finalizar plan'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('confirming finalize calls POST /clients/:id/finalize', async () => {
    mockPost.mockResolvedValue({});
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /más acciones/i }));
    fireEvent.click(screen.getByText('Finalizar plan'));
    fireEvent.click(screen.getByRole('button', { name: /^finalizar$/i }));
    await waitFor(() => expect(mockPost).toHaveBeenCalledWith('/clients/1/finalize', {}));
  });

  it('switching to Suspensiones tab shows suspended days count', async () => {
    renderPage({
      ...mockClient,
      subscriptions: [{ ...mockClient.subscriptions[0], suspendedDates: ['2026-06-10'] }],
    });
    await screen.findByText('John Doe');
    fireEvent.click(screen.getByRole('tab', { name: /suspensiones/i }));
    expect(await screen.findByText('1')).toBeInTheDocument();
  });

  it('Suspender días button opens suspend modal', async () => {
    renderPage();
    await screen.findByText('John Doe');
    fireEvent.click(screen.getByRole('button', { name: /suspender días/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('saving suspensions calls PATCH on subscriptions with suspendedDates', async () => {
    mockPatch.mockResolvedValue({});
    renderPage();
    await screen.findByText('John Doe');
    fireEvent.click(screen.getByRole('button', { name: /suspender días/i }));
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith(
        '/clients/1/subscriptions/1',
        expect.objectContaining({ suspendedDates: expect.any(Array) }),
      ),
    );
  });
});
