import { addBusinessDays, remainingDeliveryDays } from './businessDays';

describe('addBusinessDays', () => {
  it('returns the same date for 0 days', () => {
    expect(addBusinessDays('2026-05-25', 0)).toBe('2026-05-25');
  });

  it('skips the weekend: Friday + 1 = Monday', () => {
    expect(addBusinessDays('2026-05-29', 1)).toBe('2026-06-01');
  });

  it('adds 5 business days: Monday + 5 = next Monday', () => {
    expect(addBusinessDays('2026-05-25', 5)).toBe('2026-06-01');
  });

  it('adds 20 business days for a 4-week plan', () => {
    expect(addBusinessDays('2026-05-25', 20)).toBe('2026-06-22');
  });
});

describe('remainingDeliveryDays', () => {
  it('returns 0 when plan has already ended', () => {
    const today = new Date(2026, 5, 10); // Jun 10
    const start = new Date(2026, 4, 1); // May 1
    const end = new Date(2026, 5, 1); // Jun 1
    expect(remainingDeliveryDays(start, end, today)).toBe(0);
  });

  it('counts from startDate to endDate when plan has not started yet', () => {
    const today = new Date(2026, 5, 1); // Mon Jun 1
    const start = new Date(2026, 5, 3); // Wed Jun 3
    const end = new Date(2026, 5, 10); // Wed Jun 10 — Thu, Fri, Mon, Tue, Wed = 5
    expect(remainingDeliveryDays(start, end, today)).toBe(5);
  });

  it('subtracts 1 when plan has started and today is a business day', () => {
    const today = new Date(2026, 5, 1); // Mon Jun 1
    const start = new Date(2026, 4, 25); // Mon May 25, already started
    const end = new Date(2026, 5, 8); // Mon Jun 8 — Tue–Fri + Mon = 5, minus 1 = 4
    expect(remainingDeliveryDays(start, end, today)).toBe(4);
  });

  it('does not subtract 1 when today is a weekend', () => {
    const today = new Date(2026, 5, 7); // Sun Jun 7
    const start = new Date(2026, 4, 25); // May 25, already started
    const end = new Date(2026, 5, 12); // Fri Jun 12
    // date-fns v4 normalises the Sunday start to Monday before counting,
    // so this returns the same as Mon Jun8 → Fri Jun12 = 4 (Tue–Fri)
    expect(remainingDeliveryDays(start, end, today)).toBe(4);
  });
});
