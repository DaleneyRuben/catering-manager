import { Icon } from "../ui/Icon";
import { usePlans } from '../../hooks/usePlans';
import { formatDate } from '../../utils/format';
import { initials } from '../../utils/string';
import { MEAL_LABELS } from '../../constants/meals';
import { useRenewalForm } from '../../hooks/useRenewalForm';
import type { StartMode } from '../../hooks/useRenewalForm';
import type { Client, Subscription } from '../../types/client';

interface Props {
  client: Client;
  sub: Subscription | undefined;
  isReactivation: boolean;
  onClose: () => void;
  onRenew: (data: {
    planId: number;
    contractDate: string;
    startDate?: string | null;
    duration: number;
    discount: number;
    renewalType: 'renewal' | 'reactivation';
  }) => Promise<void>;
}

const inputCls =
  'w-full px-3 py-2 text-[13px] font-mono border border-rule rounded-md bg-cream focus:outline-none focus:border-olive-600';
const readonlyCls =
  'w-full px-3 py-2 text-[13px] font-mono border border-rule rounded-md bg-cream-2 text-ink-2';

export function RenewalModal({ client, sub, isReactivation, onClose, onRenew }: Props) {
  const { plans } = usePlans();
  const form = useRenewalForm({ plans, sub, isReactivation, onRenew, onClose });

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-[rgba(20,40,6,0.32)] backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-cream border border-rule-2 rounded-[10px] w-[min(760px,96vw)] max-h-[92vh] overflow-auto shadow-[0_20px_60px_rgba(20,40,6,0.25)]"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center gap-3 px-[22px] py-[18px] border-b border-rule bg-cream">
          <div className="w-11 h-11 rounded-full bg-olive-800 text-white flex items-center justify-center font-serif text-[18px] font-semibold shrink-0">
            {initials(client.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-serif text-[20px] leading-tight text-ink">
              {isReactivation ? 'Reactivar' : 'Renovar'} · {client.name}
            </p>
            <p className="font-mono text-[11px] text-muted mt-0.5">{client.deliveryZone}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-[34px] h-[34px] flex items-center justify-center border border-rule rounded-md bg-paper hover:bg-cream-2 transition-colors"
          >
            <Icon name="x" size={14} />
          </button>
        </div>

        <div className="p-[22px] flex flex-col gap-6">
          {/* Before / After summary cards */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="p-3.5 bg-cream-2 border border-rule rounded-md">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted mb-1.5">
                Contrato anterior
              </p>
              <p className="font-mono text-[12px] text-ink-2">
                {formatDate(sub?.startDate)} → {formatDate(sub?.contractEndDate)}
              </p>
              {sub?.plan && (
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-olive-800 text-white">
                    {sub.plan.name}
                  </span>
                  <span className="font-mono text-[12px] text-muted">
                    ${(sub.plan.price - (sub.discount ?? 0)).toLocaleString()}/mes
                  </span>
                </div>
              )}
            </div>
            <div className="p-3.5 bg-[#f0f4e8] border border-[#c8d9a0] rounded-md">
              <p className="text-[10px] font-mono uppercase tracking-wider text-olive-700 mb-1.5">
                Nuevo contrato
              </p>
              <p className="font-mono text-[12px] text-ink-2">{form.newContractPreview}</p>
              {form.newPlan && (
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-olive-800 text-white">
                    {form.newPlan.name}
                  </span>
                  <span className="font-mono text-[12px] font-semibold text-olive-700">
                    {form.precioNum !== undefined ? `$${form.total.toLocaleString()}/mes` : '—'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Plan de comidas — card grid matching StepPlan */}
          <div>
            <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted mb-4">
              Plan de comidas
            </p>
            <div className="grid grid-cols-3 gap-3">
              {plans.map((p) => {
                const isSel = p.id === form.newPlanId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => form.setNewPlanId(p.id)}
                    className={`text-left p-4 rounded-md border transition-colors ${
                      isSel
                        ? 'bg-olive-800 text-white border-olive-800'
                        : 'bg-paper text-ink border-rule hover:border-olive-700'
                    }`}
                  >
                    <div className="font-serif text-[18px] leading-tight">{p.name}</div>
                    <div className="font-mono text-[20px] mt-1">
                      {p.price.toLocaleString()}
                      <span className={`text-[11px] ${isSel ? 'opacity-60' : 'text-muted'}`}>
                        /mes
                      </span>
                    </div>
                    {p.meals.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {p.meals.map((m) => (
                          <span
                            key={m}
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                              isSel ? 'bg-white/15' : 'bg-cream-2 text-muted'
                            }`}
                          >
                            {MEAL_LABELS[m] ?? m}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contrato */}
          <div className="border-t border-rule pt-5">
            <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted mb-4">
              Contrato
            </p>
            <div className="grid grid-cols-4 gap-4 items-start">
              {/* Inicio del servicio */}
              <div className="col-span-2">
                <p className="text-[10.5px] font-mono uppercase tracking-wider text-muted mb-1.5">
                  Inicio del servicio
                </p>
                {!isReactivation && (
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {(
                      [
                        { v: 'atEnd', l: 'Al vencer' },
                        { v: 'pick', l: 'Elegir fecha' },
                        { v: 'undefined', l: 'Sin fecha' },
                      ] as { v: StartMode; l: string }[]
                    ).map((o) => (
                      <button
                        key={o.v}
                        type="button"
                        onClick={() => form.setStartMode(o.v)}
                        className={`px-2.5 py-1.5 rounded-md border text-[12px] font-semibold transition-colors ${
                          form.startMode === o.v
                            ? 'bg-olive-800 text-white border-olive-800'
                            : 'bg-paper text-ink border-rule hover:bg-cream-2'
                        }`}
                      >
                        {o.l}
                      </button>
                    ))}
                  </div>
                )}

                {!isReactivation && form.startMode === 'atEnd' && form.newStart && (
                  <p className="font-mono text-[11.5px] text-ink-2 px-2.5 py-2 bg-cream-2 rounded-md">
                    {formatDate(form.newStart)}
                  </p>
                )}

                {form.willBePaused && (
                  <div className="flex items-start gap-2 px-2.5 py-2 bg-[#f3eedc] border border-[#d8c075] rounded-md">
                    <Icon name="calendar" size={13} className="text-[#6b4f08] shrink-0 mt-0.5" />
                    <p className="font-mono text-[11px] text-[#6b4f08]">
                      El cliente queda pausado hasta que se active manualmente.
                    </p>
                  </div>
                )}

                {(isReactivation || form.startMode === 'pick') && (
                  <input
                    type="date"
                    value={form.pickedDate}
                    min={form.tomorrow}
                    onChange={(e) => form.setPickedDate(e.target.value)}
                    className={inputCls}
                  />
                )}
              </div>

              {/* Duración */}
              <div>
                <p className="text-[10.5px] font-mono uppercase tracking-wider text-muted mb-1.5">
                  Duración (días)
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.durationStr}
                  onChange={(e) => form.setDurationStr(e.target.value.replace(/\D/g, ''))}
                  placeholder="20"
                  className={inputCls}
                />
                <p className="font-mono text-[10px] text-muted mt-1">días hábiles (L–V)</p>
              </div>

              {/* Fin de contrato */}
              <div>
                <p className="text-[10.5px] font-mono uppercase tracking-wider text-muted mb-1.5">
                  Fin de contrato
                </p>
                <p className={readonlyCls}>{form.newEnd ? formatDate(form.newEnd) : '—'}</p>
                <p className="font-mono text-[10px] text-olive-700 mt-1">
                  calculado automáticamente
                </p>
              </div>
            </div>
          </div>

          {/* Facturación del plan */}
          <div className="border-t border-rule pt-5">
            <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted mb-4">
              Facturación del plan
            </p>
            <div className="grid grid-cols-3 gap-4 items-end">
              <div>
                <p className="text-[10.5px] font-mono uppercase tracking-wider text-muted mb-1.5">
                  Precio
                </p>
                <input
                  type="number"
                  min={0}
                  max={form.newPlan?.price}
                  value={form.precioStr}
                  onChange={(e) => form.setPrecioStr(e.target.value)}
                  disabled={!form.newPlan}
                  placeholder="—"
                  className={inputCls}
                />
              </div>
              <div>
                <p className="text-[10.5px] font-mono uppercase tracking-wider text-muted mb-1.5">
                  Descuento
                </p>
                <p className={readonlyCls}>
                  {form.newPlan && form.precioNum !== undefined
                    ? form.discount.toLocaleString()
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-[10.5px] font-mono uppercase tracking-wider text-muted mb-1.5">
                  Total
                </p>
                <p className="w-full px-3 py-2 font-mono text-[15px] font-bold text-olive-800 border border-[#c8d4b0] rounded-md bg-[#f5f7f0]">
                  {form.precioNum !== undefined ? `$${form.total.toLocaleString()}` : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="p-3.5 bg-paper border border-dashed border-rule-2 rounded-md">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted mb-2">
              Resumen
            </p>
            <ul className="text-[13px] leading-[1.7]">
              {sub?.plan && sub.planId !== form.newPlanId && (
                <li>
                  Cambio de plan:{' '}
                  <strong>{plans.find((p) => p.id === sub.planId)?.name ?? sub.plan.name}</strong> →{' '}
                  <strong className="text-olive-700">{form.newPlan?.name}</strong>
                </li>
              )}
              <li>
                Vigencia: <span className="font-mono">{form.vigenciaText}</span>
              </li>
              <li>
                Facturación:{' '}
                <span className="font-mono">
                  {form.precioNum !== undefined ? `$${form.total.toLocaleString()}/mes` : '—'}
                  {form.discount > 0 && form.newPlan && form.precioNum !== undefined && (
                    <span className="text-muted">
                      {' '}
                      (${form.newPlan.price.toLocaleString()} − ${form.discount.toLocaleString()})
                    </span>
                  )}
                </span>
                {isReactivation && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full text-[11px] font-mono bg-ok-bg text-ok">
                    Reactivación
                  </span>
                )}
              </li>
              <li>
                Cliente: <strong>{client.name}</strong>
              </li>
            </ul>
          </div>

          {/* Footer */}
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-[13px] font-semibold border border-rule rounded-md text-ink hover:bg-paper transition-colors"
            >
              Cancelar
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={form.handleConfirm}
              disabled={!form.canConfirm || form.isSaving}
              className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold bg-olive-800 text-white rounded-md hover:bg-olive-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {form.isSaving ? (
                <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : (
                <Icon name="refresh" size={14} />
              )}
              {form.confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
