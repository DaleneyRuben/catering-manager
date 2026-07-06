import Client from '../../models/Client';
import Subscription from '../../models/Subscription';
import { findActiveSubscriptionsForDate } from '../subscription';

export const findDeliveryClientsForDate = async (date: string): Promise<string[]> => {
  const subscriptions = await findActiveSubscriptionsForDate(date);

  return subscriptions
    .sort((a: Subscription, b: Subscription) => {
      const dateComparison = (a.startDate ?? '').localeCompare(b.startDate ?? '');
      if (dateComparison !== 0) return dateComparison;
      return (a.client as Client).name.localeCompare((b.client as Client).name, 'es');
    })
    .map((s) => (s.client as Client).name);
};
