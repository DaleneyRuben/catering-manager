import { useState } from 'react';
import { addDays, format } from 'date-fns';
import { Icon } from '../components/ui/Icon';
import { usePlans } from '../hooks/usePlans';
import { addBusinessDays } from '../utils/businessDays';
import { formatDate } from '../utils/format';
import { initials } from '../utils/string';
import type { Client, Subscription } from '../types/client';

type StartMode = 'atEnd' | 'pick' | 'undefined';

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

export function RenewalModal({ client, sub, isReactivation, onClose, onRenew }: Props) {
  const { plans } = usePlans();

  const [newPlanId, setNewPlanId] = useState(sub?.planId ?? plans[0]?.id ?? 0);
  const [durationStr, setDurationStr] = useState('');
  const [discountStr, setDiscountStr] = useState(String(sub?.discount ?? 0));
  // reactivation always picks a date; renewal defaults to 'atEnd'
  const [startMode, setStartMode] = useState<StartMode>(isReactivation ? 'pick' : 'atEnd');
  const [pickedDate, setPickedDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const newPlan = plans.find((p) => p.id === newPlanId);
  const duration = parseInt(durationStr, 10);
  const validDuration = !Number.isNaN(duration) && duration > 0 ? duration : null;
  const discount = Math.max(0, parseInt(discountStr, 10) || 0);
  const total = (newPlan?.price ?? 0) - discount;

  // tomorrow as ISO string — minimum selectable date
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  let newStart: string | null = null;
  if (startMode === 'atEnd' && sub?.contractEndDate) {
    // first delivery day strictly after current contract end
    newStart = addBusinessDays(sub.contractEndDate, 1);
  } else if (startMode === 'pick') {
    newStart = pickedDate || null;
  }
  // startMode === 'undefined' → newStart stays null

  const newEnd = newStart && validDuration ? addBusinessDays(newStart, validDuration - 1) : null; // duration - 1 because startDate counts as day 1

  const willBePaused = startMode === 'undefined';
  const canConfirm = !!validDuration && (willBePaused || !!newStart);

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setIsSaving(true);
    try {
      await onRenew({
        planId: newPlanId,
        contractDate: format(new Date(), 'yyyy-MM-dd'),
        startDate: newStart,
        duration: validDuration!,
        discount,
        renewalType: isReactivation ? 'reactivation' : 'renewal',
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  let confirmLabel = 'Renovar';
  if (isReactivation) confirmLabel = 'Reactivar';
  else if (willBePaused) confirmLabel = 'Crear pausado';

  let newContractPreview = 'Elegí una fecha de inicio';
  if (willBePaused) newContractPreview = 'Inicio sin definir';
  else if (newStart) newContractPreview = `${formatDate(newStart)} → ${formatDate(newEnd)}`;

  let vigenciaText = '— completá los campos —';
  if (willBePaused) vigenciaText = 'pausado (sin fecha)';
  else if (newStart && validDuration)
    vigenciaText = `${formatDate(newStart)} → ${formatDate(newEnd)} (${validDuration} días hábiles)`;

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
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-cream border border-rule-2 rounded-[10px] w-[min(720px,94vw)] max-h-[92vh] overflow-auto shadow-[0_20px_60px_rgba(20,40,6,0.25)]"
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

        <div className="p-[22px] flex flex-col gap-[18px]">
          {/* Before / After cards */}
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
              <p className="font-mono text-[12px] text-ink-2">{newContractPreview}</p>
              {newPlan && (
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-olive-800 text-white">
                    {newPlan.name}
                  </span>
                  <span className="font-mono text-[12px] font-semibold text-olive-700">
                    ${total.toLocaleString()}/mes
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Plan selector */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted mb-2">Plan</p>
            <div className="flex flex-wrap gap-1.5">
              {plans.map((p) => {
                const selected = p.id === newPlanId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setNewPlanId(p.id)}
                    className={`px-3 py-1.5 rounded-full border text-[12.5px] font-mono transition-colors ${
                      selected
                        ? 'bg-olive-800 text-white border-olive-800'
                        : 'bg-paper text-ink border-rule hover:bg-cream-2'
                    }`}
                  >
                    {p.name} · ${p.price.toLocaleString()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration + Discount */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted mb-1.5">
                Duración (días hábiles)
              </p>
              <input
                type="text"
                inputMode="numeric"
                value={durationStr}
                onChange={(e) => setDurationStr(e.target.value.replace(/\D/g, ''))}
                placeholder="ej. 20"
                className="w-full px-2.5 py-1.5 text-[13px] font-mono border border-rule rounded-md bg-cream focus:outline-none focus:border-olive-600"
              />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted mb-1.5">
                Descuento
              </p>
              <input
                type="text"
                inputMode="numeric"
                value={discountStr}
                onChange={(e) => setDiscountStr(e.target.value.replace(/\D/g, ''))}
                placeholder="0"
                className="w-full px-2.5 py-1.5 text-[13px] font-mono border border-rule rounded-md bg-cream focus:outline-none focus:border-olive-600"
              />
              <p className="font-mono text-[10.5px] text-olive-700 mt-1">
                Total: ${total.toLocaleString()}/mes
              </p>
            </div>
          </div>

          {/* Start mode (renewal only) */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted mb-2">
              Inicio del servicio
            </p>
            {!isReactivation && (
              <div className="flex flex-wrap gap-2 mb-3">
                {(
                  [
                    { v: 'atEnd', l: 'Al vencer' },
                    { v: 'pick', l: 'Elegir fecha' },
                    { v: 'undefined', l: 'Sin fecha definida' },
                  ] as { v: StartMode; l: string }[]
                ).map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => setStartMode(o.v)}
                    className={`px-3.5 py-2 rounded-md border text-[13px] font-semibold transition-colors ${
                      startMode === o.v
                        ? 'bg-olive-800 text-white border-olive-800'
                        : 'bg-paper text-ink border-rule hover:bg-cream-2'
                    }`}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            )}

            {/* "Al vencer" display */}
            {!isReactivation && startMode === 'atEnd' && newStart && (
              <div className="font-mono text-[12px] text-ink-2 px-3 py-2.5 bg-cream-2 rounded-md">
                Inicia el primer día de reparto tras el vencimiento:{' '}
                <strong>{formatDate(newStart)}</strong>
              </div>
            )}

            {/* Paused banner */}
            {willBePaused && (
              <div className="flex items-start gap-2.5 px-3.5 py-3 bg-[#f3eedc] border border-[#d8c075] rounded-md">
                <Icon name="calendar" size={14} className="text-[#6b4f08] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-semibold text-[#6b4f08]">Suscripción en pausa</p>
                  <p className="font-mono text-[11px] text-[#6b4f08]">
                    El cliente queda registrado con el nuevo plan en estado pausado. La fecha de
                    inicio se define más adelante.
                  </p>
                </div>
              </div>
            )}

            {/* Date picker */}
            {(isReactivation || startMode === 'pick') && (
              <div className="mt-2">
                <input
                  type="date"
                  value={pickedDate}
                  min={tomorrow}
                  onChange={(e) => setPickedDate(e.target.value)}
                  className="px-2.5 py-1.5 text-[13px] font-mono border border-rule rounded-md bg-cream focus:outline-none focus:border-olive-600"
                />
                <p className="font-mono text-[10.5px] text-muted mt-1.5">
                  Solo días futuros (a partir de mañana).
                </p>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="p-3.5 bg-paper border border-dashed border-rule-2 rounded-md">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted mb-2">
              Resumen
            </p>
            <ul className="text-[13px] leading-[1.7] space-y-0">
              {sub?.plan && sub.planId !== newPlanId && (
                <li>
                  Cambio de plan:{' '}
                  <strong>{plans.find((p) => p.id === sub.planId)?.name ?? sub.plan.name}</strong> →{' '}
                  <strong className="text-olive-700">{newPlan?.name}</strong>
                </li>
              )}
              <li>
                Vigencia: <span className="font-mono">{vigenciaText}</span>
              </li>
              <li>
                Facturación:{' '}
                <span className="font-mono">
                  ${total.toLocaleString()}/mes
                  {discount > 0 && (
                    <span className="text-muted">
                      {' '}
                      (${newPlan?.price.toLocaleString()} − ${discount.toLocaleString()})
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
              onClick={handleConfirm}
              disabled={!canConfirm || isSaving}
              className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold bg-olive-800 text-white rounded-md hover:bg-olive-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : (
                <Icon name="refresh" size={14} />
              )}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
