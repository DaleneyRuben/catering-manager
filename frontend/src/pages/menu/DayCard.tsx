import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Icon } from '../../components/ui/Icon';
import type { Menu } from '../../types/menu';
import { MEAL_FIELDS } from './menuFields';

interface Props {
  isToday: boolean;
  date: string;
  menu: Menu | null;
  isWeekend: boolean;
  onOpen: () => void;
}

const formatDateLabel = (iso: string): string => {
  const s = format(parseISO(iso), "EEEE d 'de' MMMM", { locale: es });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export function DayCard({ isToday, date, menu, isWeekend, onOpen }: Props) {
  const filledCount = menu ? MEAL_FIELDS.filter((f) => menu[f]).length : 0;

  const statusText = (() => {
    if (isWeekend) return 'Fin de semana · sin entregas';
    if (menu) return `Menú cargado · ${filledCount} de ${MEAL_FIELDS.length} tiempos`;
    return `Aún sin menú cargado · 0 de ${MEAL_FIELDS.length} tiempos`;
  })();

  const actionLabel = menu ? 'Editar menú' : 'Cargar menú';
  const actionIcon = menu ? 'pencil' : 'plus';

  return (
    <div
      className={
        isToday
          ? 'bg-gradient-to-br from-today-gradient-start to-today-gradient-end rounded-[14px] px-[26px] py-6 flex items-center justify-between gap-5 shadow-[0_8px_24px_rgba(20,40,6,0.14)]'
          : 'bg-paper border border-rule rounded-[14px] px-[26px] py-6 flex items-center justify-between gap-5'
      }
    >
      <div>
        <div className="flex items-center gap-[9px] mb-[10px]">
          <span
            className={
              isToday
                ? 'w-[7px] h-[7px] rounded-full bg-olive-400 shrink-0 shadow-[0_0_0_4px_rgba(108,193,24,0.22)]'
                : 'w-[7px] h-[7px] rounded-full bg-empty-border shrink-0'
            }
          />
          <span
            className={`font-mono text-[10.5px] tracking-[.16em] uppercase ${
              isToday ? 'text-olive-300' : 'text-faint'
            }`}
          >
            {isToday ? 'Hoy' : 'Mañana'}
          </span>
        </div>
        <p
          className={`font-serif font-semibold text-[27px] leading-[1.05] ${
            isToday ? 'text-olive-50' : 'text-ink'
          }`}
        >
          {formatDateLabel(date)}
        </p>
        <p className={`text-[13px] mt-[7px] ${isToday ? 'text-today-text' : 'text-faint'}`}>
          {statusText}
        </p>
      </div>

      {isWeekend ? (
        <div
          className={
            isToday
              ? 'inline-flex items-center gap-2 bg-white/10 text-white/40 border border-white/15 rounded-[9px] px-[18px] py-3 text-[13px] font-semibold whitespace-nowrap shrink-0 cursor-not-allowed'
              : 'inline-flex items-center gap-2 bg-empty-bg text-empty-text border border-hairline rounded-[9px] px-[18px] py-3 text-[13px] font-semibold whitespace-nowrap shrink-0 cursor-not-allowed'
          }
        >
          <Icon name="no-entry" size={16} stroke={1.8} />
          No disponible
        </div>
      ) : (
        <button
          type="button"
          onClick={onOpen}
          className={
            isToday
              ? 'inline-flex items-center gap-2 bg-olive-50 text-olive-800 rounded-[9px] px-5 py-3 text-[13.5px] font-bold whitespace-nowrap shrink-0 hover:bg-white transition-colors'
              : 'inline-flex items-center gap-2 bg-olive-700 text-white rounded-[9px] px-5 py-3 text-[13.5px] font-bold whitespace-nowrap shrink-0 hover:bg-olive-800 transition-colors'
          }
        >
          <Icon name={actionIcon} size={16} stroke={2.2} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
