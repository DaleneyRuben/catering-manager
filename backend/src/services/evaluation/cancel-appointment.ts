import Appointment from '../../models/Appointment';

export const cancelAppointment = async (id: number) => {
  const appointment = await Appointment.findByPk(id);
  if (!appointment || appointment.subscriptionId) return null;
  await appointment.destroy();
  return appointment;
};
