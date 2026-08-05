import { useState } from 'react';
import { Button } from '@ui/Button';
import { Card } from '@ui/Card';
import { CheckboxRow } from '@ui/CheckboxRow';
import { IconButton } from '@ui/IconButton';
import { Label } from '@ui/Label';
import { inputCls } from '@ui/Field';
import { MEAL_LABELS } from '@/constants/meals';
import type { Subscription } from '@/features/clients/types';

interface Props {
  sub: Subscription;
  onUpdateBilling: (price: number) => Promise<void>;
  onUpdateInstructions: (specialInstructions: Record<string, string>) => Promise<void>;
}

export function ActivePlanCard({ sub, onUpdateBilling, onUpdateInstructions }: Props) {
  const planPrice = Number(sub.plan.price);
  const storedGap = planPrice - Number(sub.price);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [priceStr, setPriceStr] = useState(String(Number(sub.price)));

  const enteredPrice = priceStr !== '' ? Number(priceStr) : NaN;
  // A plan's price is quoted for 20 delivery days: under it the client has a discount, over it —
  // a longer contract — a surcharge. Both are display only; the agreed total is what is stored.
  const gap = !Number.isNaN(enteredPrice) ? planPrice - enteredPrice : 0;

  const handleSave = async () => {
    if (Number.isNaN(enteredPrice)) return;
    setSaving(true);
    try {
      await onUpdateBilling(enteredPrice);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
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
        <Label variant="section">Precio y descuento</Label>
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
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3 items-end">
            <div>
              <Label variant="field" className="mb-1.5">
                Precio
              </Label>
              <input
                type="number"
                min={0}
                value={priceStr}
                onChange={(e) => setPriceStr(e.target.value)}
                className={`${inputCls()} font-mono`}
              />
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
              {planPrice.toLocaleString('es-BO')}
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
