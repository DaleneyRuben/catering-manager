import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContractCard } from '@/features/clients/components/detail/ContractCard';
import type { Subscription } from '@/features/clients/types';

const sub: Subscription = {
  id: '1',
  clientId: '42',
  planId: '1',
  contractDate: '2026-01-01',
  startDate: '2026-01-05',
  contractEndDate: '2026-03-01',
  duration: 40,
  discount: 0,
  suspendedDates: [],
  finalizedAt: null,
  plan: {
    id: '1',
    name: 'Completo',
    price: 150,
    meals: ['breakfast'],
  },
};

const onUpdateContract = jest.fn().mockResolvedValue(undefined);

beforeEach(() => jest.clearAllMocks());

it('renders contract dates in read mode', () => {
  render(<ContractCard sub={sub} remaining={25} onUpdateContract={onUpdateContract} />);
  expect(screen.getByText('01/01/2026')).toBeInTheDocument(); // contractDate
  expect(screen.getByText('05/01/2026')).toBeInTheDocument(); // startDate
  expect(screen.getByText('01/03/2026')).toBeInTheDocument(); // contractEndDate
});

it('renders remaining days', () => {
  render(<ContractCard sub={sub} remaining={25} onUpdateContract={onUpdateContract} />);
  expect(screen.getByText(/25 d\. hábiles/i)).toBeInTheDocument();
});

it('opens edit form when pencil is clicked', () => {
  render(<ContractCard sub={sub} remaining={25} onUpdateContract={onUpdateContract} />);
  fireEvent.click(screen.getByRole('button', { name: /editar/i }));
  expect(screen.getByText(/duración/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
});

it('calls onUpdateContract with correct values on save', async () => {
  render(<ContractCard sub={sub} remaining={25} onUpdateContract={onUpdateContract} />);
  fireEvent.click(screen.getByRole('button', { name: /editar/i }));
  fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
  await waitFor(() =>
    expect(onUpdateContract).toHaveBeenCalledWith({
      contractDate: '2026-01-01',
      startDate: '2026-01-05',
      duration: 40,
    }),
  );
});

it('cancels edit without saving', () => {
  render(<ContractCard sub={sub} remaining={25} onUpdateContract={onUpdateContract} />);
  fireEvent.click(screen.getByRole('button', { name: /editar/i }));
  fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
  expect(onUpdateContract).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: /guardar/i })).not.toBeInTheDocument();
});
