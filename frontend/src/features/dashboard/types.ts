export interface ContractEndingPerson {
  id: string;
  name: string;
  plan: string;
  date: string;
}

export interface BirthdayPerson {
  id: string;
  name: string;
  dateOfBirth: string;
  isToday: boolean;
}

export interface Connection {
  username: string;
  lastLoginAt: string;
  online: boolean;
  lastDeviceType: string | null;
  lastOs: string | null;
  lastBrowser: string | null;
}

export interface MenuStatus {
  date: string;
  loaded: boolean;
}

export interface DashboardSummary {
  active: { today: number; tomorrow: number };
  suspended: { today: number; tomorrow: number };
  deliveriesToday: number;
  contractEnding: { today: ContractEndingPerson[]; tomorrow: ContractEndingPerson[] };
  birthdays: BirthdayPerson[];
  connections: Connection[];
  menus: { today: MenuStatus; tomorrow: MenuStatus };
}
