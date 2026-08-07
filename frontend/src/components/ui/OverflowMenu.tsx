import { useEffect, useRef, useState } from 'react';
import { Icon } from '@ui/Icon';

interface MenuItem {
  label: string;
  onClick: () => void;
  icon?: string;
  variant?: 'default' | 'alert';
}

interface Props {
  items: MenuItem[];
  // "Más acciones" is enough on a page header, where there is only one. On a list row it says
  // nothing about which row, so the caller names it.
  label?: string;
  variant?: 'bordered' | 'bare';
}

// Bordered reads as a control of its own; repeated down a list it reads as clutter, so the bare
// variant carries no border and only takes on a background once it is open or hovered.
const TRIGGER_CLS: Record<NonNullable<Props['variant']>, string> = {
  bordered:
    'w-[38px] h-[38px] rounded-[9px] border border-rule bg-paper hover:border-rule-2 text-muted hover:text-ink-2',
  bare: 'w-[28px] h-[28px] rounded-[7px] text-muted hover:bg-movement-action-hover hover:text-ink',
};

export function OverflowMenu({ items, label = 'Más acciones', variant = 'bordered' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const bare = variant === 'bare';

  useEffect(() => {
    if (!open) return undefined;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center justify-center transition-colors ${TRIGGER_CLS[variant]} ${
          bare && open ? 'bg-movement-action-hover text-ink' : ''
        }`}
        aria-label={label}
        aria-expanded={open}
      >
        <Icon name={bare ? 'more-horizontal' : 'more-vertical'} size={bare ? 15 : 16} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-[208px] bg-paper border border-rule rounded-[11px] shadow-[var(--shadow-dropdown)] z-20 p-[6px]">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={`w-full text-left px-[11px] py-[9px] rounded-[8px] text-[13px] transition-colors flex items-center gap-[10px] ${
                item.variant === 'alert'
                  ? 'text-danger hover:bg-danger-bg'
                  : 'text-ink-2 hover:bg-cream-2'
              }`}
            >
              {item.icon && <Icon name={item.icon} size={15} stroke={1.7} />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
