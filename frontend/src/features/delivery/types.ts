export interface DeliveryPerson {
  id: string;
  name: string;
  phone: string;
  deliveryZone: string;
  address: string;
  isNew: boolean;
}

export interface DeliveryGroup {
  groupToken: string;
  members: DeliveryPerson[];
}

export interface DeliveryZone {
  zone: string;
  deliveryCount: number;
  groups: DeliveryGroup[];
  singles: DeliveryPerson[];
}

export interface DeliveryDayRoute {
  zones: DeliveryZone[];
}

export type DeliveryRouteResponse = Record<string, DeliveryDayRoute>;
