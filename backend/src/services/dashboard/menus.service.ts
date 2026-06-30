import type Menu from '../../models/Menu';
import { appToday, addCalendarDays, nextDeliveryDay } from '../../utils/date';
import menuService from '../menu/menu.service';

const MEAL_FIELDS: (keyof Menu)[] = [
  'breakfast',
  'morningSnack',
  'salad',
  'lunch',
  'afternoonSnack',
  'dinner',
  'juice',
];

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

export default { findMenus };
