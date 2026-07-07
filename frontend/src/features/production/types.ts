export interface ProductionGroups {
  juice: string[];
  lunchOnly: string[];
  lunchAndDinner: string[];
  full: string[];
}

export interface ProductionSummary {
  date: string;
  isDeliveryDay: boolean;
  total: number;
  groups: ProductionGroups;
}

export interface WeeklyDayCount {
  date: string;
  count: number;
}

export interface WeeklyCounts {
  weekStart: string;
  weekEnd: string;
  days: WeeklyDayCount[];
}

export interface ProductionData extends ProductionSummary {
  weeklyCounts: WeeklyCounts;
}
