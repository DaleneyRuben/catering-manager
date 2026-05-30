import { parseISO, isBefore, differenceInDays } from 'date-fns';

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
  startDate: string;
  contractEndDate: string;
  plan: Plan;
}

export interface Client {
  id: number;
  name: string;
  sex: string;
  dateOfBirth: string;
  phoneNumber: string;
  address: string;
  zone: string;
  delivery: string;
  nit: string | null;
  businessName: string | null;
  underlyingDiseases: string[];
  restrictions: string[];
  isActive: boolean;
  subscriptions: Subscription[];
}

export type HistoryEventType =
  | 'paused'
  | 'resumed'
  | 'plan_assigned'
  | 'plan_changed'
  | 'suspended'
  | 'reactivated'
  | 'finalized';

export interface ClientHistoryEntry {
  id: number;
  clientId: number;
  eventType: HistoryEventType;
  occurredAt: string;
  metadata: Record<string, unknown>;
}

export type ClientStatus = 'active' | 'paused' | 'expiring' | 'ended';

export function clientStatus(client: Client, today = new Date()): ClientStatus {
  const sub = client.subscriptions[0];
  if (!sub || isBefore(parseISO(sub.contractEndDate), today)) return 'ended';
  if (!client.isActive) return 'paused';
  if (differenceInDays(parseISO(sub.contractEndDate), today) <= 7) return 'expiring';
  return 'active';
}
