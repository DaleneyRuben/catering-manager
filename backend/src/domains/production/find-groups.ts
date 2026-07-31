import { parseISO } from 'date-fns';
import Client from '../../models/Client';
import Plan from '../../models/Plan';
import { appToday, addCalendarDays } from '../../utils/date';
import { checkIsWeekend } from '../../utils/devFlags';
import { findActiveSubscriptionsForDate } from '../subscription';

export type ProductionGroups = {
  juice: string[];
  lunchOnly: string[];
  lunchAndDinner: string[];
  full: string[];
};

export type ProductionSummary = {
  date: string;
  isDeliveryDay: boolean;
  total: number;
  groups: ProductionGroups;
};

// "full" (UI: Completo) counts every entry in plan.meals, including juice and extra.
const FULL_MIN_MEALS = 6;

const emptyGroups = (): ProductionGroups => ({
  juice: [],
  lunchOnly: [],
  lunchAndDinner: [],
  full: [],
});

export const findGroups = async (): Promise<ProductionSummary> => {
  const tomorrow = addCalendarDays(appToday(), 1);

  if (checkIsWeekend(parseISO(tomorrow))) {
    return { date: tomorrow, isDeliveryDay: false, total: 0, groups: emptyGroups() };
  }

  const subscriptions = await findActiveSubscriptionsForDate(tomorrow);
  const groups = emptyGroups();
  // Total counts distinct clients placed in at least one group ("clientes a preparar"),
  // not all active clients — an unclassifiable plan (e.g. breakfast-only) is excluded.
  let total = 0;

  subscriptions.forEach((subscription) => {
    const { name } = subscription.client as Client;
    const { meals } = subscription.plan as Plan;
    let placed = false;

    if (meals.includes('juice')) {
      groups.juice.push(name);
      placed = true;
    }

    if (meals.length >= FULL_MIN_MEALS) {
      groups.full.push(name);
      placed = true;
    } else if (meals.includes('lunch') && meals.includes('dinner')) {
      groups.lunchAndDinner.push(name);
      placed = true;
    } else if (meals.includes('lunch')) {
      groups.lunchOnly.push(name);
      placed = true;
    }

    if (placed) total += 1;
  });

  Object.values(groups).forEach((names) => names.sort((a, b) => a.localeCompare(b, 'es')));

  return { date: tomorrow, isDeliveryDay: true, total, groups };
};
