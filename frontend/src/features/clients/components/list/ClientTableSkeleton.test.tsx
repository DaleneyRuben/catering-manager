import { render, screen } from '@testing-library/react';
import { ClientTableSkeleton } from './ClientTableSkeleton';

it('renders column headers', () => {
  render(<ClientTableSkeleton />);
  expect(screen.getByText('Cliente')).toBeInTheDocument();
  expect(screen.getByText('Plan')).toBeInTheDocument();
  expect(screen.getByText('Estado')).toBeInTheDocument();
});
