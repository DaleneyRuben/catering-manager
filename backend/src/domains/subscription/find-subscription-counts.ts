import { appToday, addCalendarDays, nextDeliveryDay } from '../../utils/date';
import { findActiveSubscriptionsForDate } from './find-active-subscriptions-for-date';
import { findSuspendedSubscriptionsForDate } from './find-suspended-subscriptions-for-date';

export type SubscriptionCounts = {
  active: { today: number; tomorrow: number };
  suspended: { today: number; tomorrow: number };
};

// Counts the next delivery day rather than the literal today, so a weekend reports the
// coming Monday and Tuesday.
export const findSubscriptionCounts = async (): Promise<SubscriptionCounts> => {
  const today = nextDeliveryDay(appToday());
  const tomorrow = addCalendarDays(today, 1);

  const [activeToday, activeTomorrow, suspendedToday, suspendedTomorrow] = await Promise.all([
    findActiveSubscriptionsForDate(today),
    findActiveSubscriptionsForDate(tomorrow),
    findSuspendedSubscriptionsForDate(today),
    findSuspendedSubscriptionsForDate(tomorrow),
  ]);

  return {
    active: { today: activeToday.length, tomorrow: activeTomorrow.length },
    suspended: { today: suspendedToday.length, tomorrow: suspendedTomorrow.length },
  };
};
