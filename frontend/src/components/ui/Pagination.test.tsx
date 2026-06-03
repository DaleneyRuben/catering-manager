import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from './Pagination';

const noop = () => {};

describe('Pagination', () => {
  it('renders a limit selector with options 10, 25 and 50', () => {
    render(<Pagination page={1} total={30} limit={25} onChange={noop} onLimitChange={noop} />);
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '10' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '25' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '50' })).toBeInTheDocument();
  });

  it('calls onLimitChange with the selected value when limit changes', async () => {
    const onLimitChange = jest.fn();
    render(
      <Pagination page={1} total={30} limit={25} onChange={noop} onLimitChange={onLimitChange} />,
    );
    await userEvent.selectOptions(screen.getByRole('combobox'), '10');
    expect(onLimitChange).toHaveBeenCalledWith(10);
  });

  it('reflects the current limit as the selected option', () => {
    render(<Pagination page={1} total={30} limit={50} onChange={noop} onLimitChange={noop} />);
    expect(screen.getByRole('combobox')).toHaveValue('50');
  });
});
