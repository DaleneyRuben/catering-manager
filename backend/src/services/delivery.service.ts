import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Client from '../models/Client';
import { appToday, addCalendarDays } from '../utils/date';
import { checkIsWeekend } from '../utils/devFlags';
import { findActiveSubscriptionsForDate } from './subscriptionQueries';

export type DeliveryClientRow = {
  id: number;
  name: string;
  phoneNumber: string;
  deliveryZone: string;
  groupToken: string | null;
};

export type DeliveryDayRoute = {
  date: string;
  dateLabel: string;
  clients: DeliveryClientRow[];
};

const formatDateLabel = (date: string): string => {
  const label = format(parseISO(date), "EEEE d 'de' MMMM, yyyy", { locale: es });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

// Weekends are never delivery days — return an empty route without hitting the DB.
const buildDayRoute = async (date: string): Promise<DeliveryDayRoute> => {
  const dateLabel = formatDateLabel(date);
  if (checkIsWeekend(parseISO(date))) return { date, dateLabel, clients: [] };

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

  return { date, dateLabel, clients };
};

const findRoute = async (): Promise<{ hoy: DeliveryDayRoute; manana: DeliveryDayRoute }> => {
  const today = appToday();
  const tomorrow = addCalendarDays(today, 1);

  const [hoy, manana] = await Promise.all([buildDayRoute(today), buildDayRoute(tomorrow)]);

  return { hoy, manana };
};

export default { findRoute };
