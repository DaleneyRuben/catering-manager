import { Op } from 'sequelize';
import Appointment from '../../models/Appointment';

export const findPendingForAdmin = () =>
  Appointment.findAll({
    where: { subscriptionId: { [Op.is]: null } },
    order: [
      ['date', 'ASC'],
      ['time', 'ASC'],
    ],
  });
