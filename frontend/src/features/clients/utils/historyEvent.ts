import { EVENT_LABELS, PLAN_CHANGE_LABELS } from '@/features/clients/constants/historyEvents';
import type { ClientHistoryEntry } from '@/features/clients/types';
import { formatDate } from '@/utils/format';

type Metadata = ClientHistoryEntry['metadata'];

const num = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const parsed = parseFloat(String(value));
  return Number.isNaN(parsed) ? null : parsed;
};

const str = (value: unknown): string | null => (typeof value === 'string' ? value : null);

const money = (amount: number) => amount.toLocaleString('es-BO');

// What a plan_changed row actually records. Rows written before the previous values were stored
// return null for both, and the caller falls back to the generic label with no change line.
type PlanChange = { planMoved: boolean; priceMoved: boolean } | null;

const readPlanChange = (meta: Metadata): PlanChange => {
  const previousPlanId = meta?.previousPlanId;
  const previousDiscount = num(meta?.previousDiscount);
  if (previousPlanId === undefined || previousDiscount === null) return null;

  return {
    planMoved: String(previousPlanId) !== String(meta?.planId),
    priceMoved: previousDiscount !== num(meta?.discount),
  };
};

export const resolveEventLabel = (entry: ClientHistoryEntry): string => {
  if (entry.eventType !== 'plan_changed') return EVENT_LABELS[entry.eventType];

  const change = readPlanChange(entry.metadata);
  if (!change) return EVENT_LABELS.plan_changed;

  if (change.planMoved && change.priceMoved) return PLAN_CHANGE_LABELS.both;
  if (change.planMoved) return PLAN_CHANGE_LABELS.plan;
  if (change.priceMoved) return PLAN_CHANGE_LABELS.price;
  return EVENT_LABELS.plan_changed;
};

const describeContractEdit = (meta: Metadata): string | null => {
  const startDate = str(meta?.startDate);
  const contractEndDate = str(meta?.contractEndDate);
  const duration = num(meta?.duration);
  if (!startDate || !contractEndDate || duration === null) return null;

  return `${formatDate(startDate)} → ${formatDate(contractEndDate)} · ${duration} días`;
};

const describePlanChange = (meta: Metadata): string | null => {
  const change = readPlanChange(meta);
  if (!change) return null;

  if (change.planMoved) {
    const previousPlanName = str(meta?.previousPlanName);
    const planName = str(meta?.planName);
    if (!previousPlanName || !planName) return null;
    // The previous plan's price is not recorded, so when the plan moved the old total cannot be
    // reconstructed — the plan move is described alone rather than with a total we would guess.
    return `antes ${previousPlanName} · ahora ${planName}`;
  }

  if (change.priceMoved) {
    const planPrice = num(meta?.planPrice);
    const discount = num(meta?.discount);
    const previousDiscount = num(meta?.previousDiscount);
    if (planPrice === null || discount === null || previousDiscount === null) return null;
    return `antes ${money(planPrice - previousDiscount)} · ahora ${money(planPrice - discount)}/mes`;
  }

  return null;
};

export const resolveEventChange = (entry: ClientHistoryEntry): string | null => {
  if (entry.eventType === 'contract_updated') return describeContractEdit(entry.metadata);
  if (entry.eventType === 'plan_changed') return describePlanChange(entry.metadata);
  return null;
};
