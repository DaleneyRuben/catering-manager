import { parseISO } from 'date-fns';
import Client from '../models/Client';
import { appToday, addCalendarDays } from '../utils/date';
import { checkIsWeekend } from '../utils/devFlags';
import { findActiveSubscriptionsForDate } from './subscriptionQueries';

export type DeliveryPerson = {
  id: number;
  name: string;
  phone: string;
  deliveryZone: string;
};

export type DeliveryGroup = {
  groupToken: string | null;
  members: DeliveryPerson[];
};

export type DeliveryDayRoute = {
  groups: DeliveryGroup[];
};

type DeliveryClientRow = {
  id: number;
  name: string;
  phoneNumber: string;
  deliveryZone: string;
  groupToken: string | null;
};

const byName = (a: DeliveryPerson, b: DeliveryPerson) => a.name.localeCompare(b.name, 'es');

const toPerson = (c: DeliveryClientRow): DeliveryPerson => ({
  id: c.id,
  name: c.name,
  phone: c.phoneNumber,
  deliveryZone: c.deliveryZone,
});

// A client without a groupToken is represented as a group of one, so the
// frontend can render every entry the same way. Groups are listed before singles.
const buildGroups = (clients: DeliveryClientRow[]): DeliveryGroup[] => {
  const groupTokens: string[] = [];
  clients.forEach((c) => {
    if (c.groupToken && !groupTokens.includes(c.groupToken)) groupTokens.push(c.groupToken);
  });

  const groups: DeliveryGroup[] = groupTokens.map((groupToken) => ({
    groupToken,
    members: clients
      .filter((c) => c.groupToken === groupToken)
      .map(toPerson)
      .sort(byName),
  }));

  const singles: DeliveryGroup[] = clients
    .filter((c) => !c.groupToken)
    .map(toPerson)
    .sort(byName)
    .map((person) => ({ groupToken: null, members: [person] }));

  return [...groups, ...singles];
};

// Weekends are never delivery days — return an empty route without hitting the DB.
const buildDayRoute = async (date: string): Promise<DeliveryDayRoute> => {
  if (checkIsWeekend(parseISO(date))) return { groups: [] };

  const subscriptions = await findActiveSubscriptionsForDate(date);
  const clients = subscriptions.map((s) => {
    const c = s.client as Client;
    return {
      id: c.id,
      name: c.name,
      phoneNumber: c.phoneNumber,
      deliveryZone: c.deliveryZone,
      groupToken: c.groupToken,
    };
  });

  return { groups: buildGroups(clients) };
};

const findRoute = async (): Promise<Record<string, DeliveryDayRoute>> => {
  const today = appToday();
  const tomorrow = addCalendarDays(today, 1);

  const [hoy, manana] = await Promise.all([buildDayRoute(today), buildDayRoute(tomorrow)]);

  return { [today]: hoy, [tomorrow]: manana };
};

export default { findRoute };
