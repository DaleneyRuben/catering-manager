import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EvaluationHistoryTable } from '@/features/evaluations/components/EvaluationHistoryTable';
import type { Appointment } from '@/features/evaluations/types';

const paidAppointment: Appointment = {
  id: '1',
  name: 'Julia Cuentas',
  phone: '76441120',
  date: '2026-06-12',
  time: '16:00',
  subscriptionId: '9',
  subscription: { paid: true },
  clientId: null,
};

const unpaidAppointment: Appointment = {
  id: '2',
  name: 'Carmen Tapia',
  phone: '70993312',
  date: '2026-06-15',
  time: '10:30',
  subscriptionId: '10',
  subscription: { paid: false },
  clientId: null,
};

const paginationProps = {
  total: 1,
  page: 1,
  limit: 25,
  onChangePage: jest.fn(),
  onChangeLimit: jest.fn(),
};

describe('EvaluationHistoryTable', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders a row per resolved appointment with name, initials, phone, date, and time', () => {
    render(<EvaluationHistoryTable appointments={[paidAppointment]} {...paginationProps} />);

    expect(screen.getByText('Julia Cuentas')).toBeInTheDocument();
    expect(screen.getByText('JC')).toBeInTheDocument();
    expect(screen.getByText('76441120')).toBeInTheDocument();
    expect(screen.getByText('12/06/2026')).toBeInTheDocument();
    expect(screen.getByText('16:00')).toBeInTheDocument();
  });

  it('shows a Pagado pill for a paid appointment', () => {
    render(<EvaluationHistoryTable appointments={[paidAppointment]} {...paginationProps} />);
    expect(screen.getByText('Pagado')).toBeInTheDocument();
  });

  it('shows a No pagado pill for an unpaid appointment', () => {
    render(<EvaluationHistoryTable appointments={[unpaidAppointment]} {...paginationProps} />);
    expect(screen.getByText('No pagado')).toBeInTheDocument();
  });

  it('renders no actions column', () => {
    render(<EvaluationHistoryTable appointments={[paidAppointment]} {...paginationProps} />);
    expect(screen.queryByRole('columnheader', { name: 'Acciones' })).not.toBeInTheDocument();
  });

  it('renders an empty state when there are no resolved appointments', () => {
    render(<EvaluationHistoryTable appointments={[]} {...paginationProps} total={0} />);
    expect(screen.getByText('Sin registros')).toBeInTheDocument();
    expect(
      screen.getByText('Las citas que resuelvas aparecerán acá con su estado de pago.'),
    ).toBeInTheDocument();
  });

  it('renders pagination controls when there are results', () => {
    render(
      <EvaluationHistoryTable appointments={[paidAppointment]} {...paginationProps} total={30} />,
    );
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeInTheDocument();
  });

  it('calls onChangePage when a pagination control is used', async () => {
    const onChangePage = jest.fn();
    render(
      <EvaluationHistoryTable
        appointments={[paidAppointment]}
        {...paginationProps}
        total={30}
        onChangePage={onChangePage}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(onChangePage).toHaveBeenCalledWith(2);
  });
});
