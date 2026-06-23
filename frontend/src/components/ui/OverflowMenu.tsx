import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';

interface MenuItem {
  label: string;
  onClick: () => void;
  icon?: string;
  variant?: 'default' | 'alert';
}

interface Props {
  items: MenuItem[];
}

export function OverflowMenu({ items }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
        className="w-[38px] h-[38px] flex items-center justify-center rounded-[9px] border border-rule bg-paper hover:border-rule-2 transition-colors text-muted hover:text-ink-2"
        aria-label="Más acciones"
        aria-expanded={open}
      >
        <Icon name="more-vertical" size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-[208px] bg-paper border border-rule rounded-[11px] shadow-[0_12px_32px_rgba(20,40,6,0.16)] z-20 p-[6px]">
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
