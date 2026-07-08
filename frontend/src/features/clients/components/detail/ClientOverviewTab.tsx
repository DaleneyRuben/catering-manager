import { Card } from '@ui/Card';
import { Icon } from '@ui/Icon';
import { Label } from '@ui/Label';
import { MEAL_LABELS } from '@/constants/meals';
import type { Client, Subscription } from '@/features/clients/types';
import { CLIENT_STATUS } from '@/features/clients/constants/clientStatus';
import { EXPIRY_THRESHOLD_DAYS } from '@/features/clients/constants/subscription';
import { formatDate } from '@/utils/format';

interface Props {
  client: Client;
  sub: Subscription | undefined;
  remaining: number;
}

export function ClientOverviewTab({ client, sub, remaining }: Props) {
  const { status } = client;
  const delivered = sub ? Math.max(0, sub.duration - remaining) : 0;
  const progressPct = sub && sub.duration > 0 ? Math.min(100, (delivered / sub.duration) * 100) : 0;
  return (
    <div className="grid grid-cols-12 gap-[20px]">
      <div className="col-span-12 lg:col-span-7 flex flex-col gap-[20px]">
        <Card>
          {sub ? (
            <>
              <div className="flex items-start justify-between gap-4 mb-[16px]">
                <div>
                  <Label variant="section" className="mb-2">
                    {status === CLIENT_STATUS.ENDED ? 'Último plan' : 'Plan vigente'}
                  </Label>
                  <p className="font-serif text-[25px] font-semibold leading-none text-ink">
                    {sub.plan.name}
                  </p>
                </div>
                <div className="text-right shrink-0 whitespace-nowrap">
                  <span className="font-mono font-semibold text-[21px] text-ink">
                    {(Number(sub.plan.price) - sub.discount).toLocaleString('es-BO')}
                  </span>
                  <span className="font-mono text-[11px] text-faint"> /mes</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-[7px] mb-[18px]">
                {sub.plan.meals.map((m) => (
                  <span
                    key={m}
                    className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-olive-100 border border-olive-200 text-olive-700"
                  >
                    {MEAL_LABELS[m] ?? m}
                  </span>
                ))}
              </div>
              <div className="border-t border-cream-2 pt-[15px]">
                <div className="flex items-center justify-between gap-3 mb-[10px]">
                  <span className="font-mono text-[10.5px] uppercase tracking-[.06em] text-faint">
                    Progreso del plan
                  </span>
                  {(() => {
                    let cls = 'bg-ok-bg text-ok';
                    if (remaining <= 0) cls = 'bg-empty-bg text-faint';
                    else if (remaining <= EXPIRY_THRESHOLD_DAYS) cls = 'bg-warn-bg text-warn';
                    return (
                      <span
                        className={`px-[11px] py-[4px] rounded-full text-[12px] font-semibold ${cls}`}
                      >
                        {remaining} día{remaining === 1 ? '' : 's'}
                      </span>
                    );
                  })()}
                </div>
                <div className="relative h-2 mb-[9px]">
                  <div className="absolute inset-0 rounded-full bg-progress-track" />
                  <div
                    data-testid="plan-progress-fill"
                    className="absolute top-0 bottom-0 left-0 rounded-full bg-gradient-to-r from-olive-300 to-olive-700"
                    style={{ width: `${progressPct}%` }}
                  />
                  <div
                    className="absolute top-1/2 w-[14px] h-[14px] rounded-full bg-paper"
                    style={{
                      left: `${progressPct}%`,
                      transform: 'translate(-50%, -50%)',
                      boxShadow: 'inset 0 0 0 3px var(--color-olive-700)',
                    }}
                  />
                </div>
                <div className="flex justify-between font-mono text-[10.5px] text-ink">
                  <span>
                    {formatDate(sub.startDate)} <span className="text-faint">· inicio</span>
                  </span>
                  <span>
                    <span className="text-faint">fin ·</span> {formatDate(sub.contractEndDate)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-[13px] text-muted">Sin suscripción activa.</p>
          )}
        </Card>

        <Card>
          <Label variant="section" className="mb-4">
            Contacto
          </Label>
          <div className="flex flex-col gap-[14px]">
            <div className="flex items-center gap-3">
              <Icon name="phone" size={16} className="text-muted shrink-0" />
              <span className="font-mono text-[13px] text-ink">{client.phoneNumber}</span>
            </div>
            <div className="flex items-center gap-3">
              <Icon name="pin" size={16} className="text-muted shrink-0" />
              <span className="text-[13.5px] text-ink">{client.address}</span>
            </div>
            <div className="flex items-center gap-3">
              <Icon name="truck" size={16} className="text-muted shrink-0" />
              <span className="text-[13.5px] text-ink">Entrega: {client.delivery}</span>
            </div>
          </div>
          {(client.nit || client.businessName) && (
            <>
              <hr className="border-cream-2 my-[2px]" />
              <Label variant="section" className="mb-2">
                Facturación
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label variant="field">NIT</Label>
                  <p className="font-mono text-[13px]">{client.nit || '—'}</p>
                </div>
                <div>
                  <Label variant="field">Razón social</Label>
                  <p className="text-[13.5px]">{client.businessName || '—'}</p>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
        <Card>
          <div className="flex items-center justify-between mb-[18px]">
            <h2 className="font-serif text-[20px] font-semibold text-ink">Restricciones</h2>
            <span className="font-mono text-[12px] text-faint">{client.restrictions.length}</span>
          </div>
          {client.underlyingDiseases.length === 0 && client.restrictions.length === 0 ? (
            <p className="font-mono text-[12px] text-muted">Sin restricciones registradas.</p>
          ) : (
            <div className="space-y-3">
              {client.underlyingDiseases.length > 0 && (
                <div>
                  <Label variant="field" className="mb-2.5">
                    Enfermedades
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {client.underlyingDiseases.map((d) => (
                      <span
                        key={d}
                        className="px-3 py-1 rounded-full text-[12.5px] font-semibold bg-olive-100 border border-olive-200 text-olive-700"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {client.restrictions.length > 0 && (
                <div>
                  <Label variant="field" className="mb-2.5">
                    Alergias y gustos
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {client.restrictions.map((r) => (
                      <span
                        key={r}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-warn-bg text-warn border border-warn-border text-[12.5px] font-semibold rounded-full"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
