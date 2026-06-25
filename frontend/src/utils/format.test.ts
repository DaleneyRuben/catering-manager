import {
  formatDate,
  formatDateTime,
  formatLongDate,
  formatShortDate,
  formatWeekdayDate,
  formatConnectionStamp,
  formatRelativeTime,
} from './format';

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

describe('formatShortDate', () => {
  it('formats an ISO date as dd/MM', () => {
    expect(formatShortDate('2026-06-24')).toBe('24/06');
  });

  it('zero-pads single-digit day and month', () => {
    expect(formatShortDate('2026-01-05')).toBe('05/01');
  });
});

describe('formatWeekdayDate', () => {
  it('returns capitalized weekday + dd/MM', () => {
    expect(formatWeekdayDate('2026-06-23')).toBe('Martes 23/06');
  });

  it('handles a different weekday', () => {
    expect(formatWeekdayDate('2026-06-24')).toBe('Miércoles 24/06');
  });
});

describe('formatConnectionStamp', () => {
  const sameDay = new Date('2026-06-23T00:00:00');

  it('returns "Hoy · HH:mm" when iso is today', () => {
    expect(formatConnectionStamp('2026-06-23T10:29:00', sameDay)).toBe('Hoy · 10:29');
  });

  it('returns "dd/MM · HH:mm" when iso is a different day', () => {
    expect(formatConnectionStamp('2026-06-20T08:14:00', sameDay)).toBe('20/06 · 08:14');
  });
});

describe('formatRelativeTime', () => {
  const base = new Date('2026-06-23T11:00:00').getTime();

  it('returns "hace X min" for under an hour', () => {
    const iso = new Date(base - 8 * 60_000).toISOString();
    expect(formatRelativeTime(iso, base)).toBe('hace 8 min');
  });

  it('returns "hace X h" for 1–23 hours', () => {
    const iso = new Date(base - 2 * 60 * 60_000).toISOString();
    expect(formatRelativeTime(iso, base)).toBe('hace 2 h');
  });

  it('returns "hace X días" for 24+ hours', () => {
    const iso = new Date(base - 3 * 24 * 60 * 60_000).toISOString();
    expect(formatRelativeTime(iso, base)).toBe('hace 3 días');
  });
});
