export type DayClient = {
  id: number;
  name: string;
  phoneNumber: string;
  deliveryZone: string;
};

export type DayClients = {
  date: string;
  count: number;
  clients: DayClient[];
};

export const findDayClients = async (_date: string): Promise<DayClients> => {
  throw new Error('not implemented');
};
