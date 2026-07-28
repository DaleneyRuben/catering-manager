import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AssignStartDateModal } from './AssignStartDateModal';

jest.mock('@ui/DatePickerInput', () => ({
  DatePickerInput: ({
    id,
    value,
    onChange,
    disabled,
  }: {
    id?: string;
    value: string;
    onChange: (v: string) => void;
    disabled?: unknown;
  }) => (
    <input
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      data-disabled={disabled ? JSON.stringify(disabled) : ''}
    />
  ),
}));

const baseProps = {
  clientName: 'Ana Torres',
  planName: 'Completo',
  duration: 20,
  onClose: jest.fn(),
  onAssign: jest.fn().mockResolvedValue(undefined),
};

beforeEach(() => jest.clearAllMocks());

it('keeps the confirm action disabled until a date is chosen', () => {
  render(<AssignStartDateModal {...baseProps} />);

  expect(screen.getByRole('button', { name: /asignar fecha/i })).toBeDisabled();
});

it('assigns the chosen start date', async () => {
  const onAssign = jest.fn().mockResolvedValue(undefined);
  render(<AssignStartDateModal {...baseProps} onAssign={onAssign} />);

  await userEvent.type(screen.getByLabelText(/fecha de inicio/i), '2026-08-03');
  await userEvent.click(screen.getByRole('button', { name: /asignar fecha/i }));

  expect(onAssign).toHaveBeenCalledWith('2026-08-03');
});

it('rejects a weekend start date', async () => {
  const onAssign = jest.fn().mockResolvedValue(undefined);
  render(<AssignStartDateModal {...baseProps} onAssign={onAssign} />);

  await userEvent.type(screen.getByLabelText(/fecha de inicio/i), '2026-08-01');
  await userEvent.click(screen.getByRole('button', { name: /asignar fecha/i }));

  expect(onAssign).not.toHaveBeenCalled();
  expect(screen.getByText(/día hábil/i)).toBeInTheDocument();
});

it('shows the plan and duration of the renewal being scheduled', () => {
  render(<AssignStartDateModal {...baseProps} />);

  expect(screen.getByText(/Completo · 20 días hábiles/)).toBeInTheDocument();
});

it('closes without assigning', async () => {
  const onClose = jest.fn();
  render(<AssignStartDateModal {...baseProps} onClose={onClose} />);

  await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));

  expect(onClose).toHaveBeenCalled();
});
