import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActivePlanCard } from '@/features/clients/components/detail/ActivePlanCard';
import type { Subscription } from '@/features/clients/types';

const sub: Subscription = {
  id: '1',
  clientId: '42',
  planId: '1',
  contractDate: '2026-01-01',
  startDate: '2026-01-02',
  contractEndDate: '2026-03-01',
  duration: 40,
  price: 140,
  suspendedDates: [],
  finalizedAt: null,
  plan: {
    id: '1',
    name: 'Completo',
    price: 150,
    meals: ['breakfast', 'lunch'],
  },
};

const onUpdateBilling = jest.fn().mockResolvedValue(undefined);

beforeEach(() => jest.clearAllMocks());

it('renders plan name and total', () => {
  render(<ActivePlanCard sub={sub} onUpdateBilling={onUpdateBilling} />);
  expect(screen.getByText('Completo')).toBeInTheDocument();
  expect(screen.getAllByText('140')).toHaveLength(2); // header + grid row
});

it('formats prices over 1000 with a dot thousands separator', () => {
  const bigSub: Subscription = {
    ...sub,
    price: 1390,
    plan: { ...sub.plan, price: 1390 },
  };
  render(<ActivePlanCard sub={bigSub} onUpdateBilling={onUpdateBilling} />);
  expect(screen.getAllByText('1.390')).toHaveLength(3);
});

it('renders meal pills', () => {
  render(<ActivePlanCard sub={sub} onUpdateBilling={onUpdateBilling} />);
  expect(screen.getByText('Desayuno')).toBeInTheDocument();
  expect(screen.getByText('Almuerzo')).toBeInTheDocument();
});

it('shows the plan price, the gap against it and the total in read mode', () => {
  render(<ActivePlanCard sub={sub} onUpdateBilling={onUpdateBilling} />);
  expect(screen.getByText('150')).toBeInTheDocument();
  expect(screen.getByText('Descuento')).toBeInTheDocument();
  expect(screen.getByText('10')).toBeInTheDocument();
});

// A plan's price is quoted for 20 delivery days, so a longer contract legitimately costs more
// than the plan it came from — something the old discount-only model could not represent.
it('calls the gap a surcharge when the agreed price is above the plan price', () => {
  const longer: Subscription = { ...sub, price: 220, duration: 30 };
  render(<ActivePlanCard sub={longer} onUpdateBilling={onUpdateBilling} />);
  expect(screen.getByText('Recargo')).toBeInTheDocument();
  expect(screen.getByText('70')).toBeInTheDocument();
});

it('does not cap the price input at the plan price', () => {
  render(<ActivePlanCard sub={sub} onUpdateBilling={onUpdateBilling} />);
  fireEvent.click(screen.getByRole('button', { name: /editar/i }));
  expect(screen.getByDisplayValue('140')).not.toHaveAttribute('max');
});

it('opens edit form when pencil is clicked', () => {
  render(<ActivePlanCard sub={sub} onUpdateBilling={onUpdateBilling} />);
  fireEvent.click(screen.getByRole('button', { name: /editar/i }));
  expect(screen.getByDisplayValue('140')).toBeInTheDocument();
});

it('calls onUpdateBilling with the agreed price on save', async () => {
  render(<ActivePlanCard sub={sub} onUpdateBilling={onUpdateBilling} />);
  fireEvent.click(screen.getByRole('button', { name: /editar/i }));
  const input = screen.getByDisplayValue('140');
  fireEvent.change(input, { target: { value: '120' } });
  fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
  await waitFor(() => expect(onUpdateBilling).toHaveBeenCalledWith(120));
});

it('saves a price above the plan price rather than clamping it', async () => {
  render(<ActivePlanCard sub={sub} onUpdateBilling={onUpdateBilling} />);
  fireEvent.click(screen.getByRole('button', { name: /editar/i }));
  fireEvent.change(screen.getByDisplayValue('140'), { target: { value: '220' } });
  fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
  await waitFor(() => expect(onUpdateBilling).toHaveBeenCalledWith(220));
});

it('cancels edit without saving', () => {
  render(<ActivePlanCard sub={sub} onUpdateBilling={onUpdateBilling} />);
  fireEvent.click(screen.getByRole('button', { name: /editar/i }));
  fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
  expect(onUpdateBilling).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: /guardar/i })).not.toBeInTheDocument();
});

it('renders the salad toggle with an icon tile when the plan includes salad', () => {
  const subWithSalad: Subscription = { ...sub, plan: { ...sub.plan, meals: ['salad'] } };
  render(<ActivePlanCard sub={subWithSalad} onUpdateBilling={onUpdateBilling} />);
  const toggleLabel = screen.getByLabelText('Ensalada grande').closest('label')!;
  expect(toggleLabel.querySelector('svg')).toBeInTheDocument();
});

it('right-aligns the cancelar/guardar buttons', () => {
  render(<ActivePlanCard sub={sub} onUpdateBilling={onUpdateBilling} />);
  fireEvent.click(screen.getByRole('button', { name: /editar/i }));
  const cancelBtn = screen.getByRole('button', { name: /cancelar/i });
  expect(cancelBtn.parentElement).toHaveClass('justify-end');
});
