import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContractSummaryCard } from './ContractSummaryCard';

function setup(onSuspend = jest.fn()) {
  render(
    <ContractSummaryCard
      rangeLabel="04/06/2026 → 01/07/2026"
      deliveredCount={12}
      suspendedCount={2}
      onSuspend={onSuspend}
    />,
  );
  return { onSuspend };
}

describe('ContractSummaryCard', () => {
  it('renders the section label and contract range', () => {
    setup();
    expect(screen.getByText('Resumen del contrato')).toBeInTheDocument();
    expect(screen.getByText('04/06/2026 → 01/07/2026')).toBeInTheDocument();
  });

  it('renders the delivered and suspended counts with their labels', () => {
    setup();
    expect(screen.getByText('Entregas realizadas')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Días suspendidos')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('calls onSuspend when the button is clicked', async () => {
    const { onSuspend } = setup();
    await userEvent.click(screen.getByRole('button', { name: /suspender días/i }));
    expect(onSuspend).toHaveBeenCalled();
  });
});
