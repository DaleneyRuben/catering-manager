import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RenewalModal } from './RenewalModal';
import type { Client, Subscription } from '@/features/clients/types';

jest.mock('@/features/plans/hooks/usePlans', () => ({
  usePlans: () => ({
    plans: [{ id: '1', name: 'Completo', price: 1200, meals: ['breakfast', 'lunch'] }],
  }),
}));

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
  plan: { id: '1', name: 'Completo', price: 1200, meals: ['breakfast'] },
};

it('shows the client name in the header', () => {
  render(
    <RenewalModal
      client={client}
      sub={sub}
      isReactivation={false}
      onClose={jest.fn()}
      onRenew={jest.fn()}
    />,
  );
  expect(screen.getAllByText(/Ana Torres/).length).toBeGreaterThan(0);
});

it('shows Renovar in title for renewal', () => {
  render(
    <RenewalModal
      client={client}
      sub={sub}
      isReactivation={false}
      onClose={jest.fn()}
      onRenew={jest.fn()}
    />,
  );
  expect(screen.getAllByText(/renovar/i).length).toBeGreaterThan(0);
});

it('shows Reactivar in title for reactivation', () => {
  render(
    <RenewalModal
      client={client}
      sub={sub}
      isReactivation
      onClose={jest.fn()}
      onRenew={jest.fn()}
    />,
  );
  expect(screen.getAllByText(/reactivar/i).length).toBeGreaterThan(0);
});

it('calls onClose when close button is clicked', async () => {
  const onClose = jest.fn();
  render(
    <RenewalModal
      client={client}
      sub={sub}
      isReactivation={false}
      onClose={onClose}
      onRenew={jest.fn()}
    />,
  );
  await userEvent.click(screen.getByRole('button', { name: /cerrar/i }));
  expect(onClose).toHaveBeenCalledTimes(1);
});
