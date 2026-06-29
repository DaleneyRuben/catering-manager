import { render, screen } from '@testing-library/react';
import { ClientOverviewTab } from './ClientOverviewTab';
import type { Client, Subscription } from '@/features/clients/types';

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

it('shows the plan name when subscription exists', () => {
  render(<ClientOverviewTab client={client} sub={sub} remaining={15} />);
  expect(screen.getByText('Completo')).toBeInTheDocument();
});

it('shows "Sin suscripción activa" when no subscription', () => {
  render(<ClientOverviewTab client={client} sub={undefined} remaining={0} />);
  expect(screen.getByText(/sin suscripción activa/i)).toBeInTheDocument();
});

it('shows the client phone number', () => {
  render(<ClientOverviewTab client={client} sub={sub} remaining={15} />);
  expect(screen.getByText('70000000')).toBeInTheDocument();
});

it('shows the client address', () => {
  render(<ClientOverviewTab client={client} sub={sub} remaining={15} />);
  expect(screen.getByText('Calle Falsa 123')).toBeInTheDocument();
});

it('shows remaining days badge', () => {
  render(<ClientOverviewTab client={client} sub={sub} remaining={10} />);
  expect(screen.getByText(/10 días/)).toBeInTheDocument();
});

it('shows restrictions when present', () => {
  const withRestrictions: Client = {
    ...client,
    restrictions: ['Gluten'],
    underlyingDiseases: ['Diabetes'],
  };
  render(<ClientOverviewTab client={withRestrictions} sub={sub} remaining={15} />);
  expect(screen.getByText('Gluten')).toBeInTheDocument();
  expect(screen.getByText('Diabetes')).toBeInTheDocument();
});
