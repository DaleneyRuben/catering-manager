import {
  formatDate,
  formatDateTime,
  formatLongDate,
  formatShortDate,
  formatWeekdayDate,
  formatConnectionStamp,
  formatRelativeTime,
  formatDevice,
  formatTime,
  formatDayGroupLabel,
  formatBrowserOs,
  formatDeviceType,
  deviceIcon,
} from '@/utils/format';

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

  it('returns "hace 0 min" for 0 minutes', () => {
    expect(formatRelativeTime(new Date(base).toISOString(), base)).toBe('hace 0 min');
  });

  it('returns "hace X min" for under an hour', () => {
    const iso = new Date(base - 8 * 60_000).toISOString();
    expect(formatRelativeTime(iso, base)).toBe('hace 8 min');
  });

  it('returns "hace 59 min" for 59 minutes (just before the hour boundary)', () => {
    const iso = new Date(base - 59 * 60_000).toISOString();
    expect(formatRelativeTime(iso, base)).toBe('hace 59 min');
  });

  it('returns "hace 1 h" for exactly 60 minutes (at the hour boundary)', () => {
    const iso = new Date(base - 60 * 60_000).toISOString();
    expect(formatRelativeTime(iso, base)).toBe('hace 1 h');
  });

  it('returns "hace X h" for 1–23 hours', () => {
    const iso = new Date(base - 2 * 60 * 60_000).toISOString();
    expect(formatRelativeTime(iso, base)).toBe('hace 2 h');
  });

  it('returns "hace 23 h" for 23 hours (just before the day boundary)', () => {
    const iso = new Date(base - 23 * 60 * 60_000).toISOString();
    expect(formatRelativeTime(iso, base)).toBe('hace 23 h');
  });

  it('returns "hace 1 días" for exactly 24 hours (at the day boundary)', () => {
    const iso = new Date(base - 24 * 60 * 60_000).toISOString();
    expect(formatRelativeTime(iso, base)).toBe('hace 1 días');
  });

  it('returns "hace X días" for 24+ hours', () => {
    const iso = new Date(base - 3 * 24 * 60 * 60_000).toISOString();
    expect(formatRelativeTime(iso, base)).toBe('hace 3 días');
  });
});

describe('formatDevice', () => {
  it('joins browser, os and the spanish device label', () => {
    expect(formatDevice('Chrome 126', 'Android 14', 'mobile')).toBe(
      'Chrome 126 · Android 14 · Móvil',
    );
  });

  it('maps desktop and tablet device types to spanish', () => {
    expect(formatDevice('Chrome 126', 'Windows 10', 'desktop')).toBe(
      'Chrome 126 · Windows 10 · Escritorio',
    );
    expect(formatDevice('Safari 17', 'iOS 17', 'tablet')).toBe('Safari 17 · iOS 17 · Tableta');
  });

  it('omits missing parts', () => {
    expect(formatDevice('Chrome 126', null, null)).toBe('Chrome 126');
    expect(formatDevice(null, 'Android 14', 'mobile')).toBe('Android 14 · Móvil');
  });

  it('ignores an unknown device type key', () => {
    expect(formatDevice('Chrome 126', null, 'watch')).toBe('Chrome 126');
  });

  it('returns null when nothing is known', () => {
    expect(formatDevice(null, null, null)).toBeNull();
  });
});

describe('formatTime', () => {
  it('formats an ISO timestamp as HH:mm', () => {
    expect(formatTime('2026-07-04T08:12:00')).toBe('08:12');
  });
});

describe('formatDayGroupLabel', () => {
  const now = new Date('2026-07-04T12:00:00');

  it('prefixes Hoy for today', () => {
    expect(formatDayGroupLabel('2026-07-04T08:12:00', now)).toBe('Hoy · Sábado 04/07');
  });

  it('prefixes Ayer for yesterday', () => {
    expect(formatDayGroupLabel('2026-07-03T19:40:00', now)).toBe('Ayer · Viernes 03/07');
  });

  it('returns the capitalized weekday and date for older days', () => {
    expect(formatDayGroupLabel('2026-07-01T09:00:00', now)).toBe('Miércoles 01/07');
  });
});

describe('formatBrowserOs', () => {
  it('joins browser and os', () => {
    expect(formatBrowserOs('Chrome 149', 'macOS')).toBe('Chrome 149 · macOS');
  });

  it('omits missing parts', () => {
    expect(formatBrowserOs('Chrome 149', null)).toBe('Chrome 149');
    expect(formatBrowserOs(null, 'macOS')).toBe('macOS');
  });

  it('returns null when nothing is known', () => {
    expect(formatBrowserOs(null, null)).toBeNull();
  });
});

describe('formatDeviceType', () => {
  it('translates device keys to spanish', () => {
    expect(formatDeviceType('desktop')).toBe('Escritorio');
    expect(formatDeviceType('mobile')).toBe('Móvil');
    expect(formatDeviceType('tablet')).toBe('Tableta');
  });

  it('returns null for null or unknown keys', () => {
    expect(formatDeviceType(null)).toBeNull();
    expect(formatDeviceType('watch')).toBeNull();
  });
});

describe('deviceIcon', () => {
  it('maps device keys to icon names', () => {
    expect(deviceIcon('desktop')).toBe('monitor');
    expect(deviceIcon('mobile')).toBe('smartphone');
    expect(deviceIcon('tablet')).toBe('tablet');
  });

  it('returns null for null or unknown keys', () => {
    expect(deviceIcon(null)).toBeNull();
    expect(deviceIcon('watch')).toBeNull();
  });
});
