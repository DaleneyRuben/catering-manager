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
  isToday,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Icon } from '@ui/Icon';
import { IconButton } from '@ui/IconButton';
import { Modal } from '@ui/Modal';
import { Button } from '@ui/Button';
import { MODAL_CANCEL_STYLE, MODAL_CONFIRM_STYLE } from '@ui/modalButtonStyles';
import { addBusinessDays, subtractBusinessDays } from '@/utils/businessDays';
import { formatDate } from '@/utils/format';
import type { Subscription } from '@/features/clients/types';

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

  // Compute the projected end date first so it can serve as the selectable ceiling.
  // Each suspension picked extends the window, unlocking further dates dynamically.
  const net = selected.length - (sub.suspendedDates ?? []).length;
  let newEndDate: string | null = null;
  if (sub.contractEndDate) {
    if (net > 0) newEndDate = addBusinessDays(sub.contractEndDate, net);
    else if (net < 0) newEndDate = subtractBusinessDays(sub.contractEndDate, Math.abs(net));
  }
  const effectiveEnd = newEndDate ? parseISO(`${newEndDate}T12:00:00`) : contractEnd;

  const isInContract = (d: Date) =>
    contractStart && effectiveEnd
      ? !isBefore(d, contractStart) && !isAfter(d, effectiveEnd)
      : false;
  const isSelectable = (d: Date) =>
    effectiveEnd ? !isBefore(d, minDate) && !isAfter(d, effectiveEnd) : false;
  const isPickedDay = (d: Date) => selected.some((s) => isSameDay(s, d));

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
    <Modal onClose={onClose} className="w-[min(580px,92vw)] max-h-[92vh] overflow-auto">
      <div className="flex items-center gap-2.5 px-[22px] py-[18px] border-b border-rule">
        <Icon name="calendar" size={16} />
        <div className="flex-1">
          <p className="font-serif text-[20px] leading-tight text-ink">Suspender servicio</p>
          <p className="font-mono text-[11px] text-muted">{clientName} · selecciona los días</p>
        </div>
        <IconButton
          icon="x"
          label="Cerrar"
          onClick={onClose}
          size={14}
          className="w-[34px] h-[34px] border border-rule rounded-md bg-paper hover:bg-cream-2"
        />
      </div>

      <div className="p-[22px]">
        {/* Month navigation */}
        <div className="flex items-center gap-3 mb-4">
          <IconButton
            icon="arrow-left"
            label="Mes anterior"
            onClick={() => setAnchor(startOfMonth(subMonths(anchor, 1)))}
            size={14}
            className="w-9 h-9 border border-rule rounded-md bg-paper hover:bg-cream-2 text-muted"
          />
          <p className="flex-1 text-center font-serif text-[18px] capitalize">
            {format(anchor, 'MMMM', { locale: es })} de {format(anchor, 'yyyy')}
          </p>
          <IconButton
            icon="arrow-right"
            label="Mes siguiente"
            onClick={() => setAnchor(startOfMonth(addMonths(anchor, 1)))}
            size={14}
            className="w-9 h-9 border border-rule rounded-md bg-paper hover:bg-cream-2 text-muted"
          />
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
                  let borderWidth: string | undefined;
                  let borderStyle: string | undefined;
                  let borderColor: string | undefined;

                  if (picked) {
                    bg = 'var(--color-calendar-suspended-bg)';
                    color = 'var(--color-calendar-suspended-text)';
                    borderWidth = '2px';
                    borderStyle = 'solid';
                    borderColor = 'var(--color-calendar-suspended-border)';
                  } else if (!outside && inContract && selectable) {
                    bg = 'var(--color-calendar-selectable)';
                    color = 'var(--color-olive-800)';
                  }

                  // Today's ring fully replaces (rather than stacks on top of) any other
                  // border, e.g. the suspended state's own border, avoiding a doubled-ring
                  // look. Kept as longhand border-* properties throughout — mixing the
                  // `border` shorthand with longhand overrides across re-renders is a
                  // React anti-pattern (it warns about conflicting style properties).
                  if (isToday(day)) {
                    borderWidth = '2px';
                    borderStyle = 'solid';
                    borderColor = 'var(--color-olive-800)';
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
                      data-testid={isToday(day) ? 'calendar-day-today' : undefined}
                      className={`h-12 flex items-center justify-center rounded-lg text-[13px] font-mono font-semibold transition-colors ${cursorClass}`}
                      style={{
                        backgroundColor: bg,
                        color,
                        borderWidth,
                        borderStyle,
                        borderColor,
                        fontWeight: isToday(day) ? 700 : undefined,
                      }}
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
                    className="inline-flex items-center gap-[7px] px-[10px] py-[5px] rounded-[8px] text-[11.5px] font-mono bg-warn-bg text-warn border border-warn-border"
                  >
                    {formatDate(iso)}
                    <IconButton
                      icon="x"
                      label="Quitar"
                      onClick={() => toggle(d)}
                      size={10}
                      className="opacity-70 hover:opacity-100"
                    />
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
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSaving}
            style={MODAL_CANCEL_STYLE}
          >
            Cancelar
          </Button>
          <div className="flex-1" />
          <Button
            onClick={handleSave}
            loading={isSaving}
            leftIcon="check"
            style={MODAL_CONFIRM_STYLE}
          >
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
