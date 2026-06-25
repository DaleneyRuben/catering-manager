import { Icon } from '../../components/ui/Icon';
import { initials } from '../../utils/string';
import type { DeliveryPerson } from '../../types/delivery';

interface Props {
  person: DeliveryPerson;
  avatarClass: string;
  rowBorderClass: string;
}

export function DeliveryPersonRow({ person, avatarClass, rowBorderClass }: Props) {
  return (
    <div className={`flex items-center gap-[11px] py-[9px] border-t ${rowBorderClass}`}>
      <div
        className={`w-8 h-8 rounded-full border flex items-center justify-center font-mono font-semibold text-[11px] shrink-0 ${avatarClass}`}
      >
        {initials(person.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-ink leading-tight">{person.name}</p>
        <a
          href={`tel:${person.phone.replace(/\s/g, '')}`}
          className="inline-flex items-center gap-[5px] font-mono text-[11.5px] tracking-[.02em] text-muted no-underline mt-0.5 hover:text-olive-700 transition-colors"
        >
          <Icon name="phone" size={11} />
          {person.phone}
        </a>
      </div>
    </div>
  );
}
