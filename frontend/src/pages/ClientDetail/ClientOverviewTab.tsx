import { Icon } from '../../components/ui/Icon';
import { Label } from '../../components/ui/Label';
import { MEAL_LABELS } from '../../constants/meals';
import type { Client, Subscription } from '../../types/client';
import { CLIENT_STATUS } from '../../constants/clientStatus';
import { EXPIRY_THRESHOLD_DAYS } from '../../constants/subscription';
import { formatDate } from '../../utils/format';

interface Props {
  client: Client;
  sub: Subscription | undefined;
  remaining: number;
}

export function ClientOverviewTab({ client, sub, remaining }: Props) {
  const { status } = client;
  return (
    <div className="grid grid-cols-12 gap-[20px]">
      <div className="col-span-12 lg:col-span-7 flex flex-col gap-[20px]">
        <div className="bg-paper border border-rule rounded-lg p-5">
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
              <div className="flex items-center justify-between gap-3 border-t border-cream-2 pt-[14px]">
                <p className="font-mono text-[11.5px] text-faint">
                  {formatDate(sub.startDate)} → {formatDate(sub.contractEndDate)}
                </p>
                {(() => {
                  let cls = 'bg-ok-bg text-ok';
                  if (remaining <= 0) cls = 'bg-rule text-muted';
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
            </>
          ) : (
            <p className="text-[13px] text-muted">Sin suscripción activa.</p>
          )}
        </div>

        <div className="bg-paper border border-rule rounded-lg p-5">
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
              <Icon name="refresh" size={16} className="text-muted shrink-0" />
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
        </div>
      </div>

      <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
        <div className="bg-paper border border-rule rounded-lg p-5">
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
        </div>
      </div>
    </div>
  );
}
