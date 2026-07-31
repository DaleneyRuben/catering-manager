import Client from '../../models/Client';
import { appToday, nextDeliveryDay } from '../../utils/date';
import { findActiveSubscriptionsForDate } from '../subscription';
import { countStops } from './_helpers';

// Counts the next delivery day rather than the literal today, so a weekend reports the
// stops for the coming Monday. The Entregas route view deliberately uses the literal day.
export const countDeliveriesToday = async (): Promise<number> => {
  const subscriptions = await findActiveSubscriptionsForDate(nextDeliveryDay(appToday()));

  return countStops(subscriptions.map((s) => (s.client as Client).groupToken));
};
