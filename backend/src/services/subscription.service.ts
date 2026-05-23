import { format } from 'date-fns';
import Client from '../models/Client';
import Subscription from '../models/Subscription';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from '../schemas/subscription.schema';
import { addDeliveryDays } from '../utils/date';

const PLAN_DURATION_DAYS = 20;

const validationError = (message: string) => Object.assign(new Error(message), { statusCode: 400 });

const create = async (clientId: number, data: CreateSubscriptionDto) => {
  const client = await Client.findByPk(clientId);
  if (!client) return null;

  const expectedContractDate = format(new Date(), 'yyyy-MM-dd');
  const expectedContractEndDate = addDeliveryDays(data.startDate, PLAN_DURATION_DAYS);

  if (data.contractDate !== expectedContractDate) {
    throw validationError('contractDate must be today');
  }
  if (data.contractEndDate !== expectedContractEndDate) {
    throw validationError(
      `contractEndDate must be ${expectedContractEndDate} (${PLAN_DURATION_DAYS} business days from startDate)`,
    );
  }

  return Subscription.create({ ...data, clientId } as never);
};

const update = async (clientId: number, id: number, data: UpdateSubscriptionDto) => {
  const subscription = await Subscription.findOne({ where: { id, clientId } });
  if (!subscription) return null;
  return subscription.update(data);
};

export default { create, update };
