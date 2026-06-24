import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '../services/api';
import { ClientsPage } from './ClientsPage';

jest.mock('../services/api', () => ({
  default: { getPaginated: jest.fn() },
}));
const mockGetPaginated = api.getPaginated as jest.Mock;

const makeSub = (overrides = {}) => ({
  id: 1,
  clientId: 1,
  planId: 1,
  contractDate: '2026-05-01',
  startDate: '2026-05-01',
  contractEndDate: '2026-06-05',
  discount: 0,
  plan: { id: 1, name: 'Completo', meals: [], price: 480 },
  ...overrides,
});

const makeClient = (overrides = {}) => ({
  id: 1,
  name: 'María García',
  sex: 'female',
  dateOfBirth: '1970-04-12',
  phoneNumber: '+34 612 345 678',
  address: 'Av. Centro 142',
  deliveryZone: 'Centro',
  delivery: 'La Oliva',
  nit: null,
  businessName: null,
  underlyingDiseases: [],
  restrictions: ['gluten'],
  isActive: true,
  subscriptions: [makeSub()],
  ...overrides,
});

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ClientsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const paginatedResponse = (clients: ReturnType<typeof makeClient>[], total = clients.length) => ({
  data: clients,
  total,
  page: 1,
  limit: 20,
});

describe('ClientsPage', () => {
  it('renders the page heading', async () => {
    mockGetPaginated.mockResolvedValue(paginatedResponse([]));
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Clientes' })).toBeInTheDocument();
  });

  it('shows client names after loading', async () => {
    mockGetPaginated.mockResolvedValue(paginatedResponse([makeClient()]));
    renderPage();
    await waitFor(() => expect(screen.getByText('María García')).toBeInTheDocument());
  });

  it('shows empty state when no clients match', async () => {
    mockGetPaginated.mockResolvedValue(paginatedResponse([]));
    renderPage();
    await waitFor(() => expect(screen.getByText('Sin resultados')).toBeInTheDocument());
  });

  it('has an add client button', async () => {
    mockGetPaginated.mockResolvedValue(paginatedResponse([]));
    renderPage();
    expect(await screen.findByRole('button', { name: /agregar cliente/i })).toBeInTheDocument();
  });

  it('shows pagination when results span multiple pages', async () => {
    mockGetPaginated.mockResolvedValue(paginatedResponse([makeClient()], 45));
    renderPage();
    await waitFor(() => expect(screen.getByText('María García')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /siguiente/i })).toBeInTheDocument();
  });

  it('shows pagination even when all results fit on one page', async () => {
    mockGetPaginated.mockResolvedValue(paginatedResponse([makeClient()], 1));
    renderPage();
    await waitFor(() => expect(screen.getByText('María García')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /siguiente/i })).toBeInTheDocument();
  });

  it('hides pagination when there are no results', async () => {
    mockGetPaginated.mockResolvedValue(paginatedResponse([], 0));
    renderPage();
    await waitFor(() => expect(screen.getByText('Sin resultados')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /siguiente/i })).not.toBeInTheDocument();
  });

  it('shows the price with a thousands separator', async () => {
    mockGetPaginated.mockResolvedValue(
      paginatedResponse([
        makeClient({
          subscriptions: [makeSub({ plan: { id: 1, name: 'Completo', meals: [], price: 1450 } })],
        }),
      ]),
    );
    renderPage();
    expect(await screen.findByText('1.450')).toBeInTheDocument();
  });

  it('shows an em-dash for price when there is no subscription', async () => {
    mockGetPaginated.mockResolvedValue(paginatedResponse([makeClient({ subscriptions: [] })]));
    renderPage();
    await screen.findByText('María García');
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('filters clients by search query via backend', async () => {
    mockGetPaginated.mockImplementation((url: string) => {
      if (url.includes('q=Juan'))
        return Promise.resolve(
          paginatedResponse([
            makeClient({ id: 2, name: 'Juan Pérez', subscriptions: [makeSub({ clientId: 2 })] }),
          ]),
        );
      return Promise.resolve(
        paginatedResponse([
          makeClient({ id: 1, name: 'María García' }),
          makeClient({ id: 2, name: 'Juan Pérez', subscriptions: [makeSub({ clientId: 2 })] }),
        ]),
      );
    });
    renderPage();
    await waitFor(() => expect(screen.getByText('María García')).toBeInTheDocument());

    const search = screen.getByPlaceholderText('Buscar cliente…');
    await userEvent.type(search, 'Juan');

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.queryByText('María García')).not.toBeInTheDocument();
    });
  });

  it('filters clients by allergy/restriction search via backend', async () => {
    mockGetPaginated.mockImplementation((url: string) => {
      if (url.includes(`restriction=${encodeURIComponent('maní')}`))
        return Promise.resolve(
          paginatedResponse([makeClient({ id: 2, name: 'Juan Pérez', restrictions: ['maní'] })]),
        );
      return Promise.resolve(paginatedResponse([makeClient({ id: 1, name: 'María García' })]));
    });
    renderPage();
    await waitFor(() => expect(screen.getByText('María García')).toBeInTheDocument());

    const allergySearch = screen.getByPlaceholderText('Buscar por alergia o restricción…');
    await userEvent.type(allergySearch, 'maní');

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.queryByText('María García')).not.toBeInTheDocument();
    });
  });
});
