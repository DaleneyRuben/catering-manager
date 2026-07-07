import Client from '../../models/Client';
import Subscription from '../../models/Subscription';
import { appToday, addCalendarDays, nextDeliveryDay } from '../../utils/date';
import { findActiveSubscriptionsForDate, findSuspendedSubscriptionsForDate } from '../subscription';

export type DashboardCounts = {
  active: { today: number; tomorrow: number };
  suspended: { today: number; tomorrow: number };
  deliveriesToday: number;
};

// A group counts as one delivery stop regardless of member count (see docs/domain.md).
const countDeliveries = (subscriptions: Subscription[]): number => {
  const groupTokens = new Set<string>();
  let singles = 0;
  subscriptions.forEach((s) => {
    const { groupToken } = s.client as Client;
    if (groupToken) groupTokens.add(groupToken);
    else singles += 1;
  });
  return groupTokens.size + singles;
};

export const findCounts = async (): Promise<DashboardCounts> => {
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
    deliveriesToday: countDeliveries(activeToday),
  };
};
