import { Icon } from '../../components/ui/Icon';
import { MEAL_LABELS } from '../../constants/meals';
import type { Client, Subscription } from '../../types/client';
import { CLIENT_STATUS } from '../../constants/clientStatus';
import { EXPIRY_THRESHOLD_DAYS } from '../../constants/subscription';
import { formatDate } from '../../utils/format';

interface Props {
  client: Client;
  sub: Subscription | undefined;
  remaining: number;
  onFinalize: () => void;
  onSuspend: () => void;
}

export function ClientOverviewTab({ client, sub, remaining, onFinalize, onSuspend }: Props) {
  const {status} = client;
  return (
    <div className="grid grid-cols-12 gap-5">
      <div className="col-span-12 lg:col-span-7 flex flex-col gap-4">
        <div className="bg-paper border border-rule rounded-lg p-5">
          {sub ? (
            <>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="text-[10.5px] font-mono uppercase tracking-wider text-muted mb-1">
                    {status === CLIENT_STATUS.ENDED ? 'Último plan' : 'Plan vigente'}
                  </p>
                  <p className="font-serif text-[24px] leading-tight text-ink">{sub.plan.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono font-semibold text-[22px] leading-tight text-olive-800">
                    {Number(sub.plan.price) - sub.discount}
                  </p>
                  <p className="font-mono text-[10.5px] text-muted">/mes</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {sub.plan.meals.map((m) => (
                  <span
                    key={m}
                    className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-olive-100 border border-rule text-ink"
                  >
                    {MEAL_LABELS[m] ?? m}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className="font-mono text-[11.5px] text-muted">
                  {formatDate(sub.startDate)} → {formatDate(sub.contractEndDate)}
                </p>
                {(() => {
                  let cls = 'bg-ok-bg text-ok';
                  if (remaining <= 0) cls = 'bg-rule text-muted';
                  else if (remaining <= EXPIRY_THRESHOLD_DAYS) cls = 'bg-warn-bg text-warn';
                  return (
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono ${cls}`}>
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
          <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-3">Contacto</p>
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <Icon name="phone" size={14} />
              <span className="font-mono text-[13px]">{client.phoneNumber}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Icon name="pin" size={14} />
              <span className="text-[13px]">{client.address}</span>
              <span className="text-muted text-[13px]"> · </span>
              <span className="text-[13px]">{client.deliveryZone}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Icon name="refresh" size={14} />
              <span className="text-[13px] text-muted">
                Entrega: <strong className="text-ink font-semibold">{client.delivery}</strong>
              </span>
            </div>
          </div>
          {(client.nit || client.businessName) && (
            <>
              <hr className="border-rule my-3" />
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-2">
                Facturación
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-muted">NIT</p>
                  <p className="font-mono text-[13px]">{client.nit || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-muted">
                    Razón social
                  </p>
                  <p className="font-mono text-[13px]">{client.businessName || '—'}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
        <div className="bg-paper border border-rule rounded-lg p-5">
          <div className="flex items-center mb-3">
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted">
              Restricciones
            </p>
            <span className="ml-auto font-mono text-[10.5px] text-muted">
              {client.restrictions.length}
            </span>
          </div>
          {client.underlyingDiseases.length === 0 && client.restrictions.length === 0 ? (
            <p className="font-mono text-[12px] text-muted">Sin restricciones registradas.</p>
          ) : (
            <div className="space-y-3">
              {client.underlyingDiseases.length > 0 && (
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-1.5">
                    Enfermedades
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {client.underlyingDiseases.map((d) => (
                      <span
                        key={d}
                        className="px-2.5 py-1 rounded-full text-[12px] font-mono bg-olive-100 border border-rule text-ink"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {client.restrictions.length > 0 && (
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-1.5">
                    Alergias y gustos
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {client.restrictions.map((r) => (
                      <span
                        key={r}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-warn-bg text-warn text-[12px] font-mono rounded-full"
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

        {status !== CLIENT_STATUS.ENDED && (
          <div className="bg-paper border border-rule rounded-lg p-5">
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-3">
              Acciones rápidas
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={onSuspend}
                className="flex items-center gap-2 px-3 py-2.5 text-[13px] border border-rule rounded-md text-ink hover:bg-cream-2 transition-colors"
              >
                <Icon name="calendar" size={14} />
                Suspender días
              </button>
              <button
                type="button"
                onClick={onFinalize}
                className="flex items-center gap-2 px-3 py-2.5 text-[13px] border border-[#e9c4bb] rounded-md text-alert hover:bg-cream-2 transition-colors"
              >
                Finalizar plan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
