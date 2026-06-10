export interface Plan {
  id: number;
  name: string;
  meals: string[];
  price: number;
}

export interface Subscription {
  id: number;
  clientId: number;
  planId: number;
  contractDate: string;
  startDate: string | null;
  contractEndDate: string | null;
  discount: number;
  duration: number;
  suspendedDates: string[];
  plan: Plan;
}

export interface Client {
  id: number;
  name: string;
  sex: string;
  dateOfBirth: string;
  phoneNumber: string;
  address: string;
  deliveryZone: string;
  delivery: string;
  nit: string | null;
  businessName: string | null;
  underlyingDiseases: string[];
  restrictions: string[];
  pausedSince: string | null;
  subscriptions: Subscription[];
  status: ClientStatus;
}

export type HistoryEventType =
  | 'paused'
  | 'resumed'
  | 'plan_assigned'
  | 'plan_changed'
  | 'suspended'
  | 'reactivated'
  | 'finalized'
  | 'deleted';

export interface ClientHistoryEntry {
  id: number;
  clientId: number;
  eventType: HistoryEventType;
  occurredAt: string;
  metadata: Record<string, unknown>;
}

export type ClientStatus = 'active' | 'paused' | 'expiring' | 'ended' | 'suspended' | 'future';
