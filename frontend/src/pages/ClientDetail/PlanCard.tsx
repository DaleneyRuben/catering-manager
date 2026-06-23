import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { Label } from '../../components/ui/Label';
import { inputCls } from '../../components/ui/Field';
import { MEAL_LABELS } from '../../constants/meals';
import type { Subscription } from '../../types/client';

interface Props {
  sub: Subscription;
  onUpdateBilling: (discount: number) => Promise<void>;
}

export function PlanCard({ sub, onUpdateBilling }: Props) {
  const planPrice = Number(sub.plan.price);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [priceStr, setPriceStr] = useState(String(planPrice - sub.discount));

  const enteredPrice = priceStr !== '' ? Number(priceStr) : NaN;
  const derivedDiscount = !Number.isNaN(enteredPrice) ? Math.max(0, planPrice - enteredPrice) : 0;

  const handleSave = async () => {
    if (Number.isNaN(enteredPrice)) return;
    setSaving(true);
    try {
      await onUpdateBilling(derivedDiscount);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setPriceStr(String(planPrice - sub.discount));
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
            {(planPrice - sub.discount).toLocaleString('es-BO')}
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
      <hr className="border-cream-2 my-[18px]" />
      <div className="flex items-center mb-[14px]">
        <Label variant="section">Precio y descuento</Label>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Editar"
            className="ml-auto text-muted hover:text-ink transition-colors"
          >
            <Icon name="pencil" size={13} />
          </button>
        )}
      </div>
      {editing ? (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3 items-end">
            <div>
              <Label variant="field" className="mb-1.5">
                Precio
              </Label>
              <input
                type="number"
                min={0}
                max={planPrice}
                value={priceStr}
                onChange={(e) => setPriceStr(e.target.value)}
                className={`${inputCls()} font-mono`}
              />
            </div>
            <div>
              <Label variant="field" className="mb-1.5">
                Descuento
              </Label>
              <p className="font-mono text-[15px] font-semibold text-warn py-2">
                {!Number.isNaN(enteredPrice) ? derivedDiscount.toLocaleString('es-BO') : '—'}
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
          <div className="flex gap-2 mt-1">
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
              {planPrice.toLocaleString('es-BO')}
            </p>
          </div>
          <div>
            <Label variant="field" className="mb-1">
              Descuento
            </Label>
            <p className="font-mono text-[16px] font-semibold text-warn">
              {sub.discount > 0 ? sub.discount.toLocaleString('es-BO') : '—'}
            </p>
          </div>
          <div>
            <Label variant="field" className="mb-1">
              Total
            </Label>
            <p className="font-mono text-[16px] font-semibold text-olive-700">
              {(planPrice - sub.discount).toLocaleString('es-BO')}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
