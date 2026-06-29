import { render, screen } from '@testing-library/react';
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
