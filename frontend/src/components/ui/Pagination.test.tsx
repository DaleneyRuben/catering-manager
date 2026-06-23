import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from './Pagination';

const noop = () => {};

describe('Pagination', () => {
  it('renders a pill button for each limit option', () => {
    render(<Pagination page={1} total={30} limit={25} onChange={noop} onLimitChange={noop} />);
    expect(screen.getByRole('button', { name: '10' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '25' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '50' })).toBeInTheDocument();
  });

  it('calls onLimitChange with the selected value when a pill is clicked', async () => {
    const onLimitChange = jest.fn();
    render(
      <Pagination page={1} total={30} limit={25} onChange={noop} onLimitChange={onLimitChange} />,
    );
    await userEvent.click(screen.getByRole('button', { name: '10' }));
    expect(onLimitChange).toHaveBeenCalledWith(10);
  });

  it('highlights the current limit pill', () => {
    render(<Pagination page={1} total={30} limit={50} onChange={noop} onLimitChange={noop} />);
    expect(screen.getByRole('button', { name: '50' }).className).toContain('bg-olive-100');
  });
});
