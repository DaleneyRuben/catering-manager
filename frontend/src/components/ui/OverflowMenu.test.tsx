import { render, screen, fireEvent } from '@testing-library/react';
import { OverflowMenu } from './OverflowMenu';

const items = [
  { label: 'Editar datos', onClick: jest.fn() },
  { label: 'Eliminar', onClick: jest.fn(), variant: 'alert' as const },
];

beforeEach(() => jest.clearAllMocks());

it('renders the trigger button', () => {
  render(<OverflowMenu items={items} />);
  expect(screen.getByRole('button', { name: /más acciones/i })).toBeInTheDocument();
});

it('menu is hidden by default', () => {
  render(<OverflowMenu items={items} />);
  expect(screen.queryByText('Editar datos')).not.toBeInTheDocument();
});

it('opens the menu on trigger click', () => {
  render(<OverflowMenu items={items} />);
  fireEvent.click(screen.getByRole('button', { name: /más acciones/i }));
  expect(screen.getByText('Editar datos')).toBeInTheDocument();
  expect(screen.getByText('Eliminar')).toBeInTheDocument();
});

it('calls onClick and closes the menu when an item is clicked', () => {
  render(<OverflowMenu items={items} />);
  fireEvent.click(screen.getByRole('button', { name: /más acciones/i }));
  fireEvent.click(screen.getByText('Editar datos'));
  expect(items[0].onClick).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Editar datos')).not.toBeInTheDocument();
});

it('applies alert text color to items with variant alert', () => {
  render(<OverflowMenu items={items} />);
  fireEvent.click(screen.getByRole('button', { name: /más acciones/i }));
  const deleteBtn = screen.getByText('Eliminar');
  expect(deleteBtn).toHaveClass('text-alert');
});

it('closes the menu when clicking outside', () => {
  render(
    <div>
      <OverflowMenu items={items} />
      <div data-testid="outside">outside</div>
    </div>,
  );
  fireEvent.click(screen.getByRole('button', { name: /más acciones/i }));
  expect(screen.getByText('Editar datos')).toBeInTheDocument();
  fireEvent.mouseDown(screen.getByTestId('outside'));
  expect(screen.queryByText('Editar datos')).not.toBeInTheDocument();
});
