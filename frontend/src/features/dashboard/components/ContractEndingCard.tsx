import { Icon } from '@/components/ui/Icon';
import { initials } from '@/utils/string';
import { formatShortDate } from '@/utils/format';
import type { ContractEndingPerson } from '@/features/dashboard/types';

interface Props {
  today: ContractEndingPerson[];
  tomorrow: ContractEndingPerson[];
  todayLabel?: string;
  tomorrowLabel?: string;
}

function PersonRow({ person }: { person: ContractEndingPerson }) {
  return (
    <div className="flex items-center gap-[11px]">
      <div className="w-[30px] h-[30px] rounded-full bg-olive-100 border border-olive-200 text-olive-700 flex items-center justify-center font-mono font-semibold text-[10.5px] shrink-0">
        {initials(person.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-ink leading-tight">{person.name}</p>
        <p className="font-mono text-[10px] text-faint mt-px">{person.plan}</p>
      </div>
      <span className="font-mono text-[11px] text-warn bg-warn-bg rounded-[5px] px-2 py-[3px] whitespace-nowrap">
        {formatShortDate(person.date)}
      </span>
    </div>
  );
}

function DaySection({ label, people }: { label: string; people: ContractEndingPerson[] }) {
  return (
    <>
      <div className="font-mono text-[9.5px] tracking-[.13em] uppercase text-faint mb-[9px] flex items-center gap-2">
        {label}
        <span className="h-px flex-1 bg-hairline" />
      </div>
      <div className="flex flex-col gap-[7px]">
        {people.length === 0 ? (
          <p className="text-[12.5px] text-faint">Sin contratos por terminar</p>
        ) : (
          people.map((p) => <PersonRow key={p.id} person={p} />)
        )}
      </div>
    </>
  );
}

export function ContractEndingCard({
  today,
  tomorrow,
  todayLabel = 'Hoy',
  tomorrowLabel = 'Mañana',
}: Props) {
  return (
    <div className="bg-paper border border-rule rounded-[14px] px-6 py-[22px] flex flex-col">
      <div className="flex items-center gap-[11px] mb-[18px]">
        <span className="w-[34px] h-[34px] rounded-[9px] bg-warn-bg text-warn flex items-center justify-center shrink-0">
          <Icon name="flag" size={17} stroke={1.6} />
        </span>
        <h2 className="font-serif font-semibold text-[20px] text-ink">Terminan contrato</h2>
      </div>

      <div className="mb-[18px]">
        <DaySection label={todayLabel} people={today} />
      </div>
      <DaySection label={tomorrowLabel} people={tomorrow} />
    </div>
  );
}
