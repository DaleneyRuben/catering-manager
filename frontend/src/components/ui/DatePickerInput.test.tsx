import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DatePickerInput } from './DatePickerInput';

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

it('renders a text input with the default placeholder', () => {
  render(<DatePickerInput value="" onChange={jest.fn()} />);
  expect(screen.getByPlaceholderText('dd/mm/aaaa')).toBeInTheDocument();
});

it('shows the formatted date when a value is provided', () => {
  render(<DatePickerInput value="2026-06-15" onChange={jest.fn()} />);
  expect(screen.getByDisplayValue('15/06/2026')).toBeInTheDocument();
});

it('calls onChange with empty string when input is cleared', async () => {
  const onChange = jest.fn();
  render(<DatePickerInput value="2026-06-15" onChange={onChange} />);
  await userEvent.clear(screen.getByDisplayValue('15/06/2026'));
  expect(onChange).toHaveBeenCalledWith('');
});

it('calls onChange with ISO date when a complete date value is entered', () => {
  const onChange = jest.fn();
  render(<DatePickerInput value="" onChange={onChange} />);
  const input = screen.getByPlaceholderText('dd/mm/aaaa');
  fireEvent.change(input, { target: { value: '15/06/2026' } });
  expect(onChange).toHaveBeenCalledWith('2026-06-15');
});

it('opens the calendar popover when the calendar button is clicked', async () => {
  render(<DatePickerInput value="" onChange={jest.fn()} />);
  await userEvent.click(screen.getByRole('button'));
  expect(document.querySelector('[data-datepicker-portal]')).toBeInTheDocument();
});
