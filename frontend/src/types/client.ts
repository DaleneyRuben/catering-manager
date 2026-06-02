import { parseISO, isAfter } from 'date-fns';
import { businessDaysUntil } from '../utils/businessDays';
import { EXPIRY_THRESHOLD_DAYS } from '../constants/subscription';

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
  discount: number;
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
  if (!sub || !isAfter(parseISO(sub.contractEndDate), today)) return 'ended';
  if (!client.isActive) return 'paused';
  if (businessDaysUntil(today, parseISO(sub.contractEndDate)) <= EXPIRY_THRESHOLD_DAYS)
    return 'expiring';
  return 'active';
}
