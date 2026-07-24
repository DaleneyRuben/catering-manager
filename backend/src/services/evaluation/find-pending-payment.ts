import Client from '../../models/Client';
import Plan from '../../models/Plan';
import Subscription from '../../models/Subscription';

export const findPendingPayment = () =>
  Client.findAll({
    include: [{ model: Subscription, include: [Plan], required: true, where: { paid: false } }],
    order: [['createdAt', 'DESC']],
  });
