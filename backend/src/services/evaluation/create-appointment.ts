export type CreateAppointmentDto = {
  name: string;
  phone: string;
  date: string;
  time: string;
};

export const createAppointment = async (_data: CreateAppointmentDto) => {
  throw new Error('not implemented');
};
