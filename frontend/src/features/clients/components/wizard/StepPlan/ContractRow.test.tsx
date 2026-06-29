import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { ContractRow } from './ContractRow';
import type { NewClientFormValues } from '@/features/clients/types';

function Wrapper({ startDate = '', duration = 0 }: { startDate?: string; duration?: number }) {
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
