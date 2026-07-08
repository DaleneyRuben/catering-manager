import { useState } from 'react';
import { Button } from '@ui/Button';
import { PageHeader } from '@ui/PageHeader';
import { Icon } from '@ui/Icon';
import { Skeleton } from '@ui/Skeleton';
import { useDeliveryRoute } from '@/features/delivery/hooks/useDeliveryRoute';
import { formatLongDate } from '@/utils/format';
import { DeliveryZoneSection } from '@/features/delivery/components/DeliveryZoneSection';
import type { DeliveryDayRoute } from '@/features/delivery/types';

type Day = 'today' | 'tomorrow';

const deliveryCountTotal = (route: DeliveryDayRoute | undefined): number =>
  (route?.zones ?? []).reduce((sum, z) => sum + z.deliveryCount, 0);

const TAB_ON = 'bg-paper border border-rule text-ink shadow-[var(--shadow-tab)] font-semibold';
const TAB_OFF = 'border border-transparent text-muted font-semibold';
const BADGE_ON =
  'font-mono text-[10.5px] font-semibold text-olive-700 bg-olive-100 rounded-full px-[7px] py-px';
const BADGE_OFF =
  'font-mono text-[10.5px] font-semibold text-faint bg-hairline rounded-full px-[7px] py-px';

export function DeliveryPage() {
  const [day, setDay] = useState<Day>('today');
  const { today, tomorrow, todayDate, tomorrowDate, isLoading } = useDeliveryRoute();

  const selectedDate = day === 'today' ? todayDate : tomorrowDate;
  const selectedRoute = day === 'today' ? today : tomorrow;
  const zones = selectedRoute?.zones ?? [];
  const totalLabel = deliveryCountTotal(selectedRoute);

  let runningOffset = 0;
  const zonesWithOffsets = zones.map((zone) => {
    const colorIndexOffset = runningOffset;
    runningOffset += zone.groups.length;
    return { zone, colorIndexOffset };
  });

  return (
    <div className="px-4 py-5 lg:px-[44px] lg:py-[34px]">
      <PageHeader
        label="Ruta de reparto"
        title="Entregas"
        action={
          selectedDate && (
            <div className="flex items-center gap-[9px] font-mono text-[12px] text-muted bg-paper border border-rule rounded-[9px] px-[14px] py-[9px]">
              <Icon name="calendar" size={15} className="text-olive-600" />
              {formatLongDate(selectedDate, { withYear: true })}
            </div>
          )
        }
      />

      {isLoading && (
        <div className="flex flex-col gap-[22px]">
          <div className="flex gap-2">
            <Skeleton className="w-[90px] h-[38px] rounded-[8px]" />
            <Skeleton className="w-[100px] h-[38px] rounded-[8px]" />
          </div>
          {['a', 'b'].map((k) => (
            <div
              key={k}
              className="bg-paper border border-rule rounded-[13px] p-5 flex flex-col gap-3"
            >
              <Skeleton className="w-20 h-3" />
              {['x', 'y', 'z'].map((r) => (
                <div key={r} className="flex items-center justify-between">
                  <Skeleton className="w-36 h-3.5" />
                  <Skeleton className="w-12 h-3" />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="flex flex-col gap-[22px]">
          <div className="flex items-center justify-between gap-[18px] flex-wrap">
            <div className="inline-flex bg-cream-2 border border-rule rounded-[11px] p-1 gap-[3px]">
              <Button
                variant="bare"
                onClick={() => setDay('today')}
                className={`gap-2 ${day === 'today' ? TAB_ON : TAB_OFF}`}
                style={{
                  padding: '8px 18px',
                  fontSize: '13.5px',
                  borderRadius: '8px',
                  lineHeight: 'normal',
                }}
              >
                Hoy
                <span className={day === 'today' ? BADGE_ON : BADGE_OFF}>
                  {deliveryCountTotal(today)}
                </span>
              </Button>
              <Button
                variant="bare"
                onClick={() => setDay('tomorrow')}
                className={`gap-2 ${day === 'tomorrow' ? TAB_ON : TAB_OFF}`}
                style={{
                  padding: '8px 18px',
                  fontSize: '13.5px',
                  borderRadius: '8px',
                  lineHeight: 'normal',
                }}
              >
                Mañana
                <span className={day === 'tomorrow' ? BADGE_ON : BADGE_OFF}>
                  {deliveryCountTotal(tomorrow)}
                </span>
              </Button>
            </div>

            <div className="flex items-center gap-4 font-mono text-[11.5px] text-muted">
              <span className="flex items-center gap-[7px]">
                <span className="w-[9px] h-[9px] rounded-[3px] bg-olive-700" />
                Grupo
              </span>
              <span className="flex items-center gap-[7px]">
                <span className="w-[9px] h-[9px] rounded-full bg-rule-2" />
                Individual
              </span>
              <span className="text-ink font-semibold">
                {totalLabel} {totalLabel === 1 ? 'entrega' : 'entregas'}
              </span>
            </div>
          </div>

          {zonesWithOffsets.length === 0 && (
            <div className="py-16 text-center bg-paper border border-rule rounded-lg">
              <div className="w-12 h-12 rounded-full bg-cream mx-auto mb-3 flex items-center justify-center text-olive-700">
                <Icon name="motorcycle" size={22} />
              </div>
              <p className="font-semibold text-ink">Sin entregas programadas</p>
              <p className="text-sm text-muted mt-1">No hay clientes activos para este día.</p>
            </div>
          )}

          {zonesWithOffsets.map(({ zone, colorIndexOffset }) => (
            <DeliveryZoneSection key={zone.zone} zone={zone} colorIndexOffset={colorIndexOffset} />
          ))}
        </div>
      )}
    </div>
  );
}
