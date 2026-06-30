import { Op } from 'sequelize';
import Client from '../../models/Client';
import Plan from '../../models/Plan';
import Subscription from '../../models/Subscription';
import { appToday, addCalendarDays, nextDeliveryDay } from '../../utils/date';

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
    .filter((s) => s.client != null && s.plan != null)
    .map((s) => ({
      id: (s.client as Client).id,
      name: (s.client as Client).name,
      plan: (s.plan as Plan).name,
      date: s.contractEndDate as string,
    }))
    .sort(byName);
};

export const findContractEnding = async (): Promise<{
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
