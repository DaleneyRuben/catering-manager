import Subscription from '../../models/Subscription';
import { findContractActiveSubscriptions } from './_helpers';

// Used by dashboard: subscriptions that are contract-active on `date` but specifically
// suspended that day — the complement of findActiveSubscriptionsForDate's suspension filter.
export const findSuspendedSubscriptionsForDate = async (date: string): Promise<Subscription[]> => {
  const subscriptions = await findContractActiveSubscriptions(date);
  return subscriptions.filter((s) => s.suspendedDates.includes(date));
};
