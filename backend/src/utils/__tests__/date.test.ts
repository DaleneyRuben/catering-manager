import {
  addDeliveryDays,
  subtractDeliveryDays,
  addCalendarDays,
  toAppDate,
  calcContractEndDate,
  nextDeliveryDay,
  spanishWeekdayFileName,
} from '../date';

describe('spanishWeekdayFileName', () => {
  it('capitalizes the Spanish weekday name and appends dd-MM plus the given extension', () => {
    expect(spanishWeekdayFileName('2026-06-15', 'docx')).toBe('Lunes 15-06.docx');
  });

  it('supports a different extension for the same date', () => {
    expect(spanishWeekdayFileName('2026-06-15', 'xlsx')).toBe('Lunes 15-06.xlsx');
  });

  it('formats a different weekday correctly', () => {
    expect(spanishWeekdayFileName('2026-06-19', 'docx')).toBe('Viernes 19-06.docx');
  });
});

describe('addCalendarDays', () => {
  it('adds calendar days without skipping weekends', () => {
    // Fri May 8 + 1 = Sat May 9 (unlike addDeliveryDays, weekends are not skipped)
    expect(addCalendarDays('2026-05-08', 1)).toBe('2026-05-09');
  });

  it('crosses a weekend into the following week', () => {
    // Sat May 9 + 2 = Mon May 11
    expect(addCalendarDays('2026-05-09', 2)).toBe('2026-05-11');
  });

  it('returns the same date when adding 0 days', () => {
    expect(addCalendarDays('2026-05-06', 0)).toBe('2026-05-06');
  });
});

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

  it('returns the same date when adding 0 days', () => {
    expect(addDeliveryDays('2026-05-06', 0)).toBe('2026-05-06');
  });

  it('handles start date on saturday by treating it as the next monday', () => {
    // Sat May 9 + 1: date-fns normalises Sat into Mon May 11 (counts as the +1)
    expect(addDeliveryDays('2026-05-09', 1)).toBe('2026-05-11');
  });
});

describe('toAppDate', () => {
  it('extracts the Bolivia calendar date from a UTC timestamp', () => {
    // 2026-06-03T15:00:00Z = 2026-06-03 11:00 AM in La Paz (UTC-4)
    expect(toAppDate(new Date('2026-06-03T15:00:00Z'))).toBe('2026-06-03');
  });

  it('handles midnight UTC crossing into the previous Bolivia day', () => {
    // 2026-06-04T02:00:00Z = 2026-06-03 10:00 PM in La Paz (UTC-4)
    expect(toAppDate(new Date('2026-06-04T02:00:00Z'))).toBe('2026-06-03');
  });
});

describe('calcContractEndDate', () => {
  it('returns startDate + (duration - 1) delivery days', () => {
    expect(calcContractEndDate('2026-05-26', 20)).toBe(addDeliveryDays('2026-05-26', 19));
  });

  it('returns startDate itself when duration is 1', () => {
    expect(calcContractEndDate('2026-05-26', 1)).toBe('2026-05-26');
  });

  it('returns null when startDate is null', () => {
    expect(calcContractEndDate(null, 20)).toBeNull();
  });
});

describe('nextDeliveryDay', () => {
  it('returns Monday when given a Saturday', () => {
    expect(nextDeliveryDay('2026-06-27')).toBe('2026-06-29'); // Sat → Mon
  });

  it('returns Monday when given a Sunday', () => {
    expect(nextDeliveryDay('2026-06-28')).toBe('2026-06-29'); // Sun → Mon
  });

  it('returns the same date for a weekday', () => {
    expect(nextDeliveryDay('2026-06-25')).toBe('2026-06-25'); // Thu unchanged
  });

  it('returns Monday unchanged when given a Monday', () => {
    expect(nextDeliveryDay('2026-06-29')).toBe('2026-06-29');
  });

  it('returns Friday unchanged when given a Friday', () => {
    expect(nextDeliveryDay('2026-06-26')).toBe('2026-06-26');
  });
});

describe('subtractDeliveryDays', () => {
  it('subtracts business days skipping weekends', () => {
    // Tue Jun 2 - 20 = Tue May 5
    expect(subtractDeliveryDays('2026-06-02', 20)).toBe('2026-05-05');
  });

  it('skips saturday and sunday going backward', () => {
    // Mon May 11 - 1 = Fri May 8 (skip Sat/Sun)
    expect(subtractDeliveryDays('2026-05-11', 1)).toBe('2026-05-08');
  });

  it('handles end date on monday spanning a weekend', () => {
    // Mon May 11 - 3 = Wed May 6
    expect(subtractDeliveryDays('2026-05-11', 3)).toBe('2026-05-06');
  });

  it('returns the same date when subtracting 0 days', () => {
    expect(subtractDeliveryDays('2026-05-06', 0)).toBe('2026-05-06');
  });
});
