import { useState, useEffect, useRef } from 'react';
import { type UseFormSetValue } from 'react-hook-form';
import { Field, inputCls } from '@ui/Field';
import { WizardSectionCard } from '@ui/WizardSectionCard';
import type { NewClientFormValues } from '@/features/clients/types';

interface Props {
  setValue: UseFormSetValue<NewClientFormValues>;
  planPrice: number | undefined;
  price: number;
}

export function BillingRow({ setValue, planPrice, price }: Props) {
  // Seeded from the form so stepping back into this card shows the negotiated price rather than
  // resetting it to the plan's
  const [clientPrice, setClientPrice] = useState(price ? String(price) : '');
  const seededFor = useRef(price ? planPrice : undefined);

  // Selecting a different plan restages its price as the starting point for the negotiation
  useEffect(() => {
    if (planPrice === seededFor.current) return;
    seededFor.current = planPrice;
    setClientPrice(planPrice !== undefined ? String(planPrice) : '');
    if (planPrice !== undefined) setValue('price', planPrice);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planPrice]);

  const handleClientPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setClientPrice(val);
    const num = Number(val);
    setValue('price', val !== '' && !Number.isNaN(num) ? num : 0);
  };

  const clientPriceNum = clientPrice !== '' ? Number(clientPrice) : undefined;

  // A plan's price is quoted for 20 delivery days. Under it the client has a discount; over it —
  // a longer contract — they pay a surcharge. Both are display only: what gets stored is the total.
  const gap =
    planPrice !== undefined && clientPriceNum !== undefined
      ? planPrice - clientPriceNum
      : undefined;
  const isSurcharge = gap !== undefined && gap < 0;

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
            {planPrice !== undefined ? planPrice.toLocaleString('es-BO') : '—'}
          </p>
        </Field>
        <Field label="Precio final" htmlFor="client-price">
          <input
            id="client-price"
            type="number"
            min={0}
            value={clientPrice}
            onChange={handleClientPriceChange}
            disabled={planPrice === undefined}
            placeholder={planPrice === undefined ? '—' : ''}
            className={inputCls(false)}
          />
        </Field>
        <Field label={isSurcharge ? 'Recargo' : 'Descuento'} htmlFor="price-gap">
          <p
            id="price-gap"
            className="font-mono text-[14px] text-warn bg-warn-bg border border-warn-border rounded-[9px] py-[11px] px-[14px]"
          >
            {gap !== undefined ? Math.abs(gap).toLocaleString('es-BO') : '—'}
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
