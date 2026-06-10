import { parseISO, isAfter, format } from 'date-fns';
import { businessDaysUntil } from '../utils/businessDays';
import { EXPIRY_THRESHOLD_DAYS } from '../constants/subscription';
import { CLIENT_STATUS } from '../constants/clientStatus';

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
  | 'finalized'
  | 'deleted';

export interface ClientHistoryEntry {
  id: number;
  clientId: number;
  eventType: HistoryEventType;
  occurredAt: string;
  metadata: Record<string, unknown>;
}

export type ClientStatus = 'active' | 'paused' | 'expiring' | 'ended' | 'suspended';

export function clientStatus(client: Client, today = new Date()): ClientStatus {
  const sub = client.subscriptions[0];
  if (!sub || (sub.contractEndDate && !isAfter(parseISO(sub.contractEndDate), today)))
    return CLIENT_STATUS.ENDED;
  if (!client.isActive) return CLIENT_STATUS.PAUSED;
  // Subscription hasn't started yet — treat as paused until start date arrives
  if (sub.startDate && isAfter(parseISO(sub.startDate), today)) return CLIENT_STATUS.PAUSED;
  const todayIso = format(today, 'yyyy-MM-dd');
  if (sub.suspendedDates?.includes(todayIso)) return CLIENT_STATUS.SUSPENDED;
  if (
    sub.contractEndDate &&
    businessDaysUntil(today, parseISO(sub.contractEndDate)) <= EXPIRY_THRESHOLD_DAYS
  )
    return CLIENT_STATUS.EXPIRING;
  return CLIENT_STATUS.ACTIVE;
}
