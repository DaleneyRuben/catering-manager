import Client from '../models/Client';
import Plan from '../models/Plan';
import { findActiveSubscriptionsForDate } from './subscriptionQueries';

const findDeliveryClientsForDate = async (date: string): Promise<string[]> => {
  const subscriptions = await findActiveSubscriptionsForDate(date);

  return subscriptions
    .map((s) => (s.client as Client).name)
    .sort((a, b) => a.localeCompare(b, 'es'));
};

export type ActiveClientRow = {
  name: string;
  planMeals: string[];
  specialInstructions: Record<string, string>;
};

const findActiveClientsWithPlansForDate = async (date: string): Promise<ActiveClientRow[]> => {
  const subscriptions = await findActiveSubscriptionsForDate(date);

  return subscriptions.map((s) => ({
    name: (s.client as Client).name,
    planMeals: (s.plan as Plan).meals,
    specialInstructions: s.specialInstructions ?? {},
  }));
};

export default { findDeliveryClientsForDate, findActiveClientsWithPlansForDate };
