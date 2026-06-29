import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BillingRow } from './BillingRow';

it('shows dashes when price is undefined', () => {
  render(<BillingRow setValue={jest.fn()} price={undefined} discount={0} />);
  expect(screen.getAllByText('—').length).toBeGreaterThan(0);
});

it('shows the base plan price when price is set', () => {
  render(<BillingRow setValue={jest.fn()} price={1200} discount={0} />);
  expect(screen.getByText('1.200', { selector: '#base-price' })).toBeInTheDocument();
});

it('client price input defaults to price minus discount', () => {
  render(<BillingRow setValue={jest.fn()} price={1200} discount={100} />);
  expect(screen.getByLabelText(/precio final/i)).toHaveValue(1100);
});

it('calls setValue with computed discount when client price changes', async () => {
  const setValue = jest.fn();
  render(<BillingRow setValue={setValue} price={1200} discount={0} />);
  await userEvent.clear(screen.getByLabelText(/precio final/i));
  await userEvent.type(screen.getByLabelText(/precio final/i), '1100');
  expect(setValue).toHaveBeenCalledWith('discount', 100);
});
