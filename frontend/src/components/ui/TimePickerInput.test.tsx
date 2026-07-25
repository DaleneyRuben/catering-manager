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
  expect(screen.getByPlaceholderText('--:-- --')).toBeInTheDocument();
});

it('shows the formatted AM time when a morning value is provided', () => {
  render(<TimePickerInput value="09:00" onChange={jest.fn()} />);
  expect(screen.getByDisplayValue('09:00 AM')).toBeInTheDocument();
});

it('shows the formatted PM time when an afternoon value is provided', () => {
  render(<TimePickerInput value="14:30" onChange={jest.fn()} />);
  expect(screen.getByDisplayValue('02:30 PM')).toBeInTheDocument();
});

it('opens the popover with Hora/Min/AM-PM columns when the clock button is clicked', async () => {
  render(<TimePickerInput value="" onChange={jest.fn()} />);
  await userEvent.click(screen.getByRole('button'));
  expect(document.querySelector('[data-timepicker-portal]')).toBeInTheDocument();
  expect(screen.getByText('Hora')).toBeInTheDocument();
  expect(screen.getByText('Min')).toBeInTheDocument();
  expect(screen.getByText('AM/PM')).toBeInTheDocument();
});

it('marks the hour, minute and meridiem matching the current value as selected', async () => {
  render(<TimePickerInput value="09:45" onChange={jest.fn()} />);
  await userEvent.click(screen.getByRole('button'));
  expect(screen.getByRole('button', { name: '09' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: '45' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'AM' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'PM' })).toHaveAttribute('aria-pressed', 'false');
});

it('calls onChange with a default minute and AM when only an hour is picked on an empty value', async () => {
  const onChange = jest.fn();
  render(<TimePickerInput value="" onChange={onChange} />);
  await userEvent.click(screen.getByRole('button'));
  await userEvent.click(screen.getByRole('button', { name: '09' }));
  expect(onChange).toHaveBeenCalledWith('09:00');
});

it('calls onChange preserving the existing minute and meridiem when the hour changes', async () => {
  const onChange = jest.fn();
  render(<TimePickerInput value="14:30" onChange={onChange} />);
  await userEvent.click(screen.getByRole('button'));
  await userEvent.click(screen.getByRole('button', { name: '09' }));
  expect(onChange).toHaveBeenCalledWith('21:30');
});

it('calls onChange when a minute is picked', async () => {
  const onChange = jest.fn();
  render(<TimePickerInput value="09:00" onChange={onChange} />);
  await userEvent.click(screen.getByRole('button'));
  await userEvent.click(screen.getByRole('button', { name: '45' }));
  expect(onChange).toHaveBeenCalledWith('09:45');
});

it('calls onChange when a meridiem is picked', async () => {
  const onChange = jest.fn();
  render(<TimePickerInput value="09:00" onChange={onChange} />);
  await userEvent.click(screen.getByRole('button'));
  await userEvent.click(screen.getByRole('button', { name: 'PM' }));
  expect(onChange).toHaveBeenCalledWith('21:00');
});

it('calls onChange with an empty string when Limpiar is clicked', async () => {
  const onChange = jest.fn();
  render(<TimePickerInput value="09:00" onChange={onChange} />);
  await userEvent.click(screen.getByRole('button'));
  await userEvent.click(screen.getByRole('button', { name: 'Limpiar' }));
  expect(onChange).toHaveBeenCalledWith('');
});

it('closes the popover when Listo is clicked', async () => {
  render(<TimePickerInput value="09:00" onChange={jest.fn()} />);
  await userEvent.click(screen.getByRole('button'));
  await userEvent.click(screen.getByRole('button', { name: 'Listo' }));
  expect(document.querySelector('[data-timepicker-portal]')).not.toBeInTheDocument();
});

it('closes the popover on Escape', async () => {
  render(<TimePickerInput value="09:00" onChange={jest.fn()} />);
  await userEvent.click(screen.getByRole('button'));
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(document.querySelector('[data-timepicker-portal]')).not.toBeInTheDocument();
});

it('closes the popover when clicking outside', async () => {
  render(<TimePickerInput value="09:00" onChange={jest.fn()} />);
  await userEvent.click(screen.getByRole('button'));
  fireEvent.mouseDown(document.body);
  expect(document.querySelector('[data-timepicker-portal]')).not.toBeInTheDocument();
});

it('applies the given id to the text input', () => {
  render(<TimePickerInput id="am-time" value="" onChange={jest.fn()} />);
  expect(screen.getByPlaceholderText('--:-- --')).toHaveAttribute('id', 'am-time');
});

it('calls onChange with the 24h value when a complete AM time is typed', () => {
  const onChange = jest.fn();
  render(<TimePickerInput value="" onChange={onChange} />);
  fireEvent.change(screen.getByPlaceholderText('--:-- --'), { target: { value: '09:00 AM' } });
  expect(onChange).toHaveBeenCalledWith('09:00');
});

it('calls onChange with the 24h value when a complete PM time is typed', () => {
  const onChange = jest.fn();
  render(<TimePickerInput value="" onChange={onChange} />);
  fireEvent.change(screen.getByPlaceholderText('--:-- --'), { target: { value: '02:30 PM' } });
  expect(onChange).toHaveBeenCalledWith('14:30');
});

it('does not call onChange while a typed time is still incomplete', () => {
  const onChange = jest.fn();
  render(<TimePickerInput value="" onChange={onChange} />);
  fireEvent.change(screen.getByPlaceholderText('--:-- --'), { target: { value: '09:00' } });
  expect(onChange).not.toHaveBeenCalled();
});

it('reverts to the last valid value when an invalid typed time is blurred', () => {
  const onChange = jest.fn();
  render(<TimePickerInput value="09:00" onChange={onChange} />);
  const input = screen.getByDisplayValue('09:00 AM');
  fireEvent.change(input, { target: { value: 'zz:zz zz' } });
  fireEvent.blur(input);
  expect(onChange).not.toHaveBeenCalled();
  expect(screen.getByDisplayValue('09:00 AM')).toBeInTheDocument();
});

it('calls onChange with empty string when the input is cleared', async () => {
  const onChange = jest.fn();
  render(<TimePickerInput value="09:00" onChange={onChange} />);
  await userEvent.clear(screen.getByDisplayValue('09:00 AM'));
  expect(onChange).toHaveBeenCalledWith('');
});
