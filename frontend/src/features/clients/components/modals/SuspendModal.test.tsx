import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Subscription } from '@/features/clients/types';
import { SuspendModal } from './SuspendModal';

const sub: Subscription = {
  id: '1',
  clientId: '1',
  planId: '1',
  contractDate: '2026-01-01',
  startDate: '2026-01-05',
  contractEndDate: '2026-03-31',
  duration: 40,
  discount: 0,
  suspendedDates: [],
  finalizedAt: null,
  specialInstructions: {},
  plan: { id: '1', name: 'Completo', price: 1200, meals: ['breakfast'] },
};

it('shows the client name', () => {
  render(<SuspendModal sub={sub} clientName="Ana Torres" onClose={jest.fn()} onSave={jest.fn()} />);
  expect(screen.getByText(/Ana Torres/)).toBeInTheDocument();
});

it('renders the Mon-Fri weekday headers', () => {
  render(<SuspendModal sub={sub} clientName="Ana Torres" onClose={jest.fn()} onSave={jest.fn()} />);
  expect(screen.getByText('LUN')).toBeInTheDocument();
  expect(screen.getByText('VIE')).toBeInTheDocument();
});

it('shows the empty state message when no dates are selected', () => {
  render(<SuspendModal sub={sub} clientName="Ana Torres" onClose={jest.fn()} onSave={jest.fn()} />);
  expect(screen.getByText(/hacé clic en un día/i)).toBeInTheDocument();
});

it('calls onClose when the close button is clicked', async () => {
  const onClose = jest.fn();
  render(<SuspendModal sub={sub} clientName="Ana Torres" onClose={onClose} onSave={jest.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: /cerrar/i }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

it('calls onClose when the cancel button is clicked', async () => {
  const onClose = jest.fn();
  render(<SuspendModal sub={sub} clientName="Ana Torres" onClose={onClose} onSave={jest.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

it('shows month navigation buttons', () => {
  render(<SuspendModal sub={sub} clientName="Ana Torres" onClose={jest.fn()} onSave={jest.fn()} />);
  expect(screen.getByRole('button', { name: /mes anterior/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /mes siguiente/i })).toBeInTheDocument();
});

describe('today marker', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-02-10T12:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("marks only today's cell as today", () => {
    render(
      <SuspendModal sub={sub} clientName="Ana Torres" onClose={jest.fn()} onSave={jest.fn()} />,
    );
    const todayCells = screen.getAllByTestId('calendar-day-today');
    expect(todayCells).toHaveLength(1);
    expect(todayCells[0]).toHaveTextContent('10');
  });

  it('does not mark any cell as today when viewing a different month', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <SuspendModal sub={sub} clientName="Ana Torres" onClose={jest.fn()} onSave={jest.fn()} />,
    );
    await user.click(screen.getByRole('button', { name: /mes siguiente/i }));
    expect(screen.queryByTestId('calendar-day-today')).not.toBeInTheDocument();
  });
});
