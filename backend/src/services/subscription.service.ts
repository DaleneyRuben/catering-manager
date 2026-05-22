import Client from '../models/Client';
import Subscription from '../models/Subscription';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from '../schemas/subscription.schema';

const create = async (clientId: number, data: CreateSubscriptionDto) => {
  const client = await Client.findByPk(clientId);
  if (!client) return null;
  return Subscription.create({ ...data, clientId } as never);
};

const update = async (clientId: number, id: number, data: UpdateSubscriptionDto) => {
  const subscription = await Subscription.findOne({ where: { id, clientId } });
  if (!subscription) return null;
  return subscription.update(data);
};

export default { create, update };
