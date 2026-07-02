import Client from '../../models/Client';
import Plan from '../../models/Plan';
import { findActiveSubscriptionsForDate } from '../subscription/find-active-for-date';

export type ActiveClientRow = {
  name: string;
  planMeals: string[];
  specialInstructions: Record<string, string>;
};

export const findActiveClientsWithPlansForDate = async (
  date: string,
): Promise<ActiveClientRow[]> => {
  const subscriptions = await findActiveSubscriptionsForDate(date);

  return subscriptions.map((s) => ({
    name: (s.client as Client).name,
    planMeals: (s.plan as Plan).meals,
    specialInstructions: s.specialInstructions ?? {},
  }));
};
