import { render, screen } from '@testing-library/react';
import type { DeliveryCalendarMonth } from '@/features/clients/utils/deliveryCalendar';
import { DeliveryCalendarCard } from './DeliveryCalendarCard';

const sampleMonths: DeliveryCalendarMonth[] = [
  {
    label: 'Jun 2026',
    weeks: [
      [
        { date: '2026-06-22', status: 'out' },
        { date: '2026-06-23', status: 'delivered' },
        { date: '2026-06-24', status: 'suspended' },
        { date: '2026-06-25', status: 'pending' },
        null,
      ],
    ],
  },
];

function setup(overrides: Partial<React.ComponentProps<typeof DeliveryCalendarCard>> = {}) {
  render(
    <DeliveryCalendarCard
      rangeLabel="04/06/2026 → 01/07/2026"
      months={sampleMonths}
      deliveredCount={12}
      suspendedCount={2}
      showPendingLegend
      {...overrides}
    />,
  );
}

describe('DeliveryCalendarCard', () => {
  it('renders the header and the contract range', () => {
    setup();
    expect(screen.getByText('Calendario de entregas')).toBeInTheDocument();
    expect(screen.getByText('04/06/2026 → 01/07/2026')).toBeInTheDocument();
  });

  it('renders the delivered and suspended counts', () => {
    setup();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('entregas realizadas')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('días suspendidos')).toBeInTheDocument();
  });

  it('always shows the entregado and suspendido legend', () => {
    setup();
    expect(screen.getByText('Entregado')).toBeInTheDocument();
    expect(screen.getByText('Suspendido')).toBeInTheDocument();
  });

  it('shows the pendiente legend only when showPendingLegend is true', () => {
    setup({ showPendingLegend: false });
    expect(screen.queryByText('Pendiente')).not.toBeInTheDocument();

    setup({ showPendingLegend: true });
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('renders the month label and a cell per day with its status', () => {
    setup();
    expect(screen.getByText('Jun 2026')).toBeInTheDocument();

    const cells = screen.getAllByTestId('delivery-day-cell');
    expect(cells).toHaveLength(4);
    expect(cells.map((c) => c.dataset.status)).toEqual([
      'out',
      'delivered',
      'suspended',
      'pending',
    ]);
    expect(cells[1]).toHaveTextContent('23');
  });
});
