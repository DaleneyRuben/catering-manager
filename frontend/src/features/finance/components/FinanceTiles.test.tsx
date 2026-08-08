import { render, screen } from '@testing-library/react';
import { FinanceTiles } from '@/features/finance/components/FinanceTiles';

const setup = (props: Partial<React.ComponentProps<typeof FinanceTiles>> = {}) =>
  render(
    <FinanceTiles
      income={34800}
      expenses={21450}
      balance={13350}
      month="2026-08"
      incomeCount={24}
      expenseCount={31}
      {...props}
    />,
  );

describe('FinanceTiles', () => {
  it('shows the three totals', () => {
    setup();

    expect(screen.getByText('34.800')).toBeInTheDocument();
    expect(screen.getByText('21.450')).toBeInTheDocument();
    expect(screen.getByText('+13.350')).toBeInTheDocument();
  });

  it('marks a negative balance with a minus rather than a parenthesis', () => {
    setup({ balance: -4200 });

    expect(screen.getByText('−4.200')).toBeInTheDocument();
  });

  it('counts the movements behind each total', () => {
    setup();

    expect(screen.getByText('24 pagos')).toBeInTheDocument();
    expect(screen.getByText('31 gastos')).toBeInTheDocument();
  });

  it('uses the singular for a single movement', () => {
    setup({ incomeCount: 1, expenseCount: 1 });

    expect(screen.getByText('1 pago')).toBeInTheDocument();
    expect(screen.getByText('1 gasto')).toBeInTheDocument();
  });

  // A month with one row read "1 movimientos" — the count beside the balance was the one caption
  // not going through the plural helper.
  it('counts a lone movement in the singular beside the balance', () => {
    setup({ incomeCount: 0, expenseCount: 1 });

    expect(screen.getByText('1 movimiento')).toBeInTheDocument();
  });

  it('labels the balance with its month', () => {
    setup();

    expect(screen.getByText('Agosto 2026')).toBeInTheDocument();
    expect(screen.getByText('55 movimientos')).toBeInTheDocument();
  });

  // On the month still running the balance is a running total, so it says how far it counts.
  it('dates the balance on an open month', () => {
    setup({ asOf: '2026-08-03' });

    expect(screen.getByText('Al 3 de agosto')).toBeInTheDocument();
  });

  // Absent entirely on a closed month — a settled total needs no cut-off, and a marker that only
  // ever turns off would invite reading the month as unfinished.
  it('leaves the date off a closed month', () => {
    setup();

    expect(screen.queryByText(/^Al /)).not.toBeInTheDocument();
  });

  // Below 900px the three tiles stack and the balance drops a size: consulting the register on a
  // phone is the target, recording a gasto on one is not (business-rules.md → Finanzas).
  describe('below the compact breakpoint', () => {
    it('stacks the tiles into one column', () => {
      setup();

      expect(screen.getByTestId('finance-tiles')).toHaveClass('max-compact:grid-cols-1');
    });

    it('shrinks the balance so it fits a narrow column', () => {
      setup();

      expect(screen.getByText('+13.350')).toHaveClass('max-compact:text-[46px]');
    });
  });

  // The register records money that moved; nothing on it is owed, overdue or outstanding.
  it('never speaks of debt', () => {
    const { container } = setup({ balance: -4200 });

    expect(container.textContent).not.toMatch(/pendiente|saldo|deuda|vencid/i);
  });
});
