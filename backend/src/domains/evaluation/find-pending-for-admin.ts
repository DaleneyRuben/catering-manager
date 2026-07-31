import { Op } from 'sequelize';
import Appointment from '../../models/Appointment';
import { appToday } from '../../utils/date';
import { pruneStalePendingAppointments } from './_helpers';

export const findPendingForAdmin = async () => {
  await pruneStalePendingAppointments();

  return Appointment.findAll({
    where: {
      subscriptionId: { [Op.is]: null },
      date: { [Op.gte]: appToday() },
    },
    order: [
      ['date', 'ASC'],
      ['time', 'ASC'],
    ],
  });
};
