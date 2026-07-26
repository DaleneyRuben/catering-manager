import { getPrimarySubscription } from '../_helpers';

describe('getPrimarySubscription', () => {
  it('returns null for an empty list', () => {
    expect(getPrimarySubscription([])).toBeNull();
  });

  it('returns the only subscription when there is just one', () => {
    const sub = { id: 5, paid: true };
    expect(getPrimarySubscription([sub])).toBe(sub);
  });

  it('prefers a paid subscription over a newer unpaid one', () => {
    const paid = { id: 5, paid: true };
    const unpaid = { id: 8, paid: false };
    expect(getPrimarySubscription([unpaid, paid])).toBe(paid);
  });

  it('falls back to the highest id when multiple subscriptions share paid status', () => {
    const older = { id: 5, paid: true };
    const newer = { id: 9, paid: true };
    expect(getPrimarySubscription([older, newer])).toBe(newer);
  });

  it('does not mutate the input array', () => {
    const unpaid = { id: 8, paid: false };
    const paid = { id: 5, paid: true };
    const subs = [unpaid, paid];

    getPrimarySubscription(subs);

    expect(subs).toEqual([unpaid, paid]);
  });
});
