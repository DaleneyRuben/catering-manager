import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { PlanRadioList } from '../ui/PlanRadioList';
import { usePlans } from '../../hooks/usePlans';
import { formatDate } from '../../utils/format';
import { initials } from '../../utils/string';
import { useRenewalForm } from '../../hooks/useRenewalForm';
import type { StartMode } from '../../hooks/useRenewalForm';
import type { Client, Subscription, RenewalPayload } from '../../types/client';

interface Props {
  client: Client;
  sub: Subscription | undefined;
  isReactivation: boolean;
  onClose: () => void;
  onRenew: (data: RenewalPayload) => Promise<void>;
}

const inputCls =
  'w-full py-[9px] px-[12px] text-[13.5px] font-mono border border-rule rounded-[9px] bg-white focus:outline-none focus:border-olive-600';
const plainLabelCls = 'block text-[11px] text-faint mb-[6px]';
const CANCEL_BTN_STYLE = { padding: '10px 16px', fontSize: '13.5px' };
const CONFIRM_BTN_STYLE = { padding: '11px 18px', fontSize: '13.5px' };

export function RenewalModal({ client, sub, isReactivation, onClose, onRenew }: Props) {
  const { plans } = usePlans();
  const form = useRenewalForm({ plans, sub, isReactivation, onRenew, onClose });

  let vigenciaSummary = '— completar los campos —';
  if (form.willBePaused) vigenciaSummary = 'pausado (sin fecha)';
  else if (form.newStart && form.newEnd)
    vigenciaSummary = `${formatDate(form.newStart)} → ${formatDate(form.newEnd)}`;

  return (
    <Modal onClose={onClose} className="w-[min(560px,92vw)] max-h-[92vh] overflow-auto">
      {/* Header */}
      <div className="flex items-center gap-[13px] px-[28px] py-[22px] border-b border-hairline">
        <div className="w-10 h-10 rounded-full bg-olive-800 text-olive-50 flex items-center justify-center font-serif text-[16px] font-semibold shrink-0">
          {initials(client.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-serif text-[23px] leading-none text-ink">
            {isReactivation ? 'Reactivar' : 'Renovar'} · {client.name}
          </p>
          <p className="font-mono text-[11px] text-faint mt-[3px]">{client.deliveryZone}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-faint hover:text-ink-2 transition-colors p-1"
        >
          <Icon name="x" size={20} stroke={1.8} />
        </button>
      </div>

      <div className="py-[22px] px-[28px]">
        {/* Plan */}
        <div className="mb-[20px]">
          <p className={plainLabelCls}>Plan</p>
          <PlanRadioList
            plans={plans}
            selectedId={form.newPlanId}
            onSelect={form.setNewPlanId}
            size="sm"
          />
        </div>

        {/* Before / After summary cards */}
        <div className="grid grid-cols-2 gap-[14px] mb-[20px]">
          <div className="py-[14px] px-[16px] bg-empty-bg border border-hairline rounded-[11px]">
            <p className="text-[9.5px] font-mono uppercase tracking-[.1em] text-faint mb-2">
              Contrato anterior
            </p>
            <p className="font-mono text-[11.5px] text-muted">
              {formatDate(sub?.startDate)} → {formatDate(sub?.contractEndDate)}
            </p>
            {sub?.plan && (
              <div className="mt-2 flex items-center gap-[7px]">
                <span className="px-2 py-0.5 rounded-[5px] text-[10.5px] font-mono bg-muted text-olive-50">
                  {sub.plan.name}
                </span>
                <span className="font-mono text-[11px] text-faint">
                  {(sub.plan.price - (sub.discount ?? 0)).toLocaleString('es-BO')}/mes
                </span>
              </div>
            )}
          </div>
          <div className="py-[14px] px-[16px] bg-success-soft-bg border border-olive-200 rounded-[11px]">
            <p className="text-[9.5px] font-mono uppercase tracking-[.1em] text-success-text mb-2">
              Nuevo contrato
            </p>
            <p className="font-mono text-[11.5px] text-olive-700">{form.newContractPreview}</p>
            {form.newPlan && (
              <div className="mt-2 flex items-center gap-[7px]">
                <span className="px-2 py-0.5 rounded-[5px] text-[10.5px] font-mono bg-olive-800 text-olive-50">
                  {form.newPlan.name}
                </span>
                <span className="font-mono text-[11px] text-success-text">
                  {form.precioNum !== undefined ? `${form.total.toLocaleString('es-BO')}/mes` : '—'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Duración + Fin */}
        <div className="grid grid-cols-2 gap-[14px] mb-[18px]">
          <div>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- false positive: htmlFor/id are correctly matched below, rule misfires on literal text children */}
            <label className={plainLabelCls} htmlFor="renewal-duration">
              Duración (días)
            </label>
            <input
              id="renewal-duration"
              type="text"
              inputMode="numeric"
              value={form.durationStr}
              onChange={(e) => form.setDurationStr(e.target.value.replace(/\D/g, ''))}
              className={inputCls}
            />
            <p className="text-[10.5px] text-faint mt-[5px]">días hábiles (L–V)</p>
          </div>
          <div>
            <p className={plainLabelCls}>Fin</p>
            <p className="font-mono text-[13.5px] text-muted py-[9px]">
              {form.newEnd ? formatDate(form.newEnd) : '—'}
            </p>
            <p className="text-[10.5px] text-faint">calculado automáticamente</p>
          </div>
        </div>

        {/* Inicio del servicio */}
        {!isReactivation && (
          <div className="mb-[18px]">
            <p className={plainLabelCls}>Inicio del servicio</p>
            <div className="flex gap-[7px]">
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
                  className={`flex-1 text-center py-2 rounded-[8px] text-[12px] border-[1.5px] transition-colors ${
                    form.startMode === o.v
                      ? 'font-semibold bg-olive-100 text-olive-700 border-olive-200'
                      : 'bg-white text-muted border-rule'
                  }`}
                >
                  {o.l}
                </button>
              ))}
            </div>

            {form.startMode === 'atEnd' && form.newStart && (
              <p className="mt-[11px] font-mono text-[12px] text-muted bg-empty-bg border border-hairline rounded-[8px] py-[10px] px-[13px]">
                Inicia automáticamente el {formatDate(form.newStart)}.
              </p>
            )}

            {form.willBePaused && (
              <div className="mt-[11px] text-[12.5px] text-warn-text bg-warn-bg border border-warn-border rounded-[8px] py-[10px] px-[13px]">
                El cliente queda pausado hasta que se active manualmente.
              </div>
            )}

            {form.startMode === 'pick' && (
              <div className="mt-[11px]">
                <input
                  type="date"
                  value={form.pickedDate}
                  min={form.tomorrow}
                  onChange={(e) => form.setPickedDate(e.target.value)}
                  className={inputCls}
                />
                {form.pickedDateIsWeekend && (
                  <p className="font-mono text-[11px] text-alert mt-1">
                    El inicio debe ser un día hábil (lunes a viernes).
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {isReactivation && (
          <div className="mb-[18px] max-w-xs">
            <p className={plainLabelCls}>Inicio del servicio</p>
            <input
              type="date"
              value={form.pickedDate}
              min={form.tomorrow}
              onChange={(e) => form.setPickedDate(e.target.value)}
              className={inputCls}
            />
            {form.pickedDateIsWeekend && (
              <p className="font-mono text-[11px] text-alert mt-1">
                El inicio debe ser un día hábil (lunes a viernes).
              </p>
            )}
          </div>
        )}

        {/* Facturación */}
        <div className="grid grid-cols-3 gap-[12px] mb-[18px]">
          <div>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- false positive: htmlFor/id are correctly matched below, rule misfires on literal text children */}
            <label htmlFor="renewal-precio" className={plainLabelCls}>
              Precio
            </label>
            <input
              id="renewal-precio"
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
            <p className={plainLabelCls}>Descuento</p>
            <p className="font-mono text-[14px] text-warn py-[9px]">
              {form.newPlan && form.precioNum !== undefined
                ? form.discount.toLocaleString('es-BO')
                : '—'}
            </p>
          </div>
          <div>
            <p className={plainLabelCls}>Total</p>
            <p className="font-mono text-[14px] font-semibold text-olive-700 bg-olive-100 rounded-[7px] py-[9px] px-[10px] text-center">
              {form.precioNum !== undefined ? form.total.toLocaleString('es-BO') : '—'}
            </p>
          </div>
        </div>

        {/* Resumen */}
        <div className="border border-dashed border-empty-border rounded-[11px] py-[14px] px-[16px] text-[12.5px] text-ink-2 leading-[1.7]">
          · Plan: <strong>{form.newPlan?.name}</strong>
          <br />· Vigencia: <span className="font-mono">{vigenciaSummary}</span>
          <br />· Total: <strong>{form.total.toLocaleString('es-BO')}</strong> /mes · Cliente:{' '}
          {client.name}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-[10px] py-[16px] px-[28px] border-t border-hairline">
        <Button variant="secondary" onClick={onClose} style={CANCEL_BTN_STYLE}>
          Cancelar
        </Button>
        <Button
          onClick={form.handleConfirm}
          disabled={!form.canConfirm}
          loading={form.isSaving}
          leftIcon="refresh"
          style={CONFIRM_BTN_STYLE}
        >
          {form.confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
