import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { NewClientFormValues, RestrictionsState, Plan } from '@/features/clients/types';
import { StepConfirm } from './index';

const plan: Plan = { id: '1', name: 'Completo', price: 1200, meals: ['breakfast'] };

const formValues: NewClientFormValues = {
  name: 'Ana Torres',
  sex: 'F',
  dateOfBirth: '1985-03-15',
  phoneNumber: '70000000',
  address: 'Calle Falsa 123',
  deliveryZone: 'Centro',
  delivery: 'La Oliva',
  nit: '',
  businessName: '',
  planId: '1',
  contractDate: '2026-01-01',
  startDate: '2026-01-05',
  duration: 20,
  discount: 0,
  specialInstructions: {},
};

const restrictions: RestrictionsState = { restrictions: [], underlyingDiseases: [] };

it('renders the confirmation banner', () => {
  render(
    <StepConfirm
      formValues={formValues}
      restrictions={restrictions}
      plans={[plan]}
      submitError=""
    />,
  );
  expect(screen.getByText(/todo listo para crear/i)).toBeInTheDocument();
});

it('renders the ClientPreviewCard with client name', () => {
  render(
    <StepConfirm
      formValues={formValues}
      restrictions={restrictions}
      plans={[plan]}
      submitError=""
    />,
  );
  expect(screen.getByText('Ana Torres')).toBeInTheDocument();
});

it('shows submit error when provided', () => {
  render(
    <StepConfirm
      formValues={formValues}
      restrictions={restrictions}
      plans={[plan]}
      submitError="Error al guardar"
    />,
  );
  expect(screen.getByText('Error al guardar')).toBeInTheDocument();
});

it('does not show submit error when empty', () => {
  render(
    <StepConfirm
      formValues={formValues}
      restrictions={restrictions}
      plans={[plan]}
      submitError=""
    />,
  );
  expect(screen.queryByText('Error al guardar')).not.toBeInTheDocument();
});

it('does not show the payment toggle for the direct entry point', () => {
  render(
    <StepConfirm
      formValues={formValues}
      restrictions={restrictions}
      plans={[plan]}
      submitError=""
      origen="Directo"
    />,
  );
  expect(screen.queryByText('¿Pagó el servicio?')).not.toBeInTheDocument();
});

it('shows the payment toggle when entering from a cita', () => {
  render(
    <StepConfirm
      formValues={formValues}
      restrictions={restrictions}
      plans={[plan]}
      submitError=""
      origen="Cita"
      paid={null}
      onPaidChange={jest.fn()}
    />,
  );
  expect(screen.getByText('¿Pagó el servicio?')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Sí' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
});

it('calls onPaidChange with true when Sí is clicked', async () => {
  const onPaidChange = jest.fn();
  render(
    <StepConfirm
      formValues={formValues}
      restrictions={restrictions}
      plans={[plan]}
      submitError=""
      origen="Cita"
      paid={null}
      onPaidChange={onPaidChange}
    />,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Sí' }));
  expect(onPaidChange).toHaveBeenCalledWith(true);
});

it('calls onPaidChange with false when No is clicked', async () => {
  const onPaidChange = jest.fn();
  render(
    <StepConfirm
      formValues={formValues}
      restrictions={restrictions}
      plans={[plan]}
      submitError=""
      origen="Cita"
      paid={null}
      onPaidChange={onPaidChange}
    />,
  );
  await userEvent.click(screen.getByRole('button', { name: 'No' }));
  expect(onPaidChange).toHaveBeenCalledWith(false);
});
