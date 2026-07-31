import { findCounts, type DashboardCounts } from './find-counts';
import { findContractEnding, type ContractEndingPerson } from './find-contract-ending';
import { findBirthdays, type BirthdayPerson } from './find-birthdays';
import { findConnections, type Connection } from './find-connections';
import { findMenus, type MenuStatus } from './find-menus';

export type DashboardSummary = DashboardCounts & {
  contractEnding: { today: ContractEndingPerson[]; tomorrow: ContractEndingPerson[] };
  birthdays: BirthdayPerson[];
  connections: Connection[];
  menus: { today: MenuStatus; tomorrow: MenuStatus };
};

export const findSummary = async (): Promise<DashboardSummary> => {
  const [counts, contractEnding, birthdays, connections, menus] = await Promise.all([
    findCounts(),
    findContractEnding(),
    findBirthdays(),
    findConnections(),
    findMenus(),
  ]);

  return { ...counts, contractEnding, birthdays, connections, menus };
};
