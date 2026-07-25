import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimePickerInput } from './TimePickerInput';

beforeEach(() => {
  jest.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    right: 100,
    bottom: 50,
    top: 0,
    width: 100,
    height: 50,
    x: 0,
    y: 0,
    toJSON: jest.fn(),
  });
});

afterEach(() => jest.restoreAllMocks());

it('shows the default placeholder when empty', () => {
  render(<TimePickerInput value="" onChange={jest.fn()} />);
  expect(screen.getByRole('button', { name: /--:-- --/ })).toBeInTheDocument();
});

it('shows the formatted AM time when a morning value is provided', () => {
  render(<TimePickerInput value="09:00" onChange={jest.fn()} />);
  expect(screen.getByRole('button', { name: '09:00 AM' })).toBeInTheDocument();
});

it('shows the formatted PM time when an afternoon value is provided', () => {
  render(<TimePickerInput value="14:30" onChange={jest.fn()} />);
  expect(screen.getByRole('button', { name: '02:30 PM' })).toBeInTheDocument();
});

it('opens the popover with Hora/Min/AM-PM columns when the trigger is clicked', async () => {
  render(<TimePickerInput value="" onChange={jest.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: /--:-- --/ }));
  expect(document.querySelector('[data-timepicker-portal]')).toBeInTheDocument();
  expect(screen.getByText('Hora')).toBeInTheDocument();
  expect(screen.getByText('Min')).toBeInTheDocument();
  expect(screen.getByText('AM/PM')).toBeInTheDocument();
});

it('marks the hour, minute and meridiem matching the current value as selected', async () => {
  render(<TimePickerInput value="09:45" onChange={jest.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: '09:45 AM' }));
  expect(screen.getByRole('button', { name: '09' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: '45' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'AM' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'PM' })).toHaveAttribute('aria-pressed', 'false');
});

it('calls onChange with a default minute and AM when only an hour is picked on an empty value', async () => {
  const onChange = jest.fn();
  render(<TimePickerInput value="" onChange={onChange} />);
  await userEvent.click(screen.getByRole('button', { name: /--:-- --/ }));
  await userEvent.click(screen.getByRole('button', { name: '09' }));
  expect(onChange).toHaveBeenCalledWith('09:00');
});

it('calls onChange preserving the existing minute and meridiem when the hour changes', async () => {
  const onChange = jest.fn();
  render(<TimePickerInput value="14:30" onChange={onChange} />);
  await userEvent.click(screen.getByRole('button', { name: '02:30 PM' }));
  await userEvent.click(screen.getByRole('button', { name: '09' }));
  expect(onChange).toHaveBeenCalledWith('21:30');
});

it('calls onChange when a minute is picked', async () => {
  const onChange = jest.fn();
  render(<TimePickerInput value="09:00" onChange={onChange} />);
  await userEvent.click(screen.getByRole('button', { name: '09:00 AM' }));
  await userEvent.click(screen.getByRole('button', { name: '45' }));
  expect(onChange).toHaveBeenCalledWith('09:45');
});

it('calls onChange when a meridiem is picked', async () => {
  const onChange = jest.fn();
  render(<TimePickerInput value="09:00" onChange={onChange} />);
  await userEvent.click(screen.getByRole('button', { name: '09:00 AM' }));
  await userEvent.click(screen.getByRole('button', { name: 'PM' }));
  expect(onChange).toHaveBeenCalledWith('21:00');
});

it('calls onChange with an empty string when Limpiar is clicked', async () => {
  const onChange = jest.fn();
  render(<TimePickerInput value="09:00" onChange={onChange} />);
  await userEvent.click(screen.getByRole('button', { name: '09:00 AM' }));
  await userEvent.click(screen.getByRole('button', { name: 'Limpiar' }));
  expect(onChange).toHaveBeenCalledWith('');
});

it('closes the popover when Listo is clicked', async () => {
  render(<TimePickerInput value="09:00" onChange={jest.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: '09:00 AM' }));
  await userEvent.click(screen.getByRole('button', { name: 'Listo' }));
  expect(document.querySelector('[data-timepicker-portal]')).not.toBeInTheDocument();
});

it('closes the popover on Escape', async () => {
  render(<TimePickerInput value="09:00" onChange={jest.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: '09:00 AM' }));
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(document.querySelector('[data-timepicker-portal]')).not.toBeInTheDocument();
});

it('closes the popover when clicking outside', async () => {
  render(<TimePickerInput value="09:00" onChange={jest.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: '09:00 AM' }));
  fireEvent.mouseDown(document.body);
  expect(document.querySelector('[data-timepicker-portal]')).not.toBeInTheDocument();
});

it('applies the given id to the trigger button', () => {
  render(<TimePickerInput id="am-time" value="" onChange={jest.fn()} />);
  expect(screen.getByRole('button', { name: /--:-- --/ })).toHaveAttribute('id', 'am-time');
});
