import { Op, QueryTypes, fn, literal, where } from 'sequelize';
import { format, getMonth, parseISO } from 'date-fns';
import sequelize from '../database/sequelize';
import Client from '../models/Client';
import Plan from '../models/Plan';
import Subscription from '../models/Subscription';
import User from '../models/User';
import type Menu from '../models/Menu';
import { ROLES } from '../constants/roles';
import { appToday, addCalendarDays, nextDeliveryDay } from '../utils/date';
import menuService from './menu.service';

const ONLINE_WINDOW_MS = 60 * 60 * 1000;
const MEAL_FIELDS: (keyof Menu)[] = [
  'breakfast',
  'morningSnack',
  'salad',
  'lunch',
  'afternoonSnack',
  'dinner',
  'juice',
];

export type DashboardCounts = {
  active: { today: number; tomorrow: number };
  suspended: { today: number; tomorrow: number };
  deliveriesToday: number;
};

type CountsRow = {
  active_today: string;
  active_tomorrow: string;
  suspended_today: string;
  suspended_tomorrow: string;
  deliveries_today: string;
};

// Pure aggregate counts — no model hydration, mirrors client.service.ts's getCounts().
// A delivery group counts as one stop regardless of member count.
const findCounts = async (): Promise<DashboardCounts> => {
  const today = nextDeliveryDay(appToday());
  const tomorrow = addCalendarDays(today, 1);

  const [row] = await sequelize.query<CountsRow>(
    `SELECT
      COUNT(CASE WHEN c."pausedSince" IS NULL AND (s."startDate" IS NULL OR s."startDate" <= :today) AND s."contractEndDate" >= :today AND s."finalizedAt" IS NULL AND NOT (:today::date = ANY(s."suspendedDates")) THEN 1 END) AS active_today,
      COUNT(CASE WHEN c."pausedSince" IS NULL AND (s."startDate" IS NULL OR s."startDate" <= :tomorrow) AND s."contractEndDate" >= :tomorrow AND s."finalizedAt" IS NULL AND NOT (:tomorrow::date = ANY(s."suspendedDates")) THEN 1 END) AS active_tomorrow,
      COUNT(CASE WHEN c."pausedSince" IS NULL AND (s."startDate" IS NULL OR s."startDate" <= :today) AND s."contractEndDate" >= :today AND s."finalizedAt" IS NULL AND :today::date = ANY(s."suspendedDates") THEN 1 END) AS suspended_today,
      COUNT(CASE WHEN c."pausedSince" IS NULL AND (s."startDate" IS NULL OR s."startDate" <= :tomorrow) AND s."contractEndDate" >= :tomorrow AND s."finalizedAt" IS NULL AND :tomorrow::date = ANY(s."suspendedDates") THEN 1 END) AS suspended_tomorrow,
      COUNT(DISTINCT CASE WHEN c."pausedSince" IS NULL AND (s."startDate" IS NULL OR s."startDate" <= :today) AND s."contractEndDate" >= :today AND s."finalizedAt" IS NULL AND NOT (:today::date = ANY(s."suspendedDates")) AND c."groupToken" IS NOT NULL THEN c."groupToken" END)
        + COUNT(CASE WHEN c."pausedSince" IS NULL AND (s."startDate" IS NULL OR s."startDate" <= :today) AND s."contractEndDate" >= :today AND s."finalizedAt" IS NULL AND NOT (:today::date = ANY(s."suspendedDates")) AND c."groupToken" IS NULL THEN 1 END) AS deliveries_today
    FROM clients c
    LEFT JOIN subscriptions s ON s."id" = (SELECT MAX(s2."id") FROM subscriptions s2 WHERE s2."clientId" = c.id)`,
    { replacements: { today, tomorrow }, type: QueryTypes.SELECT },
  );

  const r = row as unknown as CountsRow;
  return {
    active: { today: Number(r.active_today), tomorrow: Number(r.active_tomorrow) },
    suspended: { today: Number(r.suspended_today), tomorrow: Number(r.suspended_tomorrow) },
    deliveriesToday: Number(r.deliveries_today),
  };
};

export type ContractEndingPerson = {
  id: number;
  name: string;
  plan: string;
  date: string;
};

const byName = (a: ContractEndingPerson, b: ContractEndingPerson) =>
  a.name.localeCompare(b.name, 'es');

