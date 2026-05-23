import { addDeliveryDays } from '../date';

describe('addDeliveryDays', () => {
  it('adds business days skipping weekends', () => {
    // Tue May 5 + 20 delivery days = Tue Jun 2
    expect(addDeliveryDays('2026-05-05', 20)).toBe('2026-06-02');
  });

  it('skips saturday and sunday when end falls mid-week', () => {
    // Wed May 6 + 3 = Mon May 11 (skip Sat May 9, Sun May 10)
    expect(addDeliveryDays('2026-05-06', 3)).toBe('2026-05-11');
  });

  it('handles start date on friday', () => {
    // Fri May 8 + 1 = Mon May 11 (skip Sat/Sun)
    expect(addDeliveryDays('2026-05-08', 1)).toBe('2026-05-11');
  });

  it('handles 20 days from a thursday', () => {
    // Thu May 7 + 20 = Thu Jun 4
    expect(addDeliveryDays('2026-05-07', 20)).toBe('2026-06-04');
  });
});
