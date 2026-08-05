import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BillingRow } from './BillingRow';

it('shows dashes when the plan price is undefined', () => {
  render(<BillingRow setValue={jest.fn()} planPrice={undefined} price={0} />);
  expect(screen.getAllByText('—').length).toBeGreaterThan(0);
});

it('shows the base plan price when it is set', () => {
  render(<BillingRow setValue={jest.fn()} planPrice={1200} price={1200} />);
  expect(screen.getByText('1.200', { selector: '#base-price' })).toBeInTheDocument();
});

it('shows the agreed price in the input', () => {
  render(<BillingRow setValue={jest.fn()} planPrice={1200} price={1100} />);
  expect(screen.getByLabelText(/precio final/i)).toHaveValue(1100);
});

it('reports the agreed price as the client types it', async () => {
  const setValue = jest.fn();
  render(<BillingRow setValue={setValue} planPrice={1200} price={1200} />);
  await userEvent.clear(screen.getByLabelText(/precio final/i));
  await userEvent.type(screen.getByLabelText(/precio final/i), '1100');
  expect(setValue).toHaveBeenCalledWith('price', 1100);
});

it('labels the gap a discount when the client pays under the plan price', () => {
  render(<BillingRow setValue={jest.fn()} planPrice={1200} price={1100} />);
  expect(screen.getByText(/descuento/i)).toBeInTheDocument();
  expect(screen.getByText('100', { selector: '#price-gap' })).toBeInTheDocument();
});

// A plan's price is quoted for 20 delivery days, so a longer contract legitimately costs more.
// The old model could not express this: the input was capped at the plan price.
it('labels the gap a surcharge when a longer contract costs more than the plan', () => {
  render(<BillingRow setValue={jest.fn()} planPrice={1200} price={1800} />);
  expect(screen.getByText(/recargo/i)).toBeInTheDocument();
  expect(screen.getByText('600', { selector: '#price-gap' })).toBeInTheDocument();
});

it('does not cap the price input at the plan price', () => {
  render(<BillingRow setValue={jest.fn()} planPrice={1200} price={1200} />);
  expect(screen.getByLabelText(/precio final/i)).not.toHaveAttribute('max');
});
