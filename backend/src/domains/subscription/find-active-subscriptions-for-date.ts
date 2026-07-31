import Subscription from '../../models/Subscription';
import { findContractActiveSubscriptions } from './_helpers';

// Shared by report, delivery, and dashboard services: subscriptions whose date range covers
// `date`, for a non-paused client, excluding finalized and suspended-on-date ones.
export const findActiveSubscriptionsForDate = async (date: string): Promise<Subscription[]> => {
  const subscriptions = await findContractActiveSubscriptions(date);
  return subscriptions.filter((s) => !s.suspendedDates.includes(date));
};
