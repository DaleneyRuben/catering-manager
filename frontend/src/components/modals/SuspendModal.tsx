import { useState } from 'react';
import {
  addDays,
  addMonths,
  compareAsc,
  endOfMonth,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Icon } from "../ui/Icon";
import { addBusinessDays, subtractBusinessDays } from '../../utils/businessDays';
import { formatDate } from '../../utils/format';
import type { Subscription } from '../../types/client';

const WEEKDAY_LABELS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE'];

function getCalendarWeeks(anchor: Date): Date[][] {
  const firstOfMonth = startOfMonth(anchor);
  const lastOfMonth = endOfMonth(anchor);
  const mondayOfFirst = startOfWeek(firstOfMonth, { weekStartsOn: 1 });
  const weeks: Date[][] = [];
  let current = mondayOfFirst;
  while (!isAfter(current, lastOfMonth)) {
    const week: Date[] = [];
    for (let d = 0; d < 5; d += 1) week.push(addDays(current, d));
    weeks.push(week);
    current = addDays(current, 7);
  }
  return weeks;
}

export function SuspendModal({
  sub,
  clientName,
  onClose,
  onSave,
}: {
  sub: Subscription;
  clientName: string;
  onClose: () => void;
  onSave: (dates: string[]) => Promise<void>;
}) {
  const today = startOfDay(new Date());
  const [anchor, setAnchor] = useState(startOfMonth(today));
  const [selected, setSelected] = useState<Date[]>(
    (sub.suspendedDates ?? []).map((d) => parseISO(`${d}T12:00:00`)),
  );
  const [isSaving, setIsSaving] = useState(false);

  const minDate = subDays(today, 7);
  const contractStart = sub.startDate ? parseISO(sub.startDate) : null;
  const contractEnd = sub.contractEndDate ? parseISO(sub.contractEndDate) : null;

  const toggle = (day: Date) => {
    setSelected((prev) =>
      prev.some((d) => isSameDay(d, day)) ? prev.filter((d) => !isSameDay(d, day)) : [...prev, day],
    );
  };

  const isInContract = (d: Date) =>
    contractStart && contractEnd ? !isBefore(d, contractStart) && !isAfter(d, contractEnd) : false;
  const isSelectable = (d: Date) =>
    contractEnd ? !isBefore(d, minDate) && !isAfter(d, contractEnd) : false;
  const isPickedDay = (d: Date) => selected.some((s) => isSameDay(s, d));

  const net = selected.length - (sub.suspendedDates ?? []).length;
  let newEndDate: string | null = null;
  if (sub.contractEndDate) {
    if (net > 0) newEndDate = addBusinessDays(sub.contractEndDate, net);
    else if (net < 0) newEndDate = subtractBusinessDays(sub.contractEndDate, Math.abs(net));
  }

  const weeks = getCalendarWeeks(anchor);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(selected.map((d) => format(d, 'yyyy-MM-dd')));
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-[rgba(20,40,6,0.32)] backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-cream border border-rule-2 rounded-[10px] w-[min(580px,92vw)] max-h-[92vh] overflow-auto shadow-[0_20px_60px_rgba(20,40,6,0.25)]"
      >
        <div className="flex items-center gap-2.5 px-[22px] py-[18px] border-b border-rule">
          <Icon name="calendar" size={16} />
          <div className="flex-1">
            <p className="font-serif text-[20px] leading-tight text-ink">Suspender servicio</p>
            <p className="font-mono text-[11px] text-muted">{clientName} · selecciona los días</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-[34px] h-[34px] flex items-center justify-center border border-rule rounded-md bg-paper hover:bg-cream-2 transition-colors"
          >
            <Icon name="x" size={14} />
          </button>
        </div>

        <div className="p-[22px]">
          {/* Month navigation */}
          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => setAnchor(startOfMonth(subMonths(anchor, 1)))}
              className="w-9 h-9 flex items-center justify-center border border-rule rounded-md bg-paper hover:bg-cream-2 transition-colors text-muted text-lg"
            >
              ‹
            </button>
            <p className="flex-1 text-center font-serif text-[18px] capitalize">
              {format(anchor, 'MMMM', { locale: es })} de {format(anchor, 'yyyy')}
            </p>
            <button
              type="button"
              onClick={() => setAnchor(startOfMonth(addMonths(anchor, 1)))}
              className="w-9 h-9 flex items-center justify-center border border-rule rounded-md bg-paper hover:bg-cream-2 transition-colors text-muted text-lg"
            >
              ›
            </button>
          </div>

          {/* Mon–Fri calendar grid */}
          <div className="bg-paper border border-rule rounded-lg p-4">
            <div className="grid grid-cols-5 gap-2 mb-2">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="text-center text-[10.5px] font-mono text-muted py-1 tracking-wider"
                >
                  {label}
                </div>
              ))}
            </div>
            {weeks.map((week) => {
              const weekKey = format(week[0], 'yyyy-MM-dd');
              return (
                <div key={weekKey} className="grid grid-cols-5 gap-2 mb-2">
                  {week.map((day) => {
                    const iso = format(day, 'yyyy-MM-dd');
                    const outside = !isSameMonth(day, anchor);
                    const selectable = isSelectable(day);
                    const inContract = isInContract(day);
                    const picked = isPickedDay(day);
                    const clickable = !outside && selectable;

                    let bg = '';
                    let color = '';
                    let border = '';

                    if (picked) {
                      bg = '#e3a899';
                      color = '#7a2418';
                      border = '2px solid #c5756a';
                    } else if (!outside && inContract && selectable) {
                      bg = '#a8c374';
                      color = '#1e3c0a';
                    }

                    let cursorClass = 'hover:bg-cream-2 cursor-pointer';
                    if (!clickable) cursorClass = 'opacity-25 cursor-default';
                    else if (picked || inContract) cursorClass = 'hover:opacity-80 cursor-pointer';

                    return (
                      <button
                        key={iso}
                        type="button"
                        disabled={!clickable}
                        onClick={() => clickable && toggle(day)}
                        className={`h-12 flex items-center justify-center rounded-lg text-[13px] font-mono font-semibold transition-colors ${cursorClass}`}
                        style={{ backgroundColor: bg, color, border }}
                      >
                        {format(day, 'd')}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Selected days */}
          <div className="mt-4 p-3.5 bg-paper border border-rule rounded-md">
            <p className="text-[10.5px] font-mono uppercase tracking-wider text-muted mb-2">
              Días seleccionados ({selected.length})
            </p>
            {selected.length === 0 ? (
              <p className="font-mono text-[11.5px] text-muted">
                Hacé clic en un día para suspender ese reparto.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {[...selected].sort(compareAsc).map((d) => {
                  const iso = format(d, 'yyyy-MM-dd');
                  return (
                    <span
                      key={iso}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono"
                      style={{ background: '#f3eedc', color: '#6b4f08' }}
                    >
                      {formatDate(iso)}
                      <button
                        type="button"
                        onClick={() => toggle(d)}
                        className="opacity-70 hover:opacity-100"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {newEndDate && net !== 0 && (
            <p className="font-mono text-[11.5px] text-muted mt-3">
              Nuevo fin de contrato:{' '}
              <span className="text-ink font-semibold">{formatDate(newEndDate)}</span>
            </p>
          )}

          <div className="flex gap-2.5 mt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 text-[13px] font-semibold border border-rule rounded-md text-ink hover:bg-paper transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold bg-olive-800 text-white rounded-md hover:bg-olive-700 transition-colors disabled:opacity-60"
            >
              {isSaving ? (
                <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : (
                <Icon name="check" size={14} />
              )}
              Guardar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
