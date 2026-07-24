import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NutritionistAppointmentCard } from '@/features/evaluations/components/NutritionistAppointmentCard';
import type { Appointment } from '@/features/evaluations/types';

const pendingAppointment: Appointment = {
  id: '1',
  name: 'Mariana Ovando',
  phone: '70112345',
  date: '2026-06-25',
  time: '09:00',
  subscriptionId: null,
  subscription: null,
};

const paidAppointment: Appointment = {
  ...pendingAppointment,
  id: '2',
  subscriptionId: '9',
  subscription: { paid: true },
};

const unpaidAppointment: Appointment = {
  ...pendingAppointment,
  id: '3',
  subscriptionId: '10',
  subscription: { paid: false },
};

function renderCard(appointment: Appointment) {
  return render(
    <MemoryRouter>
      <NutritionistAppointmentCard appointment={appointment} />
    </MemoryRouter>,
  );
}

describe('NutritionistAppointmentCard', () => {
  it('renders name and phone/date/time meta', () => {
    renderCard(pendingAppointment);
    expect(screen.getByText('Mariana Ovando')).toBeInTheDocument();
    expect(screen.getByText('70112345 · 25/06/2026 · 09:00')).toBeInTheDocument();
  });

  it('renders a clickable link to the wizard with a Pendiente tag when not converted', () => {
    renderCard(pendingAppointment);
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/clientes/nuevo?appointmentId=1');
  });

  it('renders a static Pagado tag with no link when converted and paid', () => {
    renderCard(paidAppointment);
    expect(screen.getByText('Pagado')).toBeInTheDocument();
    expect(screen.getByText('Convertido · pago confirmado')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders a static No pagado tag with no link when converted and unpaid', () => {
    renderCard(unpaidAppointment);
    expect(screen.getByText('No pagado')).toBeInTheDocument();
    expect(screen.getByText('Convertido · pago pendiente')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
