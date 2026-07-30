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
  clientId: null,
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

  it('does not show the Cliente existente badge when clientId is not set', () => {
    renderCard(pendingAppointment);
    expect(screen.queryByText('Cliente existente')).not.toBeInTheDocument();
  });

  it('shows a Cliente existente badge and links to the renewal view when clientId is set', () => {
    renderCard({ ...pendingAppointment, clientId: '5' });
    expect(screen.getByText('Cliente existente')).toBeInTheDocument();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/evaluaciones/citas/1/renovar');
  });
});
