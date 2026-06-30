import countsService, { type DashboardCounts } from './counts.service';
import contractEndingService, { type ContractEndingPerson } from './contract-ending.service';
import birthdaysService, { type BirthdayPerson } from './birthdays.service';
import connectionsService, { type Connection } from './connections.service';
import menusService, { type MenuStatus } from './menus.service';

export type DashboardSummary = DashboardCounts & {
  contractEnding: { today: ContractEndingPerson[]; tomorrow: ContractEndingPerson[] };
  birthdays: BirthdayPerson[];
  connections: Connection[];
  menus: { today: MenuStatus; tomorrow: MenuStatus };
};

const findSummary = async (): Promise<DashboardSummary> => {
  const [counts, contractEnding, birthdays, connections, menus] = await Promise.all([
    countsService.findCounts(),
    contractEndingService.findContractEnding(),
    birthdaysService.findBirthdays(),
    connectionsService.findConnections(),
    menusService.findMenus(),
  ]);

  return { ...counts, contractEnding, birthdays, connections, menus };
};

export default { findSummary };
