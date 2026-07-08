import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Client, Subscription } from '@/features/clients/types';
import { ClientPlanTab } from './ClientPlanTab';

function withQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{ui}</QueryClientProvider>;
}

const client: Client = {
  id: '1',
  name: 'Ana Torres',
  sex: 'F',
  dateOfBirth: '1985-03-15',
  phoneNumber: '70000000',
  address: 'Calle Falsa 123',
  deliveryZone: 'Centro',
  delivery: 'La Oliva',
  nit: null,
  businessName: null,
  underlyingDiseases: [],
  restrictions: [],
  pausedSince: null,
  subscriptions: [],
  status: 'active',
  groupMembers: [],
};

const sub: Subscription = {
  id: '1',
  clientId: '1',
  planId: '1',
  contractDate: '2026-01-01',
  startDate: '2026-01-02',
  contractEndDate: '2026-03-01',
  duration: 40,
  discount: 0,
  suspendedDates: [],
  finalizedAt: null,
  specialInstructions: {},
  plan: { id: '1', name: 'Completo', price: 1200, meals: ['breakfast', 'lunch'] },
};

it('shows "Sin suscripción activa" when no subscription', () => {
  render(
    <ClientPlanTab
      client={client}
      sub={undefined}
      remaining={0}
      onUpdateContract={jest.fn()}
      onUpdateBilling={jest.fn()}
      onUpdateInstructions={jest.fn()}
    />,
  );
  expect(screen.getByText(/sin suscripción activa/i)).toBeInTheDocument();
});

it('renders plan content when subscription exists', () => {
  render(
    withQuery(
      <ClientPlanTab
        client={client}
        sub={sub}
        remaining={15}
        onUpdateContract={jest.fn()}
        onUpdateBilling={jest.fn()}
        onUpdateInstructions={jest.fn()}
      />,
    ),
  );
  expect(screen.queryByText(/sin suscripción activa/i)).not.toBeInTheDocument();
});

it('no longer renders suspensions or group management (moved to the Entregas tab)', () => {
  render(
    withQuery(
      <ClientPlanTab
        client={client}
        sub={sub}
        remaining={15}
        onUpdateContract={jest.fn()}
        onUpdateBilling={jest.fn()}
        onUpdateInstructions={jest.fn()}
      />,
    ),
  );
  expect(screen.queryByText('Suspensiones')).not.toBeInTheDocument();
  expect(screen.queryByText('Entrega conjunta')).not.toBeInTheDocument();
});
