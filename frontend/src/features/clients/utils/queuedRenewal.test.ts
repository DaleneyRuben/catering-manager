import type { Subscription } from '@/features/clients/types';
import { findQueuedRenewal } from './queuedRenewal';

const today = '2026-07-28';

const sub = (over: Partial<Subscription>): Subscription =>
  ({
    id: 's1',
    startDate: '2026-06-30',
    contractEndDate: '2026-07-28',
    finalizedAt: null,
    duration: 20,
    plan: { id: 'p1', name: 'Completo', meals: [], price: 1390 },
    ...over,
  }) as Subscription;

describe('findQueuedRenewal', () => {
  it('returns the subscription that starts after today', () => {
    const running = sub({ id: 'running' });
    const renewal = sub({ id: 'renewal', startDate: '2026-07-29', contractEndDate: '2026-08-25' });

    expect(findQueuedRenewal([running, renewal], today)?.id).toBe('renewal');
  });

  it('returns a renewal that has no start date yet', () => {
    const running = sub({ id: 'running' });
    const renewal = sub({ id: 'renewal', startDate: null, contractEndDate: null });

    expect(findQueuedRenewal([running, renewal], today)?.id).toBe('renewal');
  });

  it('returns null when the only subscription has not started yet', () => {
    const programado = sub({ id: 'programado', startDate: '2026-08-03' });

    expect(findQueuedRenewal([programado], today)).toBeNull();
  });

  it('returns null when every subscription has already started', () => {
    expect(findQueuedRenewal([sub({ id: 'running' }), sub({ id: 'past' })], today)).toBeNull();
  });

  it('ignores a finalized subscription that starts in the future', () => {
    const running = sub({ id: 'running' });
    const finalized = sub({ id: 'finalized', startDate: '2026-07-29', finalizedAt: '2026-07-20' });

    expect(findQueuedRenewal([running, finalized], today)).toBeNull();
  });

  it('does not treat a subscription starting today as queued', () => {
    const running = sub({ id: 'running' });
    const startingToday = sub({ id: 'starting', startDate: today });

    expect(findQueuedRenewal([running, startingToday], today)).toBeNull();
  });

  it('returns null when there are no subscriptions', () => {
    expect(findQueuedRenewal([], today)).toBeNull();
  });
});
