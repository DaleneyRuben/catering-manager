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
