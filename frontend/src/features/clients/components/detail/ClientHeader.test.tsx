import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Client } from '@/features/clients/types';
import { ClientHeader } from './ClientHeader';

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

const baseProps = {
  client,
  isUpdating: false,
  onToggleActive: jest.fn(),
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  onFinalize: jest.fn(),
  onBack: jest.fn(),
  onRenew: jest.fn(),
  onDeleteRenewal: jest.fn(),
  onAssignStartDate: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

it('shows the client name', () => {
  render(<ClientHeader {...baseProps} status="active" />);
  expect(screen.getByText('Ana Torres')).toBeInTheDocument();
});

it('shows Pausar button when status is active', () => {
  render(<ClientHeader {...baseProps} status="active" />);
  expect(screen.getByRole('button', { name: /pausar/i })).toBeInTheDocument();
});

it('shows Reanudar button when status is paused', () => {
  render(<ClientHeader {...baseProps} status="paused" />);
  expect(screen.getByRole('button', { name: /reanudar/i })).toBeInTheDocument();
});

it('shows Reactivar instead of Renovar when status is ended', () => {
  render(<ClientHeader {...baseProps} status="ended" />);
  expect(screen.getByRole('button', { name: /reactivar/i })).toBeInTheDocument();
});

it('does not show Pausar when status is ended', () => {
  render(<ClientHeader {...baseProps} status="ended" />);
  expect(screen.queryByRole('button', { name: /pausar/i })).not.toBeInTheDocument();
});

it('calls onBack when the back link is clicked', async () => {
  const onBack = jest.fn();
  render(<ClientHeader {...baseProps} status="active" onBack={onBack} />);
  await userEvent.click(screen.getByRole('button', { name: /clientes/i }));
  expect(onBack).toHaveBeenCalledTimes(1);
});

it('shows a paused warning banner when status is paused', () => {
  render(<ClientHeader {...baseProps} status="paused" />);
  expect(screen.getByText(/plan en pausa/i)).toBeInTheDocument();
  expect(screen.getByText(/reanuda el plan cuando esté listo/i)).toBeInTheDocument();
});

const subscription = (over: Record<string, unknown>) =>
  ({
    id: 's1',
    startDate: '2026-06-30',
    contractEndDate: '2026-07-28',
    finalizedAt: null,
    duration: 20,
    plan: { id: 'p1', name: 'Completo', meals: [], price: 1390 },
    ...over,
  }) as Client['subscriptions'][number];

const withQueuedRenewal = (over: Partial<Client> = {}): Client => ({
  ...client,
  subscriptions: [
    subscription({ id: 'running' }),
    subscription({ id: 'renewal', startDate: '2026-07-29', contractEndDate: '2026-08-25' }),
  ],
  ...over,
});

describe('with a queued renewal', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-15T12:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('disables Renovar when a renewal is already registered', () => {
    render(<ClientHeader {...baseProps} client={withQueuedRenewal()} status="expiring" />);

    expect(screen.getByRole('button', { name: /renovar/i })).toBeDisabled();
  });

  it('shows the queued renewal notice instead of the plain pause banner', () => {
    render(<ClientHeader {...baseProps} client={withQueuedRenewal()} status="paused" />);

    expect(screen.getByText(/plan en pausa · renovación registrada/i)).toBeInTheDocument();
    expect(screen.queryByText(/reanuda el plan cuando esté listo/i)).not.toBeInTheDocument();
  });

  it('calls onDeleteRenewal from the queued renewal notice', async () => {
    const user = userEvent.setup({ delay: null });
    const onDeleteRenewal = jest.fn();
    render(
      <ClientHeader
        {...baseProps}
        client={withQueuedRenewal()}
        status="expiring"
        onDeleteRenewal={onDeleteRenewal}
      />,
    );

    await user.click(screen.getByRole('button', { name: /eliminar renovación/i }));

    expect(onDeleteRenewal).toHaveBeenCalled();
  });
});

describe('with an unpaid queued renewal', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-15T12:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const withUnpaidQueuedRenewal = (): Client => ({
    ...client,
    subscriptions: [
      subscription({ id: 'running' }),
      subscription({
        id: 'renewal',
        startDate: '2026-07-29',
        contractEndDate: '2026-08-25',
        paid: false,
      }),
    ],
  });

  it('still disables Renovar — payment does not lift the one-renewal-at-a-time block', () => {
    render(<ClientHeader {...baseProps} client={withUnpaidQueuedRenewal()} status="expiring" />);

    expect(screen.getByRole('button', { name: /renovar/i })).toBeDisabled();
  });

  it('does not show the confirmed queued renewal banner or its delete action', () => {
    render(<ClientHeader {...baseProps} client={withUnpaidQueuedRenewal()} status="expiring" />);

    expect(screen.queryByText(/renovación registrada · inicia el/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /eliminar renovación/i })).not.toBeInTheDocument();
  });

  it('shows a pending-payment notice instead of the confirmed banner', () => {
    render(<ClientHeader {...baseProps} client={withUnpaidQueuedRenewal()} status="expiring" />);

    expect(screen.getByText(/renovación pendiente de pago/i)).toBeInTheDocument();
  });
});

it('disables Renovar for a client whose only plan has not started yet', () => {
  const programado = {
    ...client,
    subscriptions: [subscription({ id: 'future', startDate: '2026-08-03' })],
  };

  render(<ClientHeader {...baseProps} client={programado} status="future" />);

  expect(screen.getByRole('button', { name: /renovar/i })).toBeDisabled();
  expect(
    screen.getByText(/renovar está inactivo hasta que el plan esté en curso/i),
  ).toBeInTheDocument();
});

it('keeps Renovar available when there is no queued renewal', () => {
  render(<ClientHeader {...baseProps} status="expiring" />);

  expect(screen.getByRole('button', { name: /renovar/i })).toBeEnabled();
});
