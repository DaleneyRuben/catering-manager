import { addBusinessDays } from './businessDays';

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
