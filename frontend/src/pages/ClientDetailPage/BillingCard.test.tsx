import { render, screen } from '@testing-library/react';
import { BillingCard } from './BillingCard';

it('renders nit and business name when provided', () => {
  render(<BillingCard nit="900123456-7" businessName="Empresa SA" />);
  expect(screen.getByText('900123456-7')).toBeInTheDocument();
  expect(screen.getByText('Empresa SA')).toBeInTheDocument();
});

it('renders dashes when nit and businessName are null', () => {
  render(<BillingCard nit={null} businessName={null} />);
  const dashes = screen.getAllByText('—');
  expect(dashes).toHaveLength(2);
});

it('shows the facturación label', () => {
  render(<BillingCard nit={null} businessName={null} />);
  expect(screen.getByText(/facturación/i)).toBeInTheDocument();
});
