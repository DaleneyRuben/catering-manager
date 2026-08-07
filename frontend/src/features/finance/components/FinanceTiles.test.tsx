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

  it('labels the balance with its month', () => {
    setup();

    expect(screen.getByText('Agosto 2026')).toBeInTheDocument();
    expect(screen.getByText('55 movimientos')).toBeInTheDocument();
  });

  // The register records money that moved; nothing on it is owed, overdue or outstanding.
  it('never speaks of debt', () => {
    const { container } = setup({ balance: -4200 });

    expect(container.textContent).not.toMatch(/pendiente|saldo|deuda|vencid/i);
  });
});
