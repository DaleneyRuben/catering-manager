import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('renders with the given aria-label', () => {
    render(<IconButton icon="x" label="Cerrar" onClick={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = jest.fn();
    render(<IconButton icon="x" label="Cerrar" onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is set', () => {
    render(<IconButton icon="x" label="Cerrar" onClick={jest.fn()} disabled />);
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeDisabled();
  });

  it('has type button by default', () => {
    render(<IconButton icon="x" label="Cerrar" onClick={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveAttribute('type', 'button');
  });

  it('applies extra className', () => {
    render(<IconButton icon="x" label="Cerrar" onClick={jest.fn()} className="text-faint" />);
    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveClass('text-faint');
  });
});
