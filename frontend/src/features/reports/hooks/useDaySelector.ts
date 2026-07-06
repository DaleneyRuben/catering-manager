import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { checkIsWeekend } from '@/utils/devFlags';
import type { DayOption } from '@/features/reports/components/DaySelector';

export function useDaySelector() {
  const [selected, setSelected] = useState<DayOption>('today');
  const today = new Date();

  const dateForOption = (opt: DayOption) => (opt === 'today' ? today : addDays(today, 1));
  const shortDateForOption = (opt: DayOption) => format(dateForOption(opt), 'dd/MM');

  const resolvedDate = dateForOption(selected);
  const isWeekend = checkIsWeekend(resolvedDate);

  return { selected, setSelected, resolvedDate, isWeekend, dateForOption, shortDateForOption };
}
