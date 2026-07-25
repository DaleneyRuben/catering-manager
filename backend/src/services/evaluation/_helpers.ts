import { Op } from 'sequelize';
import Appointment from '../../models/Appointment';
import { appToday } from '../../utils/date';

export const pruneStalePendingAppointments = async (): Promise<void> => {
  await Appointment.destroy({
    where: {
      date: { [Op.lt]: appToday() },
      subscriptionId: { [Op.is]: null },
    },
  });
};
