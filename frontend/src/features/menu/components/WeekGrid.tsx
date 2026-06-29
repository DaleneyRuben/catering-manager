import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Menu } from '../types';
import { MEAL_FIELDS, MEAL_FIELD_LABELS } from '../menuFields';

const DAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

const CELL_BG = {
  today: { filled: 'bg-row-selected', empty: 'bg-menu-today-empty' },
  other: { filled: 'bg-menu-other-filled', empty: 'bg-paper' },
};

interface Props {
  weekDays: string[];
  menus: Menu[];
  today: string;
}

export function WeekGrid({ weekDays, menus, today }: Props) {
  return (
    <div data-testid="week-grid" className="border border-rule rounded-[14px] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th
                scope="col"
                aria-label="Tipo de comida"
                className="bg-olive-50 border-b border-r border-rule px-4 py-3 min-w-[128px]"
              />
              {weekDays.map((date) => {
                const isToday = date === today;
                return (
                  <th
                    key={date}
                    className={`${isToday ? 'bg-olive-100' : 'bg-olive-50'} border-b border-l border-cream-2 px-4 py-[13px] text-center min-w-[130px]`}
                  >
                    <p className={`text-[13px] font-bold ${isToday ? 'text-ok' : 'text-ink-2'}`}>
                      {DAY_LABELS[weekDays.indexOf(date)]}
                    </p>
                    <p
                      className={`font-mono text-[10.5px] mt-[3px] ${isToday ? 'text-olive-600' : 'text-faint'}`}
                    >
                      {format(parseISO(date), 'd MMM', { locale: es })}
                    </p>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {MEAL_FIELDS.map((field) => (
              <tr key={field} className="border-t border-cream-2">
                <td className="bg-menu-sticky-bg sticky left-0 z-10 px-4 py-3.5 border-r border-rule">
                  <p className="font-mono text-[10.5px] tracking-[.08em] uppercase text-muted font-medium whitespace-nowrap">
                    {MEAL_FIELD_LABELS[field]}
                  </p>
                </td>
                {weekDays.map((date) => {
                  const menu = menus.find((m) => m.date === date) ?? null;
                  const isToday = date === today;
                  const value = menu?.[field];
                  const filled = !!value;
                  const bg = CELL_BG[isToday ? 'today' : 'other'][filled ? 'filled' : 'empty'];
                  return (
                    <td
                      key={date}
                      className={`${bg} border-l border-cream-2 px-[11px] py-[9px] min-h-[54px] text-[12.5px] text-menu-dish-text align-top`}
                    >
                      {value ?? <span className="text-empty-border text-[15px]">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
