import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Icon } from '@ui/Icon';
import { IconButton } from '@ui/IconButton';
import { DayClientsModal } from '@/features/production/components/DayClientsModal';
import { WeekCellsSkeleton } from '@/features/production/components/WeekCellsSkeleton';
import { useWeeklyCounts } from '@/features/production/hooks/useWeeklyCounts';
import { formatShortDate } from '@/utils/format';
import type { WeeklyCounts, WeeklyDayCount } from '@/features/production/types';

interface Props {
  weeklyCounts: WeeklyCounts;
  weekStarts: string[];
  today: string;
  isAdmin?: boolean;
}

const capitalize = (label: string) => label.charAt(0).toUpperCase() + label.slice(1);

const weekdayLabel = (date: string) => capitalize(format(parseISO(date), 'EEE', { locale: es }));

const weekRangeLabel = (weekStart: string, weekEnd: string) =>
  `${format(parseISO(weekStart), 'd')} – ${format(parseISO(weekEnd), 'd MMM', { locale: es })}`;

const cellClass = (isToday: boolean) =>
  `min-w-0 rounded-[11px] border px-[15px] pt-[15px] pb-4 flex flex-col gap-3 ${
    isToday ? 'bg-day-badge-bg border-olive-200' : 'bg-week-cell-bg border-week-cell-border'
  }`;

interface DayCellContentProps {
  day: WeeklyDayCount;
  isToday: boolean;
  dateLabel: boolean;
}

function DayCellContent({ day, isToday, dateLabel }: DayCellContentProps) {
  return (
    <>
      <div className="flex items-center justify-between gap-1.5">
        <span className="flex items-baseline gap-1.5 min-w-0">
          <span
            className={`font-mono text-[10px] tracking-[.11em] uppercase font-semibold ${
              isToday ? 'text-olive-700' : 'text-week-label'
            }`}
          >
            {weekdayLabel(day.date)}
          </span>
          {dateLabel && (
            <span className="font-mono text-[9.5px] tracking-[.02em] text-faint">
              {formatShortDate(day.date)}
            </span>
          )}
        </span>
        {isToday && (
          <span className="font-mono text-[8.5px] font-bold tracking-[.08em] uppercase text-white bg-olive-700 rounded-full px-[7px] py-0.5 shrink-0">
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
    </>
  );
}

const NAV_BUTTON_CLASS =
  'w-[30px] h-[30px] shrink-0 rounded-lg border bg-white border-day-badge-border text-olive-600 hover:bg-day-badge-bg hover:text-olive-700 disabled:bg-cream-2 disabled:border-week-cell-border disabled:text-faint disabled:cursor-default';

export function WeeklyCountsCard({ weeklyCounts, weekStarts, today, isAdmin = false }: Props) {
  const [weekIndex, setWeekIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const isCurrentWeek = weekIndex === 0;
  const lastIndex = weekStarts.length - 1;
  // The current week is seeded from the main /production payload; only forward
  // weeks are fetched, which also keeps the kitchen role off the admin endpoint.
  const {
    weeklyCounts: shown,
    isLoading,
    error,
  } = useWeeklyCounts(weekStarts[weekIndex], {
    enabled: isAdmin && !isCurrentWeek,
    initialData: isCurrentWeek ? weeklyCounts : undefined,
  });

  const renderCells = () => {
    if (isLoading) return <WeekCellsSkeleton />;
    if (error || !shown) {
      return (
        <p className="font-mono text-[12px] text-faint py-6 text-center">
          No se pudo cargar la semana. Intenta de nuevo.
        </p>
      );
    }
    return (
      <div className="grid grid-cols-5 gap-3.5 max-md:grid-cols-1">
        {shown.days.map((day) => {
          const isToday = day.date === today;
          if (!isAdmin) {
            return (
              <div key={day.date} className={cellClass(isToday)}>
                <DayCellContent day={day} isToday={isToday} dateLabel={false} />
              </div>
            );
          }
          return (
            <button
              key={day.date}
              type="button"
              onClick={() => setSelectedDate(day.date)}
              className={`${cellClass(isToday)} text-left cursor-pointer transition hover:border-olive-200 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5`}
            >
              <DayCellContent day={day} isToday={isToday} dateLabel />
            </button>
          );
        })}
      </div>
    );
  };

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
        <div className="flex items-center gap-2">
          {isAdmin && (
            <IconButton
              icon="arrow-left"
              label="Semana anterior"
              size={15}
              stroke={2}
              disabled={isCurrentWeek}
              onClick={() => setWeekIndex((i) => Math.max(0, i - 1))}
              className={NAV_BUTTON_CLASS}
            />
          )}
          <div className="flex items-center gap-[9px] font-mono text-[12px] text-ink-2 bg-day-badge-bg border border-day-badge-border rounded-[9px] px-3.5 py-[9px] whitespace-nowrap">
            <span className="text-olive-600">
              <Icon name="calendar" size={15} stroke={1.7} />
            </span>
            <span className="text-muted">Semana</span>
            <span className="font-semibold">
              {shown ? weekRangeLabel(shown.weekStart, shown.weekEnd) : '—'}
            </span>
          </div>
          {isAdmin && (
            <IconButton
              icon="arrow-right"
              label="Semana siguiente"
              size={15}
              stroke={2}
              disabled={weekIndex === lastIndex}
              onClick={() => setWeekIndex((i) => Math.min(lastIndex, i + 1))}
              className={NAV_BUTTON_CLASS}
            />
          )}
        </div>
      </div>

      {renderCells()}

      {isAdmin && !isCurrentWeek && (
        <div className="flex items-center gap-2 mt-4 font-mono text-[10.5px] tracking-[.03em] text-faint leading-snug">
          <span className="shrink-0">
            <Icon name="info" size={13} stroke={1.7} />
          </span>
          <span>
            Proyección según contratos vigentes · las renovaciones aún no registradas no están
            incluidas
          </span>
        </div>
      )}

      {isAdmin && selectedDate && (
        <DayClientsModal date={selectedDate} onClose={() => setSelectedDate(null)} />
      )}
    </div>
  );
}
