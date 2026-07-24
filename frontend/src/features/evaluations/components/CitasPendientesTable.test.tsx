import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CitasPendientesTable } from '@/features/evaluations/components/CitasPendientesTable';
import type { Appointment } from '@/features/evaluations/types';

const appointment1: Appointment = {
  id: '1',
  name: 'Ana Pérez',
  phone: '71234567',
  date: '2026-08-03',
  time: '09:00',
  subscriptionId: null,
};

describe('CitasPendientesTable', () => {
  it('renders a row per appointment with name, phone, date, and time', () => {
    render(
      <CitasPendientesTable
        appointments={[appointment1]}
        onEdit={jest.fn()}
        onCancel={jest.fn()}
        onNewCita={jest.fn()}
      />,
    );
    expect(screen.getByText('Ana Pérez')).toBeInTheDocument();
    expect(screen.getByText('71234567')).toBeInTheDocument();
    expect(screen.getByText('03/08/2026')).toBeInTheDocument();
    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('AP')).toBeInTheDocument();
  });

  it('calls onEdit with the appointment when the edit icon is clicked', async () => {
    const onEdit = jest.fn();
    render(
      <CitasPendientesTable
        appointments={[appointment1]}
        onEdit={onEdit}
        onCancel={jest.fn()}
        onNewCita={jest.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /editar cita/i }));
    expect(onEdit).toHaveBeenCalledWith(appointment1);
  });

  it('calls onCancel with the appointment when the trash icon is clicked', async () => {
    const onCancel = jest.fn();
    render(
      <CitasPendientesTable
        appointments={[appointment1]}
        onEdit={jest.fn()}
        onCancel={onCancel}
        onNewCita={jest.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /cancelar cita/i }));
    expect(onCancel).toHaveBeenCalledWith(appointment1);
  });

  it('renders an empty state with a Nueva cita CTA when there are no appointments', async () => {
    const onNewCita = jest.fn();
    render(
      <CitasPendientesTable
        appointments={[]}
        onEdit={jest.fn()}
        onCancel={jest.fn()}
        onNewCita={onNewCita}
      />,
    );
    expect(screen.getByText('Sin citas pendientes')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /nueva cita/i }));
    expect(onNewCita).toHaveBeenCalled();
  });
});
