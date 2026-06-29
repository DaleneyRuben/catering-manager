import { useState, useEffect } from 'react';
import { type UseFormSetValue } from 'react-hook-form';
import { Field, inputCls } from '@/components/ui/Field';
import { WizardSectionCard } from '@/components/ui/WizardSectionCard';
import type { NewClientFormValues } from '@/features/clients/types';

interface Props {
  setValue: UseFormSetValue<NewClientFormValues>;
  price: number | undefined;
  discount: number;
}

export function BillingRow({ setValue, price, discount }: Props) {
  const [clientPrice, setClientPrice] = useState('');

  // Reset when plan changes — default client price to plan price (discount = 0)
  useEffect(() => {
    setClientPrice(price !== undefined ? String(price - discount) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [price]);

  const handleClientPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setClientPrice(val);
    if (price !== undefined) {
      const num = Number(val);
      setValue('discount', !Number.isNaN(num) ? Math.max(0, price - num) : 0);
    }
  };

  const clientPriceNum = clientPrice !== '' ? Number(clientPrice) : undefined;
  const calculatedDiscount =
    price !== undefined && clientPriceNum !== undefined ? price - clientPriceNum : undefined;

  return (
    <WizardSectionCard
      icon="report"
      iconBg="bg-olive-100"
      iconColor="text-olive-700"
      title="Facturación"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-[22px] gap-y-[18px] items-end">
        <Field label="Precio base" htmlFor="base-price">
          <p
            id="base-price"
            className="font-mono text-[14px] text-muted bg-empty-bg border border-hairline rounded-[9px] py-[11px] px-[14px]"
          >
            {price !== undefined ? price.toLocaleString('es-BO') : '—'}
          </p>
        </Field>
        <Field label="Precio final" htmlFor="client-price">
          <input
            id="client-price"
            type="number"
            min={0}
            max={price}
            value={clientPrice}
            onChange={handleClientPriceChange}
            disabled={price === undefined}
            placeholder={price === undefined ? '—' : ''}
            className={inputCls(false)}
          />
        </Field>
        <Field label="Descuento" htmlFor="discount-preview">
          <p
            id="discount-preview"
            className="font-mono text-[14px] text-warn bg-warn-bg border border-warn-border rounded-[9px] py-[11px] px-[14px]"
          >
            {calculatedDiscount !== undefined ? calculatedDiscount.toLocaleString('es-BO') : '—'}
          </p>
        </Field>
      </div>
      <div className="flex items-center justify-between border-t border-cream-2 mt-[2px] pt-[18px]">
        <span className="font-mono text-[11px] tracking-[.08em] uppercase text-muted">
          Total mensual
        </span>
        <span className="font-serif text-[30px] font-semibold text-olive-700 tabular-nums">
          {clientPriceNum !== undefined ? clientPriceNum.toLocaleString('es-BO') : '—'}
        </span>
      </div>
    </WizardSectionCard>
  );
}
