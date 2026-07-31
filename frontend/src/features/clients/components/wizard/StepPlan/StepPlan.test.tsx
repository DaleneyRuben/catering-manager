import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import type { NewClientFormValues } from '@/features/clients/types';
import type { Plan } from '@/features/plans/types';
import { StepPlan } from './index';

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

const plans: Plan[] = [
  { id: '1', name: 'Completo', price: 1200, meals: ['breakfast', 'lunch'] },
  { id: '2', name: 'Ligero', price: 800, meals: ['lunch'] },
];

function Wrapper({
  availablePlans = plans,
  isLoading = false,
  origen,
}: {
  availablePlans?: Plan[];
  isLoading?: boolean;
  origen?: 'Directo' | 'Cita';
}) {
  const {
    register,
    control,
    formState: { errors },
    setValue,
  } = useForm<NewClientFormValues>({
    defaultValues: {
      planId: null,
      contractDate: '',
      startDate: '',
      duration: 0,
      discount: 0,
      specialInstructions: {},
    },
  });
  return (
    <StepPlan
      register={register}
      control={control}
      errors={errors}
      plans={availablePlans}
      setValue={setValue}
      isLoading={isLoading}
      origen={origen}
    />
  );
}

it('renders plan names from the plans prop', () => {
  render(<Wrapper />);
  expect(screen.getByText('Completo')).toBeInTheDocument();
  expect(screen.getByText('Ligero')).toBeInTheDocument();
});

it('renders the duration field', () => {
  render(<Wrapper />);
  expect(screen.getByLabelText(/duración/i)).toBeInTheDocument();
});

it('renders the billing section', () => {
  render(<Wrapper />);
  expect(screen.getByText('Facturación')).toBeInTheDocument();
});

it('renders the contract section', () => {
  render(<Wrapper />);
  expect(screen.getByText('Contrato')).toBeInTheDocument();
});

it('shows a loading skeleton instead of the plan list while plans are loading', () => {
  render(<Wrapper availablePlans={[]} isLoading />);
  expect(screen.queryByText('Completo')).not.toBeInTheDocument();
  expect(screen.getAllByTestId('plan-radio-skeleton-row')).toHaveLength(3);
});

it('does not restrict fecha de inicio when origen is not passed', () => {
  render(<Wrapper />);
  expect(screen.getByLabelText(/fecha de inicio/i)).toHaveAttribute('data-disabled', '');
});

it('forwards origen Cita to restrict fecha de inicio', () => {
  render(<Wrapper origen="Cita" />);
  expect(screen.getByLabelText(/fecha de inicio/i)).not.toHaveAttribute('data-disabled', '');
});
