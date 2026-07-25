import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppointmentModal } from '@/features/evaluations/components/AppointmentModal';
import type { Appointment } from '@/features/evaluations/types';

const existingAppointment: Appointment = {
  id: '1',
  name: 'Ana Pérez',
  phone: '71234567',
  date: '2026-08-03',
  time: '09:00',
  subscriptionId: null,
};

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

describe('AppointmentModal — create mode', () => {
  it('renders "Nueva cita" heading', () => {
    render(
      <AppointmentModal mode="create" isSaving={false} onSave={jest.fn()} onClose={jest.fn()} />,
    );
    expect(screen.getByText('Nueva cita')).toBeInTheDocument();
  });

  it('starts with empty name and phone fields', () => {
    render(
      <AppointmentModal mode="create" isSaving={false} onSave={jest.fn()} onClose={jest.fn()} />,
    );
    expect(screen.getByLabelText(/nombre/i)).toHaveValue('');
    expect(screen.getByLabelText(/tel[eé]fono/i)).toHaveValue('');
  });

  it('calls onSave with the draft and then onClose when Crear cita is clicked', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    render(<AppointmentModal mode="create" isSaving={false} onSave={onSave} onClose={onClose} />);

    await userEvent.type(screen.getByLabelText(/nombre/i), 'Ana Pérez');
    await userEvent.type(screen.getByLabelText(/tel[eé]fono/i), '71234567');
    await userEvent.type(screen.getByLabelText(/hora/i), '0900AM');
    await userEvent.click(screen.getByRole('button', { name: /crear cita/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Ana Pérez', phone: '71234567', time: '09:00' }),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('reverts an invalid typed hora back to empty on blur', async () => {
    render(
      <AppointmentModal mode="create" isSaving={false} onSave={jest.fn()} onClose={jest.fn()} />,
    );
    const horaInput = screen.getByLabelText(/hora/i);
    await userEvent.type(horaInput, 'zzzzzzzz');
    await userEvent.tab();
    expect(horaInput).toHaveValue('');
  });

  it('calls onClose when Cancelar is clicked', async () => {
    const onClose = jest.fn();
    render(
      <AppointmentModal mode="create" isSaving={false} onSave={jest.fn()} onClose={onClose} />,
    );
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('AppointmentModal — edit mode', () => {
  it('renders "Editar cita" heading, prefilled from the appointment prop', () => {
    render(
      <AppointmentModal
        mode="edit"
        appointment={existingAppointment}
        isSaving={false}
        onSave={jest.fn()}
        onClose={jest.fn()}
      />,
    );
    expect(screen.getByText('Editar cita')).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre/i)).toHaveValue('Ana Pérez');
    expect(screen.getByLabelText(/tel[eé]fono/i)).toHaveValue('71234567');
    expect(screen.getByLabelText(/hora/i)).toHaveValue('09:00 AM');
  });

  it('calls onSave with the updated draft and then onClose when Guardar cambios is clicked', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    render(
      <AppointmentModal
        mode="edit"
        appointment={existingAppointment}
        isSaving={false}
        onSave={onSave}
        onClose={onClose}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Ana Pérez' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
