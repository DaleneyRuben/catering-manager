import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
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
    <div className="bg-paper border border-rule rounded-lg p-5">
      <div className="flex items-start flex-wrap gap-3 mb-4">
        <div>
          <p className="text-[12px] font-mono uppercase tracking-wider text-olive-800 mb-1">
            Plan asignado
          </p>
          <p className="font-serif text-[28px]">{sub.plan.name}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="font-mono text-[10.5px] text-muted">Total mensual</p>
          <p className="font-serif text-[40px] text-olive-800 tabular-nums">
            {planPrice - sub.discount}
          </p>
        </div>
      </div>
      <hr className="border-rule mb-4" />
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
      <hr className="border-rule mb-4" />
      <div className="flex items-center mb-3">
        <p className="text-[12px] font-mono uppercase tracking-wider text-olive-800">
          Precio y descuento
        </p>
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
              <p className="text-[12px] font-mono uppercase tracking-wider text-olive-800 mb-1">
                Precio
              </p>
              <input
                type="number"
                min={0}
                max={planPrice}
                value={priceStr}
                onChange={(e) => setPriceStr(e.target.value)}
                className="w-full px-2.5 py-1.5 text-[13px] font-mono border border-rule rounded-md bg-cream focus:outline-none focus:border-olive-600"
              />
            </div>
            <div>
              <p className="text-[12px] font-mono uppercase tracking-wider text-olive-800 mb-1">
                Descuento
              </p>
              <p className="font-mono text-[13px] py-1.5 px-2.5 bg-cream-2 rounded-md border border-rule">
                {!Number.isNaN(enteredPrice) ? derivedDiscount : '—'}
              </p>
            </div>
            <div>
              <p className="text-[12px] font-mono uppercase tracking-wider text-olive-800 mb-1">
                Total
              </p>
              <p
                className="font-mono text-[14px] font-bold text-olive-800 py-1.5 px-2.5 rounded-md border"
                style={{
                  background: 'var(--olive-50,#f5f7f0)',
                  borderColor: 'var(--olive-200,#c8d4b0)',
                }}
              >
                {!Number.isNaN(enteredPrice) ? enteredPrice : '—'}
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
            <p className="text-[12px] font-mono uppercase tracking-wider text-olive-800">Precio</p>
            <p className="font-mono text-[14px]">{sub.plan.price}</p>
          </div>
          <div>
            <p className="text-[12px] font-mono uppercase tracking-wider text-olive-800">
              Descuento
            </p>
            <p className="font-mono text-[14px] text-muted">
              {sub.discount > 0 ? sub.discount : '—'}
            </p>
          </div>
          <div>
            <p className="text-[12px] font-mono uppercase tracking-wider text-olive-800">Total</p>
            <p className="font-mono text-[14px] font-bold text-olive-800">
              {planPrice - sub.discount}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
