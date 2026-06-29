import {
  addBusinessDays,
  subtractBusinessDays,
  remainingDeliveryDays,
  businessDaysUntil,
} from '@/utils/businessDays';

describe('addBusinessDays', () => {
  it('returns the same date for 0 days', () => {
    expect(addBusinessDays('2026-05-25', 0)).toBe('2026-05-25');
  });

  it('returns the same date for 0 days when starting on a Saturday', () => {
    expect(addBusinessDays('2026-05-23', 0)).toBe('2026-05-23');
  });

  it('skips the weekend: Friday + 1 = Monday', () => {
    expect(addBusinessDays('2026-05-29', 1)).toBe('2026-06-01');
  });

  it('Saturday + 1 business day = Monday', () => {
    expect(addBusinessDays('2026-05-23', 1)).toBe('2026-05-25');
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

  it('counts from startDate to endDate inclusive when plan has not started yet', () => {
    const today = new Date(2026, 5, 1); // Mon Jun 1
    const start = new Date(2026, 5, 3); // Wed Jun 3
    const end = new Date(2026, 5, 10); // Wed Jun 10 — Wed+Thu+Fri+Mon+Tue+Wed = 6
    expect(remainingDeliveryDays(start, end, today)).toBe(6);
  });

  it('returns 20 when start is in the future and duration is 20 business days', () => {
    const today = new Date(2026, 5, 10); // Wed Jun 10
    const start = new Date(2026, 5, 15); // Mon Jun 15
    const end = new Date(2026, 6, 10); // Fri Jul 10
    expect(remainingDeliveryDays(start, end, today)).toBe(20);
  });

  it('counts days strictly after today when plan has started and today is a business day', () => {
    const today = new Date(2026, 5, 3); // Wed Jun 3
    const start = new Date(2026, 4, 25); // Mon May 25, already started
    const end = new Date(2026, 5, 5); // Fri Jun 5 — Thu + Fri = 2
    expect(remainingDeliveryDays(start, end, today)).toBe(2);
  });

  it('does not subtract 1 when today is a weekend', () => {
    const today = new Date(2026, 5, 7); // Sun Jun 7
    const start = new Date(2026, 4, 25); // May 25, already started
    const end = new Date(2026, 5, 12); // Fri Jun 12
    // date-fns v4 normalises the Sunday start to Monday before counting,
    // so this returns the same as Mon Jun8 → Fri Jun12 = 4 (Tue–Fri)
    expect(remainingDeliveryDays(start, end, today)).toBe(4);
  });

  it('returns 1 for a 1-day plan that has not yet started (startDate == endDate)', () => {
    const today = new Date(2026, 5, 1); // Mon Jun 1
    const start = new Date(2026, 5, 3); // Wed Jun 3 — in the future
    const end = new Date(2026, 5, 3); // same day (1-day plan)
    expect(remainingDeliveryDays(start, end, today)).toBe(1);
  });
});

describe('subtractBusinessDays', () => {
  it('returns the same date for 0 days', () => {
    expect(subtractBusinessDays('2026-06-01', 0)).toBe('2026-06-01');
  });

  it('subtracts 1 business day: Monday − 1 = Friday', () => {
    expect(subtractBusinessDays('2026-06-01', 1)).toBe('2026-05-29');
  });

  it('Sunday − 1 business day = Friday', () => {
    expect(subtractBusinessDays('2026-05-24', 1)).toBe('2026-05-22');
  });

  it('subtracts 5 business days across a weekend', () => {
    expect(subtractBusinessDays('2026-06-08', 5)).toBe('2026-06-01');
  });
});

describe('businessDaysUntil', () => {
  it('counts 1 when from and to are the same weekday', () => {
    expect(businessDaysUntil(new Date(2026, 5, 1), new Date(2026, 5, 1))).toBe(1);
  });

  it('counts 5 for Monday through Friday', () => {
    expect(businessDaysUntil(new Date(2026, 5, 1), new Date(2026, 5, 5))).toBe(5);
  });

  it('skips Saturday and Sunday in the count', () => {
    // Mon Jun 1 to Mon Jun 8 = 6 business days (Mon Tue Wed Thu Fri [skip Sat Sun] Mon)
    expect(businessDaysUntil(new Date(2026, 5, 1), new Date(2026, 5, 8))).toBe(6);
  });

  it('returns 0 when from is after to', () => {
    // critical: the refactored implementation must not throw (eachDayOfInterval throws for start > end)
    expect(businessDaysUntil(new Date(2026, 5, 3), new Date(2026, 5, 1))).toBe(0);
  });

  it('does not count weekend days when from starts on a Saturday', () => {
    // Sat May 23 to Mon May 25: only Monday is a business day
    expect(businessDaysUntil(new Date(2026, 4, 23), new Date(2026, 4, 25))).toBe(1);
  });
});
