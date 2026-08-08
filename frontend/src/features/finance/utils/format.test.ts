import {
  formatDayLabel,
  formatMoney,
  formatMonthLabel,
  shiftMonth,
} from '@/features/finance/utils/format';

describe('formatMoney', () => {
  it('groups thousands in the Bolivian locale', () => {
    expect(formatMoney(34800)).toBe('34.800');
  });

  // The register reads in whole bolivianos: cents are stored but never shown on this screen.
  it('rounds to whole units', () => {
    expect(formatMoney(1200.5)).toBe('1.201');
    expect(formatMoney(1200.4)).toBe('1.200');
  });

  // The sign is rendered separately so it can carry its own colour.
  it('drops the sign', () => {
    expect(formatMoney(-13350)).toBe('13.350');
  });
});

describe('formatMonthLabel', () => {
  it('names the month in Spanish with its year', () => {
    expect(formatMonthLabel('2026-08')).toBe('Agosto 2026');
  });

  it('capitalises the month name', () => {
    expect(formatMonthLabel('2026-01')).toBe('Enero 2026');
  });
});

// Reads inside a sentence ("Al 3 de agosto"), so the month stays lowercase and the year is left
// out — the month it belongs to is already named beside it.
describe('formatDayLabel', () => {
  it('names the day and month in Spanish', () => {
    expect(formatDayLabel('2026-08-03')).toBe('3 de agosto');
  });

  it('leaves the day unpadded', () => {
    expect(formatDayLabel('2026-01-09')).toBe('9 de enero');
  });
});

describe('shiftMonth', () => {
  it('steps back a month', () => {
    expect(shiftMonth('2026-08', -1)).toBe('2026-07');
  });

  it('steps forward a month', () => {
    expect(shiftMonth('2026-08', 1)).toBe('2026-09');
  });

  it('crosses a year boundary in both directions', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
  });
});
