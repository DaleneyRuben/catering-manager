import { format, parseISO } from 'date-fns';

export type DayGroup<T> = { date: string; items: T[] };

// Groups items by the calendar day of createdAt, preserving input order.
// `date` is the createdAt of the first item seen for that day.
export function groupByDay<T extends { createdAt: string }>(items: T[]): DayGroup<T>[] {
  const groups: (DayGroup<T> & { key: string })[] = [];

  items.forEach((item) => {
    const key = format(parseISO(item.createdAt), 'yyyy-MM-dd');
    const group = groups.find((g) => g.key === key);
    if (group) {
      group.items.push(item);
    } else {
      groups.push({ key, date: item.createdAt, items: [item] });
    }
  });

  return groups.map(({ date, items: dayItems }) => ({ date, items: dayItems }));
}
