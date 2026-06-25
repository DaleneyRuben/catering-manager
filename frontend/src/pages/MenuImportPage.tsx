import { addDays, format, getDay, parseISO, startOfISOWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import type { Menu, MenuDraft } from '../types/menu';
import { useMenu } from '../hooks/useMenu';
import { checkIsWeekend } from '../utils/devFlags';
import { formatLongDate } from '../utils/format';
import { MEAL_FIELDS, MEAL_FIELD_LABELS } from './menu/menuFields';
import { MenuFormModal } from './menu/MenuFormModal';
import { DayCard } from './menu/DayCard';

const toIso = (d: Date) => format(d, 'yyyy-MM-dd');

function getWeekDays(): string[] {
  const today = new Date();
  const dow = getDay(today); // 0=Sun
  const monday = dow === 0 ? addDays(today, 1) : startOfISOWeek(today);
  return [0, 1, 2, 3, 4].map((i) => toIso(addDays(monday, i)));
}

// --- Read-only 5-column weekly grid ---

const DAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

const CELL_BG = {
  today: { filled: 'bg-row-selected', empty: 'bg-menu-today-empty' },
  other: { filled: 'bg-menu-other-filled', empty: 'bg-paper' },
};

interface WeekGridProps {
  weekDays: string[];
  menus: Menu[];
  today: string;
}

function WeekGrid({ weekDays, menus, today }: WeekGridProps) {
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

// --- Page ---

export function MenuImportPage() {
  const today = toIso(new Date());
  const tomorrow = toIso(addDays(new Date(), 1));
  const weekDays = getWeekDays();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<string>(today);

  const { menus, isSaving, save } = useMenu();

  const todayMenu = menus.find((m) => m.date === today) ?? null;
  const tomorrowMenu = menus.find((m) => m.date === tomorrow) ?? null;
  const isTodayWeekend = checkIsWeekend(parseISO(today));
  const isTomorrowWeekend = checkIsWeekend(parseISO(tomorrow));

  const weekRangeLabel = `${format(parseISO(weekDays[0]), 'd')} – ${format(parseISO(weekDays[4]), 'd MMM', { locale: es })}`;

  const openModal = (date: string) => {
    setEditingDate(date);
    setModalOpen(true);
  };

  return (
    <div className="px-4 py-5 lg:px-[44px] lg:py-[34px]">
      <PageHeader label="Operativa diaria" title="Menú del día" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[18px] mb-[30px]">
        <DayCard
          isToday
          date={today}
          menu={todayMenu}
          isWeekend={isTodayWeekend}
          onOpen={() => openModal(today)}
        />
        <DayCard
          isToday={false}
          date={tomorrow}
          menu={tomorrowMenu}
          isWeekend={isTomorrowWeekend}
          onOpen={() => openModal(tomorrow)}
        />
      </div>

      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="font-serif font-semibold text-[24px] text-ink">Esta semana</h2>
        <span className="font-mono text-[11.5px] tracking-[.04em] text-muted">
          {weekRangeLabel}
        </span>
      </div>
      <WeekGrid weekDays={weekDays} menus={menus} today={today} />

      <MenuFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        date={editingDate}
        dateLabel={formatLongDate(editingDate)}
        initial={menus.find((m) => m.date === editingDate) ?? null}
        onSave={async (draft: MenuDraft) => {
          await save(draft);
        }}
        isSaving={isSaving}
      />
    </div>
  );
}
