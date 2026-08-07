import { useEffect, useRef, useState } from 'react';
import { formatShortDate } from '@/utils/format';
import { initials } from '@/utils/string';

interface Props {
  // Null once the user who registered the movement has been deleted.
  name: string | null;
  registeredAt: string;
}

const CHIP_CLS =
  'flex-none w-[26px] h-[26px] rounded-full border flex items-center justify-center font-mono text-[9px] font-semibold tracking-[.02em]';

// Provenance, not headline information: "who recorded this 2.400 de Insumos?" is the first question
// asked when a figure looks wrong, and it must be answerable without competing with the amount.
//
// The answer opens on click rather than hover. Tooltip would be the obvious reuse, but it is
// hover/focus-driven — exactly the affordance v2 exists to remove from this screen, because a touch
// device can never produce it.
export function WhoChip({ name, registeredAt }: Props) {
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

  if (!name) {
    return (
      <span
        title="El usuario que lo registró fue eliminado"
        className={`${CHIP_CLS} border-who-chip-border bg-who-chip-bg text-who-chip-text`}
      >
        —
      </span>
    );
  }

  return (
    <div ref={ref} className="relative flex-none">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Registrado por ${name}`}
        aria-expanded={open}
        className={`${CHIP_CLS} border-who-chip-border text-who-chip-text hover:text-ink hover:border-olive-200 transition-colors cursor-pointer ${
          open ? 'bg-who-chip-bg-open' : 'bg-who-chip-bg'
        }`}
      >
        {initials(name)}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-40 whitespace-nowrap rounded-[9px] bg-olive-800 px-[13px] py-[9px] shadow-[var(--shadow-dropdown)]">
          <p className="font-mono text-[8.5px] tracking-[.18em] uppercase text-olive-300 mb-[3px]">
            Registrado por
          </p>
          <p className="text-[13px] font-semibold text-cream">{name}</p>
          <p className="font-mono text-[10px] text-cream/60 mt-0.5">
            el {formatShortDate(registeredAt)}
          </p>
        </div>
      )}
    </div>
  );
}
