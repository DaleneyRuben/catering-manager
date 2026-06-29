import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientEditModal } from './ClientEditModal';
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
  restrictions: ['Gluten'],
  pausedSince: null,
  subscriptions: [],
  status: 'active',
  groupMembers: [],
};

it('shows the client name in the header', () => {
  render(
    <ClientEditModal client={client} onSave={jest.fn()} onClose={jest.fn()} isSaving={false} />,
  );
  expect(screen.getAllByText('Ana Torres').length).toBeGreaterThan(0);
});

it('pre-fills name input with client name', () => {
  render(
    <ClientEditModal client={client} onSave={jest.fn()} onClose={jest.fn()} isSaving={false} />,
  );
  expect(screen.getByLabelText(/nombre completo/i)).toHaveValue('Ana Torres');
});

it('pre-fills phone number', () => {
  render(
    <ClientEditModal client={client} onSave={jest.fn()} onClose={jest.fn()} isSaving={false} />,
  );
  expect(screen.getByLabelText(/celular/i)).toHaveValue('70000000');
});

it('calls onClose when close icon is clicked', async () => {
  const onClose = jest.fn();
  render(<ClientEditModal client={client} onSave={jest.fn()} onClose={onClose} isSaving={false} />);
  await userEvent.click(screen.getByRole('button', { name: /cerrar/i }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

it('calls onClose when cancel button is clicked', async () => {
  const onClose = jest.fn();
  render(<ClientEditModal client={client} onSave={jest.fn()} onClose={onClose} isSaving={false} />);
  await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

it('calls onSave with draft when save button is clicked', async () => {
  const onSave = jest.fn();
  render(<ClientEditModal client={client} onSave={onSave} onClose={jest.fn()} isSaving={false} />);
  await userEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Ana Torres' }));
});

it('shows existing restrictions as tags', () => {
  render(
    <ClientEditModal client={client} onSave={jest.fn()} onClose={jest.fn()} isSaving={false} />,
  );
  expect(screen.getByText('Gluten')).toBeInTheDocument();
});

it('toggles disease pill selection on click', async () => {
  render(
    <ClientEditModal client={client} onSave={jest.fn()} onClose={jest.fn()} isSaving={false} />,
  );
  const pill = screen.getByRole('button', { name: 'Diabetes' });
  expect(pill).toHaveAttribute('aria-pressed', 'false');
  await userEvent.click(pill);
  expect(pill).toHaveAttribute('aria-pressed', 'true');
});
