import { countDeliveriesToday } from '../delivery';
import {
  findContractEnding,
  findSubscriptionCounts,
  type ContractEndingPerson,
  type SubscriptionCounts,
} from '../subscription';
import { findBirthdays, type BirthdayPerson } from '../client';
import { findConnections, type Connection } from '../user';
import { findMenuStatus, type MenuStatus } from '../menu';

export type DashboardSummary = SubscriptionCounts & {
  deliveriesToday: number;
  contractEnding: { today: ContractEndingPerson[]; tomorrow: ContractEndingPerson[] };
  birthdays: BirthdayPerson[];
  connections: Connection[];
  menus: { today: MenuStatus; tomorrow: MenuStatus };
};

export const findSummary = async (): Promise<DashboardSummary> => {
  const [counts, deliveriesToday, contractEnding, birthdays, connections, menus] =
    await Promise.all([
      findSubscriptionCounts(),
      countDeliveriesToday(),
      findContractEnding(),
      findBirthdays(),
      findConnections(),
      findMenuStatus(),
    ]);

  return { ...counts, deliveriesToday, contractEnding, birthdays, connections, menus };
};
