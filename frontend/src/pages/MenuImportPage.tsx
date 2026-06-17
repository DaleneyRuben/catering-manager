import { addDays, format, getDay, parseISO, startOfISOWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import type { Menu, MenuDraft } from '../types/menu';
import { useMenu } from '../hooks/useMenu';
import { checkIsWeekend } from '../utils/devFlags';
import { MEAL_FIELDS, MEAL_FIELD_LABELS } from './menu/menuFields';
import { MenuFormModal } from './menu/MenuFormModal';

const toIso = (d: Date) => format(d, 'yyyy-MM-dd');

const formatDateLabel = (iso: string) => {
  const s = format(parseISO(iso), "EEEE d 'de' MMMM", { locale: es });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

function getWeekDays(): string[] {
  const today = new Date();
  const dow = getDay(today); // 0=Sun
  const monday = dow === 0 ? addDays(today, 1) : startOfISOWeek(today);
  return [0, 1, 2, 3, 4].map((i) => toIso(addDays(monday, i)));
}

// --- Editable day card (today / tomorrow) ---

type CardVariant = 'today' | 'tomorrow' | 'default';

const CARD_STYLES: Record<CardVariant, { border: string; headerBg: string; dateColor: string }> = {
  today: {
    border: 'border-l-[3px] border-l-olive-800',
    headerBg: 'bg-olive-50',
    dateColor: 'text-olive-800',
  },
  tomorrow: {
    border: 'border-l-[3px] border-l-warn',
    headerBg: 'bg-warn-bg',
    dateColor: 'text-warn',
  },
  default: { border: '', headerBg: '', dateColor: 'text-ink' },
};

interface MenuCardProps {
  menu: Menu;
  onEdit: () => void;
  variant?: CardVariant;
}

function MenuCard({ menu, onEdit, variant = 'default' }: MenuCardProps) {
  const filled = MEAL_FIELDS.filter((f) => menu[f]);
  const { border, headerBg, dateColor } = CARD_STYLES[variant];
  return (
    <div className={`bg-paper rounded-lg overflow-hidden border border-rule ${border}`}>
      <div className={`flex items-center px-5 pt-4 pb-3 border-b border-rule ${headerBg}`}>
        <p className={`font-serif text-[15px] ${dateColor}`}>{formatDateLabel(menu.date)}</p>
        <button
          type="button"
          onClick={onEdit}
          aria-label="Editar menú"
          className="ml-auto w-8 h-8 flex items-center justify-center rounded-md text-muted hover:text-ink hover:bg-cream-2 transition-colors"
        >
          <Icon name="pencil" size={13} />
        </button>
      </div>
      {filled.length === 0 ? (
        <div className="px-5 py-4">
          <p className="text-[13px] text-muted">Sin platos cargados.</p>
        </div>
      ) : (
        <div className="px-5 py-5 grid grid-cols-2 gap-x-8 gap-y-4">
          {filled.map((field) => (
            <div key={field}>
              <p className="text-[9.5px] font-mono uppercase tracking-[.14em] text-muted mb-0.5">
                {MEAL_FIELD_LABELS[field]}
              </p>
              <p className="text-[14px] text-ink">{menu[field]}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface DaySectionProps {
  date: string;
  menu: Menu | null;
  isWeekend: boolean;
  variant?: CardVariant;
  onOpen: () => void;
}

function DaySection({ date, menu, isWeekend, variant = 'default', onOpen }: DaySectionProps) {
  if (isWeekend) {
    return (
      <div className="bg-paper border border-rule rounded-lg px-5 py-4">
        <p className="text-[13px] text-alert">No hay entregas los fines de semana.</p>
      </div>
    );
  }
  if (menu) {
    return <MenuCard menu={menu} onEdit={onOpen} variant={variant} />;
  }
  return (
    <div className="bg-paper border border-rule rounded-lg px-5 py-4 flex items-center gap-4">
      <p className="text-[11px] font-mono text-muted flex-1">{formatDateLabel(date)}</p>
      <Button onClick={onOpen} leftIcon="plus" size="sm">
        Cargar menú
      </Button>
    </div>
  );
}

// --- Read-only 5-column weekly grid ---

const DAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

interface WeekGridProps {
  weekDays: string[];
  menus: Menu[];
  today: string;
}

type ColKind = 'past' | 'today' | 'tomorrow' | 'future';

const COL_STYLES: Record<ColKind, { header: string; body: string; label: string; date: string }> = {
  past: { header: 'bg-cream-2', body: '', label: 'text-muted', date: 'text-ink-2' },
  today: {
    header: 'bg-olive-50',
    body: 'bg-olive-50/40',
    label: 'text-olive-800',
    date: 'text-olive-700',
  },
  tomorrow: {
    header: 'bg-warn-bg',
    body: 'bg-warn-bg/30',
    label: 'text-warn',
    date: 'text-warn',
  },
  future: { header: 'bg-cream-2', body: '', label: 'text-muted', date: 'text-ink-2' },
};

function WeekGrid({ weekDays, menus, today }: WeekGridProps) {
  const tomorrow = toIso(addDays(new Date(), 1));

  const kinds: ColKind[] = weekDays.map((date) => {
    if (date === today) return 'today';
    if (date === tomorrow) return 'tomorrow';
    if (date < today) return 'past';
    return 'future';
  });

  return (
    <div data-testid="week-grid" className="border border-rule rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th
                scope="col"
                aria-label="Tipo de comida"
                className="bg-cream-2 border-b border-r border-rule px-4 py-3 min-w-[110px]"
              />
              {weekDays.map((date, i) => {
                const s = COL_STYLES[kinds[i]];
                return (
                  <th
                    key={date}
                    className={`${s.header} border-b border-l border-rule px-3 py-3 text-left min-w-[130px]`}
                  >
                    <p
                      className={`text-[9px] font-mono uppercase tracking-[.14em] font-semibold ${s.label}`}
                    >
                      {DAY_LABELS[i]}
                    </p>
                    <p className={`text-[11px] font-mono mt-0.5 ${s.date}`}>
                      {format(parseISO(date), 'd MMM', { locale: es })}
                    </p>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {MEAL_FIELDS.map((field) => (
              <tr key={field} className="border-t border-rule">
                <td className="bg-cream-2 sticky left-0 z-10 px-4 py-2.5 border-r border-rule">
                  <p className="text-[9px] font-mono uppercase tracking-[.14em] text-muted whitespace-nowrap">
                    {MEAL_FIELD_LABELS[field]}
                  </p>
                </td>
                {weekDays.map((date, di) => {
                  const menu = menus.find((m) => m.date === date) ?? null;
                  const s = COL_STYLES[kinds[di]];
                  const value = menu?.[field];
                  return (
                    <td
                      key={date}
                      className={`${s.body} border-l border-rule px-3 py-2.5 text-[13px] text-ink align-top`}
                    >
                      {value ?? <span className="text-muted text-[12px]">—</span>}
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

  const openModal = (date: string) => {
    setEditingDate(date);
    setModalOpen(true);
  };

  return (
    <div className="px-4 py-5 lg:p-7 max-w-[900px] mx-auto">
      <PageHeader label="Operativa diaria" title="Menú del día" />

      <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted mb-3">Hoy</p>
      <DaySection
        date={today}
        menu={todayMenu}
        isWeekend={isTodayWeekend}
        variant="today"
        onOpen={() => openModal(today)}
      />

      <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted mt-6 mb-3">
        Mañana
      </p>
      <DaySection
        date={tomorrow}
        menu={tomorrowMenu}
        isWeekend={isTomorrowWeekend}
        variant="tomorrow"
        onOpen={() => openModal(tomorrow)}
      />

      <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted mt-8 mb-3">
        Esta semana
      </p>
      <WeekGrid weekDays={weekDays} menus={menus} today={today} />

      <MenuFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        date={editingDate}
        dateLabel={formatDateLabel(editingDate)}
        initial={menus.find((m) => m.date === editingDate) ?? null}
        onSave={async (draft: MenuDraft) => {
          await save(draft);
        }}
        isSaving={isSaving}
      />
    </div>
  );
}
