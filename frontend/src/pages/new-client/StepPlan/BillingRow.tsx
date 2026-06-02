import { useState, useEffect } from 'react';
import { type UseFormSetValue } from 'react-hook-form';
import { Field, inputCls } from '../../../components/ui/Field';
import type { NewClientFormValues } from '../types';

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
    <div>
      <p className="text-[10.5px] font-mono uppercase tracking-[.14em] text-muted mb-4">
        Facturación del plan
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <Field label="Precio" htmlFor="client-price">
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
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-1.5">
            Descuento
          </p>
          <p className="font-mono text-[13px] text-ink py-2 px-3 bg-cream-2 rounded-md border border-rule">
            {calculatedDiscount !== undefined ? calculatedDiscount : '—'}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-muted mb-1.5">Total</p>
          <p
            className="font-mono text-[16px] font-bold text-olive-800 py-2 px-3 rounded-md border"
            style={{
              background: 'var(--olive-50, #f5f7f0)',
              borderColor: 'var(--olive-200, #c8d4b0)',
            }}
          >
            {clientPriceNum !== undefined ? clientPriceNum : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
