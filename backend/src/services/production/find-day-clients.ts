import Client from '../../models/Client';
import { findActiveSubscriptionsForDate } from '../subscription';

export type DayClient = {
  id: number;
  name: string;
  phoneNumber: string;
  deliveryZone: string;
};

export type DayClients = {
  date: string;
  count: number;
  clients: DayClient[];
};

export const findDayClients = async (date: string): Promise<DayClients> => {
  const subscriptions = await findActiveSubscriptionsForDate(date);

  const clients = subscriptions
    .map((subscription) => {
      const { id, name, phoneNumber, deliveryZone } = subscription.client as Client;
      return { id, name, phoneNumber, deliveryZone };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));

  return { date, count: clients.length, clients };
};
