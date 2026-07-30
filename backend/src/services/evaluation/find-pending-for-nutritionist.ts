import { Op } from 'sequelize';
import Appointment from '../../models/Appointment';
import { appToday } from '../../utils/date';
import { pruneStalePendingAppointments } from './_helpers';

export const findPendingForNutritionist = async () => {
  await pruneStalePendingAppointments();

  return Appointment.findAll({
    where: {
      date: { [Op.gte]: appToday() },
      subscriptionId: { [Op.is]: null },
    },
    order: [
      ['date', 'ASC'],
      ['time', 'ASC'],
    ],
  });
};
