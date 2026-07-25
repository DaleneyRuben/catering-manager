import { Op } from 'sequelize';
import Appointment from '../../models/Appointment';
import Subscription from '../../models/Subscription';
import { appToday } from '../../utils/date';
import { pruneStalePendingAppointments } from './_helpers';

export const findForNutritionist = async () => {
  await pruneStalePendingAppointments();

  return Appointment.findAll({
    where: { date: { [Op.gte]: appToday() } },
    include: [{ model: Subscription, attributes: ['paid'] }],
    order: [
      ['date', 'ASC'],
      ['time', 'ASC'],
    ],
  });
};
