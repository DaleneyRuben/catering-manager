import { useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { initials } from '../../utils/string';
import { formatShortDate } from '../../utils/format';
import type { BirthdayPerson } from '../../types/dashboard';

interface Props {
  birthdays: BirthdayPerson[];
  monthLabel: string;
}

const LIMIT = 5;

const AVATAR_TODAY = 'bg-olive-700 border-olive-700 text-olive-50';
const AVATAR_DEFAULT = 'bg-cream-2 border-hairline text-muted';
const DATE_CHIP_TODAY = 'bg-ok-bg text-ok font-semibold';
const DATE_CHIP_DEFAULT = 'bg-cream-2 text-muted';

export function BirthdaysCard({ birthdays, monthLabel }: Props) {
  const [showAll, setShowAll] = useState(false);

  const hasMore = birthdays.length > LIMIT;
  const shown = showAll ? birthdays : birthdays.slice(0, LIMIT);

  return (
    <div className="bg-paper border border-rule rounded-[14px] px-6 py-[22px] flex flex-col">
      <div className="flex items-center gap-[11px] mb-[6px]">
        <span className="w-[34px] h-[34px] rounded-[9px] bg-olive-100 text-olive-700 flex items-center justify-center shrink-0">
          <Icon name="gift" size={17} stroke={1.6} />
        </span>
        <h2 className="font-serif font-semibold text-[20px] text-ink">Cumpleaños</h2>
      </div>
      <p className="font-mono text-[12px] text-faint tracking-[.04em] uppercase mb-4">
        {monthLabel} · {birthdays.length} clientes
      </p>

      <div className="flex flex-col gap-[9px]">
        {shown.map((b) => (
          <div key={b.id} className="flex items-center gap-[11px]">
            <div
              className={`w-[30px] h-[30px] rounded-full border flex items-center justify-center font-mono font-semibold text-[10.5px] shrink-0 ${b.isToday ? AVATAR_TODAY : AVATAR_DEFAULT}`}
            >
              {initials(b.name)}
            </div>
            <div className="flex-1 min-w-0 text-[13.5px] font-semibold text-ink">{b.name}</div>
            <span
              className={`font-mono text-[11px] tracking-[.04em] rounded-[5px] px-2 py-[3px] whitespace-nowrap ${b.isToday ? DATE_CHIP_TODAY : DATE_CHIP_DEFAULT}`}
            >
              {formatShortDate(b.dateOfBirth)}
            </span>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-[15px] inline-flex items-center justify-center gap-[7px] border-t border-cream-2 pt-[13px] pb-0.5 w-full font-mono text-[11px] font-semibold tracking-[.08em] uppercase text-olive-600 hover:text-olive-700 transition-colors"
        >
          {showAll ? 'Ver menos' : `Ver ${birthdays.length - LIMIT} más`}
          <Icon
            name="chevron-down"
            size={13}
            stroke={2.2}
            className={`transition-transform ${showAll ? 'rotate-180' : ''}`}
          />
        </button>
      )}
    </div>
  );
}
