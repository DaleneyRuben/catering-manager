import { groupByDay } from '@/utils/groupByDay';

describe('groupByDay', () => {
  it('groups items by calendar day preserving order', () => {
    const items = [
      { createdAt: '2026-07-04T10:00:00', id: 1 },
      { createdAt: '2026-07-04T08:00:00', id: 2 },
      { createdAt: '2026-07-02T09:00:00', id: 3 },
    ];

    expect(groupByDay(items)).toEqual([
      { date: '2026-07-04T10:00:00', items: [items[0], items[1]] },
      { date: '2026-07-02T09:00:00', items: [items[2]] },
    ]);
  });

  it('separates same clock time on different days', () => {
    const items = [
      { createdAt: '2026-07-04T08:00:00', id: 1 },
      { createdAt: '2026-07-03T08:00:00', id: 2 },
    ];

    expect(groupByDay(items)).toHaveLength(2);
  });

  it('returns an empty array for no items', () => {
    expect(groupByDay([])).toEqual([]);
  });
});
