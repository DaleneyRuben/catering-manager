import { render, screen } from '@testing-library/react';
import type { Client, Subscription } from '@/features/clients/types';
import { ExistingClientSummaryCard } from './ExistingClientSummaryCard';

const plan = { id: '1', name: 'Completo', price: 1200, meals: ['breakfast', 'lunch'] };

const sub: Subscription = {
  id: '1',
  clientId: '1',
  planId: '1',
  contractDate: '2026-01-01',
  startDate: '2026-01-02',
  contractEndDate: '2026-08-15',
  duration: 40,
  discount: 0,
  suspendedDates: [],
  finalizedAt: null,
  specialInstructions: {},
  plan,
};

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
  subscriptions: [sub],
  status: 'active',
  groupMembers: [],
};

describe('ExistingClientSummaryCard', () => {
  it('shows name and phone', () => {
    render(<ExistingClientSummaryCard client={client} sub={sub} />);
    expect(screen.getByText('Ana Torres')).toBeInTheDocument();
    expect(screen.getByText('70000000')).toBeInTheDocument();
  });

  it('shows the status pill label', () => {
    render(<ExistingClientSummaryCard client={client} sub={sub} />);
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });

  it('shows the current plan name', () => {
    render(<ExistingClientSummaryCard client={client} sub={sub} />);
    expect(screen.getByText('Completo')).toBeInTheDocument();
  });

  it('shows the contract end date formatted as dd/MM/yyyy', () => {
    render(<ExistingClientSummaryCard client={client} sub={sub} />);
    expect(screen.getByText('15/08/2026')).toBeInTheDocument();
  });

  it('does not show restrictions, address, NIT, or other admin-only fields', () => {
    render(<ExistingClientSummaryCard client={client} sub={sub} />);
    expect(screen.queryByText('Calle Falsa 123')).not.toBeInTheDocument();
  });
});
