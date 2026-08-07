import { render, screen, fireEvent } from '@testing-library/react';
import { OverflowMenu } from '@ui/OverflowMenu';

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

it('applies danger text color to items with variant alert', () => {
  render(<OverflowMenu items={items} />);
  fireEvent.click(screen.getByRole('button', { name: /más acciones/i }));
  const deleteBtn = screen.getByText('Eliminar');
  expect(deleteBtn).toHaveClass('text-danger');
});

it('takes a label of its own when "más acciones" would not say which row', () => {
  render(<OverflowMenu items={items} label="Acciones del gasto" />);
  expect(screen.getByRole('button', { name: 'Acciones del gasto' })).toBeInTheDocument();
});

// A bordered 38px trigger reads as a control in a page header and as clutter once it repeats on
// every row of a list, so the bare variant drops the border and shrinks to 28px.
it('drops the border and shrinks in the bare variant', () => {
  render(<OverflowMenu items={items} variant="bare" />);
  const trigger = screen.getByRole('button', { name: /más acciones/i });
  // Written in px, not in Tailwind's rem scale: the app's root font-size is 14px, so w-7 renders
  // 24.5px and the trigger quietly comes out under the size the design calls for.
  expect(trigger).toHaveClass('w-[28px]', 'h-[28px]');
  expect(trigger).not.toHaveClass('border');
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
