export interface Plan {
  id: string;
  name: string;
  meals: string[];
  price: number;
}

export interface Subscription {
  id: string;
  clientId: string;
  planId: string;
  contractDate: string;
  startDate: string | null;
  contractEndDate: string | null;
  discount: number;
  duration: number;
  suspendedDates: string[];
  finalizedAt: string | null;
  plan: Plan;
}

export interface GroupMember {
  id: string;
  name: string;
}

export interface Client {
  id: string;
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
  groupMembers: GroupMember[];
}

export type HistoryEventType =
  | 'paused'
  | 'resumed'
  | 'plan_assigned'
  | 'plan_renewed'
  | 'plan_changed'
  | 'suspended'
  | 'reactivated'
  | 'finalized'
  | 'deleted';

export interface ClientHistoryEntry {
  id: string;
  clientId: string;
  eventType: HistoryEventType;
  occurredAt: string;
  metadata: Record<string, unknown>;
}

export type ClientStatus = 'active' | 'paused' | 'expiring' | 'ended' | 'suspended' | 'future';

export interface RenewalPayload {
  planId: string;
  contractDate: string;
  startDate?: string | null;
  duration: number;
  discount: number;
  renewalType: 'renewal' | 'reactivation';
}
