import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { StepIdentity } from './StepIdentity';
import type { NewClientFormValues } from '@/features/clients/types';

function Wrapper() {
  const {
    register,
    control,
    formState: { errors },
  } = useForm<NewClientFormValues>({
    defaultValues: {
      name: '',
      sex: '',
      dateOfBirth: '',
      phoneNumber: '',
      address: '',
      deliveryZone: '',
      delivery: '',
      nit: '',
      businessName: '',
    },
  });
  return <StepIdentity register={register} control={control} errors={errors} />;
}

it('renders the name field', () => {
  render(<Wrapper />);
  expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
});

it('renders the sex selector', () => {
  render(<Wrapper />);
  expect(screen.getByLabelText(/sexo/i)).toBeInTheDocument();
});

it('renders the phone number field', () => {
  render(<Wrapper />);
  expect(screen.getByLabelText(/celular/i)).toBeInTheDocument();
});

it('renders the address field', () => {
  render(<Wrapper />);
  expect(screen.getByLabelText(/dirección/i)).toBeInTheDocument();
});

it('renders the NIT field', () => {
  render(<Wrapper />);
  expect(screen.getByLabelText(/nit/i)).toBeInTheDocument();
});
