import { render, screen } from '@testing-library/react';
import { ClientPreviewCard } from './ClientPreviewCard';
import type { NewClientFormValues, RestrictionsState, Plan } from '@/features/clients/types';

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

it('shows the client name', () => {
  render(<ClientPreviewCard formValues={formValues} restrictions={restrictions} plans={[plan]} />);
  expect(screen.getByText('Ana Torres')).toBeInTheDocument();
});

it('shows the selected plan name', () => {
  render(<ClientPreviewCard formValues={formValues} restrictions={restrictions} plans={[plan]} />);
  expect(screen.getByText('Completo')).toBeInTheDocument();
});

it('shows the total monthly price when no discount', () => {
  render(<ClientPreviewCard formValues={formValues} restrictions={restrictions} plans={[plan]} />);
  expect(screen.getAllByText('1.200').length).toBeGreaterThan(0);
});

it('shows dashes for total when no plan is selected', () => {
  const noplan = { ...formValues, planId: null };
  render(<ClientPreviewCard formValues={noplan} restrictions={restrictions} plans={[plan]} />);
  expect(screen.getAllByText('—').length).toBeGreaterThan(0);
});

it('shows phone number', () => {
  render(<ClientPreviewCard formValues={formValues} restrictions={restrictions} plans={[plan]} />);
  expect(screen.getByText('70000000')).toBeInTheDocument();
});
