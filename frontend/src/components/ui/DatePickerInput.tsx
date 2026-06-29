import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DayPicker, type Matcher } from 'react-day-picker';
import { es } from 'react-day-picker/locale';
import { format, parse, isValid } from 'date-fns';
import { Icon } from '@/components/ui/Icon';
import { inputCls } from '@/components/ui/Field';

type CaptionLayout = 'label' | 'dropdown' | 'dropdown-months' | 'dropdown-years';

interface Props {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  hasError?: boolean;
  placeholder?: string;
  captionLayout?: CaptionLayout;
  startMonth?: Date;
  endMonth?: Date;
  disabled?: Matcher | Matcher[];
}

const POPOVER_WIDTH = 292;

const CLASSNAMES = {
  root: 'select-none',
  months: '',
  month: 'relative w-full',
  month_caption: 'flex justify-center items-center h-9 mb-2 mx-9',
  caption_label:
    'font-mono text-[13px] font-semibold text-ink flex items-center gap-1 pointer-events-none',
  dropdowns: 'flex items-center gap-1.5',
  dropdown_root:
    'relative inline-flex items-center border border-rule rounded-md px-2 h-7 bg-cream hover:border-olive-600 transition-colors cursor-pointer',
  dropdown: 'absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10',
  months_dropdown: '',
  years_dropdown: '',
  nav: '',
  button_previous:
    'absolute left-0 top-0 h-9 w-9 flex items-center justify-center rounded-lg hover:bg-cream-2 transition-colors text-muted',
  button_next:
    'absolute right-0 top-0 h-9 w-9 flex items-center justify-center rounded-lg hover:bg-cream-2 transition-colors text-muted',
  chevron: 'fill-current',
  month_grid: 'w-full',
  weekdays: '',
  weekday: 'text-center text-[11px] font-mono text-muted py-1 font-normal',
  weeks: '',
  week: '',
  day: 'text-center p-0.5',
  day_button:
    'h-9 w-9 text-[12px] font-mono rounded-full flex items-center justify-center mx-auto transition-colors hover:bg-cream-2 cursor-pointer',
  today: 'font-bold text-olive-600',
  outside: 'opacity-30',
  disabled: 'opacity-30 cursor-not-allowed pointer-events-none',
  hidden: 'invisible',
  focused: 'ring-1 ring-olive-600',
  selected: '',
};

function toDisplay(iso: string): string {
  if (!iso) return '';
  const d = parse(iso, 'yyyy-MM-dd', new Date());
  return d && isValid(d) ? format(d, 'dd/MM/yyyy') : '';
}

export function DatePickerInput({
  id,
  value,
  onChange,
  hasError,
  placeholder = 'dd/mm/aaaa',
  captionLayout = 'label',
  startMonth,
  endMonth,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState(() => toDisplay(value));
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync display text when value is changed externally (e.g. calendar selection)
  useEffect(() => {
    setInputText(toDisplay(value));
  }, [value]);

  const updatePosition = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const left =
      rect.left + POPOVER_WIDTH > window.innerWidth ? rect.right - POPOVER_WIDTH : rect.left;
    setPopoverStyle({ top: rect.bottom + 6, left });
  };

  useEffect(() => {
    if (!open) return undefined;
    updatePosition();
    const onMouseDown = (e: MouseEvent) => {
      if (
        !containerRef.current?.contains(e.target as Node) &&
        !(e.target as Element).closest('[data-datepicker-portal]')
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
  }, [open]);

  const parsed = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;
  const selected = parsed && isValid(parsed) ? parsed : undefined;

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    // Auto-insert slashes only when adding characters
    if (val.length > inputText.length) {
      if (val.length === 2 && !val.includes('/')) val += '/';
      else if (val.length === 5 && val[2] === '/' && !val.slice(3).includes('/')) val += '/';
    }

    setInputText(val);

    if (val === '') {
      onChange('');
      return;
    }
    if (val.length === 10) {
      const d = parse(val, 'dd/MM/yyyy', new Date());
      if (isValid(d)) onChange(format(d, 'yyyy-MM-dd'));
    }
  };

  const handleBlur = () => {
    if (!inputText) return;
    const d = parse(inputText, 'dd/MM/yyyy', new Date());
    if (isValid(d)) {
      onChange(format(d, 'yyyy-MM-dd'));
      setInputText(format(d, 'dd/MM/yyyy'));
    } else {
      // Reset to last valid value
      setInputText(toDisplay(value));
    }
  };

  return (
    <div ref={containerRef} className="relative flex items-center">
      <input
        id={id}
        type="text"
        value={inputText}
        onChange={handleTextChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`${inputCls(hasError)} pr-9`}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setOpen((o) => !o)}
        className="absolute right-2.5 flex items-center text-muted hover:text-ink transition-colors"
      >
        <Icon name="calendar" size={14} />
      </button>

      {open &&
        createPortal(
          <div
            data-datepicker-portal
            style={{ ...popoverStyle, width: POPOVER_WIDTH, position: 'fixed', zIndex: 9999 }}
            className="bg-cream border border-rule rounded-xl shadow-xl p-4"
          >
            <DayPicker
              mode="single"
              locale={es}
              selected={selected}
              onSelect={(date) => {
                if (date) {
                  onChange(format(date, 'yyyy-MM-dd'));
                  setOpen(false);
                }
              }}
              captionLayout={captionLayout}
              navLayout="around"
              startMonth={startMonth}
              endMonth={endMonth}
              defaultMonth={selected}
              disabled={disabled}
              classNames={CLASSNAMES}
              modifiersStyles={{
                selected: {
                  backgroundColor: 'var(--color-olive-800)',
                  color: 'white',
                },
              }}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}
