import Appointment from '../../models/Appointment';
import Subscription from '../../models/Subscription';

export const findForNutritionist = () =>
  Appointment.findAll({
    include: [{ model: Subscription, attributes: ['paid'] }],
    order: [
      ['date', 'ASC'],
      ['time', 'ASC'],
    ],
  });
