import { Icon } from '@ui/Icon';
import { DeliveryGroupCard } from '@/features/delivery/components/DeliveryGroupCard';
import { DeliveryPersonRow } from '@/features/delivery/components/DeliveryPersonRow';
import type { DeliveryZone } from '@/features/delivery/types';

interface Props {
  zone: DeliveryZone;
  colorIndexOffset: number;
}

export function DeliveryZoneSection({ zone, colorIndexOffset }: Props) {
  return (
    <section className="flex flex-col gap-[14px]">
      <div className="flex items-center gap-[13px] pt-1">
        <span className="w-[30px] h-[30px] rounded-[8px] bg-olive-800 text-olive-200 flex items-center justify-center shrink-0">
          <Icon name="pin" size={16} />
        </span>
        <h2 className="font-serif font-semibold text-[25px] text-ink">Zona {zone.zone}</h2>
        <span className="font-mono text-[11px] font-semibold tracking-[.06em] text-olive-600 bg-olive-100 border border-olive-200 rounded-full px-[11px] py-1">
          {zone.entregas} {zone.entregas === 1 ? 'entrega' : 'entregas'}
        </span>
        <span className="h-px flex-1 bg-hairline" />
      </div>

      {zone.groups.length > 0 && (
        <div className="flex flex-col gap-[14px]">
          {zone.groups.map((g, i) => (
            <DeliveryGroupCard key={g.groupToken} group={g} colorIndex={colorIndexOffset + i} />
          ))}
        </div>
      )}

      {zone.singles.length > 0 && (
        <div className="bg-paper border border-rule rounded-[13px] px-[18px] py-[6px]">
          <div className="flex items-center gap-[9px] py-[11px] pb-[9px]">
            <span className="font-mono text-[10px] font-semibold tracking-[.13em] uppercase text-faint">
              Individuales
            </span>
            <span className="font-mono text-[10px] text-muted-dot">
              {zone.singles.length === 1 ? '1 cliente' : `${zone.singles.length} clientes`}
            </span>
            <span className="h-px flex-1 bg-cream-2" />
          </div>
          <div className="flex flex-col">
            {zone.singles.map((p) => (
              <DeliveryPersonRow
                key={p.id}
                person={p}
                avatarClass="bg-cream-2 border-hairline text-muted"
                rowBorderClass="border-cream-2"
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
