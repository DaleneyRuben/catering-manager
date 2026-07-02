import { Op, fn, literal, where } from 'sequelize';
import { format, getMonth, parseISO } from 'date-fns';
import Client from '../../models/Client';
import { appToday, nextDeliveryDay } from '../../utils/date';

export type BirthdayPerson = {
  id: number;
  name: string;
  dateOfBirth: string;
  isToday: boolean;
};

export const findBirthdays = async (): Promise<BirthdayPerson[]> => {
  const today = nextDeliveryDay(appToday());
  const todayDate = parseISO(today);
  // getMonth returns 0-based; SQL EXTRACT(MONTH) is 1-based
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
