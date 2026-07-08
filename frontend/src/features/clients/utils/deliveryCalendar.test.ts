import { buildDeliveryCalendar } from './deliveryCalendar';

describe('buildDeliveryCalendar', () => {
  it('classifies days up to and including asOf as delivered', () => {
    const { months } = buildDeliveryCalendar({
      contractStart: '2026-06-24',
      contractEndDate: '2026-06-26',
      asOf: '2026-06-25',
      suspendedDates: [],
    });

    const cells = months.flatMap((m) => m.weeks.flat()).filter((c) => c !== null);
    const byDate = (date: string) => cells.find((c) => c?.date === date);
    expect(byDate('2026-06-24')?.status).toBe('delivered');
    expect(byDate('2026-06-25')?.status).toBe('delivered');
    expect(byDate('2026-06-26')?.status).toBe('pending');
  });

  it('classifies a suspended day as suspended even if before asOf', () => {
    const { months } = buildDeliveryCalendar({
      contractStart: '2026-06-24',
      contractEndDate: '2026-06-26',
      asOf: '2026-06-25',
      suspendedDates: ['2026-06-25'],
    });

    const cells = months.flatMap((m) => m.weeks.flat()).filter((c) => c !== null);
    const byDate = (date: string) => cells.find((c) => c?.date === date);
    expect(byDate('2026-06-24')?.status).toBe('delivered');
    expect(byDate('2026-06-25')?.status).toBe('suspended');
    expect(byDate('2026-06-26')?.status).toBe('pending');
  });

  it('classifies days outside the contract range as out, within the same displayed month', () => {
    const { months } = buildDeliveryCalendar({
      contractStart: '2026-06-29',
      contractEndDate: '2026-07-02',
      asOf: '2026-07-02',
      suspendedDates: [],
    });

    expect(months).toHaveLength(2);
    expect(months[0].label).toBe('Jun 2026');
    expect(months[1].label).toBe('Jul 2026');

    const julyWeek = months[1].weeks[0];
    expect(julyWeek).toEqual([
      null,
      null,
      { date: '2026-07-01', status: 'delivered' },
      { date: '2026-07-02', status: 'delivered' },
      { date: '2026-07-03', status: 'out' },
    ]);
  });

  it('counts delivered days across all months', () => {
    const { deliveredCount } = buildDeliveryCalendar({
      contractStart: '2026-06-29',
      contractEndDate: '2026-07-02',
      asOf: '2026-07-02',
      suspendedDates: [],
    });

    expect(deliveredCount).toBe(4);
  });

  it('excludes suspended and pending days from the delivered count', () => {
    const { deliveredCount } = buildDeliveryCalendar({
      contractStart: '2026-06-24',
      contractEndDate: '2026-06-26',
      asOf: '2026-06-25',
      suspendedDates: ['2026-06-25'],
    });

    expect(deliveredCount).toBe(1);
  });
});
