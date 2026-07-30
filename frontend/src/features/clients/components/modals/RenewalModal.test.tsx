import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Client, Subscription } from '@/features/clients/types';
import { RenewalModal } from './RenewalModal';

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

it('does not show the paid toggle by default', () => {
  render(
    <RenewalModal
      client={client}
      sub={sub}
      isReactivation={false}
      onClose={jest.fn()}
      onRenew={jest.fn()}
    />,
  );
  expect(screen.queryByText(/¿pagó el servicio\?/i)).not.toBeInTheDocument();
});

it('shows the paid toggle when showPaidToggle is set, with no default selection', () => {
  render(
    <RenewalModal
      client={client}
      sub={sub}
      isReactivation={false}
      onClose={jest.fn()}
      onRenew={jest.fn()}
      showPaidToggle
    />,
  );
  expect(screen.getByText(/¿pagó el servicio\?/i)).toBeInTheDocument();
  const si = screen.getByRole('button', { name: /^sí$/i });
  const no = screen.getByRole('button', { name: /^no$/i });
  expect(si).toHaveAttribute('aria-pressed', 'false');
  expect(no).toHaveAttribute('aria-pressed', 'false');
});

it('disables confirm until a paid selection is made, then enables it', async () => {
  render(
    <RenewalModal
      client={client}
      sub={sub}
      isReactivation={false}
      onClose={jest.fn()}
      onRenew={jest.fn()}
      showPaidToggle
    />,
  );
  const precio = screen.getByLabelText(/precio/i);
  await userEvent.clear(precio);
  await userEvent.type(precio, '1200');

  expect(screen.getByRole('button', { name: /^renovar$/i })).toBeDisabled();

  await userEvent.click(screen.getByRole('button', { name: /^sí$/i }));

  expect(screen.getByRole('button', { name: /^renovar$/i })).not.toBeDisabled();
});
