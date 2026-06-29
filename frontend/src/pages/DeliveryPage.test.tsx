import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/services/api';
import { DeliveryPage } from '@/pages/DeliveryPage';

jest.mock('@/services/api', () => ({
  default: { get: jest.fn() },
}));

const mockGet = api.get as jest.Mock;

const person = (id: string, name: string, deliveryZone = 'Sur') => ({
  id,
  name,
  phone: '70000000',
  deliveryZone,
});

const renderPage = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <DeliveryPage />
    </QueryClientProvider>,
  );
};

beforeEach(() => jest.clearAllMocks());

describe('DeliveryPage', () => {
  it('renders the Entregas heading', async () => {
    mockGet.mockResolvedValue({
      '2026-06-25': { zones: [] },
      '2026-06-26': { zones: [] },
    });
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Entregas' })).toBeInTheDocument();
  });

  it('shows an empty state when the selected day has no zones', async () => {
    mockGet.mockResolvedValue({
      '2026-06-25': { zones: [] },
      '2026-06-26': { zones: [] },
    });
    renderPage();
    expect(await screen.findByText('Sin entregas programadas')).toBeInTheDocument();
  });

  it('shows today data by default', async () => {
    mockGet.mockResolvedValue({
      '2026-06-25': {
        zones: [{ zone: 'Sur', entregas: 1, groups: [], singles: [person('1', 'Ana López')] }],
      },
      '2026-06-26': { zones: [] },
    });
    renderPage();
    expect(await screen.findByText('Ana López')).toBeInTheDocument();
  });

  it('switches to manana data when the Mañana tab is clicked', async () => {
    mockGet.mockResolvedValue({
      '2026-06-25': {
        zones: [{ zone: 'Sur', entregas: 1, groups: [], singles: [person('1', 'Ana López')] }],
      },
      '2026-06-26': {
        zones: [{ zone: 'Centro', entregas: 1, groups: [], singles: [person('2', 'Zara Gomez')] }],
      },
    });
    renderPage();
    await screen.findByText('Ana López');

    await userEvent.click(screen.getByRole('button', { name: /mañana/i }));

    await waitFor(() => expect(screen.getByText('Zara Gomez')).toBeInTheDocument());
    expect(screen.queryByText('Ana López')).not.toBeInTheDocument();
  });

  it('shows entregas counts on both tab badges', async () => {
    mockGet.mockResolvedValue({
      '2026-06-25': {
        zones: [{ zone: 'Sur', entregas: 2, groups: [], singles: [] }],
      },
      '2026-06-26': {
        zones: [{ zone: 'Sur', entregas: 5, groups: [], singles: [] }],
      },
    });
    renderPage();
    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument());
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows the zone for the selected day', async () => {
    mockGet.mockResolvedValue({
      '2026-06-25': {
        zones: [{ zone: 'Sur', entregas: 1, groups: [], singles: [person('1', 'Ana López')] }],
      },
      '2026-06-26': { zones: [] },
    });
    renderPage();
    expect(await screen.findByText('Zona Sur')).toBeInTheDocument();
  });
});
