import Appointment from '../../models/Appointment';
import Client from '../../models/Client';
import { assertSlotAvailable } from './_helpers';

export type CreateAppointmentDto = {
  clientId?: number;
  name?: string;
  phone?: string;
  date: string;
  time: string;
};

export const createAppointment = async (data: CreateAppointmentDto) => {
  await assertSlotAvailable(data.date, data.time);

  if (data.clientId !== undefined) {
    const client = await Client.findByPk(data.clientId);
    if (!client) return null;

    return Appointment.create({
      name: client.name,
      phone: client.phoneNumber,
      date: data.date,
      time: data.time,
      clientId: data.clientId,
    } as never);
  }

  return Appointment.create({
    name: data.name,
    phone: data.phone,
    date: data.date,
    time: data.time,
  } as never);
};