const findContractEndingForDate = async (date: string): Promise<ContractEndingPerson[]> => {
  const subscriptions = await Subscription.findAll({
    where: { contractEndDate: date, finalizedAt: { [Op.is]: null } },
    include: [Client, Plan],
  });

  return subscriptions
    .map((s) => ({
      id: (s.client as Client).id,
      name: (s.client as Client).name,
      plan: (s.plan as Plan).name,
      date: s.contractEndDate as string,
    }))
    .sort(byName);
};

const findContractEnding = async (): Promise<{
  today: ContractEndingPerson[];
  tomorrow: ContractEndingPerson[];
}> => {
  const today = nextDeliveryDay(appToday());
  const tomorrow = addCalendarDays(today, 1);

  const [todayRows, tomorrowRows] = await Promise.all([
    findContractEndingForDate(today),
    findContractEndingForDate(tomorrow),
  ]);

  return { today: todayRows, tomorrow: tomorrowRows };
};

export type BirthdayPerson = {
  id: number;
  name: string;
  dateOfBirth: string;
  isToday: boolean;
};

const findBirthdays = async (): Promise<BirthdayPerson[]> => {
  const today = nextDeliveryDay(appToday());
  const todayDate = parseISO(today);
  // getMonth returns 0-based index; SQL EXTRACT(MONTH) is 1-based
  const currentMonth = getMonth(todayDate) + 1;
  const todayMonthDay = format(todayDate, 'MM-dd');

  const clients = await Client.findAll({
    attributes: ['id', 'name', 'dateOfBirth'],
    where: where(fn('EXTRACT', literal('MONTH FROM "dateOfBirth"')), Op.eq, currentMonth),
    order: [[literal('EXTRACT(DAY FROM "dateOfBirth")'), 'ASC']],
  });

  return clients.map((c) => ({
    id: c.id,
    name: c.name,
    dateOfBirth: c.dateOfBirth,
    isToday: format(parseISO(c.dateOfBirth), 'MM-dd') === todayMonthDay,
  }));
};

export type Connection = {
  username: string;
  lastLoginAt: string;
  online: boolean;
};

const findConnections = async (): Promise<Connection[]> => {
  const users = await User.findAll({
    where: {
      role: { [Op.in]: [ROLES.KITCHEN, ROLES.DELIVERY] },
      lastLoginAt: { [Op.not]: null },
    },
    order: [['lastLoginAt', 'DESC']],
  });

  const now = Date.now();
  return users.map((user) => {
    const lastLoginAt = user.lastLoginAt as Date;
    return {
      username: user.username,
      lastLoginAt: lastLoginAt.toISOString(),
      online: now - lastLoginAt.getTime() <= ONLINE_WINDOW_MS,
    };
  });
};

export type MenuStatus = {
  date: string;
  loaded: boolean;
};

const isMenuLoaded = (menu: Menu | null): boolean =>
  !!menu && MEAL_FIELDS.every((field) => !!menu[field]);

const findMenus = async (): Promise<{ today: MenuStatus; tomorrow: MenuStatus }> => {
  const today = nextDeliveryDay(appToday());
  const tomorrow = addCalendarDays(today, 1);

  const [todayMenu, tomorrowMenu] = await Promise.all([
    menuService.findByDate(today),
    menuService.findByDate(tomorrow),
  ]);

  return {
    today: { date: today, loaded: isMenuLoaded(todayMenu) },
    tomorrow: { date: tomorrow, loaded: isMenuLoaded(tomorrowMenu) },
  };
};

export type DashboardSummary = DashboardCounts & {
  contractEnding: { today: ContractEndingPerson[]; tomorrow: ContractEndingPerson[] };
  birthdays: BirthdayPerson[];
  connections: Connection[];
  menus: { today: MenuStatus; tomorrow: MenuStatus };
};

const findSummary = async (): Promise<DashboardSummary> => {
  const [counts, contractEnding, birthdays, connections, menus] = await Promise.all([
    findCounts(),
    findContractEnding(),
    findBirthdays(),
    findConnections(),
    findMenus(),
  ]);

  return { ...counts, contractEnding, birthdays, connections, menus };
};

export default {
  findCounts,
  findContractEnding,
  findBirthdays,
  findConnections,
  findMenus,
  findSummary,
};
