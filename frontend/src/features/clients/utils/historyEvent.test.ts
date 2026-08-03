import type { ClientHistoryEntry } from '@/features/clients/types';
import { resolveEventLabel, resolveEventChange } from '@/features/clients/utils/historyEvent';

const entry = (overrides: Partial<ClientHistoryEntry> = {}): ClientHistoryEntry => ({
  id: '1',
  clientId: '1',
  eventType: 'terms_changed',
  occurredAt: '2026-08-03T14:20:00',
  metadata: {},
  username: 'Daleney',
  ...overrides,
});

const planChange = (metadata: Record<string, unknown>) => entry({ metadata });

describe('resolveEventLabel', () => {
  it('names a price move by the price, not by the plan', () => {
    const label = resolveEventLabel(
      planChange({
        planId: '2',
        planName: 'Reductor',
        planPrice: 1450,
        previousPlanId: '2',
        previousPlanName: 'Reductor',
        discount: 150,
        previousDiscount: 0,
      }),
    );

    expect(label).toBe('Precio modificado');
  });

  it('names a plan move by the plan', () => {
    const label = resolveEventLabel(
      planChange({
        planId: '5',
        planName: 'Completo',
        planPrice: 1800,
        previousPlanId: '2',
        previousPlanName: 'Ligero',
        discount: 0,
        previousDiscount: 0,
      }),
    );

    expect(label).toBe('Plan modificado');
  });

  it('names both when the plan and the price moved together', () => {
    const label = resolveEventLabel(
      planChange({
        planId: '5',
        planName: 'Completo',
        planPrice: 1800,
        previousPlanId: '2',
        previousPlanName: 'Ligero',
        discount: 250,
        previousDiscount: 100,
      }),
    );

    expect(label).toBe('Plan y precio modificados');
  });

  it('falls back to the plain plan label when a legacy row carries no previous values', () => {
    expect(resolveEventLabel(planChange({ planName: 'Completo' }))).toBe('Plan modificado');
  });

  it('calls a reactivation a plan reactivation, matching a renewal', () => {
    expect(resolveEventLabel(entry({ eventType: 'plan_reactivated' }))).toBe('Plan reactivado');
  });

  it('calls a contract edit a change of dates', () => {
    expect(resolveEventLabel(entry({ eventType: 'dates_changed' }))).toBe('Fechas modificadas');
  });

  it('leaves the events that already say what they do alone', () => {
    expect(resolveEventLabel(entry({ eventType: 'plan_paused' }))).toBe('Plan pausado');
    expect(resolveEventLabel(entry({ eventType: 'plan_renewed' }))).toBe('Plan renovado');
    expect(resolveEventLabel(entry({ eventType: 'plan_finalized' }))).toBe('Plan finalizado');
  });

  // a row written by an older deploy, or read before the rename migration has run: showing the
  // raw key beats showing an empty timeline row
  it('shows the raw key rather than nothing when it does not recognise the event', () => {
    const unknown = { ...entry(), eventType: 'paused' } as unknown as ClientHistoryEntry;
    expect(resolveEventLabel(unknown)).toBe('paused');
  });
});

describe('resolveEventChange', () => {
  it('shows what the client paid before and pays now', () => {
    const change = resolveEventChange(
      planChange({
        planId: '2',
        planName: 'Reductor',
        planPrice: 1450,
        previousPlanId: '2',
        previousPlanName: 'Reductor',
        discount: 150,
        previousDiscount: 0,
      }),
    );

    expect(change).toBe('antes 1.450 · ahora 1.300/mes');
  });

  it('shows the plan the client came from and moved to', () => {
    const change = resolveEventChange(
      planChange({
        planId: '5',
        planName: 'Completo',
        planPrice: 1800,
        previousPlanId: '2',
        previousPlanName: 'Ligero',
        discount: 0,
        previousDiscount: 0,
      }),
    );

    expect(change).toBe('antes Ligero · ahora Completo');
  });

  // the previous plan's price is not stored, so the old total cannot be reconstructed
  it('shows only the plan move when both moved, never a total it cannot compute', () => {
    const change = resolveEventChange(
      planChange({
        planId: '5',
        planName: 'Completo',
        planPrice: 1800,
        previousPlanId: '2',
        previousPlanName: 'Ligero',
        discount: 250,
        previousDiscount: 100,
      }),
    );

    expect(change).toBe('antes Ligero · ahora Completo');
  });

  it('shows the contract span and its duration on a dates edit', () => {
    const change = resolveEventChange(
      entry({
        eventType: 'dates_changed',
        metadata: { startDate: '2026-08-03', duration: 25, contractEndDate: '2026-09-05' },
      }),
    );

    expect(change).toBe('03/08/2026 → 05/09/2026 · 25 días');
  });

  it('says nothing for an event that carries no change to describe', () => {
    expect(resolveEventChange(entry({ eventType: 'plan_paused', metadata: {} }))).toBeNull();
    expect(resolveEventChange(planChange({ planName: 'Completo' }))).toBeNull();
  });
});
