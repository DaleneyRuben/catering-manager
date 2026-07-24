import Appointment from '../../models/Appointment';
import { CreateAppointmentDto } from './create-appointment';

export const updateAppointment = async (id: number, data: Partial<CreateAppointmentDto>) => {
  const appointment = await Appointment.findByPk(id);
  if (!appointment) return null;
  return appointment.update(data as never);
};
