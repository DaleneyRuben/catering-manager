import Appointment from '../../models/Appointment';

export const findById = async (id: number) => Appointment.findByPk(id);
