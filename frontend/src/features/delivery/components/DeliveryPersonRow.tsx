import { Icon } from '@ui/Icon';
import { initials } from '@/utils/string';
import type { DeliveryPerson } from '@/features/delivery/types';

interface Props {
  person: DeliveryPerson;
  avatarClass: string;
  rowBorderClass: string;
  showAddress?: boolean;
}

export function DeliveryPersonRow({
  person,
  avatarClass,
  rowBorderClass,
  showAddress = false,
}: Props) {
  const phoneLink = (
    <a
      href={`tel:${person.phone.replace(/\s/g, '')}`}
      className={`inline-flex items-center gap-[5px] font-mono text-[11.5px] tracking-[.02em] text-muted no-underline hover:text-olive-700 transition-colors ${
        showAddress ? 'whitespace-nowrap' : 'mt-0.5'
      }`}
    >
      <Icon name="phone" size={11} />
      {person.phone}
    </a>
  );

  return (
    <div className={`flex items-center gap-[11px] py-[9px] border-t ${rowBorderClass}`}>
      <div
        className={`w-8 h-8 rounded-full border flex items-center justify-center font-mono font-semibold text-[11px] shrink-0 ${avatarClass}`}
      >
        {initials(person.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13.5px] font-semibold text-ink leading-tight">{person.name}</p>
          {person.isNew && (
            <span className="font-mono text-[9px] font-bold tracking-[.1em] uppercase text-white bg-olive-700 rounded-full px-2 py-0.5 shrink-0">
              Nuevo
            </span>
          )}
        </div>
        {showAddress ? (
          <div className="flex items-center gap-[6px] text-faint mt-0.5">
            <Icon name="pin" size={12} className="shrink-0" />
            <span className="font-mono text-[11px] tracking-[.01em] text-muted">
              {person.address}
            </span>
          </div>
        ) : (
          phoneLink
        )}
      </div>
      {showAddress && phoneLink}
    </div>
  );
}
