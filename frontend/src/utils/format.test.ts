import { formatDate, formatDateTime, formatLongDate } from './format';

describe('formatDate', () => {
  it('returns — for null input', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('returns — for undefined input', () => {
    expect(formatDate(undefined)).toBe('—');
  });

  it('formats an ISO date as dd/MM/yyyy', () => {
    expect(formatDate('2026-06-03')).toBe('03/06/2026');
  });

  it('handles single-digit day and month with zero padding', () => {
    expect(formatDate('2026-01-05')).toBe('05/01/2026');
  });

  it('formats the last day of the year', () => {
    expect(formatDate('2026-12-31')).toBe('31/12/2026');
  });
});

describe('formatDateTime', () => {
  it('formats an ISO datetime as dd/MM/yyyy HH:mm', () => {
    expect(formatDateTime('2026-06-03T14:30:00')).toBe('03/06/2026 14:30');
  });

  it('zero-pads hours and minutes', () => {
    expect(formatDateTime('2026-06-03T09:05:00')).toBe('03/06/2026 09:05');
  });
});

describe('formatLongDate', () => {
  it('formats as capitalized weekday + day + month in Spanish', () => {
    expect(formatLongDate('2026-06-24')).toBe('Miércoles 24 de junio');
  });

  it('includes the year when withYear is true', () => {
    expect(formatLongDate('2026-06-24', { withYear: true })).toBe('Miércoles 24 de junio, 2026');
  });
});
