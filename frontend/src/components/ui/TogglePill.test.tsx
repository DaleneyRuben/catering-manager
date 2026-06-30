import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TogglePill } from '@ui/TogglePill';

it('renders label text', () => {
  render(
    <TogglePill pressed={false} onClick={jest.fn()}>
      Diabetes
    </TogglePill>,
  );
  expect(screen.getByRole('button', { name: 'Diabetes' })).toBeInTheDocument();
});

it('sets aria-pressed=false when not pressed', () => {
  render(
    <TogglePill pressed={false} onClick={jest.fn()}>
      Diabetes
    </TogglePill>,
  );
  expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
});

it('sets aria-pressed=true when pressed', () => {
  render(
    <TogglePill pressed onClick={jest.fn()}>
      Diabetes
    </TogglePill>,
  );
  expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
});

it('applies selected classes when pressed', () => {
  render(
    <TogglePill pressed onClick={jest.fn()}>
      Diabetes
    </TogglePill>,
  );
  expect(screen.getByRole('button')).toHaveClass('bg-olive-100', 'text-olive-700');
});

it('applies unselected classes when not pressed', () => {
  render(
    <TogglePill pressed={false} onClick={jest.fn()}>
      Diabetes
    </TogglePill>,
  );
  expect(screen.getByRole('button')).toHaveClass('text-muted');
  expect(screen.getByRole('button')).not.toHaveClass('bg-olive-100');
});

it('calls onClick when clicked', async () => {
  const onClick = jest.fn();
  render(
    <TogglePill pressed={false} onClick={onClick}>
      Diabetes
    </TogglePill>,
  );
  await userEvent.click(screen.getByRole('button'));
  expect(onClick).toHaveBeenCalledTimes(1);
});

it('forwards className for sizing', () => {
  render(
    <TogglePill pressed={false} onClick={jest.fn()} className="py-[7px] px-[15px]">
      Diabetes
    </TogglePill>,
  );
  expect(screen.getByRole('button')).toHaveClass('py-[7px]', 'px-[15px]');
});
