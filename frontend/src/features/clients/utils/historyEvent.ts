import {
  EVENT_LABELS,
  HISTORY_EVENTS,
  PLAN_CHANGE_LABELS,
} from '@/features/clients/constants/historyEvents';
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

// What a terms_changed row actually records. Rows written before the previous values were stored
// return null, and the caller falls back to the generic label with no change line.
//
// Two shapes reach this. Rows written once the subscription carried its own price hold the totals
// directly; older ones hold the discount off a plan price, and the total has to be reconstructed
// from both. History is append-only, so the old shape is read forever.
type PlanChange = {
  planMoved: boolean;
  priceMoved: boolean;
  previousTotal: number | null;
  total: number | null;
} | null;

const readPlanChange = (meta: Metadata): PlanChange => {
  const previousPlanId = meta?.previousPlanId;
  if (previousPlanId === undefined) return null;

  const planMoved = String(previousPlanId) !== String(meta?.planId);

  const previousPrice = num(meta?.previousPrice);
  if (previousPrice !== null) {
    const price = num(meta?.price);
    return {
      planMoved,
      priceMoved: previousPrice !== price,
      previousTotal: previousPrice,
      total: price,
    };
  }

  const previousDiscount = num(meta?.previousDiscount);
  if (previousDiscount === null) return null;

  // Legacy row: only the new plan's price was stored, so the previous total is reconstructible
  // only while the plan stayed put.
  const planPrice = num(meta?.planPrice);
  const discount = num(meta?.discount);
  return {
    planMoved,
    priceMoved: previousDiscount !== discount,
    previousTotal: planMoved || planPrice === null ? null : planPrice - previousDiscount,
    total: planMoved || planPrice === null || discount === null ? null : planPrice - discount,
  };
};

export const resolveEventLabel = (entry: ClientHistoryEntry): string => {
  // an unrecognised key means a row written by an older deploy, or read before the rename
  // migration has run — showing the raw key beats leaving the timeline row blank
  if (entry.eventType !== HISTORY_EVENTS.TERMS_CHANGED) {
    return EVENT_LABELS[entry.eventType] ?? entry.eventType;
  }

  const change = readPlanChange(entry.metadata);
  if (!change) return EVENT_LABELS.terms_changed;

  if (change.planMoved && change.priceMoved) return PLAN_CHANGE_LABELS.both;
  if (change.planMoved) return PLAN_CHANGE_LABELS.plan;
  if (change.priceMoved) return PLAN_CHANGE_LABELS.price;
  return EVENT_LABELS.terms_changed;
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

  const { previousTotal, total } = change;

  if (change.planMoved) {
    const previousPlanName = str(meta?.previousPlanName);
    const planName = str(meta?.planName);
    if (!previousPlanName || !planName) return null;

    // A legacy row cannot say what the client paid before a plan move, so the plan is described
    // alone rather than beside a total we would be guessing at.
    if (previousTotal === null || total === null) {
      return `antes ${previousPlanName} · ahora ${planName}`;
    }

    // A plan change moves no money, so the two totals usually match — saying it once is what a
    // reader expects. They differ only when a price correction rode along with the plan.
    if (previousTotal === total) {
      return `antes ${previousPlanName} · ahora ${planName} · ${money(total)}/mes`;
    }

    return `antes ${previousPlanName} ${money(previousTotal)} · ahora ${planName} ${money(total)}/mes`;
  }

  if (change.priceMoved) {
    if (previousTotal === null || total === null) return null;
    return `antes ${money(previousTotal)} · ahora ${money(total)}/mes`;
  }

  return null;
};

// The total a plan-assignment row records. Rows written once the subscription carried its own
// price hold it directly; older ones hold the plan's price and a discount off it.
export const resolveEventTotal = (entry: ClientHistoryEntry): number | null => {
  const meta = entry.metadata;

  const price = num(meta?.price);
  if (price !== null) return price;

  const planPrice = num(meta?.planPrice);
  if (planPrice === null) return null;
  return planPrice - (num(meta?.discount) ?? 0);
};

export const resolveEventChange = (entry: ClientHistoryEntry): string | null => {
  if (entry.eventType === HISTORY_EVENTS.DATES_CHANGED) return describeContractEdit(entry.metadata);
  if (entry.eventType === HISTORY_EVENTS.TERMS_CHANGED) return describePlanChange(entry.metadata);
  return null;
};
