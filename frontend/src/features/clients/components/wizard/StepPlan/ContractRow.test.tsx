import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import type { NewClientFormValues } from '@/features/clients/types';
import { ContractRow } from './ContractRow';

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

function Wrapper({
  startDate = '',
  duration = 0,
  origen = 'Directo',
}: {
  startDate?: string;
  duration?: number;
  origen?: 'Directo' | 'Cita';
}) {
  const {
    register,
    control,
    formState: { errors },
  } = useForm<NewClientFormValues>({
    defaultValues: { contractDate: '2026-01-01', startDate, duration },
  });
  return (
    <ContractRow
      register={register}
      control={control}
      errors={errors}
      startDate={startDate}
      duration={duration}
      origen={origen}
    />
  );
}

it('renders the duration and contract-end-date fields', () => {
  render(<Wrapper />);
  expect(screen.getByLabelText(/duración/i)).toBeInTheDocument();
  expect(screen.getByText(/fin de contrato/i)).toBeInTheDocument();
});

it('shows dashes for contract end date when no start date or duration', () => {
  render(<Wrapper />);
  expect(screen.getByText('—')).toBeInTheDocument();
});

it('calculates and displays the contract end date from start date and duration', () => {
  render(<Wrapper startDate="2026-01-05" duration={20} />);
  expect(screen.queryByText('—')).not.toBeInTheDocument();
  const preview = document.getElementById('contractEndDatePreview');
  expect(preview?.textContent).toBeTruthy();
});

describe('fecha de inicio restriction for nutritionist-created clients', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-02-10T12:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not restrict fecha de inicio for the direct entry point', () => {
    render(<Wrapper origen="Directo" />);
    const input = screen.getByLabelText(/fecha de inicio/i);
    expect(input).toHaveAttribute('data-disabled', '');
  });

  it('disables dates before today+2 for the cita entry point', () => {
    render(<Wrapper origen="Cita" />);
    const input = screen.getByLabelText(/fecha de inicio/i);
    const disabled = JSON.parse(input.getAttribute('data-disabled')!);
    expect(new Date(disabled.before).toISOString().slice(0, 10)).toBe('2026-02-12');
  });
});
