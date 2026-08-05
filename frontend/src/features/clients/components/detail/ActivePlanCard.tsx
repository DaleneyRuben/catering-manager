import { useState } from 'react';
import { parseISO } from 'date-fns';
import { Button } from '@ui/Button';
import { Card } from '@ui/Card';
import { CheckboxRow } from '@ui/CheckboxRow';
import { Icon } from '@ui/Icon';
import { IconButton } from '@ui/IconButton';
import { Label } from '@ui/Label';
import { inputCls, selectCls } from '@ui/Field';
import { MEAL_LABELS } from '@/constants/meals';
import { projectedEndDate, remainingDeliveryDays } from '@/utils/businessDays';
import { formatDate } from '@/utils/format';
import { usePlans } from '@/features/plans/hooks/usePlans';
import type { Subscription, SubscriptionTermsDraft } from '@/features/clients/types';

interface Props {
  sub: Subscription;
  onUpdateTerms: (terms: SubscriptionTermsDraft) => Promise<void>;
  onUpdateInstructions: (specialInstructions: Record<string, string>) => Promise<void>;
}

export function ActivePlanCard({ sub, onUpdateTerms, onUpdateInstructions }: Props) {
  const { plans } = usePlans();
  const assignedPlanPrice = Number(sub.plan.price);
  const storedGap = assignedPlanPrice - Number(sub.price);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [planId, setPlanId] = useState(sub.planId);
  const [durationStr, setDurationStr] = useState(String(sub.duration));
  const [priceStr, setPriceStr] = useState(String(Number(sub.price)));

  // the previewed gap follows the selection, not the stored plan
  const selectedPlan = plans.find((p) => p.id === planId);
  const planPrice = selectedPlan ? selectedPlan.price : assignedPlanPrice;
  const enteredPrice = priceStr !== '' ? Number(priceStr) : NaN;
  // negative when the client already paid more than the new plan lists — a surcharge, not a
  // discount. Only a plan change can produce that, and only because the total is frozen.
  const gap = !Number.isNaN(enteredPrice) ? planPrice - enteredPrice : 0;

  const parsedDuration = parseInt(durationStr, 10);
  const validDuration = !Number.isNaN(parsedDuration) && parsedDuration > 0 ? parsedDuration : 0;
  const previewEndDate =
    sub.startDate && validDuration > 0
      ? projectedEndDate(sub.startDate, validDuration, sub.suspendedDates.length)
      : null;
  const previewRemaining =
    sub.startDate && previewEndDate
      ? remainingDeliveryDays(parseISO(sub.startDate), parseISO(previewEndDate))
      : 0;

  const planChanged = planId !== sub.planId;

  // What the client pays never moves on a plan change — no charge on an upgrade, no refund on a
  // downgrade. The price is left alone and the gap absorbs the difference; the admin settles it
  // by changing the duration instead.
  const handleSave = async () => {
    if (Number.isNaN(enteredPrice) || validDuration === 0) return;
    setSaving(true);
    try {
      await onUpdateTerms({
        price: enteredPrice,
        // sent only when they moved, so an untouched plan writes no terms_changed
        ...(planChanged && { planId }),
        ...(validDuration !== sub.duration && { duration: validDuration }),
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setPlanId(sub.planId);
    setDurationStr(String(sub.duration));
    setPriceStr(String(Number(sub.price)));
    setEditing(false);
  };

  return (
    <Card padding="24px 26px">
      <div className="flex items-start flex-wrap gap-3">
        <div>
          <Label variant="section" className="mb-2">
            Plan asignado
          </Label>
          <p className="font-serif text-[28px] font-semibold leading-none">{sub.plan.name}</p>
        </div>
        <div className="ml-auto text-right">
          <Label variant="field">Total mensual</Label>
          <p className="font-serif text-[40px] font-semibold leading-[1.05] text-olive-700 tabular-nums">
            {Number(sub.price).toLocaleString('es-BO')}
          </p>
        </div>
      </div>
      <hr className="border-cream-2 my-[18px]" />
      <div className="flex flex-wrap gap-[7px]">
        {sub.plan.meals.map((m) => (
          <span
            key={m}
            className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-olive-100 border border-olive-200 text-olive-700"
          >
            {MEAL_LABELS[m] ?? m}
          </span>
        ))}
      </div>

      {sub.plan.meals.includes('salad') && (
        <>
          <hr className="border-cream-2 my-[18px]" />
          <Label variant="section" className="mb-[14px]">
            Instrucciones especiales
          </Label>
          <CheckboxRow
            id="salad-grande"
            label="Ensalada grande"
            icon="salad"
            checked={!!sub.specialInstructions?.salad}
            onChange={(checked) => {
              const updated = { ...sub.specialInstructions };
              if (checked) {
                updated.salad = 'DAR GRANDES';
              } else {
                delete updated.salad;
              }
              onUpdateInstructions(updated);
            }}
          />
        </>
      )}

      <hr className="border-cream-2 my-[18px]" />
      <div className="flex items-center mb-[14px]">
        <Label variant="section">Plan y precio</Label>
        {!editing && (
          <IconButton
            icon="pencil"
            label="Editar"
            onClick={() => setEditing(true)}
            size={15}
            stroke={1.7}
            className="ml-auto text-olive-700 hover:opacity-70 transition-opacity p-[3px]"
          />
        )}
      </div>
      {editing ? (
        <div className="flex flex-col gap-[15px]">
          <div className="grid grid-cols-[1.35fr_1fr] gap-3 items-end">
            <div>
              <Label variant="field" htmlFor="plan" className="mb-1.5">
                Plan
              </Label>
              <select
                id="plan"
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className={selectCls()}
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label variant="field" htmlFor="duration" className="mb-1.5">
                Duración
              </Label>
              <div className="relative">
                <input
                  id="duration"
                  inputMode="numeric"
                  value={durationStr}
                  onChange={(e) => setDurationStr(e.target.value)}
                  className={`${inputCls()} font-mono pr-[46px]`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11.5px] text-faint pointer-events-none">
                  días
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 items-end">
            <div>
              <Label variant="field" htmlFor={planChanged ? undefined : 'price'} className="mb-1.5">
                Precio
              </Label>
              {planChanged ? (
                <p className="font-mono text-[15px] font-semibold text-ink py-2">
                  {!Number.isNaN(enteredPrice) ? enteredPrice.toLocaleString('es-BO') : '—'}
                </p>
              ) : (
                <input
                  id="price"
                  type="number"
                  min={0}
                  value={priceStr}
                  onChange={(e) => setPriceStr(e.target.value)}
                  className={`${inputCls()} font-mono`}
                />
              )}
            </div>
            <div>
              <Label variant="field" className="mb-1.5">
                {gap < 0 ? 'Recargo' : 'Descuento'}
              </Label>
              <p className="font-mono text-[15px] font-semibold text-warn py-2">
                {!Number.isNaN(enteredPrice) ? Math.abs(gap).toLocaleString('es-BO') : '—'}
              </p>
            </div>
            <div>
              <Label variant="field" className="mb-1.5">
                Total
              </Label>
              <p className="font-mono text-[15px] font-semibold text-olive-700 bg-olive-100 rounded-[7px] py-[9px] px-[10px] text-center">
                {!Number.isNaN(enteredPrice) ? enteredPrice.toLocaleString('es-BO') : '—'}
              </p>
            </div>
          </div>
          <p className="font-mono text-[12px] text-muted">
            {previewEndDate ? (
              <>
                Vence el{' '}
                <span className="text-ink font-semibold">{formatDate(previewEndDate)}</span> ·{' '}
                <span className="text-ink font-semibold">{previewRemaining}</span> días restantes
              </>
            ) : (
              <span className="text-faint">—</span>
            )}
          </p>
          {planChanged && (
            <div className="flex items-start gap-2.5 bg-empty-bg border border-hairline rounded-[10px] px-[13px] py-[11px]">
              <Icon name="info" size={15} stroke={1.7} className="flex-none mt-0.5 text-muted" />
              <p className="text-[12.5px] leading-[1.55] text-muted">
                <span className="font-mono text-[11.5px] text-ink">
                  {sub.plan.name} → {selectedPlan?.name}
                </span>{' '}
                · El cambio no genera cobro ni devolución; ajusta la duración.
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-1">
            <Button variant="secondary" size="sm" onClick={handleCancel} disabled={saving}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} loading={saving} leftIcon="check">
              Guardar
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label variant="field" className="mb-1">
              Precio
            </Label>
            <p className="font-mono text-[16px] font-semibold text-ink">
              {assignedPlanPrice.toLocaleString('es-BO')}
            </p>
          </div>
          <div>
            <Label variant="field" className="mb-1">
              {storedGap < 0 ? 'Recargo' : 'Descuento'}
            </Label>
            <p className="font-mono text-[16px] font-semibold text-warn">
              {storedGap !== 0 ? Math.abs(storedGap).toLocaleString('es-BO') : '—'}
            </p>
          </div>
          <div>
            <Label variant="field" className="mb-1">
              Total
            </Label>
            <p className="font-mono text-[16px] font-semibold text-olive-700">
              {Number(sub.price).toLocaleString('es-BO')}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
