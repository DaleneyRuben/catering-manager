import { format } from 'date-fns';
import Client from '../models/Client';
import Subscription from '../models/Subscription';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from '../schemas/subscription.schema';
import { addDeliveryDays } from '../utils/date';

const validationError = (message: string) => Object.assign(new Error(message), { statusCode: 400 });

const create = async (clientId: number, data: CreateSubscriptionDto) => {
  const client = await Client.findByPk(clientId);
  if (!client) return null;

  const expectedContractDate = format(new Date(), 'yyyy-MM-dd');
  if (data.contractDate !== expectedContractDate) {
    throw validationError('contractDate must be today');
  }

  const contractEndDate = addDeliveryDays(data.startDate, data.duration);

  return Subscription.create({
    planId: data.planId,
    startDate: data.startDate,
    contractDate: data.contractDate,
    discount: data.discount ?? 0,
    contractEndDate,
    clientId,
  } as never);
};

const update = async (clientId: number, id: number, data: UpdateSubscriptionDto) => {
  const subscription = await Subscription.findOne({ where: { id, clientId } });
  if (!subscription) return null;
  return subscription.update(data);
};

export default { create, update };
