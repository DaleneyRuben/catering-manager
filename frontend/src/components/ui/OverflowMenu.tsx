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
        className="w-9 h-9 flex items-center justify-center rounded-md border border-rule bg-paper hover:bg-cream-2 transition-colors text-ink"
        aria-label="Más acciones"
        aria-expanded={open}
      >
        <Icon name="more-vertical" size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-paper border border-rule rounded-lg shadow-md z-20 py-1 overflow-hidden">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={`w-full text-left px-3.5 py-2.5 text-[13px] transition-colors hover:bg-cream-2 flex items-center gap-2.5 ${
                item.variant === 'alert' ? 'text-alert' : 'text-ink'
              }`}
            >
              {item.icon && <Icon name={item.icon} size={13} stroke={1.5} />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
