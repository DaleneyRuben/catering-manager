import { render, screen } from '@testing-library/react';
import type { Client, Subscription } from '@/features/clients/types';
import { ClientOverviewTab } from './ClientOverviewTab';

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

it('shows a truck icon on the delivery row', () => {
  const { container } = render(<ClientOverviewTab client={client} sub={sub} remaining={15} />);
  const deliveryRow = screen.getByText(/entrega: la oliva/i).closest('div')!;
  expect(deliveryRow.querySelector('svg')).toBeInTheDocument();
  expect(container.querySelectorAll('svg').length).toBeGreaterThan(0);
});

it('renders the plan progress bar fill proportional to delivered/duration', () => {
  render(<ClientOverviewTab client={client} sub={sub} remaining={25} />);
  // duration 40 - remaining 25 = 15 delivered -> 15/40 = 37.5%
  expect(screen.getByTestId('plan-progress-fill')).toHaveStyle({ width: '37.5%' });
});

it('clamps the plan progress fill to 0% when remaining exceeds duration', () => {
  render(<ClientOverviewTab client={client} sub={sub} remaining={999} />);
  expect(screen.getByTestId('plan-progress-fill')).toHaveStyle({ width: '0%' });
});

it('uses the empty-bg/faint style for the badge when no days remain', () => {
  render(<ClientOverviewTab client={client} sub={sub} remaining={0} />);
  expect(screen.getByText('0 días').className).toContain('bg-empty-bg');
  expect(screen.getByText('0 días').className).toContain('text-faint');
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
