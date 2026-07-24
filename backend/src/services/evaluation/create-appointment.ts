import Appointment from '../../models/Appointment';

export type CreateAppointmentDto = {
  name: string;
  phone: string;
  date: string;
  time: string;
};

export const createAppointment = (data: CreateAppointmentDto) => Appointment.create(data as never);
