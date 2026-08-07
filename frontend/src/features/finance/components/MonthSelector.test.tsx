import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MonthSelector } from '@/features/finance/components/MonthSelector';

const setup = (props: Partial<React.ComponentProps<typeof MonthSelector>> = {}) => {
  const onChange = jest.fn();
  render(
    <MonthSelector
      month="2026-08"
      earliestMonth="2026-07"
      currentMonth="2026-09"
      onChange={onChange}
      {...props}
    />,
  );
  return { onChange };
};

describe('MonthSelector', () => {
  it('shows the selected month in Spanish', () => {
    setup();

    expect(screen.getByText('Agosto 2026')).toBeInTheDocument();
  });

  it('pages backwards', async () => {
    const { onChange } = setup();

    await userEvent.click(screen.getByRole('button', { name: /mes anterior/i }));

    expect(onChange).toHaveBeenCalledWith('2026-07');
  });

  it('pages forwards', async () => {
    const { onChange } = setup();

    await userEvent.click(screen.getByRole('button', { name: /mes siguiente/i }));

    expect(onChange).toHaveBeenCalledWith('2026-09');
  });

  // There is no data before the register went live and no backfill, so paging further back would
  // show empty months that read as months with no money.
  it('disables the back arrow at the earliest month', () => {
    setup({ month: '2026-07' });

    expect(screen.getByRole('button', { name: /mes anterior/i })).toBeDisabled();
  });

  it('disables the forward arrow at the current month', () => {
    setup({ month: '2026-09' });

    expect(screen.getByRole('button', { name: /mes siguiente/i })).toBeDisabled();
  });

  it('explains why the back arrow stops where it does', () => {
    setup({ month: '2026-07' });

    expect(screen.getByRole('button', { name: /mes anterior/i })).toHaveAttribute(
      'title',
      'El registro empieza en julio 2026',
    );
  });
});
