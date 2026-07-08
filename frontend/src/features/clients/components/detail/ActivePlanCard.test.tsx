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
  discount: 10,
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
  expect(screen.getAllByText('140')).toHaveLength(2); // header + grid row (150 - 10)
});

it('formats prices over 1000 with a dot thousands separator', () => {
  const bigSub: Subscription = {
    ...sub,
    discount: 0,
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

it('shows price/discount/total in read mode', () => {
  render(<ActivePlanCard sub={sub} onUpdateBilling={onUpdateBilling} />);
  expect(screen.getByText('150')).toBeInTheDocument();
  expect(screen.getByText('10')).toBeInTheDocument();
});

it('opens edit form when pencil is clicked', () => {
  render(<ActivePlanCard sub={sub} onUpdateBilling={onUpdateBilling} />);
  fireEvent.click(screen.getByRole('button', { name: /editar/i }));
  expect(screen.getByDisplayValue('140')).toBeInTheDocument();
});

it('calls onUpdateBilling with derived discount on save', async () => {
  render(<ActivePlanCard sub={sub} onUpdateBilling={onUpdateBilling} />);
  fireEvent.click(screen.getByRole('button', { name: /editar/i }));
  const input = screen.getByDisplayValue('140');
  fireEvent.change(input, { target: { value: '120' } });
  fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
  await waitFor(() => expect(onUpdateBilling).toHaveBeenCalledWith(30)); // 150 - 120 = 30
});

it('cancels edit without saving', () => {
  render(<ActivePlanCard sub={sub} onUpdateBilling={onUpdateBilling} />);
  fireEvent.click(screen.getByRole('button', { name: /editar/i }));
  fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
  expect(onUpdateBilling).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: /guardar/i })).not.toBeInTheDocument();
});

it('right-aligns the cancelar/guardar buttons', () => {
  render(<ActivePlanCard sub={sub} onUpdateBilling={onUpdateBilling} />);
  fireEvent.click(screen.getByRole('button', { name: /editar/i }));
  const cancelBtn = screen.getByRole('button', { name: /cancelar/i });
  expect(cancelBtn.parentElement).toHaveClass('justify-end');
});
