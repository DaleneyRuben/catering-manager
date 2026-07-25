import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@ui/Icon';
import { inputCls } from '@ui/Field';

interface Props {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

type Meridiem = 'AM' | 'PM';
type TimeParts = { h12: number; min: number; mer: Meridiem };

const POPOVER_WIDTH = 232;
const POPOVER_HEIGHT = 232;
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
const MERIDIEMS: Meridiem[] = ['AM', 'PM'];

function parseTime(value: string): TimeParts | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value || '');
  if (!m) return null;
  const hours = Number(m[1]);
  const minutes = Number(m[2]);
  if (hours > 23 || minutes > 59) return null;
  return { h12: hours % 12 || 12, min: minutes, mer: hours >= 12 ? 'PM' : 'AM' };
}

function buildValue(parts: TimeParts): string {
  const hours = parts.mer === 'PM' ? (parts.h12 % 12) + 12 : parts.h12 % 12;
  return `${String(hours).padStart(2, '0')}:${String(parts.min).padStart(2, '0')}`;
}

function cellCls(selected: boolean): string {
  const base =
    'w-full text-center font-mono text-[12.5px] tabular-nums py-1.5 rounded-[7px] transition-colors';
  return selected
    ? `${base} bg-olive-700 text-white font-semibold hover:bg-olive-800`
    : `${base} text-ink-2 hover:bg-cream-2 hover:text-ink`;
}

export function TimePickerInput({ id, value, onChange, placeholder = '--:-- --' }: Props) {
  const [open, setOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedHourRef = useRef<HTMLButtonElement>(null);
  const selectedMinuteRef = useRef<HTMLButtonElement>(null);

  const parts = parseTime(value);

  const updatePosition = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const openUp =
      rect.bottom + 6 + POPOVER_HEIGHT > window.innerHeight && rect.top - 6 - POPOVER_HEIGHT > 0;
    setPopoverStyle({
      top: openUp ? rect.top - 6 - POPOVER_HEIGHT : rect.bottom + 6,
      left: rect.right - POPOVER_WIDTH,
    });
  };

  useEffect(() => {
    if (!open) return undefined;
    updatePosition();
    selectedHourRef.current?.scrollIntoView?.({ block: 'center' });
    selectedMinuteRef.current?.scrollIntoView?.({ block: 'center' });
    const onMouseDown = (e: MouseEvent) => {
      if (
        !containerRef.current?.contains(e.target as Node) &&
        !(e.target as Element).closest('[data-timepicker-portal]')
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onScroll = () => updatePosition();
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const pick = (patch: Partial<TimeParts>) => {
    const base: TimeParts = parts ?? { h12: 9, min: 0, mer: 'AM' };
    onChange(buildValue({ ...base, ...patch }));
  };

  const display = parts
    ? `${String(parts.h12).padStart(2, '0')}:${String(parts.min).padStart(2, '0')} ${parts.mer}`
    : placeholder;

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${inputCls()} flex items-center justify-between gap-2 ${
          parts ? '' : 'text-faint'
        }`}
      >
        <span>{display}</span>
        <Icon name="clock" size={15} stroke={1.7} className="text-muted shrink-0" />
      </button>

      {open &&
        createPortal(
          <div
            data-timepicker-portal
            style={{ ...popoverStyle, width: POPOVER_WIDTH, position: 'fixed', zIndex: 9999 }}
            className="bg-cream border border-rule rounded-xl shadow-xl overflow-hidden"
          >
            <div className="grid grid-cols-3 gap-1.5 px-2.5 pt-2 pb-1">
              <span className="font-mono text-[9px] tracking-[.13em] uppercase text-faint text-center">
                Hora
              </span>
              <span className="font-mono text-[9px] tracking-[.13em] uppercase text-faint text-center">
                Min
              </span>
              <span className="font-mono text-[9px] tracking-[.13em] uppercase text-faint text-center">
                AM/PM
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 px-2.5 pb-2.5">
              <div className="max-h-[126px] overflow-y-auto flex flex-col gap-0.5 pr-0.5">
                {HOURS.map((h) => {
                  const selected = parts?.h12 === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      ref={selected ? selectedHourRef : undefined}
                      aria-pressed={selected}
                      onClick={() => pick({ h12: h })}
                      className={cellCls(selected)}
                    >
                      {String(h).padStart(2, '0')}
                    </button>
                  );
                })}
              </div>
              <div className="max-h-[126px] overflow-y-auto flex flex-col gap-0.5 pr-0.5">
                {MINUTES.map((min) => {
                  const selected = parts?.min === min;
                  return (
                    <button
                      key={min}
                      type="button"
                      ref={selected ? selectedMinuteRef : undefined}
                      aria-pressed={selected}
                      onClick={() => pick({ min })}
                      className={cellCls(selected)}
                    >
                      {String(min).padStart(2, '0')}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-col gap-0.5">
                {MERIDIEMS.map((mer) => {
                  const selected = parts?.mer === mer;
                  return (
                    <button
                      key={mer}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => pick({ mer })}
                      className={cellCls(selected)}
                    >
                      {mer}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 px-2.5 py-2 border-t border-hairline bg-cream-2">
              <button
                type="button"
                onClick={() => onChange('')}
                className="font-mono text-[10.5px] tracking-[.06em] uppercase text-muted hover:text-ink hover:bg-rule px-1.5 py-1 rounded-md transition-colors"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="font-mono text-[10.5px] tracking-[.06em] uppercase text-olive-700 font-semibold hover:bg-olive-100 px-2 py-1 rounded-md transition-colors"
              >
                Listo
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
