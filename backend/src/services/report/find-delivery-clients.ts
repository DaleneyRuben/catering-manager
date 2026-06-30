import Client from '../../models/Client';
import { findActiveSubscriptionsForDate } from '../subscription/find-active-for-date';

export const findDeliveryClientsForDate = async (date: string): Promise<string[]> => {
  const subscriptions = await findActiveSubscriptionsForDate(date);

  return subscriptions
    .map((s) => (s.client as Client).name)
    .sort((a, b) => a.localeCompare(b, 'es'));
};
