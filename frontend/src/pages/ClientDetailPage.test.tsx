import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import api from '../services/api';
import { ClientDetailPage } from './ClientDetailPage';

jest.mock('../services/api', () => ({
  default: { get: jest.fn(), patch: jest.fn() },
}));
const mockGet = api.get as jest.Mock;
const mockPatch = api.patch as jest.Mock;

const mockClient = {
  id: 1,
  name: 'John Doe',
  sex: 'male',
  dateOfBirth: '1990-05-15',
  phoneNumber: '+1234567890',
  address: '123 Main St',
  zone: 'Centro',
  delivery: 'La Oliva',
  nit: null,
  businessName: null,
  underlyingDiseases: ['diabetes'],
  restrictions: ['gluten'],
  isActive: true,
  subscriptions: [
    {
      id: 1,
      clientId: 1,
      planId: 2,
      contractDate: '2026-05-25',
      startDate: '2026-05-26',
      contractEndDate: '2026-06-25',
      plan: { id: 2, name: 'Plan A', price: 1200, meals: [], discount: 0 },
    },
  ],
};

function renderPage(client = mockClient) {
  mockGet.mockResolvedValue(client);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/clientes/1']}>
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
    expect(screen.getByText('Centro')).toBeInTheDocument();
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
    renderPage({ ...mockClient, isActive: false });
    expect(await screen.findByRole('button', { name: /reanudar/i })).toBeInTheDocument();
  });

  it('calls PATCH on pause and toggles button', async () => {
    mockPatch.mockResolvedValue({ ...mockClient, isActive: false });
    renderPage();
    const btn = await screen.findByRole('button', { name: /pausar/i });
    fireEvent.click(btn);
    await waitFor(() => expect(mockPatch).toHaveBeenCalledWith('/clients/1', { isActive: false }));
    expect(await screen.findByRole('button', { name: /reanudar/i })).toBeInTheDocument();
  });

  it('shows Editar button in view mode', async () => {
    renderPage();
    expect(await screen.findByRole('button', { name: /editar/i })).toBeInTheDocument();
  });

  it('clicking Editar shows form with current values pre-filled', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /editar/i }));
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument();
  });

  it('shows Guardar and Cancelar buttons in edit mode', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /editar/i }));
    expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

  it('Cancelar returns to view mode', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /editar/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
    expect(screen.queryByDisplayValue('John Doe')).not.toBeInTheDocument();
  });

  it('Guardar calls PATCH with updated fields and shows new name', async () => {
    mockPatch.mockResolvedValue({ ...mockClient, name: 'Jane Doe' });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /editar/i }));
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
});
