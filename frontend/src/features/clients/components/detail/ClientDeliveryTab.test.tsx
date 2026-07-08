import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/services/api';
import type { Client, Subscription } from '@/features/clients/types';
import { ClientDeliveryTab } from './ClientDeliveryTab';

jest.mock('@/services/api', () => ({
  default: { get: jest.fn() },
}));
const mockGet = api.get as jest.Mock;

const baseSub: Subscription = {
  id: '1',
  clientId: '1',
  planId: '2',
  contractDate: '2026-06-04',
  startDate: '2026-06-04',
  contractEndDate: '2026-06-26',
  discount: 0,
  duration: 20,
  suspendedDates: ['2026-06-10'],
  finalizedAt: null,
  specialInstructions: {},
  plan: { id: '2', name: 'Hiperproteico', price: 1200, meals: ['lunch'] },
};

const baseClient: Client = {
  id: '1',
  name: 'Pablo Villarroel',
  sex: 'male',
  dateOfBirth: '1999-10-14',
  phoneNumber: '+591 7 654 3210',
  address: 'Av. Las Américas #210, Sur',
  deliveryZone: 'Sur',
  delivery: 'La Oliva',
  nit: null,
  businessName: null,
  underlyingDiseases: [],
  restrictions: [],
  groupMembers: [],
  pausedSince: null,
  status: 'active',
  subscriptions: [baseSub],
};

function renderTab(sub: Subscription | undefined, onSuspend = jest.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  mockGet.mockResolvedValue([]);
  render(
    <QueryClientProvider client={queryClient}>
      <ClientDeliveryTab client={baseClient} sub={sub} onSuspend={onSuspend} />
    </QueryClientProvider>,
  );
  return { onSuspend };
}

describe('ClientDeliveryTab', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-11T12:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows a message when there is no active subscription', () => {
    renderTab(undefined);
    expect(screen.getByText('Sin suscripción activa.')).toBeInTheDocument();
    expect(screen.queryByText('Calendario de entregas')).not.toBeInTheDocument();
  });

  it('renders the delivery calendar and contract summary with matching counts', () => {
    renderTab(baseSub);
    expect(screen.getByText('Calendario de entregas')).toBeInTheDocument();
    expect(screen.getByText('Resumen del contrato')).toBeInTheDocument();
    // business days 04/06 (Thu) - 11/06 (Thu), minus the suspended 10/06 = 5 delivered
    expect(screen.getAllByText('5')).toHaveLength(2);
    expect(screen.getAllByText('1')).toHaveLength(2);
  });

  it('renders the group management card', () => {
    renderTab(baseSub);
    expect(screen.getByText('Entrega conjunta')).toBeInTheDocument();
  });

  it('calls onSuspend when the suspend button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    const { onSuspend } = renderTab(baseSub);
    await user.click(screen.getByRole('button', { name: /suspender días/i }));
    expect(onSuspend).toHaveBeenCalled();
  });

  it('shows a placeholder instead of the calendar when contract dates are missing', () => {
    renderTab({ ...baseSub, startDate: null, contractEndDate: null });
    expect(screen.queryByText('Calendario de entregas')).not.toBeInTheDocument();
    expect(screen.getByText('Sin fechas de contrato definidas.')).toBeInTheDocument();
    expect(screen.getByText('Entrega conjunta')).toBeInTheDocument();
  });
});
