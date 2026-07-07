import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Icon } from '@ui/Icon';
import type { WeeklyCounts } from '@/features/production/types';

interface Props {
  weeklyCounts: WeeklyCounts;
  today: string;
}

const capitalize = (label: string) => label.charAt(0).toUpperCase() + label.slice(1);

const weekdayLabel = (date: string) => capitalize(format(parseISO(date), 'EEE', { locale: es }));

const weekRangeLabel = (weekStart: string, weekEnd: string) =>
  `${format(parseISO(weekStart), 'd')} – ${format(parseISO(weekEnd), 'd MMM', { locale: es })}`;

export function WeeklyCountsCard({ weeklyCounts, today }: Props) {
  const { weekStart, weekEnd, days } = weeklyCounts;

  return (
    <div className="bg-paper border border-rule rounded-[14px] px-7 py-6">
      <div className="flex items-start justify-between gap-5 flex-wrap mb-[22px]">
        <div>
          <h2 className="font-serif font-semibold text-[26px] leading-none text-ink m-0">
            Clientes activos por día
          </h2>
          <p className="font-mono text-[11px] tracking-[.06em] text-faint mt-[9px] uppercase">
            Clientes activos de lunes a viernes
          </p>
        </div>
        <div className="flex items-center gap-[9px] font-mono text-[12px] text-ink-2 bg-day-badge-bg border border-day-badge-border rounded-[9px] px-3.5 py-[9px] whitespace-nowrap">
          <span className="text-olive-600">
            <Icon name="calendar" size={15} stroke={1.7} />
          </span>
          <span className="text-muted">Semana</span>
          <span className="font-semibold">{weekRangeLabel(weekStart, weekEnd)}</span>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3.5 max-md:grid-cols-1">
        {days.map((day) => {
          const isToday = day.date === today;
          return (
            <div
              key={day.date}
              className={`min-w-0 rounded-[11px] border px-[15px] pt-[15px] pb-4 flex flex-col gap-3 ${
                isToday
                  ? 'bg-day-badge-bg border-olive-200'
                  : 'bg-week-cell-bg border-week-cell-border'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span
                  className={`font-mono text-[10px] tracking-[.11em] uppercase font-semibold ${
                    isToday ? 'text-olive-700' : 'text-week-label'
                  }`}
                >
                  {weekdayLabel(day.date)}
                </span>
                {isToday && (
                  <span className="font-mono text-[8.5px] font-bold tracking-[.08em] uppercase text-white bg-olive-700 rounded-full px-[7px] py-0.5">
                    Hoy
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className={`font-serif font-semibold text-[38px] leading-[.9] ${
                    isToday ? 'text-week-count-today' : 'text-ink'
                  }`}
                >
                  {day.count}
                </span>
                <span className="font-mono text-[9.5px] tracking-[.05em] uppercase text-week-unit-label">
                  activos
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
