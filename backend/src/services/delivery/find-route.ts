import { parseISO } from 'date-fns';
import Client from '../../models/Client';
import { appToday, addCalendarDays } from '../../utils/date';
import { checkIsWeekend } from '../../utils/devFlags';
import { findActiveSubscriptionsForDate } from '../subscription/find-active-for-date';

// Display order for the Entregas page — Sur first, matching the route layout, not the
// alphabetical order used for client-facing zone dropdowns elsewhere in the app.
const ZONE_ORDER = ['Sur', 'Centro'];

export type DeliveryPerson = {
  id: number;
  name: string;
  phone: string;
  deliveryZone: string;
};

export type DeliveryGroup = {
  groupToken: string;
  members: DeliveryPerson[];
};

export type DeliveryZoneRoute = {
  zone: string;
  entregas: number;
  groups: DeliveryGroup[];
  singles: DeliveryPerson[];
};

export type DeliveryDayRoute = {
  zones: DeliveryZoneRoute[];
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

const buildZones = (clients: DeliveryClientRow[]): DeliveryZoneRoute[] =>
  ZONE_ORDER.map((zone) => {
    const inZone = clients.filter((c) => c.deliveryZone === zone);

    const groupTokens: string[] = [];
    inZone.forEach((c) => {
      if (c.groupToken && !groupTokens.includes(c.groupToken)) groupTokens.push(c.groupToken);
    });

    const groups: DeliveryGroup[] = groupTokens.map((groupToken) => ({
      groupToken,
      members: inZone
        .filter((c) => c.groupToken === groupToken)
        .map(toPerson)
        .sort(byName),
    }));

    const singles = inZone
      .filter((c) => !c.groupToken)
      .map(toPerson)
      .sort(byName);

    return { zone, entregas: groups.length + singles.length, groups, singles };
  }).filter((z) => z.entregas > 0);

// Weekends are never delivery days — return an empty route without hitting the DB.
const buildDayRoute = async (date: string): Promise<DeliveryDayRoute> => {
  if (checkIsWeekend(parseISO(date))) return { zones: [] };

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

  return { zones: buildZones(clients) };
};

export const findRoute = async (): Promise<Record<string, DeliveryDayRoute>> => {
  const today = appToday();
  const tomorrow = addCalendarDays(today, 1);

  const [todayRoute, tomorrowRoute] = await Promise.all([
    buildDayRoute(today),
    buildDayRoute(tomorrow),
  ]);

  return { [today]: todayRoute, [tomorrow]: tomorrowRoute };
};
