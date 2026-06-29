import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientHeader } from './ClientHeader';
import type { Client } from '@/features/clients/types';

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
});
