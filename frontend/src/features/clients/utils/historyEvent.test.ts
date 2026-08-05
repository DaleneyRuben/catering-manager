import { HISTORY_EVENTS } from '@/features/clients/constants/historyEvents';
import type { ClientHistoryEntry } from '@/features/clients/types';
import {
  resolveEventLabel,
  resolveEventChange,
  resolveEventTotal,
} from '@/features/clients/utils/historyEvent';

const entry = (overrides: Partial<ClientHistoryEntry> = {}): ClientHistoryEntry => ({
  id: '1',
  clientId: '1',
  eventType: HISTORY_EVENTS.TERMS_CHANGED,
  occurredAt: '2026-08-03T14:20:00',
  metadata: {},
  username: 'Daleney',
  ...overrides,
});

const planChange = (metadata: Record<string, unknown>) => entry({ metadata });

// Rows written before the subscription carried its own price record discount/previousDiscount
// instead. History is append-only, so both shapes are read forever.
describe('resolveEventLabel on rows carrying the subscription price', () => {
  it('names a price move by the price', () => {
    expect(
      resolveEventLabel(
        planChange({
          planId: '2',
          planName: 'Reductor',
          planPrice: 1450,
          previousPlanId: '2',
          previousPlanName: 'Reductor',
          price: 1300,
          previousPrice: 1450,
        }),
      ),
    ).toBe('Precio modificado');
  });

  // A plan change moves no money, so the price is identical on both sides and only the plan moved.
  it('names a plan move by the plan when the price rode through unchanged', () => {
    expect(
      resolveEventLabel(
        planChange({
          planId: '5',
          planName: 'Completo',
          planPrice: 1800,
          previousPlanId: '2',
          previousPlanName: 'Ligero',
          price: 1450,
          previousPrice: 1450,
        }),
      ),
    ).toBe('Plan modificado');
  });

  it('names both when the plan and the price moved together', () => {
    expect(
      resolveEventLabel(
        planChange({
          planId: '5',
          planName: 'Completo',
          planPrice: 1800,
          previousPlanId: '2',
          previousPlanName: 'Ligero',
          price: 1700,
          previousPrice: 1450,
        }),
      ),
    ).toBe('Plan y precio modificados');
  });
});

describe('resolveEventChange on rows carrying the subscription price', () => {
  it('reads both totals straight off the row instead of reconstructing them', () => {
    expect(
      resolveEventChange(
        planChange({
          planId: '2',
          planName: 'Reductor',
          planPrice: 1450,
          previousPlanId: '2',
          previousPlanName: 'Reductor',
          price: 1300,
          previousPrice: 1450,
        }),
      ),
    ).toBe('antes 1.450 · ahora 1.300/mes');
  });

  // The previous total used to be unreconstructible after a plan move, so it was omitted. With the
  // price stored on the subscription it survives the change and can be shown alongside.
  it('shows the unchanged total beside a plan that moved', () => {
    expect(
      resolveEventChange(
        planChange({
          planId: '5',
          planName: 'Completo',
          planPrice: 1800,
          previousPlanId: '2',
          previousPlanName: 'Ligero',
          price: 1450,
          previousPrice: 1450,
        }),
      ),
    ).toBe('antes Ligero · ahora Completo · 1.450/mes');
  });

  it('shows both plans and both totals when the plan and the price moved together', () => {
    expect(
      resolveEventChange(
        planChange({
          planId: '5',
          planName: 'Completo',
          planPrice: 1800,
          previousPlanId: '2',
          previousPlanName: 'Ligero',
          price: 1700,
          previousPrice: 1450,
        }),
      ),
    ).toBe('antes Ligero 1.450 · ahora Completo 1.700/mes');
  });
});

describe('resolveEventTotal', () => {
  it('reads the agreed total straight off a row that carries it', () => {
    expect(
      resolveEventTotal(
        entry({
          eventType: HISTORY_EVENTS.PLAN_ASSIGNED,
          metadata: { planName: 'Completo', planPrice: 1800, price: 1450 },
        }),
      ),
    ).toBe(1450);
  });

  it('reconstructs the total from the plan price and discount on a legacy row', () => {
    expect(
      resolveEventTotal(
        entry({
          eventType: HISTORY_EVENTS.PLAN_ASSIGNED,
          metadata: { planName: 'Completo', planPrice: 1800, discount: 350 },
        }),
      ),
    ).toBe(1450);
  });

  it('says nothing when the row records no price at all', () => {
    expect(
      resolveEventTotal(entry({ eventType: HISTORY_EVENTS.PLAN_ASSIGNED, metadata: {} })),
    ).toBeNull();
  });
});

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
    expect(resolveEventLabel(entry({ eventType: HISTORY_EVENTS.PLAN_REACTIVATED }))).toBe(
      'Plan reactivado',
    );
  });

  it('calls a contract edit a change of dates', () => {
    expect(resolveEventLabel(entry({ eventType: HISTORY_EVENTS.DATES_CHANGED }))).toBe(
      'Fechas modificadas',
    );
  });

  it('leaves the events that already say what they do alone', () => {
    expect(resolveEventLabel(entry({ eventType: HISTORY_EVENTS.PLAN_PAUSED }))).toBe(
      'Plan pausado',
    );
    expect(resolveEventLabel(entry({ eventType: HISTORY_EVENTS.PLAN_RENEWED }))).toBe(
      'Plan renovado',
    );
    expect(resolveEventLabel(entry({ eventType: HISTORY_EVENTS.PLAN_FINALIZED }))).toBe(
      'Plan finalizado',
    );
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
        eventType: HISTORY_EVENTS.DATES_CHANGED,
        metadata: { startDate: '2026-08-03', duration: 25, contractEndDate: '2026-09-05' },
      }),
    );

    expect(change).toBe('03/08/2026 → 05/09/2026 · 25 días');
  });

  it('says nothing for an event that carries no change to describe', () => {
    expect(
      resolveEventChange(entry({ eventType: HISTORY_EVENTS.PLAN_PAUSED, metadata: {} })),
    ).toBeNull();
    expect(resolveEventChange(planChange({ planName: 'Completo' }))).toBeNull();
  });
});
