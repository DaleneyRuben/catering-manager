import { Op } from 'sequelize';
import Appointment from '../../models/Appointment';
import { appToday } from '../../utils/date';
import { ConflictError } from '../../utils/errors';

export const pruneStalePendingAppointments = async (): Promise<void> => {
  await Appointment.destroy({
    where: {
      date: { [Op.lt]: appToday() },
      subscriptionId: { [Op.is]: null },
    },
  });
};

// A resolved appointment already happened and no longer occupies the slot, so only pending
// ones can collide.
export const assertSlotAvailable = async (
  date: string,
  time: string,
  excludeId?: number,
): Promise<void> => {
  const existing = await Appointment.findOne({
    where: {
      date,
      time,
      subscriptionId: { [Op.is]: null },
      ...(excludeId !== undefined ? { id: { [Op.ne]: excludeId } } : {}),
    },
  });
  if (existing) {
    throw new ConflictError('Ya existe una cita pendiente en esa fecha y hora.');
  }
};
