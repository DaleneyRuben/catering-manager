import type Menu from '../../models/Menu';
import { appToday, addCalendarDays, nextDeliveryDay } from '../../utils/date';
import { findByDate } from '../menu/find-by-date';

export type MenuStatus = {
  date: string;
  loaded: boolean;
};

const MEAL_FIELDS: (keyof Menu)[] = [
  'breakfast',
  'morningSnack',
  'salad',
  'lunch',
  'afternoonSnack',
  'dinner',
  'juice',
];

const isMenuLoaded = (menu: Menu | null): boolean =>
  !!menu && MEAL_FIELDS.every((field) => !!menu[field]);

export const findMenus = async (): Promise<{ today: MenuStatus; tomorrow: MenuStatus }> => {
  const today = nextDeliveryDay(appToday());
  const tomorrow = addCalendarDays(today, 1);

  const [todayMenu, tomorrowMenu] = await Promise.all([findByDate(today), findByDate(tomorrow)]);

  return {
    today: { date: today, loaded: isMenuLoaded(todayMenu) },
    tomorrow: { date: tomorrow, loaded: isMenuLoaded(tomorrowMenu) },
  };
};
