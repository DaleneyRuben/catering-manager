import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PendingPaymentCard } from '@/features/evaluations/components/PendingPaymentCard';
import type { PendingPaymentClient } from '@/features/evaluations/types';

const client: PendingPaymentClient = {
  id: '1',
  name: 'Gabriel Antelo',
  sex: 'male',
  dateOfBirth: '1990-01-01',
  phoneNumber: '74552201',
  address: 'Calle 1',
  deliveryZone: 'Centro',
  delivery: 'La Oliva',
  nit: null,
  businessName: null,
  underlyingDiseases: [],
  restrictions: [],
  pausedSince: null,
  status: 'active',
  groupMembers: [],
  isExistingClientRenewal: false,
  subscriptions: [
    {
      id: '9',
      clientId: '1',
      planId: '2',
      contractDate: '2026-06-23',
      startDate: '2026-06-23',
      contractEndDate: '2026-07-18',
      price: 1350,
      duration: 20,
      suspendedDates: [],
      finalizedAt: null,
      specialInstructions: {},
      paid: false,
      plan: { id: '2', name: 'Reductor', meals: ['lunch'], price: 1450 },
    },
  ],
};

describe('PendingPaymentCard', () => {
  it('renders name, phone/plan meta, total price, and contract range', () => {
    render(<PendingPaymentCard client={client} onMarkPaid={jest.fn()} onDelete={jest.fn()} />);
    expect(screen.getByText('Gabriel Antelo')).toBeInTheDocument();
    expect(screen.getByText('74552201 · Reductor')).toBeInTheDocument();
    expect(screen.getByText('1.350')).toBeInTheDocument();
    expect(screen.getByText('23/06/2026 → 18/07/2026')).toBeInTheDocument();
    expect(screen.getByText('Pendiente de pago')).toBeInTheDocument();
  });

  it('calls onMarkPaid with the client id when the check icon is clicked', async () => {
    const onMarkPaid = jest.fn();
    render(<PendingPaymentCard client={client} onMarkPaid={onMarkPaid} onDelete={jest.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /marcar como pagado/i }));
    expect(onMarkPaid).toHaveBeenCalledWith(client);
  });

  it('calls onDelete with the client id when the trash icon is clicked', async () => {
    const onDelete = jest.fn();
    render(<PendingPaymentCard client={client} onMarkPaid={jest.fn()} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(onDelete).toHaveBeenCalledWith(client);
  });
});
