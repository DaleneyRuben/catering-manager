import type { HistoryEventType } from '@/features/clients/constants/historyEvents';
import type { Plan } from '@/features/plans/types';

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
  specialInstructions: Record<string, string>;
  plan: Plan;
  paid: boolean;
}

// What the plan card can move in one edit. `planId` and `duration` are omitted when they did not
// change, so an untouched plan never writes a spurious terms_changed on the backend.
export interface SubscriptionTermsDraft {
  discount: number;
  planId?: string;
  duration?: number;
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

export type { HistoryEventType };

export interface ClientHistoryEntry {
  id: string;
  clientId: string;
  eventType: HistoryEventType;
  occurredAt: string;
  metadata: Record<string, unknown>;
  // null on entries recorded before the acting user was tracked
  username: string | null;
}

export type ClientStatus = 'active' | 'paused' | 'expiring' | 'ended' | 'suspended' | 'future';

export interface RenewalPayload {
  planId: string;
  contractDate: string;
  startDate?: string | null;
  duration: number;
  discount: number;
  renewalType: 'renewal' | 'reactivation';
  paid?: boolean;
}

export interface NewClientFormValues {
  name: string;
  sex: string;
  dateOfBirth: string;
  phoneNumber: string;
  address: string;
  deliveryZone: string;
  delivery: string;
  nit: string;
  businessName: string;
  planId: string | null;
  contractDate: string;
  startDate: string;
  duration: number;
  discount: number;
  specialInstructions: Record<string, string>;
}

export interface RestrictionsState {
  restrictions: string[];
  underlyingDiseases: string[];
}
