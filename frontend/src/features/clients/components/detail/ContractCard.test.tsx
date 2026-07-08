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
  expect(screen.getByText('25')).toBeInTheDocument();
  expect(screen.getByText('días hábiles')).toBeInTheDocument();
});

it('renders the delivered-of-duration counter', () => {
  render(<ContractCard sub={sub} remaining={25} onUpdateContract={onUpdateContract} />);
  // duration 40 - remaining 25 = 15 delivered
  expect(screen.getByText('15 de 40')).toBeInTheDocument();
  expect(screen.getByText('entregados')).toBeInTheDocument();
});

it('renders the progress bar fill proportional to delivered/duration', () => {
  render(<ContractCard sub={sub} remaining={25} onUpdateContract={onUpdateContract} />);
  // 15 / 40 = 37.5%
  expect(screen.getByTestId('contract-progress-fill')).toHaveStyle({ width: '37.5%' });
});

it('clamps the delivered counter to 0 when remaining exceeds duration', () => {
  render(<ContractCard sub={sub} remaining={999} onUpdateContract={onUpdateContract} />);
  expect(screen.getByText('0 de 40')).toBeInTheDocument();
  expect(screen.getByTestId('contract-progress-fill')).toHaveStyle({ width: '0%' });
});

it('renders Duración in the simplified field grid', () => {
  render(<ContractCard sub={sub} remaining={25} onUpdateContract={onUpdateContract} />);
  expect(screen.getByText('Duración')).toBeInTheDocument();
  expect(screen.getByText('40 días hábiles')).toBeInTheDocument();
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

it('preview end date includes suspended days offset', () => {
  const subWithSuspensions: Subscription = {
    ...sub,
    suspendedDates: ['2026-01-10', '2026-01-11'], // 2 suspensions
  };
  render(
    <ContractCard sub={subWithSuspensions} remaining={25} onUpdateContract={onUpdateContract} />,
  );
  fireEvent.click(screen.getByRole('button', { name: /editar/i }));

  // addBusinessDays('2026-01-05', 40 - 1 + 2) = addBusinessDays('2026-01-05', 41) = 2026-03-03
  expect(screen.getByText('03/03/2026')).toBeInTheDocument();
});

it('cancels edit without saving', () => {
  render(<ContractCard sub={sub} remaining={25} onUpdateContract={onUpdateContract} />);
  fireEvent.click(screen.getByRole('button', { name: /editar/i }));
  fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
  expect(onUpdateContract).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: /guardar/i })).not.toBeInTheDocument();
});
