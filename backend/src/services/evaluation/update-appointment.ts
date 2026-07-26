import Appointment from '../../models/Appointment';
import { CreateAppointmentDto } from './create-appointment';

export const updateAppointment = async (id: number, data: Partial<CreateAppointmentDto>) => {
  const appointment = await Appointment.findByPk(id);
  if (!appointment) return null;

  // name/phone are derived from the client and locked once an appointment is linked to one —
  // not independently editable, regardless of what the request body sends.
  if (appointment.clientId) {
    const { date, time } = data;
    return appointment.update({ date, time } as never);
  }

  return appointment.update(data as never);
};
