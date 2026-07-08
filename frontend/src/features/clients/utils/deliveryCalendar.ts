import {
  addDays,
  addMonths,
  format,
  getDay,
  getMonth,
  getYear,
  isAfter,
  isBefore,
  isSameMonth,
  isWeekend,
  parseISO,
  startOfMonth,
} from 'date-fns';

const MONTH_LABELS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

const WEEKS_PER_MONTH = 6;
const DAYS_PER_WEEK = 5;

export type DeliveryDayStatus = 'delivered' | 'suspended' | 'pending' | 'out';

export interface DeliveryCalendarCell {
  date: string;
  status: DeliveryDayStatus;
}

export interface DeliveryCalendarMonth {
  label: string;
  weeks: (DeliveryCalendarCell | null)[][];
}

export interface DeliveryCalendarResult {
  months: DeliveryCalendarMonth[];
  deliveredCount: number;
}

// Parsed at local midnight to stay consistent with the day cells generated below
// (startOfMonth/addDays also produce local-midnight dates) — mixing offsets here
// would make the boundary day compare as "before" its own start/end date.
function toLocalDate(dateString: string): Date {
  return parseISO(dateString);
}

function classifyDeliveryDay(
  day: Date,
  contractStart: Date,
  contractEnd: Date,
  asOf: Date,
  suspendedDates: Set<string>,
): DeliveryDayStatus {
  if (isWeekend(day) || isBefore(day, contractStart) || isAfter(day, contractEnd)) {
    return 'out';
  }
  if (suspendedDates.has(format(day, 'yyyy-MM-dd'))) return 'suspended';
  return isAfter(day, asOf) ? 'pending' : 'delivered';
}

// Monday of the week containing `date`, independent of date-fns' locale-based week start.
function mondayOfWeek(date: Date): Date {
  const offsetFromMonday = (getDay(date) + 6) % 7;
  return addDays(date, -offsetFromMonday);
}

export function buildDeliveryCalendar({
  contractStart,
  contractEndDate,
  asOf,
  suspendedDates,
}: {
  contractStart: string;
  contractEndDate: string;
  asOf: string;
  suspendedDates: string[];
}): DeliveryCalendarResult {
  const start = toLocalDate(contractStart);
  const end = toLocalDate(contractEndDate);
  const asOfDate = toLocalDate(asOf);
  const suspendedSet = new Set(suspendedDates);

  const months: DeliveryCalendarMonth[] = [];
  let deliveredCount = 0;
  let monthAnchor = startOfMonth(start);
  const lastMonthAnchor = startOfMonth(end);

  while (!isAfter(monthAnchor, lastMonthAnchor)) {
    let weekCursor = mondayOfWeek(monthAnchor);
    const weeks: (DeliveryCalendarCell | null)[][] = [];

    for (let w = 0; w < WEEKS_PER_MONTH; w += 1) {
      const week: (DeliveryCalendarCell | null)[] = [];
      let anyInMonth = false;

      for (let d = 0; d < DAYS_PER_WEEK; d += 1) {
        const day = addDays(weekCursor, d);
        if (isSameMonth(day, monthAnchor)) {
          anyInMonth = true;
          const status = classifyDeliveryDay(day, start, end, asOfDate, suspendedSet);
          if (status === 'delivered') deliveredCount += 1;
          week.push({ date: format(day, 'yyyy-MM-dd'), status });
        } else {
          week.push(null);
        }
      }

      weekCursor = addDays(weekCursor, 7);
      if (anyInMonth) weeks.push(week);
    }

    months.push({
      label: `${MONTH_LABELS[getMonth(monthAnchor)]} ${getYear(monthAnchor)}`,
      weeks,
    });
    monthAnchor = addMonths(monthAnchor, 1);
  }

  return { months, deliveredCount };
}
